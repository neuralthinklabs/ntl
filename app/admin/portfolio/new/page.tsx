import { AdminHeader } from '@/components/admin/admin-header'
import { PortfolioForm } from '@/components/admin/portfolio-form'

export const metadata = { title: 'Add portfolio item' }

export default function NewPortfolioPage() {
  return (
    <>
      <AdminHeader title="Add portfolio item" />
      <PortfolioForm />
    </>
  )
}
