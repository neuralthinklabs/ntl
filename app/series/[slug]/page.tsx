import { CollectionPage, collectionMetadata } from '@/components/collections/collection-page'

type Props = { params: Promise<{ slug: string }> }
export const dynamic = 'force-dynamic'

export const generateMetadata = (p: Props) => collectionMetadata('series', p)

export default function Page(p: Props) {
  return <CollectionPage kind="series" {...p} />
}
