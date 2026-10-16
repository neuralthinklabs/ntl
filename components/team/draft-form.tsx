'use client'

import { useActionState } from 'react'
import { saveMyDraft } from '@/actions/team'
import { Field, FormMessage, SubmitButton, fieldClass } from '@/components/admin/fields'

export function DraftForm({
  assignmentId,
  initial,
  locked,
}: {
  assignmentId: string
  initial: { title: string; excerpt: string; body: string }
  locked: boolean
}) {
  const [state, action] = useActionState(saveMyDraft, null)

  return (
    <form action={action} className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <fieldset disabled={locked} className="flex flex-col gap-5 disabled:opacity-70">
        <Field label="Title">
          <input name="title" required defaultValue={initial.title} className={fieldClass} />
        </Field>
        <Field label="Short summary" hint="Shown on cards and in link previews. Up to 400 characters.">
          <textarea name="excerpt" rows={2} maxLength={400} defaultValue={initial.excerpt} className={`${fieldClass} resize-none`} />
        </Field>
        <Field label="Body" hint="Blank line = new paragraph. Start a line with “## ” for a heading or “- ” for a bullet. **bold** and [text](https://link) work.">
          <textarea name="body" rows={18} defaultValue={initial.body} className={`${fieldClass} font-mono`} />
        </Field>
      </fieldset>
      <FormMessage state={state} />
      {locked ? (
        <p className="text-sm text-slate-600">This post is closed or already published, so it can no longer be edited here.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton name="intent" value="save" variant="outline">Save draft</SubmitButton>
          <SubmitButton name="intent" value="submit" pendingLabel="Submitting…">Submit for review</SubmitButton>
        </div>
      )}
    </form>
  )
}
