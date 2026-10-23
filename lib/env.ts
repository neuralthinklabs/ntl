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
  NEXT_PUBLIC_VOLUNTEER_FORM_URL: z.string().url().optional(),
  NEXT_PUBLIC_PROBLEM_FORM_URL: z.string().url().optional(),
  PAYMENT_INSTRUCTIONS: z.string().optional(),
  CRON_SECRET: z.string().min(8).optional(),
  // Server-only. Needed for the admin "Sign-in apps" page.
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),
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

  if (process.env.NODE_ENV === 'production' && !parsed.data.CRON_SECRET) {
    console.warn('[env] CRON_SECRET is not set: the cleanup cron route will refuse all requests.')
  }

  cached = parsed.data
  return cached
}
