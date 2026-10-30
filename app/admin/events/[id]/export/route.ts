import { asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { events, eventRegistrations, profiles } from '@/db/schema'
import { requireAdminAction } from '@/lib/auth/admin'
import { logAdmin } from '@/lib/audit'

export const dynamic = 'force-dynamic'

// Spreadsheet formula injection guard: a cell that starts with = + - @ is
// prefixed with an apostrophe so Excel/Sheets treat it as text.
const cell = (v: string) => {
  const s = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v
  return `"${s.replace(/"/g, '""')}"`
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin
  try {
    admin = (await requireAdminAction()).user
  } catch {
    return new Response('Forbidden', { status: 403 })
  }
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response('Not found', { status: 404 })
  const ev = await db.query.events.findFirst({ where: eq(events.id, id) })
  if (!ev) return new Response('Not found', { status: 404 })

  const rows = await db
    .select({ name: profiles.fullName, email: profiles.email, ntlId: profiles.ntlId, status: eventRegistrations.status, at: eventRegistrations.registeredAt })
    .from(eventRegistrations)
    .innerJoin(profiles, eq(eventRegistrations.userId, profiles.id))
    .where(eq(eventRegistrations.eventId, id))
    .orderBy(asc(eventRegistrations.registeredAt))

  const csv =
    ['Name', 'Email', 'NTL ID', 'Status', 'Registered at (UTC)'].map(cell).join(',') +
    '\r\n' +
    rows.map((r) => [r.name ?? '', r.email, r.ntlId, r.status, r.at.toISOString()].map(cell).join(',')).join('\r\n') +
    '\r\n'

  await logAdmin({ actorId: admin.id, action: 'event_export', entity: 'event', entityId: id, summary: `${rows.length} rows` })

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${ev.slug}-registrations.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
