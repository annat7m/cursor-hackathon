import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number().default(8080),
  DB_PATH: z.string().default("./data/sessions.sqlite"),
  INVITE_CODE: z.string().optional(),
  SESSION_TTL_MINUTES: z.coerce.number().default(30),
  DOCKER_IMAGE_DEFAULT: z.string().default("cursor-hackathon/ubuntu-xfce:dev"),
  // If you want to expose a stable public base URL (for connectUrl), set this.
  PUBLIC_BASE_URL: z.string().optional(),
  // Resource limits (best-effort; depends on Docker runtime)
  SESSION_MEMORY_MB: z.coerce.number().default(1024),
  SESSION_CPU_CORES: z.coerce.number().default(1)
});

export type AppConfig = z.infer<typeof EnvSchema>;

export const config: AppConfig = EnvSchema.parse(process.env);

