'use server'

import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import type { ActionState } from './auth'

const profileSchema = z.object({
  fullName: z.string().trim().min(1, 'Please enter your name.').max(120),
  bio: z.string().trim().max(500, 'Bio must be 500 characters or fewer.'),
})

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in.' }

  const parsed = profileSchema.safeParse({
    fullName: formData.get('fullName') ?? '',
    bio: formData.get('bio') ?? '',
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

  await db
    .update(profiles)
    .set({
      fullName: parsed.data.fullName,
      // Empty string clears the bio (previously it was silently ignored).
      bio: parsed.data.bio === '' ? null : parsed.data.bio,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, user.id))

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  return { success: 'Profile updated.' }
}
