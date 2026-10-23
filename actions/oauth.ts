'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { AUTH_ID_RE, isSafeRedirect, oauthUser } from '@/lib/oauth'
import type { ActionState } from './auth'

const UUID_RE = /^[0-9a-f-]{36}$/i

/** Approve or deny a "Sign in with NTL ID" request, then send the user back to the app. */
export async function decideAuthorization(authorizationId: string, approve: boolean): Promise<ActionState> {
  if (!AUTH_ID_RE.test(authorizationId)) return { error: 'This sign-in request is invalid. Go back to the app and try again.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Your session expired. Log in again and retry.' }

  const api = oauthUser(supabase)
  const { data, error } = approve
    ? await api.approveAuthorization(authorizationId, { skipBrowserRedirect: true })
    : await api.denyAuthorization(authorizationId, { skipBrowserRedirect: true })

  const url = data?.redirect_url
  if (error || !url || !isSafeRedirect(url)) {
    console.error('[oauth] decision failed:', error?.message)
    return { error: 'This sign-in request expired or could not be completed. Go back to the app and try again.' }
  }
  redirect(url) // outside try/catch on purpose: redirect() works by throwing
}

/** Remove an app's access to this account (also ends its sessions and refresh tokens). */
export async function revokeAppAccess(clientId: string): Promise<ActionState> {
  if (!UUID_RE.test(clientId)) return { error: 'App not found.' }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Please log in.' }

  const { error } = await oauthUser(supabase).revokeGrant({ clientId })
  if (error) {
    console.error('[oauth] revoke failed:', error.message)
    return { error: 'Could not remove access. Please try again.' }
  }
  revalidatePath('/account/connected-apps')
  return { success: 'Access removed.' }
}
