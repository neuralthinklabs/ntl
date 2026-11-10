'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Paperclip } from 'lucide-react'
import { createPost } from '@/actions/community'
import { POST_TYPES, POST_TYPE_LABEL } from '@/lib/community/constants'
import { COMMUNITY_MAX_FILES, COMMUNITY_MAX_FILE_BYTES } from '@/lib/collab/constants'
import { formatBytes, safeFileName } from '@/lib/upload-limits'
import { hasValidFileSignature } from '@/lib/file-signature'
import { createClient } from '@/lib/supabase/client'
import { fieldClass } from '@/lib/ui'
import { FormMessage, SubmitButton } from '@/components/admin/fields'

export type ComposerGroup = { id: string; name: string; kind: string; canModerate: boolean }

export function Composer({
  groups,
  loggedIn,
  verified,
  nextPath,
  fixedGroupId,
}: {
  groups: ComposerGroup[]
  loggedIn: boolean
  verified: boolean
  nextPath: string
  fixedGroupId?: string
}) {
  const [state, formAction] = useActionState(createPost, null)
  const [communityId, setCommunityId] = useState(fixedGroupId ?? groups[0]?.id ?? '')
  const [type, setType] = useState<string>('discussion')
  const [startsLocal, setStartsLocal] = useState('')
  const [closesLocal, setClosesLocal] = useState('')
  const [requestId, setRequestId] = useState(() => crypto.randomUUID())
  const [fileError, setFileError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const filesRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset()
      setStartsLocal('')
      setClosesLocal('')
      setType('discussion')
      setFileError(null)
      setRequestId(crypto.randomUUID())
    }
  }, [state])

  if (!loggedIn) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm">
        <Link href={`/auth/login?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-brand-muted underline">Log in</Link> or{' '}
        <Link href="/auth/signup" className="font-semibold text-brand-muted underline">create an account</Link> to post, comment and join groups.
      </p>
    )
  }
  if (!groups.length) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-700">
        Join a group to start posting. <Link href="/community/discover" className="font-semibold text-brand-muted underline">Discover groups</Link>.
      </p>
    )
  }

  const group = groups.find((g) => g.id === communityId)
  const allowed = POST_TYPES.filter((t) => {
    if (t === 'announcement') return !!group?.canModerate
    if (t === 'project_update') return group?.kind === 'project' || !!group?.canModerate
    if (t === 'event') return !!group?.canModerate || verified
    return true
  })
  const iso = (v: string) => (v ? new Date(v).toISOString() : '')

  async function validateFiles(list: FileList | null) {
    if (!list || list.length === 0) return setFileError(null)
    if (list.length > COMMUNITY_MAX_FILES) return setFileError(`Attach at most ${COMMUNITY_MAX_FILES} files (you selected ${list.length}).`)
    for (const f of Array.from(list)) {
      if (f.size > COMMUNITY_MAX_FILE_BYTES) return setFileError(`"${f.name}" is ${formatBytes(f.size)}, over the ${formatBytes(COMMUNITY_MAX_FILE_BYTES)} limit.`)
      if (!(await hasValidFileSignature(f))) return setFileError(`"${f.name}" is not a supported file. Use an image or PDF.`)
    }
    setFileError(null)
  }

  // Files go straight from the browser to Storage; the server re-checks every one.
  async function onSubmit(fd: FormData) {
    setUploadError(null)
    if (fileError) return
    const files = Array.from(filesRef.current?.files ?? [])
    const uploads: { path: string; name: string; type: string; size: number }[] = []
    if (files.length) {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error('not signed in')
        for (const f of files) {
          const path = `${communityId}/${user.id}/${requestId}/${crypto.randomUUID()}-${safeFileName(f.name)}`
          const { error } = await supabase.storage.from('community-media').upload(path, f, { contentType: f.type })
          if (error) throw error
          uploads.push({ path, name: f.name, type: f.type, size: f.size })
        }
      } catch (e) {
        console.error(e)
        setUploadError('One of your files failed to upload. Check your connection and try again.')
        return
      }
    }
    fd.delete('files')
    fd.set('uploads', JSON.stringify(uploads))
    formAction(fd)
  }

  return (
    <form ref={formRef} action={onSubmit} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <input type="hidden" name="clientRequestId" value={requestId} />
      <input type="hidden" name="eventStartsAt" value={type === 'event' ? iso(startsLocal) : ''} />
      <input type="hidden" name="pollClosesAt" value={type === 'poll' ? iso(closesLocal) : ''} />
      <div className="grid gap-3 sm:grid-cols-2">
        {fixedGroupId ? (
          <input type="hidden" name="communityId" value={fixedGroupId} />
        ) : (
          <label className="block">
            <span className="sr-only">Group</span>
            <select name="communityId" value={communityId} onChange={(e) => { setCommunityId(e.target.value); setType('discussion') }} className={fieldClass}>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </label>
        )}
        <label className="block">
          <span className="sr-only">Post type</span>
          <select name="type" value={type} onChange={(e) => setType(e.target.value)} className={fieldClass}>
            {allowed.map((t) => <option key={t} value={t}>{POST_TYPE_LABEL[t]}</option>)}
          </select>
        </label>
      </div>
      {type !== 'discussion' && <input name="title" required minLength={3} maxLength={200} placeholder="Title" aria-label="Title" className={fieldClass} />}
      <textarea name="body" required minLength={3} maxLength={10000} rows={type === 'discussion' ? 3 : 5} placeholder={type === 'idea' ? 'Describe your idea and the problem it solves…' : type === 'poll' ? 'What do you want to ask?' : 'Start a discussion…'} aria-label="Post text" className={`${fieldClass} resize-y`} />
      {type === 'poll' && (
        <>
          <textarea name="pollOptions" required rows={4} placeholder={'One option per line (2 to 6)'} aria-label="Poll options" className={`${fieldClass} resize-none`} />
          <label className="block text-xs text-slate-600">Closes (optional)
            <input type="datetime-local" value={closesLocal} onChange={(e) => setClosesLocal(e.target.value)} className={`${fieldClass} mt-1`} />
          </label>
        </>
      )}
      {type === 'event' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs text-slate-600">Starts
            <input type="datetime-local" required value={startsLocal} onChange={(e) => setStartsLocal(e.target.value)} className={`${fieldClass} mt-1`} />
          </label>
          <label className="block text-xs text-slate-600">Where
            <input name="eventLocation" maxLength={200} placeholder="Venue or online" className={`${fieldClass} mt-1`} />
          </label>
        </div>
      )}
      {(type === 'resource' || type === 'research' || type === 'event' || type === 'project_update') && (
        <input name="linkUrl" type="url" required={type === 'resource'} placeholder={type === 'resource' ? 'Link to the resource (https://…)' : 'Link (optional, https://…)'} aria-label="Link" className={fieldClass} />
      )}
      <label className="block text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5 font-medium text-ink"><Paperclip className="size-3.5" /> Attach images or a PDF (optional, up to {COMMUNITY_MAX_FILES} files, {formatBytes(COMMUNITY_MAX_FILE_BYTES)} each)</span>
        <input ref={filesRef} name="files" type="file" multiple accept="image/*,.pdf" onChange={(e) => validateFiles(e.target.files)} className="mt-1 block w-full text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-brand/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-muted" />
      </label>
      {fileError && <p role="alert" className="text-xs text-red-700">{fileError}</p>}
      {uploadError && <p role="alert" className="text-xs text-red-700">{uploadError}</p>}
      <FormMessage state={state} />
      <div><SubmitButton pendingLabel="Posting…">Post</SubmitButton></div>
    </form>
  )
}
