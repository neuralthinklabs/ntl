'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { updateProfile } from '@/actions/profile'

const fieldClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20'

export function ProfileForm({
  email,
  fullName,
  bio,
  ntlId,
  showCredit,
}: {
  email: string
  fullName: string
  bio: string
  ntlId: string
  showCredit: boolean
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
        <span className="mb-1.5 block text-sm font-medium text-ink">Your NTL ID</span>
        <input value={ntlId} readOnly className={`${fieldClass} bg-slate-50 font-mono text-slate-700`} />
        <span className="mt-1 block text-xs text-slate-500">
          Your permanent identity across Neural Think Labs. It never changes.{' '}
          {showCredit && <Link href={`/u/${ntlId}`} className="font-medium text-brand-muted underline">View your public page</Link>}
        </span>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Full name</span>
        <input name="fullName" defaultValue={fullName} required className={fieldClass} />
      </label>
      

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Author bio</span>
        <textarea name="bio" defaultValue={bio} rows={4} maxLength={500} className={`${fieldClass} resize-none`} />
        <span className="mt-1 block text-xs text-slate-500">
          Shown under every blog post you write and on your public page. Up to 500 characters.
        </span>
      </label>

      <label className="flex items-start gap-3">
        <input type="checkbox" name="showCredit" defaultChecked={showCredit} className="mt-0.5 size-4 accent-[#38b6ff]" />
        <span className="text-sm text-ink">
          Show my name and NTL ID publicly when I am credited on a project or blog post
          <span className="mt-0.5 block text-xs text-slate-500">Turn this off to stay anonymous. Your bio is only shown on your public page.</span>
        </span>
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
