import { Navbar } from './navbar'
import { Footer } from './footer'
import { createClient } from '@/lib/supabase/server'

export async function SiteShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50">
      <Navbar
        user={
          user
            ? { email: user.email ?? '', fullName: user.user_metadata?.full_name }
            : null
        }
      />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
