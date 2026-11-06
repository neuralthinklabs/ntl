'use client'

import { useActionState, useState } from 'react'
import { saveCommunity } from '@/actions/admin/community'
import { ATLAS_SCOPES, ATLAS_SCOPE_LABEL, COMMUNITY_KINDS, KIND_LABEL, VISIBILITY_HELP, VISIBILITY_LABEL, isInternalKind } from '@/lib/community/constants'
import { Field, FormMessage, SubmitButton, fieldClass } from './fields'

export type CommunityFormValues = {
  id?: string; name: string; slug: string; description: string; kind: string; visibility: string
  atlasScope: string; atlasUnitId: string; goalId: string; requirePostApproval: boolean
}
type Option = { id: string; label: string }

export function CommunityForm({ initial, atlasUnits, goals }: { initial?: CommunityFormValues; atlasUnits: Option[]; goals: Option[] }) {
  const [state, action] = useActionState(saveCommunity, null)
  const v = initial
  const [kind, setKind] = useState(v?.kind ?? 'interest')
  const [visibility, setVisibility] = useState(v?.visibility ?? 'public')
  const internal = isInternalKind(kind)
  const effective = internal ? 'internal' : visibility === 'internal' ? 'public' : visibility
  const locked = v?.visibility === 'internal'

  return (
    <form action={action} className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {v?.id && <input type="hidden" name="id" value={v.id} />}
      <Field label="Name"><input name="name" required defaultValue={v?.name} className={fieldClass} /></Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Type" hint="Departments, leadership, zone and operations spaces are always internal and hidden.">
          <select name="kind" value={kind} onChange={(e) => setKind(e.target.value)} className={fieldClass} disabled={!!v?.id && locked}>
            {COMMUNITY_KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
          </select>
          {!!v?.id && locked && <input type="hidden" name="kind" value={kind} />}
        </Field>
        <Field label="Visibility" hint={VISIBILITY_HELP[effective]}>
          <select name="visibility" value={effective} onChange={(e) => setVisibility(e.target.value)} className={fieldClass} disabled={internal}>
            {internal ? <option value="internal">{VISIBILITY_LABEL.internal}</option> : (['public', 'private'] as const).map((x) => <option key={x} value={x}>{VISIBILITY_LABEL[x]}</option>)}
          </select>
          {internal && <input type="hidden" name="visibility" value="internal" />}
        </Field>
      </div>
      {kind === 'atlas' && (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Atlas scope">
            <select name="atlasScope" defaultValue={v?.atlasScope ?? 'national'} className={fieldClass}>
              {ATLAS_SCOPES.map((s) => <option key={s} value={s}>{ATLAS_SCOPE_LABEL[s]}</option>)}
            </select>
          </Field>
          <Field label="Linked Atlas unit (optional)" hint="National groups need none. Zone, region and city groups can link to a published Atlas unit.">
            <select name="atlasUnitId" defaultValue={v?.atlasUnitId ?? ''} className={fieldClass}>
              <option value="">None</option>
              {atlasUnits.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
          </Field>
        </div>
      )}
      {kind === 'project' && (
        <Field label="Linked campaign (optional)">
          <select name="goalId" defaultValue={v?.goalId ?? ''} className={fieldClass}>
            <option value="">None</option>
            {goals.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select>
        </Field>
      )}
      <Field label="Description"><textarea name="description" rows={4} defaultValue={v?.description} className={`${fieldClass} resize-none`} /></Field>
      <label className="flex items-start gap-3 text-sm text-ink">
        <input type="checkbox" name="requirePostApproval" defaultChecked={v?.requirePostApproval} className="mt-0.5 size-4 accent-[#38b6ff]" />
        <span>Moderators approve posts before they appear<span className="block text-xs text-slate-600">Leaders, moderators and verified contributors skip approval.</span></span>
      </label>
      {!v?.id && (
        <Field label="First leader (NTL ID, optional)" hint="They get the Leader role in this group. You can add more people from the group's Members tab.">
          <input name="leaderNtlId" placeholder="NTL-XXXX-XXXX" className={`${fieldClass} font-mono uppercase`} />
        </Field>
      )}
      <Field label="Web address (optional)" hint="Leave blank to build it from the name."><input name="slug" defaultValue={v?.slug} className={fieldClass} /></Field>
      <FormMessage state={state} />
      <div><SubmitButton>{v?.id ? 'Save group' : 'Create group'}</SubmitButton></div>
    </form>
  )
}
