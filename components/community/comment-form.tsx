'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addComment } from '@/actions/community'
import { fieldClass } from '@/lib/ui'

export function CommentForm({ postId, parentId, onDone, placeholder = 'Write a comment…' }: { postId: string; parentId?: string; onDone?: () => void; placeholder?: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        setError(null)
        start(async () => {
          const res = await addComment(postId, body, parentId)
          if (res?.error) setError(res.error)
          else { setBody(''); onDone?.(); router.refresh() }
        })
      }}
    >
      <label className="sr-only" htmlFor={`c-${parentId ?? postId}`}>{placeholder}</label>
      <textarea id={`c-${parentId ?? postId}`} value={body} onChange={(e) => setBody(e.target.value)} rows={parentId ? 2 : 3} maxLength={3000} required placeholder={placeholder} className={`${fieldClass} resize-y`} />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending || !body.trim()} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-60">
          {pending ? 'Posting…' : parentId ? 'Reply' : 'Comment'}
        </button>
        {error && <span role="alert" className="text-xs text-red-700">{error}</span>}
      </div>
    </form>
  )
}

export function ReplyToggle({ postId, parentId }: { postId: string; parentId: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-1">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="text-xs font-medium text-slate-600 underline">{open ? 'Cancel' : 'Reply'}</button>
      {open && <div className="mt-2"><CommentForm postId={postId} parentId={parentId} onDone={() => setOpen(false)} placeholder="Write a reply…" /></div>}
    </div>
  )
}
