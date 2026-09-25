import { z } from 'zod'

// P1 #8: fail fast at startup if required env vars are missing/malformed,
// instead of failing confusingly deep inside a request (e.g. `db/index.ts`'s
// `throw new Error('DATABASE_URL is not set...')`, or a cryptic Supabase
// client error). This module is imported once from `instrumentation.ts`
// (Next.js's server startup hook) so it runs before the app serves traffic.

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url(),

  // Optional — the app degrades gracefully (logs + skips) when these are
  // absent, so they're not required, but we still validate the *shape*
  // when they ARE set so a typo doesn't silently no-op in production.
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1).optional(),
  CONTACT_INBOX_EMAIL: z.string().email().optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1).optional(),
  TURNSTILE_SECRET_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_VOLUNTEER_FORM_URL: z.string().url().optional(),
})

export type Env = z.infer<typeof serverEnvSchema>

let cached: Env | null = null

/**
 * Validates process.env against the schema above. Throws with a readable,
 * aggregated message (every missing/invalid var at once) so a fresh
 * `.env.local` can be fixed in a single pass instead of one restart per var.
 */
export function validateEnv(): Env {
  if (cached) return cached

  const parsed = serverEnvSchema.safeParse(process.env)
  if (!parsed.success) {
    const lines = parsed.error.issues.map(
      (issue) => `  - ${issue.path.join('.')}: ${issue.message}`,
    )
    throw new Error(
      `Invalid/missing environment variables:\n${lines.join('\n')}\n\n` +
        `Copy .env.example to .env.local and fill in the values, then restart.`,
    )
  }

  cached = parsed.data
  return cached
}

// Typed accessor for call sites that just want `env.DATABASE_URL` etc.
// instead of `process.env.X!` casts. Cheap after the first call because
// `validateEnv()` caches its result.
export const env: Env = new Proxy({} as Env, {
  get(_target, prop: string) {
    return validateEnv()[prop as keyof Env]
  },
})
