// Safe to import from client components (no DB imports).

/** Never blockable, so an admin can always sign in and fix a mistake, and legal pages stay public. */
export const NEVER_BLOCK = ['/admin', '/auth', '/api', '/oauth', '/privacy', '/terms']

export const COMMON_PATHS = [
  '*', '/', '/problems', '/volunteer', '/support', '/goals', '/events', '/tickets', '/stories', '/series', '/magazines',
  '/atlas', '/portfolio', '/ntldgs', '/get-involved', '/community', '/community/discover', '/community/messages',
  '/community/tasks', '/workspace', '/contact', '/faq', '/developers', '/dashboard', '/profile',
]

export function pathMatches(path: string, prefix: string) {
  if (prefix === '*') return true
  if (prefix === '/') return path === '/'
  return path === prefix || path.startsWith(`${prefix}/`)
}

export function isNeverBlocked(path: string) {
  return NEVER_BLOCK.some((p) => pathMatches(path, p))
}

/** Returns a clean prefix, or an error message. '*' = whole site, '/' = home page only. */
export function normalizePrefix(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const s = (raw ?? '').trim().split(/[?#]/)[0]
  if (s === '*') return { ok: true, value: '*' }
  if (!s) return { ok: false, error: 'Enter a page path like /events, or * for the whole site.' }
  const p = s === '/' ? '/' : `/${s.replace(/^\/+|\/+$/g, '')}`
  if (!/^\/[A-Za-z0-9\-_/]*$/.test(p)) return { ok: false, error: 'Use letters, numbers, dashes and slashes only, like /community/messages.' }
  if (isNeverBlocked(p)) return { ok: false, error: 'Admin, sign-in, API and legal pages cannot be blocked.' }
  return { ok: true, value: p }
}
