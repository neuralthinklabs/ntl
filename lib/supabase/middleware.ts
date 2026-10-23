import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { fetchIsAdminRole } from '@/lib/auth/role-check'

// /team is login-only here; the page itself checks the volunteer / core team /
// admin role and redirects everyone else.
const PROTECTED_PREFIXES = ['/dashboard', '/profile', '/problems/mine', '/contributions', '/team', '/oauth', '/account']
const ADMIN_PREFIXES = ['/admin']

// Match whole path segments: "/team" and "/team/x" match, "/teams" does not.
const matches = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`)

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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANT: this refreshes the auth token and must not be removed.
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub as string | undefined

  const path = request.nextUrl.pathname
  const needsAuth = PROTECTED_PREFIXES.some((p) => matches(path, p))
  const needsAdmin = ADMIN_PREFIXES.some((p) => matches(path, p))

  if ((needsAuth || needsAdmin) && !userId) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.search = ''
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }

  if (needsAdmin && userId) {
    const isAdmin = await fetchIsAdminRole(supabase, userId)
    if (!isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      url.search = ''
      return NextResponse.redirect(url)
    }
  }

  return response
}
