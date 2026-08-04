import pkg from "@pkg";

/**
 * Static metadata extracted from package.json.
 *
 * Vite resolves the JSON import at bundle-time (via the @pkg alias in
 * vite.config.ts) so these values are available in the renderer process
 * without any IPC bridge.
 */
export const APP_INFO = {
  name: (pkg as any).build?.productName ?? pkg.name,
  version: pkg.version,
  author: pkg.author?.name ?? "Thiago Miranda",
  authorEmail: pkg.author?.email ?? "",
  license: pkg.license ?? "MIT",
  description: pkg.description ?? "",
} as const;
