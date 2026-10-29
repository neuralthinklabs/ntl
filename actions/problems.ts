'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { problems, problemAttachments, profiles } from '@/db/schema'
import {
  sendEmail,
  problemConfirmationEmail,
  problemAdminNotifyEmail,
  problemStatusEmail,
} from '@/lib/email'
import { requireAdminAction } from '@/lib/auth/admin'
import { logAdmin } from '@/lib/audit'
import { MAX_FILE_SIZE_BYTES, MAX_FILES } from '@/lib/upload-limits'
import { hasValidSignatureBytes } from '@/lib/file-signature'
import { awardPoints } from '@/lib/points'
import { checkAchievements } from '@/lib/achievements'
import { goalIndexBySlug } from '@/lib/ntldgs'
import { checkRateLimit, recordAttempt } from '@/lib/rate-limit'
import type { ActionState } from './auth'

const BUCKET = 'problem-attachments'
const site = () => process.env.NEXT_PUBLIC_SITE_URL ?? ''

const uploadSchema = z.object({
  path: z.string().min(1).max(300),
  name: z.string().min(1).max(200),
  type: z.string().max(120).optional(),
  size: z.number().int().nonnegative().max(MAX_FILE_SIZE_BYTES),
})

const problemSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters.').max(200),
  description: z
    .string()
    .trim()
    .min(20, 'Please provide more detail (min 20 characters).')
    .max(2000),
  category: z.string().trim().max(80).optional(),
  ntldgSlug: z.string().optional(),
  location: z.string().trim().max(200).optional(),
  context: z.string().trim().max(5000).optional(),
  evidenceNotes: z.string().trim().max(5000).optional(),
  clientRequestId: z.string().uuid('Please reload the page and try again.'),
})

type Upload = z.infer<typeof uploadSchema>

/** Reads the first bytes + total size of an uploaded object without downloading it. */
async function inspectObject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  path: string,
): Promise<{ ok: boolean; size: number }> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60)
  if (error || !data?.signedUrl) return { ok: false, size: 0 }
  const res = await fetch(data.signedUrl, { headers: { Range: 'bytes=0-15' } })
  if (!res.ok) return { ok: false, size: 0 }
  const head = new Uint8Array(await res.arrayBuffer())
  const total = Number(res.headers.get('content-range')?.split('/')[1] ?? res.headers.get('content-length') ?? 0)
  return { ok: hasValidSignatureBytes(head), size: total }
}

export async function submitProblem(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Please log in to submit a problem.' }

  // At most 8 submissions per 15 minutes per person.
  const submitKey = `problem:user:${user.id}`
  if (!(await checkRateLimit(submitKey, 8)).allowed) {
    return { error: 'Too many submissions in a short time. Please try again in a few minutes.' }
  }

  const parsed = problemSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    category: formData.get('category') || undefined,
    ntldgSlug: formData.get('ntldgSlug') || undefined,
    location: formData.get('location') || undefined,
    context: formData.get('context') || undefined,
    evidenceNotes: formData.get('evidenceNotes') || undefined,
    clientRequestId: formData.get('clientRequestId'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  await recordAttempt(submitKey)
  const data = parsed.data
  const ntldgSlug = data.ntldgSlug && goalIndexBySlug(data.ntldgSlug) >= 0 ? data.ntldgSlug : null

  // Files were uploaded straight from the browser to Storage; we receive only
  // their metadata and re-verify everything server-side.
  let uploads: Upload[] = []
  try {
    const raw = JSON.parse(String(formData.get('uploads') || '[]'))
    uploads = z.array(uploadSchema).max(MAX_FILES).parse(raw)
  } catch {
    return { error: `Attachments could not be read. Attach at most ${MAX_FILES} files and try again.` }
  }

  const alreadyDone = await db.query.problems.findFirst({
    where: eq(problems.clientRequestId, data.clientRequestId),
  })
  if (alreadyDone) redirect(`/problems/confirmation?id=${alreadyDone.id}`)

  const prefix = `${user.id}/${data.clientRequestId}/`
  const rejectAll = async (message: string) => {
    if (uploads.length) await supabase.storage.from(BUCKET).remove(uploads.map((u) => u.path))
    return { error: message }
  }

  for (const u of uploads) {
    if (!u.path.startsWith(prefix) || u.path.includes('..')) {
      return rejectAll('One of your attachments was uploaded to an invalid location. Please try again.')
    }
    const info = await inspectObject(supabase, u.path)
    if (!info.ok) {
      return rejectAll(`"${u.name}" doesn't look like a supported file. Please upload an image, PDF, or Word document.`)
    }
    if (info.size > MAX_FILE_SIZE_BYTES) return rejectAll(`"${u.name}" is larger than the limit.`)
  }

  await db
    .insert(profiles)
    .values({ id: user.id, email: user.email ?? '' })
    .onConflictDoNothing({ target: profiles.id })

  const problem = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(problems)
      .values({
        submittedBy: user.id,
        clientRequestId: data.clientRequestId,
        title: data.title,
        description: data.description,
        category: data.category,
        ntldgSlug,
        location: data.location,
        context: data.context,
        evidenceNotes: data.evidenceNotes,
      })
      .onConflictDoNothing({ target: problems.clientRequestId })
      .returning()
    if (!row) return null

    if (uploads.length) {
      await tx.insert(problemAttachments).values(
        uploads.map((u) => ({
          problemId: row.id,
          storagePath: u.path,
          fileName: u.name,
          fileType: u.type,
          fileSize: u.size,
        })),
      )
    }

    await awardPoints({
      executor: tx,
      userId: user.id,
      points: 25,
      type: 'problem_submitted',
      title: `Submitted: ${data.title}`,
      meta: 'Problem submitted · +25 pts',
      relatedId: row.id,
    })
    await checkAchievements(user.id, tx)
    return row
  })

  if (!problem) {
    const winner = await db.query.problems.findFirst({
      where: eq(problems.clientRequestId, data.clientRequestId),
    })
    if (winner) redirect(`/problems/confirmation?id=${winner.id}`)
    return { error: 'Something went wrong submitting your problem. Please try again.' }
  }

  if (user.email) {
    await sendEmail({
      to: user.email,
      subject: 'We received your problem submission',
      html: problemConfirmationEmail(data.title),
    })
  }
  const inbox = process.env.CONTACT_INBOX_EMAIL
  if (inbox) {
    await sendEmail({
      to: inbox,
      subject: `New problem: ${data.title}`,
      html: problemAdminNotifyEmail(data.title, user.email ?? 'a member', `${site()}/admin/problems`),
    })
  }

  revalidatePath('/problems/mine')
  revalidatePath('/dashboard')
  revalidatePath('/admin')
  redirect(`/problems/confirmation?id=${problem.id}`)
}

const statusSchema = z.object({
  problemId: z.string().uuid(),
  status: z.enum(['submitted', 'in_review', 'accepted', 'in_progress', 'resolved', 'declined']),
  adminNotes: z.string().max(2000).optional(),
})

export async function updateProblemStatus(
  problemId: string,
  status: z.infer<typeof statusSchema>['status'],
  adminNotes?: string,
) {
  const { user } = await requireAdminAction()
  const parsed = statusSchema.parse({ problemId, status, adminNotes })

  const before = await db.query.problems.findFirst({
    where: eq(problems.id, parsed.problemId),
    with: { submitter: true },
  })
  if (!before) throw new Error('Problem not found')

  await db
    .update(problems)
    .set({
      status: parsed.status,
      adminNotes: parsed.adminNotes ?? before.adminNotes,
      reviewedBy: user.id,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(problems.id, parsed.problemId))

  await logAdmin({
    actorId: user.id,
    action: 'problem_status',
    entity: 'problem',
    entityId: parsed.problemId,
    summary: `${before.status} -> ${parsed.status}`,
  })

  // Tell the submitter when the status (not just a note) changed.
  if (before.status !== parsed.status && before.submitter?.email) {
    await sendEmail({
      to: before.submitter.email,
      subject: `Update on your problem: ${before.title}`,
      html: problemStatusEmail(before.title, parsed.status, parsed.adminNotes ?? before.adminNotes, `${site()}/problems/mine`),
    })
  }

  revalidatePath('/admin/problems')
  revalidatePath('/problems/mine')
}
