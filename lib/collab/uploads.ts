import 'server-only'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { hasValidSignatureBytes } from '@/lib/file-signature'
import { COMMUNITY_MAX_FILES, COMMUNITY_MAX_FILE_BYTES } from './constants'

export const BUCKET = 'community-media'

const uploadSchema = z.object({
  path: z.string().min(1).max(300),
  name: z.string().min(1).max(200),
  type: z.string().max(120).optional(),
  size: z.number().int().nonnegative().max(COMMUNITY_MAX_FILE_BYTES),
})
export type PostUpload = z.infer<typeof uploadSchema>

/** Reads the `uploads` JSON the composer sends (files were already uploaded from the browser). */
export function readUploads(formData: FormData): PostUpload[] | null {
  try {
    return z.array(uploadSchema).max(COMMUNITY_MAX_FILES).parse(JSON.parse(String(formData.get('uploads') || '[]')))
  } catch {
    return null
  }
}

/** Re-checks every uploaded object server-side. Returns an error message, or null when all are fine. */
export async function verifyUploads(uploads: PostUpload[], prefix: string): Promise<string | null> {
  const supabase = await createClient()
  for (const u of uploads) {
    if (!u.path.startsWith(prefix) || u.path.includes('..')) return 'One of your attachments was uploaded to an invalid location. Please try again.'
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(u.path, 60)
    if (error || !data?.signedUrl) return `"${u.name}" could not be found. Please upload it again.`
    const res = await fetch(data.signedUrl, { headers: { Range: 'bytes=0-15' } })
    if (!res.ok) return `"${u.name}" could not be read. Please upload it again.`
    const head = new Uint8Array(await res.arrayBuffer())
    const total = Number(res.headers.get('content-range')?.split('/')[1] ?? res.headers.get('content-length') ?? 0)
    if (!hasValidSignatureBytes(head)) return `"${u.name}" does not look like a supported file. Use an image or PDF.`
    if (total > COMMUNITY_MAX_FILE_BYTES) return `"${u.name}" is larger than the limit.`
  }
  return null
}

export async function removeUploads(paths: string[]) {
  if (!paths.length) return
  try {
    const supabase = await createClient()
    await supabase.storage.from(BUCKET).remove(paths)
  } catch (err) {
    console.error('[community] could not remove uploads:', err)
  }
}
