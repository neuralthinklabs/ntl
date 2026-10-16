'use client'

import { useActionState } from 'react'
import { createBlogAssignment } from '@/actions/admin/assignments'
import { Field, FormMessage, SubmitButton, fieldClass } from './fields'

export function BlogAssignForm({ people }: { people: { id: string; label: string; role: string }[] }) {
  const [state, action] = useActionState(createBlogAssignment, null)

  if (people.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
        No volunteers or core-team members yet. Give someone that role in Admin &gt; Users first.
      </p>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <Field label="Writer">
        <select name="assignee" required defaultValue="" className={fieldClass}>
          <option value="" disabled>Choose a person</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>{p.label} ({p.role})</option>
          ))}
        </select>
      </Field>
      <Field label="Topic / working title">
        <input name="title" required className={fieldClass} placeholder="e.g. How our clean water pilot works" />
      </Field>
      <Field label="Brief (optional)" hint="Angle, length, links, anything the writer needs.">
        <textarea name="brief" rows={5} maxLength={3000} className={`${fieldClass} resize-none`} />
      </Field>
      <Field label="Due date (optional)">
        <input name="dueDate" type="date" className={fieldClass} />
      </Field>
      <FormMessage state={state} />
      <div>
        <SubmitButton pendingLabel="Assigning…">Assign writing</SubmitButton>
      </div>
    </form>
  )
}
