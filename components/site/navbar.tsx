'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Menu, X } from 'lucide-react'
import { Logo } from './logo'
import { cn } from '@/lib/utils'
import { logout } from '@/actions/auth'

const links = [
  { href: '/about', label: 'About' },
  { href: '/ntldgs', label: '12 Goals' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/events', label: 'Events' },
  { href: '/stories', label: 'Stories' },
  { href: '/volunteer', label: 'Volunteer' },
  { href: '/contact', label: 'Contact' },
]

type NavbarUser = { email: string; fullName?: string } | null

export function Navbar({ user }: { user?: NavbarUser } = {}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isActive = (href: string) => pathname.startsWith(href)

  // Close menus on navigation, Escape, or an outside click.
  useEffect(() => {
    setOpen(false)
    setMenu(false)
  }, [pathname])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setMenu(false)
      }
    }
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [])

  const name = user?.fullName || user?.email.split('@')[0] || 'Account'

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/95 backdrop-blur supports-[backdrop-filter]:bg-ink/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-0.5 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={cn(
                'rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                isActive(link.href) ? 'text-brand' : 'text-white/75 hover:text-white',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/support" className="rounded-lg border border-white/20 px-3.5 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10">
            Contribute
          </Link>
          <Link href="/problems" className="rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90">
            Submit a problem
          </Link>
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                aria-expanded={menu}
                aria-haspopup="menu"
                onClick={() => setMenu((m) => !m)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10"
              >
                <span className="max-w-[8rem] truncate">{name}</span>
                <ChevronDown className="size-4" />
              </button>
              {menu && (
                <div role="menu" className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-ink p-1 shadow-xl">
                  {[
                    { href: '/dashboard', label: 'Dashboard' },
                    { href: '/profile', label: 'Profile' },
                    { href: '/problems/mine', label: 'My problems' },
                    { href: '/contributions/mine', label: 'My pledges' },
                  ].map((i) => (
                    <Link key={i.href} href={i.href} role="menuitem" className="block rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/10">
                      {i.label}
                    </Link>
                  ))}
                  <form action={logout}>
                    <button type="submit" role="menuitem" className="block w-full rounded-lg px-3 py-2 text-left text-sm text-white/85 hover:bg-white/10">
                      Log out
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth/login" className="rounded-lg border border-white/20 px-3.5 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10">
              Log in
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex size-9 items-center justify-center rounded-md text-white lg:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-ink lg:hidden">
          <nav aria-label="Mobile" className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn('rounded-md px-3 py-2.5 text-sm font-medium', isActive(link.href) ? 'bg-white/5 text-brand' : 'text-white/80')}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              <Link href="/support" className="flex-1 rounded-lg border border-white/20 px-3.5 py-2.5 text-center text-sm font-medium text-white">
                Contribute
              </Link>
              <Link href="/problems" className="flex-1 rounded-lg bg-brand px-3.5 py-2.5 text-center text-sm font-semibold text-brand-foreground">
                Submit a problem
              </Link>
            </div>
            {user ? (
              <>
                <Link href="/dashboard" className="mt-2 rounded-lg border border-white/20 px-3.5 py-2.5 text-center text-sm font-medium text-white">
                  Dashboard
                </Link>
                <form action={logout}>
                  <button type="submit" className="w-full rounded-lg px-3.5 py-2.5 text-center text-sm text-white/70">
                    Log out
                  </button>
                </form>
              </>
            ) : (
              <Link href="/auth/login" className="mt-2 rounded-lg border border-white/20 px-3.5 py-2.5 text-center text-sm font-medium text-white">
                Log in
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
