import Link from 'next/link'
import { Logo } from './logo'
import { brandSocials } from './brand-icons'

const columns = [
  {
    title: 'Explore',
    links: [
      { href: '/atlas', label: 'Atlas' },
      { href: '/ntldgs', label: 'The 12 Goals' },
      { href: '/portfolio', label: 'Portfolio' },
      { href: '/stories', label: 'Stories' },
      { href: '/events', label: 'Events' },
    ],
  },
  {
    title: 'Get involved',
    links: [
      { href: '/get-involved', label: 'All ways to help' },
      { href: '/problems', label: 'Submit a problem' },
      { href: '/volunteer', label: 'Volunteer' },
      { href: '/support', label: 'Contribute' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Help and legal',
    links: [
      { href: '/faq', label: 'FAQ' },
      { href: '/developers', label: 'Developers' },
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-12 md:grid-cols-[1.2fr_2fr]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              A global ecosystem for learning, innovation and real-world impact.
            </p>
            {brandSocials.length > 0 && (
              <div className="mt-6 flex items-center gap-2">
                {brandSocials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="inline-flex size-9 items-center justify-center rounded-lg border border-white/15 text-white/70 transition-colors hover:border-brand/60 hover:text-brand"
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
                <ul className="mt-4 flex flex-col gap-2.5">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-sm text-white/60 transition-colors hover:text-white">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Neural Think Labs. All rights reserved.</p>
          <p>Real people. Real problems. Better futures.</p>
        </div>
      </div>
    </footer>
  )
}
