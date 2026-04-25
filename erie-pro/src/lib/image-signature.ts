// ── Image file-signature ("magic byte") validation ──────────────────
// An attacker uploading a profile photo can set the multipart
// Content-Type header to `image/jpeg` while the actual bytes are
// HTML, JavaScript, a ZIP, or a polyglot crafted to exploit image
// parsers. Relying on client-reported MIME types to decide "this is
// safe to render" is a standard file-upload foot-gun — the server
// must inspect the actual bytes.
//
// This helper inspects the first few bytes (the file signature) and
// returns whether they match the claimed MIME type. We only accept
// JPEG, PNG, WebP, and GIF — formats without executable script
// payloads. SVG is deliberately excluded because `<svg>` can contain
// `<script>` tags; supporting user-uploaded SVG is a full XSS channel.

type SupportedMime = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

export const SUPPORTED_IMAGE_TYPES: readonly SupportedMime[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

/** Returns the detected MIME type from the leading bytes, or null if unknown. */
export function detectImageMime(buf: Uint8Array): SupportedMime | null {
  // JPEG: FF D8 FF
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return "image/png";
  }

  // GIF: "GIF87a" or "GIF89a"
  if (
    buf.length >= 6 &&
    buf[0] === 0x47 && // G
    buf[1] === 0x49 && // I
    buf[2] === 0x46 && // F
    buf[3] === 0x38 && // 8
    (buf[4] === 0x37 || buf[4] === 0x39) && // 7 or 9
    buf[5] === 0x61 // a
  ) {
    return "image/gif";
  }

  // WebP: "RIFF" ???? "WEBP"
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 && // R
    buf[1] === 0x49 && // I
    buf[2] === 0x46 && // F
    buf[3] === 0x46 && // F
    buf[8] === 0x57 && // W
    buf[9] === 0x45 && // E
    buf[10] === 0x42 && // B
    buf[11] === 0x50 // P
  ) {
    return "image/webp";
  }

  return null;
}

/**
 * Validate that `claimedMime` matches the actual image bytes. Returns
 * the verified MIME type, or a reason string for rejection.
 */
export function verifyImageUpload(
  buf: Uint8Array,
  claimedMime: string,
):
  | { ok: true; mime: SupportedMime }
  | { ok: false; reason: string } {
  if (!SUPPORTED_IMAGE_TYPES.includes(claimedMime as SupportedMime)) {
    return { ok: false, reason: `Unsupported content type: ${claimedMime}` };
  }
  const detected = detectImageMime(buf);
  if (detected === null) {
    return { ok: false, reason: "File is not a recognized image format" };
  }
  if (detected !== claimedMime) {
    return {
      ok: false,
      reason: `Declared type ${claimedMime} but bytes are ${detected}`,
    };
  }
  return { ok: true, mime: detected };
}
