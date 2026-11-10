import { asc, eq } from 'drizzle-orm'
import { FileText } from 'lucide-react'
import { db } from '@/db'
import { postAttachments } from '@/db/collab-schema'
import { createClient } from '@/lib/supabase/server'
import { BUCKET } from '@/lib/collab/uploads'
import { formatBytes } from '@/lib/upload-limits'

/** Files on a post. Links are signed for an hour; the bucket policy decides who can read them. */
export async function PostAttachments({ postId }: { postId: string }) {
  const rows = await db.select().from(postAttachments).where(eq(postAttachments.postId, postId)).orderBy(asc(postAttachments.createdAt))
  if (!rows.length) return null
  const supabase = await createClient()
  const files = await Promise.all(
    rows.map(async (r) => {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(r.storagePath, 3600)
      return { r, url: data?.signedUrl ?? null }
    }),
  )
  return (
    <ul className="mt-3 flex flex-wrap gap-3">
      {files.map(({ r, url }) => {
        const image = !!r.fileType?.startsWith('image/')
        if (!url) return <li key={r.id} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-600">{r.fileName} (unavailable)</li>
        return (
          <li key={r.id}>
            {image ? (
              <a href={url} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={r.fileName} className="max-h-56 max-w-full rounded-lg border border-slate-200 object-cover" />
              </a>
            ) : (
              <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-ink hover:bg-slate-50">
                <FileText className="size-4 text-slate-500" /> {r.fileName}{r.fileSize ? ` · ${formatBytes(r.fileSize)}` : ''}
              </a>
            )}
          </li>
        )
      })}
    </ul>
  )
}
