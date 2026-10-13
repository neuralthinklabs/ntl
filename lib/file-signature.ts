// "Magic bytes" sniffing for uploaded problem attachments. The declared MIME
// type and extension are supplied by the browser and are trivially spoofable.
// This checks the first bytes of the real content. It is defense in depth: it
// proves the file *is* one of the allowed container formats, not that it is
// safe. The storage bucket stays private, which remains the main mitigation.

type Signature = { bytes: number[]; offset?: number }

const SIGNATURES: Record<string, Signature[]> = {
  'image/jpeg': [{ bytes: [0xff, 0xd8, 0xff] }],
  'image/png': [{ bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  'image/gif': [
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] },
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] },
  ],
  'application/pdf': [{ bytes: [0x25, 0x50, 0x44, 0x46] }],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    { bytes: [0x50, 0x4b, 0x03, 0x04] },
  ],
  'application/msword': [{ bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] }],
}

function matches(buf: Uint8Array, sig: Signature) {
  const offset = sig.offset ?? 0
  if (buf.length < offset + sig.bytes.length) return false
  return sig.bytes.every((b, i) => buf[offset + i] === b)
}

/** Pure check on the first >=16 bytes of a file. */
export function hasValidSignatureBytes(head: Uint8Array): boolean {
  // WEBP = "RIFF" .... "WEBP"
  if (
    matches(head, { bytes: [0x52, 0x49, 0x46, 0x46] }) &&
    head.length >= 12 &&
    head[8] === 0x57 &&
    head[9] === 0x45 &&
    head[10] === 0x42 &&
    head[11] === 0x50
  ) {
    return true
  }
  return Object.values(SIGNATURES).some((sigs) => sigs.some((s) => matches(head, s)))
}

export async function hasValidFileSignature(file: File): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  return hasValidSignatureBytes(head)
}
