import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NtldgsView } from '@/components/ntldgs/view'
import { goalIndexBySlug, goals } from '@/lib/ntldgs'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return goals.map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const i = goalIndexBySlug(slug)
  if (i < 0) return { title: 'Goal not found' }
  const g = goals[i]
  return {
    title: `${g.verb}: ${g.title} — NTLDGs`,
    description: g.question,
    alternates: { canonical: `/ntldgs/${g.slug}` },
  }
}

export default async function NtldgGoalPage({ params }: Props) {
  const { slug } = await params
  if (goalIndexBySlug(slug) < 0) notFound()
  return <NtldgsView slug={slug} />
}
