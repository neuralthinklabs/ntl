import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { GroupView } from '@/components/community/group-view'
import { getViewer } from '@/lib/community/authz'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ tab?: string; type?: string; page?: string }> }
export const dynamic = 'force-dynamic'
// Internal spaces never appear in search results or titles for anyone.
export const metadata: Metadata = { title: 'NTL workspace', robots: { index: false, follow: false } }

export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params
  if (!(await getViewer())) redirect(`/auth/login?next=${encodeURIComponent(`/workspace/${slug}`)}`)
  // GroupView 404s unless the viewer is a member or an admin, so existence is never confirmed.
  return <GroupView slug={slug} internal sp={await searchParams} />
}
