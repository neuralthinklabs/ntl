'use client'

import { useActionState } from 'react'
import { saveCollection } from '@/actions/admin/collections'
import { COLLECTION_KINDS, COLLECTION_LABEL } from '@/lib/collection-constants'
import { Field, FormMessage, SubmitButton, fieldClass } from './fields'
import { ImageUpload } from './image-upload'

export type CollectionFormValues = {
  id?: string
  title: string
  slug: string
  kind: string
  description: string
  coverImage: string
  published: boolean
}

export function CollectionForm({ initial }: { initial?: CollectionFormValues }) {
  const [state, action] = useActionState(saveCollection, null)
  const v = initial
  return (
    <form action={action} className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {v?.id && <input type="hidden" name="id" value={v.id} />}
      <Field label="Title">
        <input name="title" required defaultValue={v?.title} className={fieldClass} />
      </Field>
      <Field label="Type" hint="A series is numbered parts. A magazine groups articles into issues.">
        <select name="kind" defaultValue={v?.kind ?? 'series'} className={fieldClass}>
          {COLLECTION_KINDS.map((k) => (
            <option key={k} value={k}>{COLLECTION_LABEL[k]}</option>
          ))}
        </select>
      </Field>
      <Field label="Description">
        <textarea name="description" rows={4} defaultValue={v?.description} className={`${fieldClass} resize-none`} />
      </Field>
      <ImageUpload name="coverImage" folder="collections" defaultValue={v?.coverImage} label="Cover image" />
      <Field label="Web address (optional)" hint="Leave blank to build it from the title.">
        <input name="slug" defaultValue={v?.slug} className={fieldClass} />
      </Field>
      <label className="flex items-center gap-2 text-sm font-medium text-ink">
        <input type="checkbox" name="published" defaultChecked={v?.published} className="size-4 accent-[#38b6ff]" /> Published (visible to the public)
      </label>
      <FormMessage state={state} />
      <div>
        <SubmitButton>{v?.id ? 'Save' : 'Create'}</SubmitButton>
      </div>
    </form>
  )
}
