/**
 * Maps yt-dlp stderr output to user-friendly i18n error keys.
 *
 * Known / predictable errors get specific translation keys.
 * Anything unrecognized falls back to a generic "errors.serverError".
 * The renderer resolves the key via i18n t() before displaying.
 */

interface YtDlpError {
  /** i18n translation key (e.g. "errors.unsupportedUrl") */
  message: string;
  /** HTTP status code */
  status: number;
}

const KNOWN_ERRORS: Array<{ pattern: RegExp; error: YtDlpError }> = [
  // ── URL / platform issues ──
  {
    pattern: /Unsupported URL|No video formats/i,
    error: {
      message: "errors.unsupportedUrl",
      status: 400,
    },
  },
  {
    pattern: /This video is not available|Video unavailable|Private video|members-only/i,
    error: {
      message: "errors.videoUnavailable",
      status: 400,
    },
  },
  {
    pattern: /Video has been removed|deleted/i,
    error: {
      message: "errors.videoRemoved",
      status: 400,
    },
  },
  {
    pattern: /geo[- ]?restricted|geo[- ]?blocked|not available in your country/i,
    error: {
      message: "errors.geoRestricted",
      status: 400,
    },
  },
  {
    pattern: /copyright|infringement/i,
    error: {
      message: "errors.copyright",
      status: 400,
    },
  },
  {
    pattern: /sign in to confirm|not a bot/i,
    error: {
      message: "errors.botCheck",
      status: 429,
    },
  },
  {
    pattern: /age[- ]?restricted/i,
    error: {
      message: "errors.ageRestricted",
      status: 400,
    },
  },

  // ── Network issues ──
  {
    pattern: /Unable to connect|Connection error|network|timed out|timeout/i,
    error: {
      message: "errors.networkError",
      status: 502,
    },
  },

  // ── Format / download issues ──
  {
    pattern: /Requested format|format is not available|no video/i,
    error: {
      message: "errors.formatUnavailable",
      status: 400,
    },
  },
  {
    pattern: /ffmpeg|ffprobe/i,
    error: {
      message: "errors.ffmpegError",
      status: 500,
    },
  },
];

/** Generic fallback for unrecognized errors. */
const GENERIC_ERROR: YtDlpError = {
  message: "errors.serverError",
  status: 500,
};

/** Generic fallback for download/processing failures. */
const DOWNLOAD_ERROR: YtDlpError = {
  message: "errors.downloadFailed",
  status: 400,
};

/**
 * Extracts only the ERROR: lines from yt-dlp stderr.
 *
 * yt-dlp writes warnings, progress, and download info to stderr as well,
 * so the full buffer is not reliable for error classification. We only
 * want to match patterns against genuine error lines.
 */
function extractErrorLines(stderr: string): string {
  return stderr
    .split("\n")
    .filter((line) => line.includes("ERROR:"))
    .join("\n");
}

/**
 * Parses yt-dlp stderr and returns a user-friendly error.
 *
 * - Only tests patterns against ERROR: lines (not warnings/progress).
 * - If no ERROR: lines exist, falls back to testing the full stderr.
 * - If stderr contains "ERROR:" but is unrecognized → generic download error.
 * - If stderr is empty or completely unrecognized → generic server error.
 *
 * @param stderr  The full stderr output from yt-dlp.
 * @param context "info" for info lookups, "download" for downloads.
 */
export function parseYtDlpError(
  stderr: string,
  context: "info" | "download" = "info"
): YtDlpError {
  // Always log the full stderr so we can see everything yt-dlp reported
  console.error(`[ytdlp] Full stderr (${context}):`, stderr || "(empty)");

  // Only match patterns against actual ERROR: lines, not warnings/progress
  const errorLines = extractErrorLines(stderr);
  const matchTarget = errorLines || stderr;

  for (const { pattern, error } of KNOWN_ERRORS) {
    if (pattern.test(matchTarget)) {
      return error;
    }
  }

  // If yt-dlp reported a specific error we don't recognize,
  // still show a contextual friendly message rather than the raw text.
  if (errorLines) {
    console.error(`[ytdlp] Unrecognized ERROR lines (${context}):`, errorLines);
    return context === "download" ? DOWNLOAD_ERROR : {
      message: "errors.infoFailed",
      status: 400,
    };
  }

  // No ERROR: lines at all — yt-dlp exited non-zero without a clear error.
  // This could be a crash or signal. Log it for debugging.
  console.error(`[ytdlp] No ERROR: lines found, raw stderr (${context}):`, stderr || "(empty)");
  return GENERIC_ERROR;
}

/**
 * Returns a friendly message when the binary itself fails to spawn
 * (e.g. executable not found or lacks permissions).
 */
export function binaryErrorMessage(): string {
  return "errors.serverError";
}
