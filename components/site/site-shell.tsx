import { headers } from 'next/headers'
import { Navbar } from './navbar'
import { Footer } from './footer'
import { AnnouncementBar } from './announcement-bar'
import { BlockedNotice } from './blocked-notice'
import { createClient } from '@/lib/supabase/server'
import { fetchIsAdminRole } from '@/lib/auth/role-check'
import { getBlockForPath, getLiveAnnouncements } from '@/lib/site-controls'

export async function SiteShell({ children }: { children: React.ReactNode }) {
  // Display-only identity for the navbar: getClaims() avoids a network call to
  // the Auth server on every page view. Anything security-sensitive re-checks
  // with getUser() on the server.
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  const meta = (claims?.user_metadata ?? {}) as { full_name?: string }

  // Admin "page controls": the middleware passes the path along.
  const path = (await headers()).get('x-pathname') ?? ''
  const [control, announcements] = await Promise.all([getBlockForPath(path), getLiveAnnouncements()])

  // Admins can still open a blocked page (to check it before it goes live).
  let block = control
  let adminPreview = false
  if (control && claims?.sub && (await fetchIsAdminRole(supabase, claims.sub as string))) {
    block = null
    adminPreview = true
  }

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <AnnouncementBar items={announcements} />
      <Navbar user={claims?.sub ? { email: (claims.email as string) ?? '', fullName: meta.full_name } : null} />
      <main id="main" className="flex-1">
        {adminPreview && (
          <p role="status" className="bg-amber-100 px-4 py-2 text-center text-xs font-medium text-amber-900">
            Admin preview: this page is currently blocked for everyone else.
          </p>
        )}
        {block ? <BlockedNotice block={block} /> : children}
      </main>
      <Footer />
    </div>
  )
}
