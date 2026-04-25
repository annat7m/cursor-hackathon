import Docker from "dockerode";
import { config } from "./config.js";

export type StartedContainer = {
  containerId: string;
  hostPort: number;
};

function nanoCpusFromCores(cores: number) {
  return Math.max(1, Math.floor(cores * 1_000_000_000));
}

function getDocker(): Docker {
  // dockerode auto-detects on many platforms; on Windows it may need named pipe.
  // We keep it simple and let dockerode infer; users can set DOCKER_HOST if needed.
  return new Docker();
}

export async function startSessionContainer(sessionId: string, templateImage: string): Promise<StartedContainer> {
  const docker = getDocker();

  // This image is expected to expose a web desktop on 3000/tcp (linuxserver/webtop).
  // We'll publish to a random host port and return that as connectUrl.
  const internalPort = "3000/tcp";

  const container = await docker.createContainer({
    Image: templateImage || config.DOCKER_IMAGE_DEFAULT,
    name: `vm_${sessionId}`,
    Env: [
      "PUID=1000",
      "PGID=1000",
      "TZ=Etc/UTC"
    ],
    ExposedPorts: {
      [internalPort]: {}
    },
    HostConfig: {
      AutoRemove: true,
      PortBindings: {
        [internalPort]: [{ HostPort: "0" }]
      },
      Memory: config.SESSION_MEMORY_MB * 1024 * 1024,
      NanoCpus: nanoCpusFromCores(config.SESSION_CPU_CORES)
    }
  });

  await container.start();

  const inspect = await container.inspect();
  const hostPort = inspect.NetworkSettings.Ports?.[internalPort]?.[0]?.HostPort;
  if (!hostPort) {
    throw new Error("Failed to determine published port for session");
  }
  return { containerId: container.id, hostPort: Number(hostPort) };
}

export async function stopSessionContainer(containerId: string) {
  const docker = getDocker();
  const container = docker.getContainer(containerId);
  try {
    await container.stop({ t: 5 });
  } catch (e) {
    // If it's already stopped/removed, that's fine for our cleanup.
  }
}

