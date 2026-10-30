import { z } from 'zod'

// Fail fast at startup if required env vars are missing or malformed
// (imported from instrumentation.ts, which Next runs once on boot).

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url(),

  // Optional: the app degrades gracefully when absent, but the *shape* is
  // validated when set so a typo does not silently no-op in production.
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1).optional(),
  CONTACT_INBOX_EMAIL: z.string().email().optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1).optional(),
  TURNSTILE_SECRET_KEY: z.string().min(1).optional(),
  PAYMENT_INSTRUCTIONS: z.string().optional(),
  CRON_SECRET: z.string().min(16).optional(),
  // Server-only. Needed for the admin "Sign-in apps" page.
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),

  // Launch hardening
  TRUSTED_IP_HEADER: z.string().min(1).optional(),
  ALLOWED_SITE_ORIGINS: z.string().optional(),
  CSP_MODE: z.enum(['enforce', 'report-only']).optional(),
})

export type Env = z.infer<typeof serverEnvSchema>

let cached: Env | null = null

export function validateEnv(): Env {
  if (cached) return cached

  // Treat empty strings (".env" lines with no value) as unset.
  const raw = Object.fromEntries(
    Object.entries(process.env).filter(([, v]) => v !== undefined && v !== ''),
  )
  const parsed = serverEnvSchema.safeParse(raw)
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    throw new Error(
      `Invalid/missing environment variables:\n${lines.join('\n')}\n\n` +
        `Copy .env.example to .env.local and fill in the values, then restart.`,
    )
  }

  const live = process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build'
  if (live) {
    const host = new URL(parsed.data.NEXT_PUBLIC_SITE_URL).hostname
    if ((host === 'localhost' || host === '127.0.0.1') && process.env.ALLOW_LOCALHOST_SITE_URL !== '1') {
      // This is what makes emailed links point at localhost.
      throw new Error(
        'NEXT_PUBLIC_SITE_URL points at localhost in production. Set it to your real https URL ' +
          '(or set ALLOW_LOCALHOST_SITE_URL=1 if you are only testing a production build locally).',
      )
    }

    const missing: string[] = []
    if (!parsed.data.RESEND_API_KEY) missing.push('RESEND_API_KEY (no emails will be sent)')
    if (!parsed.data.EMAIL_FROM) missing.push('EMAIL_FROM (default sender may be rejected by Resend)')
    if (!parsed.data.CONTACT_INBOX_EMAIL) missing.push('CONTACT_INBOX_EMAIL (admins will not be notified)')
    if (!parsed.data.TURNSTILE_SECRET_KEY || !parsed.data.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
      missing.push('TURNSTILE_SECRET_KEY / NEXT_PUBLIC_TURNSTILE_SITE_KEY (the contact form will reject every message)')
    if (!parsed.data.CRON_SECRET) missing.push('CRON_SECRET (the cleanup cron route will refuse all requests)')
    if (!process.env.VERCEL && !parsed.data.TRUSTED_IP_HEADER)
      missing.push('TRUSTED_IP_HEADER (rate limiting may trust a spoofable IP header)')
    if (parsed.data.CSP_MODE !== 'enforce') missing.push('CSP_MODE=enforce (CSP is only in report-only mode)')
    if (missing.length) console.warn(`[env] Production warnings:\n  - ${missing.join('\n  - ')}`)
  }

  cached = parsed.data
  return cached
}
