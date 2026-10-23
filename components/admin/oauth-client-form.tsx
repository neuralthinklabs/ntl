'use client'

import { useActionState } from 'react'
import { createOAuthClient } from '@/actions/admin/oauth-clients'
import { Field, FormMessage, SubmitButton, fieldClass } from './fields'

export function OAuthClientForm() {
  const [state, action] = useActionState(createOAuthClient, null)
  return (
    <form action={action} className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <Field label="App name" hint="Shown to people on the consent screen, e.g. Learning Hub.">
        <input name="name" required maxLength={80} className={fieldClass} />
      </Field>
      <Field label="Redirect URLs" hint="One per line. Exactly where the app receives the sign-in result. https only (http://localhost is allowed for testing).">
        <textarea name="redirectUris" rows={4} required placeholder="https://learn.example.org/auth/callback/ntl" className={`${fieldClass} resize-none font-mono`} />
      </Field>
      <FormMessage state={state} />
      <div>
        <SubmitButton pendingLabel="Registering…">Register app</SubmitButton>
      </div>
    </form>
  )
}
