import type { Metadata } from 'next'
import { CollectionIndex } from '@/components/collections/collection-index'

export const metadata: Metadata = { title: 'Series', description: 'Multi-part stories from Neural Think Labs.' }
export const dynamic = 'force-dynamic'

export default function SeriesPage() {
  return <CollectionIndex kind="series" />
}
