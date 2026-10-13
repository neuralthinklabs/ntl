'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { safeFileName } from '@/lib/upload-limits'

const MAX_BYTES = 5 * 1024 * 1024
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/**
 * Uploads straight from the browser to the public "site-media" bucket (only
 * admins are allowed to write there) and stores the public URL in a hidden
 * input, so the surrounding form submits it like any other field.
 */
export function ImageUpload({
  name,
  folder,
  defaultValue = '',
  label = 'Image',
}: {
  name: string
  folder: string
  defaultValue?: string | null
  label?: string
}) {
  const [url, setUrl] = useState(defaultValue ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onFile(file: File | undefined) {
    if (!file) return
    setError(null)
    if (!OK_TYPES.includes(file.type)) return setError('Use a JPG, PNG, WebP or GIF image.')
    if (file.size > MAX_BYTES) return setError('Images must be 5MB or smaller.')

    setBusy(true)
    try {
      const supabase = createClient()
      const path = `${folder}/${crypto.randomUUID()}-${safeFileName(file.name)}`
      const { error: upErr } = await supabase.storage
        .from('site-media')
        .upload(path, file, { contentType: file.type, cacheControl: '31536000' })
      if (upErr) throw upErr
      setUrl(supabase.storage.from('site-media').getPublicUrl(path).data.publicUrl)
    } catch (e) {
      console.error(e)
      setError('Upload failed. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <input type="hidden" name={name} value={url} />
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="mb-3 h-32 w-full max-w-xs rounded-lg border border-slate-200 object-cover" />
      )}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept={OK_TYPES.join(',')}
          disabled={busy}
          onChange={(e) => onFile(e.target.files?.[0])}
          className="block text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-muted"
        />
        {busy && <span className="text-xs text-slate-500">Uploading…</span>}
        {url && !busy && (
          <button type="button" onClick={() => setUrl('')} className="text-xs font-medium text-red-700 underline">
            Remove image
          </button>
        )}
      </div>
      {error && <p role="alert" className="mt-1.5 text-xs text-red-700">{error}</p>}
    </div>
  )
}
