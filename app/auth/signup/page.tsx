import type { Metadata } from 'next'
import { SiteShell } from '@/components/site/site-shell'
import { AuthForm, AuthShell, AuthLink } from '@/components/auth/auth-form'
import { signUp } from '@/actions/auth'

export const metadata: Metadata = {
  title: 'Sign Up — Neural Think Labs',
}

export default function SignUpPage() {
  return (
    <SiteShell>
      <AuthShell
        title="Create your account"
        description="Join Neural Think Labs to submit problems, join events, and track your impact."
      >
        <AuthForm
          action={signUp}
          submitLabel="Create account"
          fields={[
            { name: 'fullName', label: 'Full name', type: 'text', autoComplete: 'name' },
            { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
            { name: 'password', label: 'Password', type: 'password', autoComplete: 'new-password' },
          ]}
          footer={
            <p className="text-sm text-slate-500">
              Already have an account? <AuthLink href="/auth/login">Log in</AuthLink>
            </p>
          }
        />
      </AuthShell>
    </SiteShell>
  )
}
