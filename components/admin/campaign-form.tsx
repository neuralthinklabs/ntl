'use client'

import { useActionState } from 'react'
import { saveCampaign } from '@/actions/admin/campaigns'
import { goals as ntldgs } from '@/lib/ntldgs'
import { Field, FormMessage, SubmitButton, fieldClass } from './fields'
import { ImageUpload } from './image-upload'

export type CampaignFormValues = {
  id?: string
  title: string
  slug: string
  ntldgSlug: string
  problemSummary: string
  objective: string
  responsibleTeam: string
  status: string
  target: string
  raised: string
  startDate: string
  endDate: string
  heroImage: string
}

export function CampaignForm({ initial }: { initial?: CampaignFormValues }) {
  const [state, action] = useActionState(saveCampaign, null)
  const v = initial

  return (
    <form action={action} className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {v?.id && <input type="hidden" name="id" value={v.id} />}
      <Field label="Title">
        <input name="title" required defaultValue={v?.title} className={fieldClass} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Status">
          <select name="status" defaultValue={v?.status ?? 'planned'} className={fieldClass}>
            <option value="planned">Planned</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
        </Field>
        <Field label="Related goal (optional)">
          <select name="ntldgSlug" defaultValue={v?.ntldgSlug ?? ''} className={fieldClass}>
            <option value="">None</option>
            {ntldgs.map((g) => (
              <option key={g.slug} value={g.slug}>
                {g.number}. {g.verb}: {g.title}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="The problem">
        <textarea name="problemSummary" rows={3} defaultValue={v?.problemSummary} className={`${fieldClass} resize-none`} />
      </Field>
      <Field label="Our objective">
        <textarea name="objective" rows={3} defaultValue={v?.objective} className={`${fieldClass} resize-none`} />
      </Field>
      <Field label="Responsible team">
        <input name="responsibleTeam" defaultValue={v?.responsibleTeam} className={fieldClass} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Funding target (USD)">
          <input name="target" type="number" min="0" step="1" defaultValue={v?.target ?? '0'} className={fieldClass} />
        </Field>
        <Field
          label="Raised so far (USD)"
          hint="Confirming a pledge adds to this automatically. Edit it here only to record offline donations or corrections."
        >
          <input name="raised" type="number" min="0" step="1" defaultValue={v?.raised ?? '0'} className={fieldClass} />
        </Field>
        <Field label="Start date">
          <input name="startDate" type="date" defaultValue={v?.startDate} className={fieldClass} />
        </Field>
        <Field label="End date">
          <input name="endDate" type="date" defaultValue={v?.endDate} className={fieldClass} />
        </Field>
      </div>
      <ImageUpload name="heroImage" folder="campaigns" defaultValue={v?.heroImage} label="Header image" />
      <Field label="Web address (optional)" hint="Leave blank to build it from the title.">
        <input name="slug" defaultValue={v?.slug} className={fieldClass} />
      </Field>
      <FormMessage state={state} />
      <div>
        <SubmitButton>{v?.id ? 'Save campaign' : 'Create campaign'}</SubmitButton>
      </div>
    </form>
  )
}
