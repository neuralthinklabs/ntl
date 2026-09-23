'use server'

import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import type { ActionState } from './auth'

const profileSchema = z.object({
  fullName: z.string().min(1, 'Please enter your name.'),
  bio: z.string().max(500, 'Bio must be 500 characters or fewer.').optional(),
})

export async function updateProfile(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in.' }

  const parsed = profileSchema.safeParse({
    fullName: formData.get('fullName'),
    bio: formData.get('bio') || undefined,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  await db
    .update(profiles)
    .set({
      fullName: parsed.data.fullName,
      bio: parsed.data.bio,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, user.id))

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  return { success: 'Profile updated.' }
}
