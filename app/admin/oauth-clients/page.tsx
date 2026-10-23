import { AdminHeader, EmptyState } from '@/components/admin/admin-header'
import { OAuthClientForm } from '@/components/admin/oauth-client-form'
import { DeleteButton } from '@/components/admin/delete-button'
import { deleteOAuthClient } from '@/actions/admin/oauth-clients'
import { createAdminClient } from '@/lib/supabase/admin'
import { oauthAdmin, type OAuthClientRow } from '@/lib/oauth'

export const metadata = { title: 'Sign-in apps' }
export const dynamic = 'force-dynamic'

export default async function AdminOAuthClientsPage() {
  const sb = createAdminClient()
  let clients: OAuthClientRow[] = []
  let problem: string | null = null

  if (!sb) {
    problem = 'Set SUPABASE_SERVICE_ROLE_KEY in your environment (server only) and enable the OAuth server in Supabase to manage apps here.'
  } else {
    const { data, error } = await oauthAdmin(sb).listClients()
    if (error) problem = `Could not load apps: ${error.message}. Is the OAuth server enabled in Supabase?`
    else clients = Array.isArray(data) ? data : (data?.clients ?? [])
  }

  return (
    <>
      <AdminHeader
        title="Sign-in apps"
        description="Websites that offer “Sign in with NTL ID”. Register each one here and give its team the client ID and secret."
      />
      {problem && <p role="alert" className="mb-6 rounded-lg bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900 ring-1 ring-inset ring-amber-200">{problem}</p>}

      <div className="flex flex-col gap-3">
        {clients.map((c) => (
          <div key={c.client_id} className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">{c.client_name ?? 'Unnamed app'}</p>
              <p className="mt-0.5 break-all font-mono text-xs text-slate-600">{c.client_id}</p>
              <ul className="mt-2 text-xs text-slate-600">
                {(c.redirect_uris ?? []).map((u) => <li key={u} className="break-all">{u}</li>)}
              </ul>
            </div>
            <DeleteButton action={deleteOAuthClient.bind(null, c.client_id)} what={`“${c.client_name ?? 'this app'}”`} label="Remove" />
          </div>
        ))}
        {clients.length === 0 && !problem && <EmptyState>No apps registered yet.</EmptyState>}
      </div>

      {sb && (
        <section className="mt-10">
          <h2 className="mb-3 text-base font-semibold text-ink">Register an app</h2>
          <OAuthClientForm />
        </section>
      )}
    </>
  )
}
