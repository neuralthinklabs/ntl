'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ChevronDown, Menu, X } from 'lucide-react'
import { Logo } from './logo'
import { cn } from '@/lib/utils'
import { logout } from '@/actions/auth'

// Main destinations. Everything that asks something of the visitor lives in
// "Get involved", and the single filled button is reserved for the core action.
const primaryLinks = [
  { href: '/#about', label: 'About' },
  { href: '/atlas', label: 'Atlas' },
  { href: '/ntldgs', label: '12 Goals' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/stories', label: 'Stories' },
]

const involveLinks = [
  { href: '/events', label: 'Events', hint: 'Workshops, talks and meetups' },
  { href: '/volunteer', label: 'Volunteer', hint: 'Share your time and skills' },
  { href: '/support', label: 'Contribute', hint: 'Back a campaign' },
  { href: '/contact', label: 'Contact', hint: 'Questions and partnerships' },
]

const accountLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/profile', label: 'Profile' },
  { href: '/problems/mine', label: 'My problems' },
  { href: '/contributions/mine', label: 'My pledges' },
]

type NavbarUser = { email: string; fullName?: string } | null
type OpenMenu = 'involved' | 'account' | null

const panel = 'absolute mt-3 rounded-xl border border-white/10 bg-ink-2 p-1.5 shadow-2xl shadow-black/40'
const panelItem = 'block rounded-lg px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white'

export function Navbar({ user }: { user?: NavbarUser } = {}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menu, setMenu] = useState<OpenMenu>(null)

  const isActive = (href: string) => !href.includes('#') && (pathname === href || pathname.startsWith(`${href}/`))
  const involvedActive = involveLinks.some((l) => isActive(l.href))
  const name = user?.fullName || user?.email.split('@')[0] || 'Account'

  useEffect(() => {
    setMobileOpen(false)
    setMenu(null)
  }, [pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false)
        setMenu(null)
      }
    }
    const onClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-menu]')) setMenu(null)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [])

  // Stop the page scrolling behind the open mobile menu.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const linkClass = (active: boolean) =>
    cn(
      'relative rounded-md px-3 py-2 text-sm font-medium transition-colors',
      active
        ? 'text-white after:absolute after:inset-x-3 after:-bottom-[15px] after:h-0.5 after:bg-brand'
        : 'text-white/65 hover:text-white',
    )

  return (
    <>
        <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/90 backdrop-blur supports-[backdrop-filter]:bg-ink/75">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
            <Logo />

            <nav aria-label="Main" className="ml-2 hidden items-center gap-0.5 lg:flex">
              {primaryLinks.map((l) => (
                <Link key={l.href} href={l.href} aria-current={isActive(l.href) ? 'page' : undefined} className={linkClass(isActive(l.href))}>
                  {l.label}
                </Link>
              ))}

              <div className="relative" data-menu>
                <button
                  type="button"
                  aria-expanded={menu === 'involved'}
                  aria-haspopup="menu"
                  onClick={() => setMenu((m) => (m === 'involved' ? null : 'involved'))}
                  className={cn(linkClass(involvedActive), 'inline-flex items-center gap-1')}
                >
                  Get involved
                  <ChevronDown className={cn('size-4 transition-transform', menu === 'involved' && 'rotate-180')} />
                </button>
                {menu === 'involved' && (
                  <div role="menu" className={cn(panel, 'left-0 w-64')}>
                    {involveLinks.map((l) => (
                      <Link key={l.href} href={l.href} role="menuitem" className={panelItem}>
                        <span className="block font-medium text-white">{l.label}</span>
                        <span className="block text-xs text-white/55">{l.hint}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            <div className="ml-auto hidden items-center gap-3 lg:flex">
              {user ? (
                <div className="relative" data-menu>
                  <button
                    type="button"
                    aria-expanded={menu === 'account'}
                    aria-haspopup="menu"
                    aria-label={`Account menu for ${name}`}
                    onClick={() => setMenu((m) => (m === 'account' ? null : 'account'))}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 py-1 pl-1 pr-3 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
                  >
                    <span className="flex size-7 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-foreground">
                      {name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="max-w-[7rem] truncate">{name}</span>
                    <ChevronDown className={cn('size-4 transition-transform', menu === 'account' && 'rotate-180')} />
                  </button>
                  {menu === 'account' && (
                    <div role="menu" className={cn(panel, 'right-0 w-52')}>
                      {accountLinks.map((l) => (
                        <Link key={l.href} href={l.href} role="menuitem" className={panelItem}>
                          {l.label}
                        </Link>
                      ))}
                      <div className="my-1 border-t border-white/10" />
                      <form action={logout}>
                        <button type="submit" role="menuitem" className={cn(panelItem, 'w-full text-left')}>
                          Log out
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/auth/login" className="rounded-md px-2 py-2 text-sm font-medium text-white/75 transition-colors hover:text-white">
                  Log in
                </Link>
              )}
              <Link
                href="/problems"
                className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground transition-colors hover:brightness-110"
              >
                Submit a problem
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="ml-auto inline-flex size-10 items-center justify-center rounded-lg text-white hover:bg-white/10 lg:hidden"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </header>

        {mobileOpen && (
            <div className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto border-t border-white/10 bg-ink lg:hidden">
              <nav aria-label="Mobile" className="mx-auto flex max-w-6xl flex-col px-4 pb-10 pt-4">
                <ul className="flex flex-col">
                  {primaryLinks.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        aria-current={isActive(l.href) ? 'page' : undefined}
                        className={cn('block border-b border-white/10 py-3.5 text-base font-medium', isActive(l.href) ? 'text-brand' : 'text-white/90')}
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>

                <p className="mb-1 mt-6 text-sm font-semibold text-white/50">Get involved</p>
                <ul className="flex flex-col">
                  {involveLinks.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        aria-current={isActive(l.href) ? 'page' : undefined}
                        className={cn('block border-b border-white/10 py-3 text-base', isActive(l.href) ? 'text-brand' : 'text-white/85')}
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>

                {user && (
                  <>
                    <p className="mb-1 mt-6 text-sm font-semibold text-white/50">{name}</p>
                    <ul className="flex flex-col">
                      {accountLinks.map((l) => (
                        <li key={l.href}>
                          <Link href={l.href} className="block border-b border-white/10 py-3 text-base text-white/85">
                            {l.label}
                          </Link>
                        </li>
                      ))}
                      <li>
                        <form action={logout}>
                          <button type="submit" className="w-full py-3 text-left text-base text-white/60">
                            Log out
                          </button>
                        </form>
                      </li>
                    </ul>
                  </>
                )}

                <div className="mt-8 flex flex-col gap-3">
                  <Link
                    href="/problems"
                    className="inline-flex h-12 items-center justify-center rounded-lg bg-brand text-sm font-semibold text-brand-foreground"
                  >
                    Submit a problem
                  </Link>
                  {!user && (
                    <Link
                      href="/auth/login"
                      className="inline-flex h-12 items-center justify-center rounded-lg border border-white/20 text-sm font-medium text-white"
                    >
                      Log in
                    </Link>
                  )}
                </div>
              </nav>
            </div>
          )}
        </>
      )
    }
