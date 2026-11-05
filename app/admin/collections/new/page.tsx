import { AdminHeader } from '@/components/admin/admin-header'
import { CollectionForm } from '@/components/admin/collection-form'

export const metadata = { title: 'New series or magazine' }

export default function NewCollectionPage() {
  return (
    <>
      <AdminHeader title="New series or magazine" description="Create it first, then add stories to it on the next screen." />
      <CollectionForm />
    </>
  )
}
