'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { contactEnquiries } from '@/db/schema'
import { requireAdminAction } from '@/lib/auth/admin'
import { logAdmin } from '@/lib/audit'

// Mutation half of the admin contact inbox; app/admin/contact/page.tsx is the read half.
export async function setContactEnquiryHandled(id: string, handled: boolean) {
  const { user } = await requireAdminAction()

  await db.update(contactEnquiries).set({ handled }).where(eq(contactEnquiries.id, id))
  await logAdmin({
    actorId: user.id,
    action: handled ? 'contact_handled' : 'contact_reopened',
    entity: 'contact',
    entityId: id,
  })

  revalidatePath('/admin/contact')
  revalidatePath('/admin')
}
