'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarDays,
  FileText,
  HandCoins,
  LayoutDashboard,
  ListChecks,
  Mail,
  Megaphone,
  Boxes,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/problems', label: 'Problems', icon: ListChecks },
  { href: '/admin/contributions', label: 'Pledges & payments', icon: HandCoins },
  { href: '/admin/posts', label: 'Posts & stories', icon: FileText },
  { href: '/admin/events', label: 'Events', icon: CalendarDays },
  { href: '/admin/campaigns', label: 'Campaigns', icon: Megaphone },
  { href: '/admin/portfolio', label: 'Portfolio', icon: Boxes },
  { href: '/admin/contact', label: 'Contact messages', icon: Mail },
  { href: '/admin/users', label: 'Users', icon: Users },
]

export function AdminNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {items.map((n) => {
        const active = n.exact ? pathname === n.href : pathname.startsWith(n.href)
        return (
          <Link
            key={n.href}
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
