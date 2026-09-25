import type { Metadata } from 'next'
import { SiteShell } from '@/components/site/site-shell'
import { AuthForm, AuthShell, AuthLink } from '@/components/auth/auth-form'
import { login } from '@/actions/auth'

export const metadata: Metadata = {
  title: 'Log In — Neural Think Labs',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const { next, error } = await searchParams

  return (
    <SiteShell>
      <AuthShell
        title="Welcome back"
        description="Log in to see your dashboard, submitted problems, and activity."
      >
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
            {error}
          </p>
        )}
        <AuthForm
          action={login}
          submitLabel="Log in"
          hiddenFields={next ? { next } : undefined}
          fields={[
            { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
            { name: 'password', label: 'Password', type: 'password', autoComplete: 'current-password' },
          ]}
          footer={
            <div className="flex flex-col gap-2 text-sm text-slate-500">
              <div className="flex items-center justify-between">
                <span>
                  New here? <AuthLink href="/auth/signup">Sign up</AuthLink>
                </span>
                <AuthLink href="/auth/reset-password">Forgot password?</AuthLink>
              </div>
              {/* P2 #18: resendVerificationEmail now has a caller. */}
              <AuthLink href="/auth/resend">Didn&apos;t get a verification email?</AuthLink>
            </div>
          }
        />
      </AuthShell>
    </SiteShell>
  )
}
