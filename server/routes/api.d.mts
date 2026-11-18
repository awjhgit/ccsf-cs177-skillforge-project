export function createApi(databasePath: string, options?: { now?: () => number; databaseUrl?: string }): {
  handle(request: Request): Promise<Response>;
  ready: Promise<void>;
  close(): void | Promise<void>;
};
