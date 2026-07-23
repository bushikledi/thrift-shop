/**
 * Image file-signature ("magic byte") detection.
 *
 * A client-supplied Content-Type can be forged, so uploads are additionally
 * verified against the actual bytes of the file. Only the image formats the
 * platform accepts are recognised; anything else returns null.
 */

/** Returns the MIME type implied by the buffer's magic bytes, or null. */
export function detectImageMimeType(buffer: Buffer): string | null {
  if (!Buffer.isBuffer(buffer)) {
    return null;
  }

  // JPEG: FF D8 FF
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // GIF: "GIF87a" or "GIF89a"
  if (buffer.length >= 6) {
    const header = buffer.subarray(0, 6).toString('ascii');
    if (header === 'GIF87a' || header === 'GIF89a') {
      return 'image/gif';
    }
  }

  // WebP: "RIFF" .... "WEBP"
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }

  return null;
}

/**
 * True when the buffer's real image type matches the declared MIME type.
 */
export function matchesDeclaredImageType(
  buffer: Buffer,
  declaredMimeType: string,
): boolean {
  const detected = detectImageMimeType(buffer);
  return detected !== null && detected === declaredMimeType;
}
