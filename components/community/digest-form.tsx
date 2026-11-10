'use client'

import { useState, useTransition } from 'react'
import { setDigestPreference } from '@/actions/community-prefs'
import { DIGEST_LABEL, DIGEST_OPTIONS } from '@/lib/collab/constants'

export function DigestForm({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial)
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => { e.preventDefault(); setMsg(null); start(async () => { const res = await setDigestPreference(value); setMsg(res?.error ? { ok: false, text: res.error } : { ok: true, text: res?.success ?? 'Saved.' }) }) }}
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-ink">Email digest</legend>
        {DIGEST_OPTIONS.map((o) => (
          <label key={o} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 text-sm text-ink hover:bg-slate-50">
            <input type="radio" name="digest" value={o} checked={value === o} onChange={() => setValue(o)} className="size-4 accent-[#38b6ff]" />
            {DIGEST_LABEL[o]}
          </label>
        ))}
      </fieldset>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-60">{pending ? 'Saving…' : 'Save'}</button>
        {msg && <span role={msg.ok ? 'status' : 'alert'} className={msg.ok ? 'text-xs text-brand-muted' : 'text-xs text-red-700'}>{msg.text}</span>}
      </div>
    </form>
  )
}
