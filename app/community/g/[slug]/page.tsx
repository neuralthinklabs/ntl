import type { Metadata } from 'next'
import { GroupView } from '@/components/community/group-view'
import { loadGroup } from '@/lib/community/authz'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ tab?: string; type?: string; page?: string }> }
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const g = await loadGroup(slug, false)
  if (!g) return { title: 'Group not found' }
  // Only public groups are indexed.
  return { title: g.community.name, description: g.community.description?.slice(0, 160) || undefined, robots: g.community.visibility === 'public' ? undefined : { index: false, follow: false } }
}

export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params
  return <GroupView slug={slug} internal={false} sp={await searchParams} />
}
