import { desc, eq } from 'drizzle-orm'
import { ExternalLink, Pin } from 'lucide-react'
import { db } from '@/db'
import { groupResources } from '@/db/phase3-schema'
import { ActionButton } from './action-button'
import { ResourceForm } from './resource-form'
import { MentionText } from './mention-text'
import { deleteResource } from '@/actions/resources'
import { formatDate } from '@/lib/datetime'
import type { Access, Community } from '@/lib/community/authz'

export async function ResourcesTab({ community, access }: { community: Community; access: Access }) {
  const rows = await db
    .select()
    .from(groupResources)
    .where(eq(groupResources.communityId, community.id))
    .orderBy(desc(groupResources.pinned), desc(groupResources.createdAt))
    .limit(200)
  const canManage = access.canModerate && !community.archivedAt
  return (
    <section className="mt-8 flex flex-col gap-6">
      {canManage && <ResourceForm communityId={community.id} />}
      <ul className="flex flex-col gap-3">
        {rows.length === 0 && <li className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">No resources yet.{canManage ? ' Add guidelines or useful links above.' : ''}</li>}
        {rows.map((r) => (
          <li key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h3 className="flex items-center gap-2 text-base font-semibold text-ink">
                {r.pinned && <Pin className="size-4 text-slate-500" aria-label="Pinned" />}
                {r.title}
              </h3>
              <span className="text-xs text-slate-600">{formatDate(r.createdAt)}</span>
            </div>
            {r.description && <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700"><MentionText text={r.description} /></p>}
            {r.url && r.url.startsWith('https://') && (
              <p className="mt-3">
                <a href={r.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1.5 break-all text-sm font-medium text-brand-muted underline">
                  <ExternalLink className="size-4 shrink-0" /> {r.url.replace(/^https:\/\//, '').slice(0, 80)}
                </a>
              </p>
            )}
            {canManage && (
              <div className="mt-3">
                <ActionButton action={deleteResource.bind(null, r.id)} label="Remove" confirm="Remove this resource?" variant="danger" />
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
