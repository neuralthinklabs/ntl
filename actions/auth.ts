'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { checkAuthLimits, recordAuthAttempt } from '@/lib/rate-limit'
import { getClientIp as clientIp } from '@/lib/ip'
import { safeNext } from '@/lib/safe-redirect'
import { siteUrl } from '@/lib/site-url'

export type ActionState = { error?: string; success?: string } | null

const TOO_MANY = 'Too many attempts. Please wait a few minutes and try again.'

const signUpSchema = z.object({
  fullName: z.string().trim().min(1, 'Please enter your name.').max(120),
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(200),
})

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

  const { fullName, email, password } = parsed.data
  const ip = await clientIp()
  if (!(await checkAuthLimits('signup', ip, email))) return { error: TOO_MANY }
  await recordAuthAttempt('signup', ip, email)

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${await siteUrl()}/auth/callback?next=/dashboard`,
    },
  })
  if (error) return { error: error.message }

  // The DB trigger normally creates the profile; this is a safe fallback.
  if (data.user) {
    await db
      .insert(profiles)
      .values({ id: data.user.id, email, fullName })
      .onConflictDoNothing({ target: profiles.id })
  }

  return { success: 'Check your inbox to confirm your email address before logging in.' }
}

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
})

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

  const ip = await clientIp()
  const { email, password } = parsed.data
  if (!(await checkAuthLimits('login', ip, email))) return { error: TOO_MANY }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Only FAILED attempts count toward the limit, so real users are never
    // locked out by logging in normally.
    await recordAuthAttempt('login', ip, email)
    if (error.code === 'email_not_confirmed') {
      return { error: 'Please confirm your email first. Check your inbox, or request a new link.' }
    }
    return { error: 'Incorrect email or password.' }
  }

  revalidatePath('/', 'layout')
  redirect(safeNext(formData.get('next')))
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

const emailOnlySchema = z.object({ email: z.string().trim().email('Enter a valid email address.') })

export async function requestPasswordReset(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = emailOnlySchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

  const ip = await clientIp()
  if (!(await checkAuthLimits('reset', ip, parsed.data.email))) return { error: TOO_MANY }
  await recordAuthAttempt('reset', ip, parsed.data.email)

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await siteUrl()}/auth/callback?next=/auth/update-password`,
  })
  if (error) console.error('[auth] reset email failed:', error.message)

  // Same answer whether or not the account exists (no account enumeration).
  return { success: 'If an account exists for that email, a reset link is on its way.' }
}

const updatePasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters.').max(200),
})

export async function updatePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = updatePasswordSchema.safeParse({ password: formData.get('password') })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) return { error: error.message }

  redirect('/dashboard')
}

export async function resendVerificationEmail(email: string) {
  const supabase = await createClient()
  await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: `${await siteUrl()}/auth/callback?next=/dashboard` },
  })
}

export async function resendVerification(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = emailOnlySchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

  const ip = await clientIp()
  if (!(await checkAuthLimits('resend', ip, parsed.data.email))) return { error: TOO_MANY }
  await recordAuthAttempt('resend', ip, parsed.data.email)

  await resendVerificationEmail(parsed.data.email)
  return { success: 'If that email needs verifying, a new link is on its way.' }
}

export async function getCurrentProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const profile = await db.query.profiles.findFirst({ where: eq(profiles.id, user.id) })
  return profile ?? null
}
