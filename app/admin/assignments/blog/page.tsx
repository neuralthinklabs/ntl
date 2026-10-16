import { asc, inArray } from 'drizzle-orm'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { AdminHeader } from '@/components/admin/admin-header'
import { BlogAssignForm } from '@/components/admin/blog-assign-form'
import { ROLE_LABELS } from '@/lib/roles'

export const metadata = { title: 'Assign a blog post' }
export const dynamic = 'force-dynamic'

export default async function AssignBlogPage() {
  const team = await db
    .select({ id: profiles.id, name: profiles.fullName, email: profiles.email, role: profiles.role })
    .from(profiles)
    .where(inArray(profiles.role, ['volunteer', 'core_team']))
    .orderBy(asc(profiles.fullName))

  return (
    <>
      <AdminHeader
        title="Assign a blog post"
        description="Creates a private draft for the writer. They save and submit it; you review and publish it from Posts & stories. They are credited as the author."
      />
      <BlogAssignForm people={team.map((t) => ({ id: t.id, label: t.name || t.email, role: ROLE_LABELS[t.role] ?? t.role }))} />
    </>
  )
}
