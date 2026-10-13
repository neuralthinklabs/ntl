// Only allow same-site relative paths ("/dashboard", "/problems?goal=live").
// Rejects absolute URLs, protocol-relative URLs ("//evil.com"), backslash
// tricks ("/\evil.com") and anything with control characters.
export function safeNext(next: unknown, fallback = '/dashboard'): string {
  if (typeof next !== 'string') return fallback
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback
  if (/[\u0000-\u001f\u007f]/.test(next)) return fallback
  return next
}
