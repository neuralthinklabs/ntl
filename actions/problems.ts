'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { eq, sql } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { problems, problemAttachments, activityRecords, profiles } from '@/db/schema'
import { sendEmail, problemConfirmationEmail } from '@/lib/email'
import type { ActionState } from './auth'

const problemSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().min(20, 'Please provide more detail (min 20 characters).'),
  category: z.string().optional(),
  location: z.string().optional(),
  context: z.string().optional(),
  evidenceNotes: z.string().optional(),
})

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_FILES = 5
const BUCKET = 'problem-attachments'

export async function submitProblem(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Please log in to submit a problem.' }
  }

  const parsed = problemSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    category: formData.get('category') || undefined,
    location: formData.get('location') || undefined,
    context: formData.get('context') || undefined,
    evidenceNotes: formData.get('evidenceNotes') || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const files = formData
    .getAll('files')
    .filter((f): f is File => f instanceof File && f.size > 0)

  if (files.length > MAX_FILES) {
    return { error: `Please attach at most ${MAX_FILES} files.` }
  }
  for (const f of files) {
    if (f.size > MAX_FILE_SIZE) {
      return { error: `"${f.name}" is larger than 10MB.` }
    }
  }

  // Ensure a profile row exists (in case the DB trigger / signup path missed it).
  await db
    .insert(profiles)
    .values({ id: user.id, email: user.email ?? '' })
    .onConflictDoNothing({ target: profiles.id })

  const [problem] = await db
    .insert(problems)
    .values({
      submittedBy: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      location: parsed.data.location,
      context: parsed.data.context,
      evidenceNotes: parsed.data.evidenceNotes,
    })
    .returning()

  // Upload attachments to Supabase Storage under a per-user, per-problem path.
  for (const file of files) {
    const path = `${user.id}/${problem.id}/${crypto.randomUUID()}-${file.name}`
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type })

    if (!uploadError) {
      await db.insert(problemAttachments).values({
        problemId: problem.id,
        storagePath: path,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      })
    } else {
      console.error('[problems] attachment upload failed:', uploadError)
    }
  }

  await db.insert(activityRecords).values({
    userId: user.id,
    type: 'problem_submitted',
    title: `Submitted: ${parsed.data.title}`,
    meta: 'Problem submitted · +25 pts',
    pointsDelta: 25,
    relatedId: problem.id,
  })

  await db
    .update(profiles)
    .set({ points: sql`${profiles.points} + 25` })
    .where(eq(profiles.id, user.id))

  if (user.email) {
    await sendEmail({
      to: user.email,
      subject: 'We received your problem submission',
      html: problemConfirmationEmail(parsed.data.title),
    })
  }

  revalidatePath('/problems/mine')
  revalidatePath('/dashboard')
  redirect(`/problems/confirmation?id=${problem.id}`)
}

export async function updateProblemStatus(
  problemId: string,
  status: 'submitted' | 'in_review' | 'accepted' | 'in_progress' | 'resolved' | 'declined',
  adminNotes?: string,
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.id),
  })
  if (profile?.role !== 'admin') throw new Error('Not authorized')

  await db
    .update(problems)
    .set({
      status,
      adminNotes,
      reviewedBy: user.id,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(problems.id, problemId))

  revalidatePath('/admin/problems')
  revalidatePath('/problems/mine')
}
