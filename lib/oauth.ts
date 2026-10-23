import type { SupabaseClient } from '@supabase/supabase-js'

// Thin, typed wrappers around Supabase's OAuth 2.1 server API (public beta).
// The casts keep `pnpm typecheck` green even if your installed supabase-js
// types differ slightly; once you have confirmed the shapes you can delete
// the casts and use supabase.auth.oauth / supabase.auth.admin.oauth directly.

export const AUTH_ID_RE = /^[A-Za-z0-9_-]{8,128}$/

export const SCOPE_COPY: Record<string, { title: string; text: string }> = {
  openid: { title: 'Recognise you', text: 'Confirms that you are the same NTL account each time you sign in.' },
  profile: { title: 'Your name and NTL ID', text: 'Your public name (if you show credit) and your NTL ID.' },
  email: { title: 'Your email address', text: 'The email address on your NTL account.' },
}

export function parseScopes(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String)
  if (typeof v === 'string') return v.split(/\s+/).filter(Boolean)
  return []
}

/** https only (http allowed for localhost while developing). No fragments. */
export function isSafeRedirect(url: string): boolean {
  try {
    const u = new URL(url)
    if (u.hash) return false
    if (u.protocol === 'https:') return true
    return u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1')
  } catch {
    return false
  }
}

type Res<T> = Promise<{ data: T | null; error: { message: string } | null }>
type ClientInfo = { id?: string; name?: string; uri?: string; logo_uri?: string }

export type AuthorizationDetails = {
  redirect_url?: string
  client?: ClientInfo
  scope?: string | string[]
  scopes?: string[]
}
export type Grant = { client?: ClientInfo; scopes?: string[]; granted_at?: string }

export type OAuthUserApi = {
  getAuthorizationDetails(id: string): Res<AuthorizationDetails>
  approveAuthorization(id: string, o?: { skipBrowserRedirect?: boolean }): Res<{ redirect_url?: string }>
  denyAuthorization(id: string, o?: { skipBrowserRedirect?: boolean }): Res<{ redirect_url?: string }>
  listGrants(): Res<Grant[]>
  revokeGrant(o: { clientId: string }): Res<unknown>
}

export type OAuthClientRow = {
  client_id: string
  client_name?: string
  redirect_uris?: string[]
  created_at?: string
  client_secret?: string
}
export type OAuthAdminApi = {
  listClients(): Res<{ clients?: OAuthClientRow[] } | OAuthClientRow[]>
  createClient(p: { client_name: string; redirect_uris: string[] }): Res<OAuthClientRow>
  deleteClient(id: string): Res<unknown>
}

export const oauthUser = (s: SupabaseClient) => (s.auth as unknown as { oauth: OAuthUserApi }).oauth
export const oauthAdmin = (s: SupabaseClient) => (s.auth.admin as unknown as { oauth: OAuthAdminApi }).oauth
