'use client'

import { useActionState } from 'react'
import { updateProfile } from '@/actions/profile'

const fieldClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20'

export function ProfileForm({
  email,
  fullName,
  bio,
}: {
  email: string
  fullName: string
  bio: string
}) {
  const [state, formAction, pending] = useActionState(updateProfile, null)

  return (
    <form
      action={formAction}
      className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Email</span>
        <input value={email} disabled className={`${fieldClass} bg-slate-50 text-slate-400`} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Full name</span>
        <input name="fullName" defaultValue={fullName} required className={fieldClass} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Bio</span>
        <textarea name="bio" defaultValue={bio} rows={4} className={`${fieldClass} resize-none`} />
      </label>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{state.error}</p>
      )}
      {state?.success && (
        <p className="rounded-lg bg-brand/10 px-3.5 py-2.5 text-sm text-brand-muted">{state.success}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-fit items-center justify-center rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90 disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}
