import Link from 'next/link'
import { Logo } from './logo'
import { brandSocials } from './brand-icons'

const columns = [
  {
    title: 'Explore',
    links: [
      { href: '/about', label: 'About' },
      { href: '/ntldgs', label: 'The 12 Goals' },
      { href: '/portfolio', label: 'Portfolio' },
      { href: '/stories', label: 'Stories' },
      { href: '/events', label: 'Events' },
    ],
  },
  {
    title: 'Get involved',
    links: [
      { href: '/problems', label: 'Submit a problem' },
      { href: '/volunteer', label: 'Volunteer' },
      { href: '/support', label: 'Contribute' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/faq', label: 'FAQ' },
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-ink text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-white/65">
              A global ecosystem for learning, innovation and real-world impact.
            </p>
            {brandSocials.length > 0 && (
              <div className="mt-5 flex items-center gap-2">
                {brandSocials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="inline-flex size-8 items-center justify-center rounded-md border border-white/15 text-white/70 transition-colors hover:border-brand/50 hover:text-brand"
                  >
                    <s.Icon className="size-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((c) => (
              <nav key={c.title} aria-label={c.title}>
                <p className="text-sm font-semibold text-white">{c.title}</p>
                <ul className="mt-3 flex flex-col gap-2">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-sm text-white/70 transition-colors hover:text-white">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-xs text-white/55">
          © {new Date().getFullYear()} Neural Think Labs. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
