import { db } from '@/db'
import { adminAuditLog } from '@/db/schema'

// Every admin mutation writes one row here so there is always an answer to
// "who changed this, and when".
export async function logAdmin(params: {
  actorId: string
  action: string
  entity: string
  entityId?: string
  summary?: string
}) {
  try {
    await db.insert(adminAuditLog).values({
      actorId: params.actorId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      summary: params.summary,
    })
  } catch (err) {
    // Auditing must never break the action it describes.
    console.error('[audit] failed to write audit log:', err)
  }
}
