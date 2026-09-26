import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { fetchIsAdminRole } from '@/lib/auth/role-check'

const PROTECTED_PREFIXES = ['/dashboard', '/profile', '/problems/mine']
const ADMIN_PREFIXES = ['/admin']

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANT: this call refreshes the auth token and must not be removed.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  const needsAuth = PROTECTED_PREFIXES.some((p) => path.startsWith(p))
  const needsAdmin = ADMIN_PREFIXES.some((p) => path.startsWith(p))

  if ((needsAuth || needsAdmin) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }

  if (needsAdmin && user) {
    // See lib/auth/role-check.ts — this is the same check
    // lib/auth/admin.ts uses for pages/Server Actions, kept in one place
    // so the two runtimes (edge here, Node there) can't drift apart.
    const isAdmin = await fetchIsAdminRole(supabase, user.id)

    if (!isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return response
}
