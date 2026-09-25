'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { eq, sql } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { problems, problemAttachments, profiles } from '@/db/schema'
import { sendEmail, problemConfirmationEmail } from '@/lib/email'
import { requireAdminAction } from '@/lib/auth/admin'
import { MAX_FILE_SIZE_BYTES, MAX_FILES } from '@/lib/upload-limits'
import { awardPoints } from '@/lib/points'
import type { ActionState } from './auth'

const problemSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().min(20, 'Please provide more detail (min 20 characters).'),
  category: z.string().optional(),
  location: z.string().optional(),
  context: z.string().optional(),
  evidenceNotes: z.string().optional(),
  clientRequestId: z.string().uuid('Please reload the page and try again.'),
})

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
    clientRequestId: formData.get('clientRequestId'),
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
    if (f.size > MAX_FILE_SIZE_BYTES) {
      return { error: `"${f.name}" is larger than the limit.` }
    }
  }

  const existing = await db.query.problems.findFirst({
    where: eq(problems.clientRequestId, parsed.data.clientRequestId),
  })
  if (existing) {
    redirect(
      `/problems/confirmation?id=${existing.id}${existing.attachmentsIncomplete ? '&incomplete=1' : ''}`,
    )
  }

  await db
    .insert(profiles)
    .values({ id: user.id, email: user.email ?? '' })
    .onConflictDoNothing({ target: profiles.id })

  const [problem] = await db
    .insert(problems)
    .values({
      submittedBy: user.id,
      clientRequestId: parsed.data.clientRequestId,
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      location: parsed.data.location,
      context: parsed.data.context,
      evidenceNotes: parsed.data.evidenceNotes,
    })
    .onConflictDoNothing({ target: problems.clientRequestId })
    .returning()

  if (!problem) {
    const winner = await db.query.problems.findFirst({
      where: eq(problems.clientRequestId, parsed.data.clientRequestId),
    })
    if (winner) {
      redirect(
        `/problems/confirmation?id=${winner.id}${winner.attachmentsIncomplete ? '&incomplete=1' : ''}`,
      )
    }
    return { error: 'Something went wrong submitting your problem. Please try again.' }
  }

  const failedFiles: string[] = []
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
      console.error('[problems] attachment upload failed:', file.name, uploadError)
      failedFiles.push(file.name)
    }
  }

  const attachmentsIncomplete = failedFiles.length > 0
  if (attachmentsIncomplete) {
    await db
      .update(problems)
      .set({
        attachmentsIncomplete: true,
        adminNotes: sql`coalesce(${problems.adminNotes} || '\n', '') || ${
          `[system] ${failedFiles.length} attachment(s) failed to upload: ${failedFiles.join(', ')}`
        }`,
      })
      .where(eq(problems.id, problem.id))
  }

  // P1 #9: centralized — see lib/points.ts.
  await awardPoints({
    userId: user.id,
    points: 25,
    type: 'problem_submitted',
    title: `Submitted: ${parsed.data.title}`,
    meta: attachmentsIncomplete
      ? 'Problem submitted (some attachments failed) · +25 pts'
      : 'Problem submitted · +25 pts',
    relatedId: problem.id,
  })

  if (user.email) {
    await sendEmail({
      to: user.email,
      subject: attachmentsIncomplete
        ? 'We received your problem submission (attachment issue)'
        : 'We received your problem submission',
      html: problemConfirmationEmail(parsed.data.title),
    })
  }

  revalidatePath('/problems/mine')
  revalidatePath('/dashboard')
  redirect(
    `/problems/confirmation?id=${problem.id}${attachmentsIncomplete ? '&incomplete=1' : ''}`,
  )
}

export async function updateProblemStatus(
  problemId: string,
  status: 'submitted' | 'in_review' | 'accepted' | 'in_progress' | 'resolved' | 'declined',
  adminNotes?: string,
) {
  const { user } = await requireAdminAction()

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
