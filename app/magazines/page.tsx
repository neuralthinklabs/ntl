import type { Metadata } from 'next'
import { CollectionIndex } from '@/components/collections/collection-index'

export const metadata: Metadata = { title: 'Magazines', description: 'Issue-based publications from Neural Think Labs.' }
export const dynamic = 'force-dynamic'

export default function MagazinesPage() {
  return <CollectionIndex kind="magazine" />
}
