/**
 * Shared yt-dlp configuration helpers.
 *
 * These functions build the common yt-dlp arguments used by both the
 * info and download functions, ensuring consistent behaviour.
 *
 * ## YouTube "Sign in to confirm you're not a bot"
 *
 * When the app ran on cloud providers (datacenter IPs) YouTube flagged
 * requests as automated traffic. We previously worked around this by
 * forcing alternative player clients (ios, tv_embedded, web_safari).
 *
 * Now that the app runs locally on the user's machine (residential IP),
 * those workarounds are no longer needed and were counter-productive:
 *   - `tv_embedded` is unsupported in recent yt-dlp
 *   - `ios` client now requires a GVS PO Token, causing 403 errors
 *
 * The default `web` client works correctly for local/residential IPs.
 *
 * A `cookies.txt` file can still be passed via the `YT_DLP_COOKIES_PATH`
 * environment variable for full authentication if needed.
 */

/**
 * Returns common yt-dlp arguments that should be prepended to every
 * invocation (both info and download).
 */
export function buildCommonArgs(): string[] {
  const args: string[] = [
    "--no-playlist",
    "--js-runtimes", "node",
  ];

  // Optional cookies file for authenticated YouTube access
  const cookiesPath = process.env.YT_DLP_COOKIES_PATH;
  if (cookiesPath) {
    args.push("--cookies", cookiesPath);
  }

  return args;
}

/**
 * Sanitises a URL string received from the client.
 *
 * - Trims whitespace
 * - Strips surrounding quotes (single or double) that can appear from
 *   copy-paste or clipboard quirks on some platforms.
 * - Validates that it looks like a URL (starts with http:// or https://).
 *
 * Returns `null` if the input is not a valid URL.
 */
export function sanitizeUrl(input: string): string | null {
  let url = input.trim();

  // Strip surrounding quotes: 'url' or "url"
  if (
    (url.startsWith("'") && url.endsWith("'")) ||
    (url.startsWith('"') && url.endsWith('"'))
  ) {
    url = url.slice(1, -1).trim();
  }

  // Strip stray trailing single-quote (seen in production logs)
  url = url.replace(/['\u2018\u2019]+$/g, "").trim();

  if (!url) return null;

  // Basic URL shape check
  if (!/^https?:\/\//i.test(url)) return null;

  return url;
}
