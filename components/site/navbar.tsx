'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Logo } from './logo'
import { cn } from '@/lib/utils'

const links = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/events', label: 'Events' },
  { href: '/stories', label: 'Stories' },
  { href: '/contact', label: 'Contact' },
]

type NavbarUser = { email: string; fullName?: string } | null

export function Navbar({ user }: { user?: NavbarUser } = {}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/95 backdrop-blur supports-[backdrop-filter]:bg-ink/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive(link.href)
                  ? 'text-brand'
                  : 'text-white/70 hover:text-white',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/volunteer"
            className="rounded-lg border border-white/15 px-3.5 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
          >
            Volunteer
          </Link>
          <Link
            href="/support"
            className="rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90"
          >
            Contribute
          </Link>
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-lg border border-white/15 px-3.5 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="rounded-lg border border-white/15 px-3.5 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
            >
              Log in
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex size-9 items-center justify-center rounded-md text-white md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-ink md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium',
                  isActive(link.href)
                    ? 'bg-white/5 text-brand'
                    : 'text-white/70',
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              <Link
                href="/volunteer"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-white/15 px-3.5 py-2 text-center text-sm font-medium text-white"
              >
                Volunteer
              </Link>
              <Link
                href="/support"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg bg-brand px-3.5 py-2 text-center text-sm font-semibold text-brand-foreground"
              >
                Contribute
              </Link>
            </div>
            <Link
              href={user ? '/dashboard' : '/auth/login'}
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg border border-white/15 px-3.5 py-2 text-center text-sm font-medium text-white"
            >
              {user ? 'Dashboard' : 'Log in'}
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
