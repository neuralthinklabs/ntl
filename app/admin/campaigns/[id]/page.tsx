import { notFound } from 'next/navigation'
import { asc, desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { goals, goalMilestones, goalUpdates, profiles, projectContributors } from '@/db/schema'
import { AdminHeader } from '@/components/admin/admin-header'
import { CampaignForm } from '@/components/admin/campaign-form'
import { DeleteButton } from '@/components/admin/delete-button'
import { MilestoneEditor, UpdatesEditor } from '@/components/admin/campaign-extras'
import { ContributorEditor } from '@/components/admin/campaign-contributors'
import { deleteCampaign } from '@/actions/admin/campaigns'
import { addContributor, removeContributor } from '@/actions/admin/contributors'

export const metadata = { title: 'Edit campaign' }

const day = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : '')

export default async function EditCampaignPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params
  const { created } = await searchParams
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const g = await db.query.goals.findFirst({ where: eq(goals.id, id) })
  if (!g) notFound()
  const [milestones, updates, people] = await Promise.all([
    db.query.goalMilestones.findMany({ where: eq(goalMilestones.goalId, id), orderBy: [asc(goalMilestones.sortOrder)] }),
    db.query.goalUpdates.findMany({ where: eq(goalUpdates.goalId, id), orderBy: [desc(goalUpdates.createdAt)] }),
    db
      .select({ userId: profiles.id, name: profiles.fullName, email: profiles.email, ntlId: profiles.ntlId, showCredit: profiles.showCredit, roleLabel: projectContributors.roleLabel })
      .from(projectContributors)
      .innerJoin(profiles, eq(projectContributors.userId, profiles.id))
      .where(eq(projectContributors.goalId, id))
      .orderBy(asc(projectContributors.createdAt)),
  ])

  return (
    <>
      <AdminHeader title="Edit campaign" />
      {created && <p role="status" className="mb-4 rounded-lg bg-brand/10 px-3.5 py-2.5 text-sm text-brand-muted">Campaign created.</p>}
      <div className="flex flex-col gap-6">
        <CampaignForm
          initial={{
            id: g.id,
            title: g.title,
            slug: g.slug,
            ntldgSlug: g.ntldgSlug ?? '',
            problemSummary: g.problemSummary ?? '',
            objective: g.objective ?? '',
            responsibleTeam: g.responsibleTeam ?? '',
            status: g.status,
            target: String(Math.round(g.fundingTargetCents / 100)),
            raised: String(Math.round(g.fundingRaisedCents / 100)),
            startDate: day(g.startDate),
            endDate: day(g.endDate),
            heroImage: g.heroImage ?? '',
          }}
        />
        <ContributorEditor
          contributors={people.map((p) => ({ userId: p.userId, name: p.name || p.email, ntlId: p.ntlId, roleLabel: p.roleLabel, hidden: !p.showCredit }))}
          add={addContributor.bind(null, g.id)}
          remove={removeContributor.bind(null, g.id)}
          where="this campaign"
        />
        <MilestoneEditor goalId={g.id} milestones={milestones.map((m) => ({ id: m.id, name: m.name, status: m.status }))} />
        <UpdatesEditor goalId={g.id} updates={updates.map((u) => ({ id: u.id, title: u.title, body: u.body, date: u.createdAt.toLocaleDateString('en-US', { timeZone: 'UTC' }) }))} />
        <div>
          <DeleteButton action={deleteCampaign.bind(null, g.id)} what={`“${g.title}” with its milestones and updates`} label="Delete campaign" />
        </div>
      </div>
    </>
  )
}
