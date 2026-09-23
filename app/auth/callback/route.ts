import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Handles the redirect from Supabase Auth emails (signup verification,
// password reset, magic links). Exchanges the `code` for a session cookie
// then sends the user on to `next`.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(
    `${origin}/auth/login?error=Could not verify link. Please try again.`,
  )
}
