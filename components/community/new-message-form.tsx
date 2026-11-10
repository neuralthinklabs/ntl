'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { NTL_ID_RE } from '@/lib/ntl-id'
import { fieldClass } from '@/lib/ui'

export function NewMessageForm() {
  const router = useRouter()
  const [id, setId] = useState('')
  const [error, setError] = useState<string | null>(null)
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        const v = id.trim().toUpperCase()
        if (!NTL_ID_RE.test(v)) return setError('Enter a valid NTL ID, like NTL-7K3M-9QX2.')
        router.push(`/community/messages/${v}`)
      }}
    >
      <label className="block text-xs font-medium text-ink">Message someone by NTL ID
        <input value={id} onChange={(e) => { setId(e.target.value.toUpperCase()); setError(null) }} placeholder="NTL-XXXX-XXXX" className={`${fieldClass} mt-1 w-52 font-mono`} />
      </label>
      <button type="submit" className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand/90">Open</button>
      {error && <span role="alert" className="text-xs text-red-700">{error}</span>}
    </form>
  )
}
