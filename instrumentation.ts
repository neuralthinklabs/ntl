// Next.js server-startup hook (App Router, stable since Next 15). Runs once
// when the server process boots, before any request is handled — the right
// place for "validate required env vars at startup" (P1 #8), instead of
// discovering a missing key mid-request.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv } = await import('./lib/env')
    validateEnv()
  }
}
