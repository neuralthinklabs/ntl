import { AdminHeader } from '@/components/admin/admin-header'
import { EventForm } from '@/components/admin/event-form'

export const metadata = { title: 'New event' }

export default function NewEventPage() {
  return (
    <>
      <AdminHeader title="New event" />
      <EventForm />
    </>
  )
}
