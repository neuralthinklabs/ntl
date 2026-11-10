'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { editPost, deleteOwnPost } from '@/actions/community-edit'
import { ActionButton } from './action-button'
import { fieldClass } from '@/lib/ui'

const LINK_TYPES = ['resource', 'research', 'event', 'project_update']

/** Edit / delete controls shown to a post's author. */
export function PostAuthorTools({ postId, type, title, body, linkUrl }: { postId: string; type: string; title: string | null; body: string; linkUrl: string | null }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()
  const [t, setT] = useState(title ?? '')
  const [b, setB] = useState(body)
  const [l, setL] = useState(linkUrl ?? '')
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="mt-3 border-t border-slate-200 pt-3">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="text-xs font-medium text-brand-muted underline">{open ? 'Cancel edit' : 'Edit'}</button>
        <ActionButton action={deleteOwnPost.bind(null, postId)} label="Delete" confirm="Delete this post? This cannot be undone." variant="link" className="!text-red-700" />
      </div>
      {open && (
        <form
          className="mt-3 flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            setError(null)
            start(async () => {
              const res = await editPost(postId, { title: t, body: b, linkUrl: l })
              if (res?.error) setError(res.error)
              else { setOpen(false); router.refresh() }
            })
          }}
        >
          {(type !== 'discussion' || !!title) && <input value={t} onChange={(e) => setT(e.target.value)} maxLength={200} aria-label="Title" className={fieldClass} />}
          <textarea value={b} onChange={(e) => setB(e.target.value)} rows={5} maxLength={10000} required aria-label="Post text" className={`${fieldClass} resize-y`} />
          {LINK_TYPES.includes(type) && <input value={l} onChange={(e) => setL(e.target.value)} type="url" placeholder="Link (https://…)" aria-label="Link" className={fieldClass} />}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={pending || b.trim().length < 3} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-60">{pending ? 'Saving…' : 'Save changes'}</button>
            {error && <span role="alert" className="text-xs text-red-700">{error}</span>}
          </div>
        </form>
      )}
    </div>
  )
}
