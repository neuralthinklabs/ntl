import type { Metadata } from 'next'
import { SiteShell } from '@/components/site/site-shell'
import { AuthForm, AuthShell } from '@/components/auth/auth-form'
import { updatePassword } from '@/actions/auth'

export const metadata: Metadata = {
  title: 'Set New Password — Neural Think Labs',
}

export default function UpdatePasswordPage() {
  return (
    <SiteShell>
      <AuthShell
        title="Choose a new password"
        description="You followed a password reset link. Set a new password below."
      >
        <AuthForm
          action={updatePassword}
          submitLabel="Update password"
          fields={[
            { name: 'password', label: 'New password', type: 'password', autoComplete: 'new-password' },
          ]}
        />
      </AuthShell>
    </SiteShell>
  )
}
