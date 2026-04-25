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

export type SandboxRunResult = {
  success: boolean;
  stdout: string;
  stderr: string;
  latencyMs: number;
};

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

export async function runSandboxedNodeCode(code: string, opts?: { timeoutMs?: number }): Promise<SandboxRunResult> {
  const docker = getDocker();
  const timeoutMs = opts?.timeoutMs ?? 2500;

  const startedAt = Date.now();

  // Use a fresh container, no mounts, no network.
  const container = await docker.createContainer({
    Image: "node:22-alpine",
    Cmd: ["node", "-e", code],
    AttachStdout: true,
    AttachStderr: true,
    Tty: false,
    OpenStdin: false,
    HostConfig: {
      AutoRemove: true,
      NetworkMode: "none",
      Memory: Math.max(64, Math.floor(config.SESSION_MEMORY_MB / 4)) * 1024 * 1024,
      NanoCpus: Math.max(1, Math.floor(config.SESSION_CPU_CORES * 1_000_000_000))
    }
  });

  await container.start();

  const logsPromise = container.logs({
    stdout: true,
    stderr: true,
    follow: true
  });

  const waitPromise = container.wait();

  let timedOut = false;
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    const t = setTimeout(() => {
      timedOut = true;
      clearTimeout(t);
      reject(new Error("timeout"));
    }, timeoutMs);
  });

  let stdout = "";
  let stderr = "";

  try {
    const stream = await logsPromise;
    // dockerode multiplexes streams when not TTY; parse manually.
    stream.on("data", (chunk: Buffer) => {
      if (chunk.length < 8) return;
      const streamType = chunk[0]; // 1 stdout, 2 stderr
      const payload = chunk.subarray(8);
      if (streamType === 1) stdout += payload.toString("utf8");
      else if (streamType === 2) stderr += payload.toString("utf8");
      else stdout += payload.toString("utf8");
    });

    await Promise.race([waitPromise, timeoutPromise]);
  } catch (e) {
    if (timedOut) {
      try {
        await container.kill();
      } catch {
        // ignore
      }
      stderr += "\n[timeout]\n";
    } else {
      stderr += `\n[error] ${(e as Error).message}\n`;
    }
  }

  const latencyMs = Date.now() - startedAt;
  const success = !timedOut;

  return { success, stdout, stderr, latencyMs };
}

