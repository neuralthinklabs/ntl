import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { getViewer } from '@/lib/community/authz'
import { getMyTasks } from '@/lib/collab/queries'
import { TASK_PRIORITY_LABEL, TASK_STATUS_LABEL } from '@/lib/collab/constants'
import { groupHref } from '@/lib/community/constants'
import { formatDate } from '@/lib/datetime'

export const metadata: Metadata = { title: 'My tasks', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function MyTasksPage() {
  const viewer = await getViewer()
  if (!viewer) redirect('/auth/login?next=/community/tasks')
  const tasks = await getMyTasks(viewer.id)
  const today = new Date().toISOString().slice(0, 10)
  return (
    <SiteShell>
      <PageHero title="My tasks" description="Open tasks assigned to you across your groups and workspaces." />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <ul className="flex flex-col gap-3">
          {tasks.length === 0 && <li className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">Nothing assigned to you right now.</li>}
          {tasks.map((t) => {
            const due = t.dueDate ? t.dueDate.toISOString().slice(0, 10) : null
            return (
              <li key={t.id}>
                <Link href={`${groupHref({ slug: t.groupSlug, visibility: t.groupVisibility })}?tab=tasks&mine=1`} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink">{t.title}</span>
                    <span className="block text-xs text-slate-600">{t.groupName} · {TASK_PRIORITY_LABEL[t.priority]} priority</span>
                  </span>
                  <span className="shrink-0 text-right text-xs text-slate-600">
                    <span className="block font-medium text-ink">{TASK_STATUS_LABEL[t.status]}</span>
                    {t.dueDate && <span className={due && due < today ? 'font-medium text-red-700' : ''}>due {formatDate(t.dueDate)}</span>}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </SiteShell>
  )
}
