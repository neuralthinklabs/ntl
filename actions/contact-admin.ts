'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { contactEnquiries } from '@/db/schema'
import { requireAdminAction } from '@/lib/auth/admin'

// contact_enquiries.handled was written by actions/contact.ts but had no
// reader anywhere in the app — enquiries piled up invisibly with no admin
// review surface (unlike problems, which got /admin/problems). This is the
// mutation half of that gap; app/admin/contact/page.tsx is the read half.
export async function setContactEnquiryHandled(id: string, handled: boolean) {
  await requireAdminAction()

  await db.update(contactEnquiries).set({ handled }).where(eq(contactEnquiries.id, id))

  revalidatePath('/admin/contact')
}
