export type Env = {
  LOADER: WorkerLoader;
};

// Minimal Worker Loader typing for TS.
export type WorkerLoader = {
  load<T = unknown>(script: string, options?: { globalOutbound?: unknown }): Promise<T>;
};

