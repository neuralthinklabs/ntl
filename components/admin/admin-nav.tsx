'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarDays,
  ClipboardList,
  FileText,
  HandCoins,
  LayoutDashboard,
  ListChecks,
  Mail,
  Megaphone,
  Boxes,
  Users,
  MapPinned,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/problems', label: 'Problems', icon: ListChecks },
  { href: '/admin/assignments', label: 'Assignments', icon: ClipboardList },
  { href: '/admin/contributions', label: 'Pledges & payments', icon: HandCoins },
  { href: '/admin/posts', label: 'Posts & stories', icon: FileText },
  { href: '/admin/events', label: 'Events', icon: CalendarDays },
  { href: '/admin/campaigns', label: 'Campaigns', icon: Megaphone },
  { href: '/admin/portfolio', label: 'Portfolio', icon: Boxes },
  { href: '/admin/atlas', label: 'Atlas', icon: MapPinned },
  { href: '/admin/contact', label: 'Contact messages', icon: Mail },
  { href: '/admin/users', label: 'Users', icon: Users },
]

export function AdminNav() {
  const pathname = usePathname()
  const boxRef = useRef<HTMLElement>(null)
  const activeRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const box = boxRef.current
    const el = activeRef.current
    if (!box || !el) return
    box.scrollTo({ left: el.offsetLeft - box.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' })
  }, [pathname])

  return (
    <nav
      ref={boxRef}
      aria-label="Admin"
      className="relative flex gap-1 overflow-x-auto [scrollbar-width:none] lg:flex-col lg:overflow-visible [&::-webkit-scrollbar]:hidden"
    >
      {items.map((n) => {
        const active = n.exact ? pathname === n.href : pathname.startsWith(n.href)
        return (
          <Link
            key={n.href}
            ref={active ? activeRef : undefined}
            href={n.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              active ? 'bg-brand/10 text-ink' : 'text-slate-600 hover:bg-white hover:text-ink',
            )}
          >
            <n.icon className={cn('size-4', active ? 'text-brand-muted' : 'text-slate-500')} />
            {n.label}
          </Link>
        )
      })}
    </nav>
  )
}
