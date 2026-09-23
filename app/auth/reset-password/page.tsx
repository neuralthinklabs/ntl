import type { Metadata } from 'next'
import { SiteShell } from '@/components/site/site-shell'
import { AuthForm, AuthShell, AuthLink } from '@/components/auth/auth-form'
import { requestPasswordReset } from '@/actions/auth'

export const metadata: Metadata = {
  title: 'Reset Password — Neural Think Labs',
}

export default function ResetPasswordPage() {
  return (
    <SiteShell>
      <AuthShell
        title="Reset your password"
        description="Enter your email and we will send you a link to reset your password."
      >
        <AuthForm
          action={requestPasswordReset}
          submitLabel="Send reset link"
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
