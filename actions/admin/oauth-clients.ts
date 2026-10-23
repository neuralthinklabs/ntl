'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { runAdmin } from '@/lib/admin-action'
import { logAdmin } from '@/lib/audit'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSafeRedirect, oauthAdmin } from '@/lib/oauth'
import type { ActionState } from '../auth'

const schema = z.object({
  name: z.string().trim().min(2, 'Enter the app name.').max(80),
  redirectUris: z.string().max(3000),
})

export async function createOAuthClient(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAdmin(async (admin) => {
    const parsed = schema.safeParse({ name: formData.get('name'), redirectUris: formData.get('redirectUris') ?? '' })
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

    const uris = [...new Set(parsed.data.redirectUris.split('\n').map((s) => s.trim()).filter(Boolean))]
    if (uris.length < 1 || uris.length > 10) return { error: 'Add 1 to 10 redirect URLs, one per line.' }
    if (uris.some((u) => !isSafeRedirect(u))) {
      return { error: 'Redirect URLs must start with https:// (http:// only for localhost) and have no #fragment.' }
    }

    const sb = createAdminClient()
    if (!sb) return { error: 'SUPABASE_SERVICE_ROLE_KEY is not set on the server.' }

    const { data, error } = await oauthAdmin(sb).createClient({ client_name: parsed.data.name, redirect_uris: uris })
    if (error || !data) {
      console.error('[oauth] create client failed:', error?.message)
      return { error: `Supabase refused the request: ${error?.message ?? 'unknown error'}` }
    }

    // The secret is never stored or logged by us.
    await logAdmin({
      actorId: admin.id,
      action: 'oauth_client_create',
      entity: 'oauth_client',
      entityId: data.client_id,
      summary: parsed.data.name,
    })
    revalidatePath('/admin/oauth-clients')
    return {
      success: `Created. Client ID: ${data.client_id}${data.client_secret ? `  Secret: ${data.client_secret}  (shown once, copy it now)` : ''}`,
    }
  })
}

export async function deleteOAuthClient(clientId: string): Promise<ActionState> {
  return runAdmin(async (admin) => {
    const id = z.string().uuid().safeParse(clientId)
    if (!id.success) return { error: 'App not found.' }
    const sb = createAdminClient()
    if (!sb) return { error: 'SUPABASE_SERVICE_ROLE_KEY is not set on the server.' }

    const { error } = await oauthAdmin(sb).deleteClient(id.data)
    if (error) return { error: `Supabase refused the request: ${error.message}` }

    await logAdmin({ actorId: admin.id, action: 'oauth_client_delete', entity: 'oauth_client', entityId: id.data })
    revalidatePath('/admin/oauth-clients')
    return { success: 'Removed.' }
  })
}
