'use client'

import { useActionState, useEffect, useRef } from 'react'
import { addResource } from '@/actions/resources'
import { Field, FormMessage, SubmitButton, fieldClass } from '@/components/admin/fields'

export function ResourceForm({ communityId }: { communityId: string }) {
  const [state, action] = useActionState(addResource, null)
  const ref = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (state?.success) ref.current?.reset()
  }, [state])
  return (
    <form ref={ref} action={action} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
      <input type="hidden" name="communityId" value={communityId} />
      <h3 className="text-base font-semibold text-ink sm:col-span-2">Add a resource</h3>
      <Field label="Title"><input name="title" required minLength={3} maxLength={160} className={fieldClass} placeholder="Group guidelines" /></Field>
      <Field label="Link (optional)" hint="https://…"><input name="url" type="url" maxLength={500} className={fieldClass} /></Field>
      <Field label="Text (optional)" className="sm:col-span-2" hint="Rules, how-to notes or context. Plain text.">
        <textarea name="description" rows={4} maxLength={3000} className={`${fieldClass} resize-y`} />
      </Field>
      <label className="flex items-center gap-2 text-sm font-medium text-ink sm:col-span-2"><input type="checkbox" name="pinned" className="size-4 accent-[#38b6ff]" /> Pin to the top</label>
      <div className="flex flex-col gap-3 sm:col-span-2"><FormMessage state={state} /><div><SubmitButton pendingLabel="Adding…">Add resource</SubmitButton></div></div>
    </form>
  )
}
