import { AdminHeader } from '@/components/admin/admin-header'
import { CampaignForm } from '@/components/admin/campaign-form'

export const metadata = { title: 'New campaign' }

export default function NewCampaignPage() {
  return (
    <>
      <AdminHeader title="New campaign" />
      <CampaignForm />
    </>
  )
}
