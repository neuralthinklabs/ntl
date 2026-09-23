import Link from 'next/link'
import { Logo } from './logo'
import { brandSocials } from './brand-icons'

const footerLinks = [
  { href: '/', label: 'Home' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/events', label: 'Events' },
  { href: '/stories', label: 'Stories' },
  { href: '/contact', label: 'Contact' },
]

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-ink text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-white/50">
              A global ecosystem for learning, innovation and real-world impact.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {brandSocials.map((s) => (
                <Link
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="inline-flex size-8 items-center justify-center rounded-md border border-white/10 text-white/60 transition-colors hover:border-brand/40 hover:text-brand"
                >
                  <s.Icon className="size-4" />
                </Link>
              ))}
            </div>
          </div>

          <nav className="flex flex-wrap gap-x-8 gap-y-3">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-white/60 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-xs text-white/40">
          © {new Date().getFullYear()} Neural Think Labs. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
