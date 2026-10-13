import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { NtldgsView } from '@/components/ntldgs/view'
import { goalIndexBySlug, goals } from '@/lib/ntldgs'

export const metadata: Metadata = {
  title: 'The 12 NTLDGs',
  description: 'A better life, a stronger society, and a future worth inheriting. Twelve goals, one connected system.',
  alternates: { canonical: '/ntldgs' },
}

export default async function NtldgsPage({ searchParams }: { searchParams: Promise<{ goal?: string }> }) {
  const { goal } = await searchParams
  // Old shared links used ?goal=<slug>; send them to the per-goal page.
  if (goalIndexBySlug(goal) >= 0) redirect(`/ntldgs/${goal}`)
  return <NtldgsView slug={goals[0].slug} />
}
