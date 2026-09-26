// Server-side verification for Cloudflare Turnstile (contact form spam
// protection). Returns true if the token is valid, false otherwise.
// If TURNSTILE_SECRET_KEY isn't set:
//   - in production, this FAILS CLOSED (returns false) — a missing secret
//     (unset/typo'd env var) must never silently turn off spam protection
//     on a live site.
//   - anywhere else (local dev, a preview without the var configured), it
//     skips verification so the contact form stays usable without setup.
export async function verifyTurnstile(token: string | null, ip?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error(
        '[turnstile] TURNSTILE_SECRET_KEY is not set in production — refusing to verify (failing closed). Set the env var to restore spam protection.',
      )
      return false
    }
    console.warn('[turnstile] TURNSTILE_SECRET_KEY not set — skipping verification (dev mode).')
    return true
  }
  if (!token) return false

  try {
    const res = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, response: token, remoteip: ip }),
      },
    )
    const data = await res.json()
    return data.success === true
  } catch (err) {
    console.error('[turnstile] verification request failed:', err)
    return false
  }
}
