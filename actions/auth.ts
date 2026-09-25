'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { checkRateLimit, recordAttempt, authIdentifier } from '@/lib/rate-limit'

export type ActionState = { error?: string; success?: string } | null

async function clientIp() {
  const hdrs = await headers()
  return hdrs.get('x-forwarded-for')?.split(',')[0]?.trim()
}

const signUpSchema = z.object({
  fullName: z.string().min(1, 'Please enter your name.'),
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
})

export async function signUp(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const { fullName, email, password } = parsed.data

  // P1 #6: rate limit signup attempts per (IP, email) so a script can't
  // hammer account creation / email-sending for one address.
  const ip = await clientIp()
  const identifier = authIdentifier(ip, email)
  const limit = await checkRateLimit(identifier)
  if (!limit.allowed) {
    return { error: 'Too many attempts. Please wait a few minutes and try again.' }
  }
  await recordAttempt(identifier)

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/dashboard`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  // Create the app-facing profile row. Safe to run even if a DB trigger
  // already created one (see supabase/migrations for the trigger option).
  if (data.user) {
    await db
      .insert(profiles)
      .values({ id: data.user.id, email, fullName })
      .onConflictDoNothing({ target: profiles.id })
  }

  return {
    success:
      'Check your inbox to confirm your email address before logging in.',
  }
}

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
})

export async function login(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  // P1 #6: this is the highest-value place to rate limit — it's the
  // credential-guessing endpoint. Checked (not just recorded) BEFORE
  // calling Supabase, so a lockout doesn't also cost Supabase auth calls.
  const ip = await clientIp()
  const identifier = authIdentifier(ip, parsed.data.email)
  const limit = await checkRateLimit(identifier)
  if (!limit.allowed) {
    return { error: 'Too many login attempts. Please wait a few minutes and try again.' }
  }
  await recordAttempt(identifier)

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { error: error.message }
  }

  const next = (formData.get('next') as string) || '/dashboard'
  revalidatePath('/', 'layout')
  redirect(next)
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

const emailOnlySchema = z.object({
  email: z.string().email('Enter a valid email address.'),
})

export async function requestPasswordReset(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = emailOnlySchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  // P1 #6: rate limit reset-email requests — otherwise this endpoint is a
  // free way to spam an inbox or enumerate which emails have accounts
  // (via response timing/side channels) at unlimited volume.
  const ip = await clientIp()
  const identifier = authIdentifier(ip, parsed.data.email)
  const limit = await checkRateLimit(identifier)
  if (!limit.allowed) {
    return { error: 'Too many requests. Please wait a few minutes and try again.' }
  }
  await recordAttempt(identifier)

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/auth/update-password`,
    },
  )

  if (error) {
    return { error: error.message }
  }

  return {
    success: 'If an account exists for that email, a reset link is on its way.',
  }
}

const updatePasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters.'),
})

export async function updatePassword(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = updatePasswordSchema.safeParse({
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}

// P2 #18: this previously had no caller anywhere in the app — either wire
// it into the UI or delete it. Wired: `resendVerification` below is a thin
// `useActionState`-compatible wrapper around it, used by
// `app/auth/resend/page.tsx`, linked from the login page's error state.
export async function resendVerificationEmail(email: string) {
  const supabase = await createClient()
  await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/dashboard`,
    },
  })
}

const resendSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
})

export async function resendVerification(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resendSchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const ip = await clientIp()
  const identifier = authIdentifier(ip, parsed.data.email)
  const limit = await checkRateLimit(identifier)
  if (!limit.allowed) {
    return { error: 'Too many requests. Please wait a few minutes and try again.' }
  }
  await recordAttempt(identifier)

  await resendVerificationEmail(parsed.data.email)

  return {
    success: 'If that email needs verifying, a new link is on its way.',
  }
}

export async function getCurrentProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.id),
  })

  return profile ?? null
}
