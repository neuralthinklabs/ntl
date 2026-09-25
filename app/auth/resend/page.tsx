import type { Metadata } from 'next'
import { SiteShell } from '@/components/site/site-shell'
import { AuthForm, AuthShell, AuthLink } from '@/components/auth/auth-form'
import { resendVerification } from '@/actions/auth'

export const metadata: Metadata = {
  title: 'Resend Verification Email — Neural Think Labs',
}

export default function ResendVerificationPage() {
  return (
    <SiteShell>
      <AuthShell
        title="Resend verification email"
        description="Didn't get the confirmation email, or it expired? Enter your email and we'll send a new one."
      >
        <AuthForm
          action={resendVerification}
          submitLabel="Resend email"
          fields={[
            { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
          ]}
          footer={
            <p className="text-sm text-slate-500">
              <AuthLink href="/auth/login">Back to login</AuthLink>
            </p>
          }
        />
      </AuthShell>
    </SiteShell>
  )
}
