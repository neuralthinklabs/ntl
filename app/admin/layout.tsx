// app/admin/layout.tsx
export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { SiteShell } from '@/components/site/site-shell'
import { AdminNav } from '@/components/admin/admin-nav'
import { requireAdminPage } from '@/lib/auth/admin'

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Admin' },
  robots: { index: false, follow: false },
}

// Defense in depth: middleware already blocks non-admins, and every admin
// server action re-checks the role on its own.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage('/admin')
  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          <aside className="sticky top-16 z-30 -mx-4 border-b border-slate-200 bg-canvas/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
                <p className="mb-3 hidden px-3 text-xs font-medium text-slate-600 lg:block">Admin portal</p>
                <AdminNav />
           </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </SiteShell>
  )
}
