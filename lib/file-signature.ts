// Lightweight "magic bytes" sniffing for uploaded problem attachments.
// The declared MIME type / file extension come from the browser and are
// trivially spoofable (rename anything.exe to anything.pdf and the
// <input accept> + `file.type` check in problem-form.tsx both pass). This
// checks the first few bytes of the actual file content against known
// signatures for the types actions/problems.ts accepts, so a renamed or
// disguised file is rejected even though its name/declared type looked
// fine client-side.
//
// This is defense-in-depth, not a full content-security scanner — it only
// confirms the file *is* one of the allowed container formats, not that
// it's safe (a PDF can still embed malicious JavaScript, for instance).
// The storage bucket is already private with no public URL, which remains
// the primary mitigation; this closes the "wrong file type entirely" gap.

type Signature = { bytes: number[]; offset?: number }

const SIGNATURES: Record<string, Signature[]> = {
  'image/jpeg': [{ bytes: [0xff, 0xd8, 0xff] }],
  'image/png': [{ bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  'image/gif': [
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] }, // GIF87a
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] }, // GIF89a
  ],
  // WEBP is "RIFF"....'WEBP' — the WEBP marker at offset 8 is checked
  // separately in hasValidFileSignature() below.
  'image/webp': [{ bytes: [0x52, 0x49, 0x46, 0x46] }],
  'application/pdf': [{ bytes: [0x25, 0x50, 0x44, 0x46] }], // "%PDF"
  // .docx (and any modern Office file) is a ZIP container.
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    { bytes: [0x50, 0x4b, 0x03, 0x04] },
  ],
  // Legacy binary .doc uses the OLE2/Compound File signature.
  'application/msword': [{ bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] }],
}

function matchesSignature(buf: Uint8Array, sig: Signature) {
  const offset = sig.offset ?? 0
  if (buf.length < offset + sig.bytes.length) return false
  return sig.bytes.every((b, i) => buf[offset + i] === b)
}

/**
 * Returns true if `file`'s actual bytes match a known signature for an
 * accepted attachment type (image/*, PDF, or Word doc). Reads only the
 * first 16 bytes, so this is cheap even for large files.
 */
export async function hasValidFileSignature(file: File): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer())

  const isRiff = matchesSignature(head, SIGNATURES['image/webp'][0])
  if (
    isRiff &&
    head.length >= 12 &&
    head[8] === 0x57 && // W
    head[9] === 0x45 && // E
    head[10] === 0x42 && // B
    head[11] === 0x50 // P
  ) {
    return true
  }

  for (const [mime, sigs] of Object.entries(SIGNATURES)) {
    if (mime === 'image/webp') continue // handled above (needs the offset-8 check)
    if (sigs.some((sig) => matchesSignature(head, sig))) return true
  }

  return false
}
