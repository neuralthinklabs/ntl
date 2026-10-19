'use client'

import { useActionState, useState } from 'react'
import { saveAtlasUnit } from '@/actions/admin/atlas'
import { ATLAS_LEVELS, LEVEL_LABEL, PARENT_LEVEL, type AtlasLevel } from '@/lib/atlas-constants'
import { Field, FormMessage, SubmitButton, fieldClass } from './fields'

export type AtlasFormValues = {
  id?: string
  code: string
  name: string
  level: AtlasLevel
  parentId: string
  summary: string
  demographics: string
  problemDomains: string
  resources: string
  initiatives: string
  dataSources: string
  verified: boolean
  published: boolean
  sortOrder: string
}
export type ParentOption = { id: string; code: string; name: string; level: AtlasLevel }

export function AtlasForm({ initial, parents }: { initial?: AtlasFormValues; parents: ParentOption[] }) {
  const [state, action] = useActionState(saveAtlasUnit, null)
  const [level, setLevel] = useState<AtlasLevel>(initial?.level ?? 'zone')
  const [parentId, setParentId] = useState(initial?.parentId ?? '')
  const v = initial
  const need = PARENT_LEVEL[level]
  const options = parents.filter((p) => p.level === need && p.id !== v?.id)

  return (
    <form action={action} className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {v?.id && <input type="hidden" name="id" value={v.id} />}
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Level">
          <select name="level" value={level} onChange={(e) => { setLevel(e.target.value as AtlasLevel); setParentId('') }} className={fieldClass}>
            {ATLAS_LEVELS.map((l) => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}
          </select>
        </Field>
        <Field label="Code" hint="Public ID, e.g. Z01, Z01-S02, Z01-S02-C03.">
          <input name="code" required defaultValue={v?.code} className={`${fieldClass} font-mono uppercase`} />
        </Field>
        <Field label="Order" hint="Lower numbers first.">
          <input name="sortOrder" type="number" min="0" defaultValue={v?.sortOrder ?? '0'} className={fieldClass} />
        </Field>
      </div>
      <Field label="Name"><input name="name" required defaultValue={v?.name} className={fieldClass} /></Field>
      {need && (
        <Field label={`Parent ${need}`}>
          <select name="parentId" required value={parentId} onChange={(e) => setParentId(e.target.value)} className={fieldClass}>
            <option value="" disabled>Choose a {need}</option>
            {options.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}
          </select>
        </Field>
      )}
      <Field label="Summary"><textarea name="summary" rows={3} defaultValue={v?.summary} className={`${fieldClass} resize-none`} /></Field>
      <Field label="Demographics (aggregate only)" hint="No names or identifiable personal details.">
        <textarea name="demographics" rows={4} defaultValue={v?.demographics} className={`${fieldClass} resize-none`} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Problem domains" hint="One per line."><textarea name="problemDomains" rows={5} defaultValue={v?.problemDomains} className={`${fieldClass} resize-none`} /></Field>
        <Field label="Resources and assets" hint="One per line."><textarea name="resources" rows={5} defaultValue={v?.resources} className={`${fieldClass} resize-none`} /></Field>
      </div>
      <Field label="NTL activity"><textarea name="initiatives" rows={3} defaultValue={v?.initiatives} className={`${fieldClass} resize-none`} /></Field>
      <Field label="Data sources"><input name="dataSources" defaultValue={v?.dataSources} className={fieldClass} /></Field>
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" name="verified" defaultChecked={v?.verified} className="size-4 accent-[#38b6ff]" /> Data is verified
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" name="published" defaultChecked={v?.published} className="size-4 accent-[#38b6ff]" /> Published (visible on the public Atlas)
        </label>
      </div>
      <FormMessage state={state} />
      <div><SubmitButton>{v?.id ? 'Save' : 'Create'}</SubmitButton></div>
    </form>
  )
}
