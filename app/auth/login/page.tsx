import type { Metadata } from 'next'
import { SiteShell } from '@/components/site/site-shell'
import { AuthForm, AuthShell, AuthLink } from '@/components/auth/auth-form'
import { login } from '@/actions/auth'
import { safeNext } from '@/lib/safe-redirect'

export const metadata: Metadata = { title: 'Log in', robots: { index: false } }

// Error codes (not free text) so a crafted link cannot show arbitrary copy.
const ERRORS: Record<string, string> = {
  link_invalid: 'That link is invalid or has expired. Request a new one and try again.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const { next, error } = await searchParams
  const message = error ? ERRORS[error] : undefined
  const safe = next ? safeNext(next) : undefined

  return (
    <SiteShell>
      <AuthShell
        title="Welcome back"
        description="Log in to see your dashboard, submitted problems, and activity."
      >
        {message && (
          <p className="mb-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{message}</p>
        )}
        <AuthForm
          action={login}
          submitLabel="Log in"
          hiddenFields={safe ? { next: safe } : undefined}
          fields={[
            { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
            { name: 'password', label: 'Password', type: 'password', autoComplete: 'current-password' },
          ]}
          footer={
            <div className="flex flex-col gap-2 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>
                  New here? <AuthLink href="/auth/signup">Sign up</AuthLink>
                </span>
                <AuthLink href="/auth/reset-password">Forgot password?</AuthLink>
              </div>
              <AuthLink href="/auth/resend">Didn&apos;t get a verification email?</AuthLink>
            </div>
          }
        />
      </AuthShell>
    </SiteShell>
  )
}
