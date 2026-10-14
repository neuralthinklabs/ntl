import { Navbar } from './navbar'
import { Footer } from './footer'
import { createClient } from '@/lib/supabase/server'

export async function SiteShell({ children }: { children: React.ReactNode }) {
  // Display-only identity for the navbar: getClaims() avoids a network call to
  // the Auth server on every page view. Anything security-sensitive re-checks
  // with getUser() on the server.
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  const meta = (claims?.user_metadata ?? {}) as { full_name?: string }

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <Navbar user={claims?.sub ? { email: (claims.email as string) ?? '', fullName: meta.full_name } : null} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}
