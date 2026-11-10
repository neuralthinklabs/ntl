'use server'

import { z } from 'zod'
import { and, asc, desc, eq, gt, isNull, lte } from 'drizzle-orm'
import { db } from '@/db'
import { notifications } from '@/db/community-schema'
import { dmConversations, dmMessages, dmReports } from '@/db/collab-schema'
import { getViewer } from '@/lib/community/authz'
import { notify } from '@/lib/community/notify'
import { REPORT_REASONS } from '@/lib/community/constants'
import { MESSAGE_MAX } from '@/lib/collab/constants'
import { canMessage, findConversation, loadPerson, loadPersonById, markRead, pairIds } from '@/lib/collab/messaging'
import { throttle } from '@/lib/collab/throttle'
import type { ActionState } from './auth'

const uuid = z.string().uuid()

export type ChatMessage = { id: string; mine: boolean; body: string; createdAt: string; deleted: boolean }

export async function sendMessage(toNtlId: string, body: string): Promise<ActionState> {
  const viewer = await getViewer()
  if (!viewer) return { error: 'Please log in to send messages.' }
  if (viewer.blocked) return { error: 'Your community access is currently restricted.' }
  const text = z.string().trim().min(1, 'Write a message first.').max(MESSAGE_MAX, `Messages can be up to ${MESSAGE_MAX} characters.`).safeParse(body ?? '')
  if (!text.success) return { error: text.error.issues[0]?.message ?? 'Invalid message.' }
  const limited = await throttle(`dm:send:${viewer.id}`, 60)
  if (limited) return limited

  const target = await loadPerson(toNtlId)
  if (!target) return { error: 'No one has that NTL ID.' }
  const can = await canMessage(viewer, target)
  if (!can.ok) return { error: can.error }

  let conv = await findConversation(viewer.id, target.id)
  if (!conv) {
    const newLimit = await throttle(`dm:new:${viewer.id}`, 10)
    if (newLimit) return newLimit
    const [low, high] = pairIds(viewer.id, target.id)
    await db.insert(dmConversations).values({ userLow: low, userHigh: high }).onConflictDoNothing()
    conv = await findConversation(viewer.id, target.id)
  }
  if (!conv) return { error: 'Could not start the conversation. Please try again.' }

  await db.insert(dmMessages).values({ conversationId: conv.id, senderId: viewer.id, body: text.data })
  await db.update(dmConversations).set({ lastMessageAt: new Date() }).where(eq(dmConversations.id, conv.id))
  await markRead(conv.id, viewer.id)

  // One unread "new message" notification per sender is enough; the text is never put in a notification.
  const me = await loadPersonById(viewer.id)
  const [pending] = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(and(eq(notifications.userId, target.id), eq(notifications.actorId, viewer.id), eq(notifications.type, 'message'), isNull(notifications.readAt)))
    .limit(1)
  if (!pending && me) {
    await notify([{ userId: target.id, type: 'message', title: `${viewer.name} sent you a message`, link: `/community/messages/${me.ntlId}`, actorId: viewer.id }])
  }
  return { success: 'Sent.' }
}

/** Polled by the open thread: new messages after `afterIso`, and marks the thread read. */
export async function pollMessages(otherNtlId: string, afterIso?: string): Promise<{ messages: ChatMessage[] } | { error: string }> {
  const viewer = await getViewer()
  if (!viewer) return { error: 'Please log in.' }
  const other = await loadPerson(otherNtlId)
  if (!other) return { error: 'Person not found.' }
  const conv = await findConversation(viewer.id, other.id)
  if (!conv) return { messages: [] }
  const after = afterIso ? new Date(afterIso) : null
  const rows = await db
    .select()
    .from(dmMessages)
    .where(and(eq(dmMessages.conversationId, conv.id), after && !Number.isNaN(after.getTime()) ? gt(dmMessages.createdAt, after) : undefined))
    .orderBy(asc(dmMessages.createdAt))
    .limit(100)
  if (rows.length) await markRead(conv.id, viewer.id)
  return {
    messages: rows.map((m) => ({ id: m.id, mine: m.senderId === viewer.id, body: m.deletedAt ? '' : m.body, createdAt: m.createdAt.toISOString(), deleted: !!m.deletedAt })),
  }
}

/** Senders can delete their own message; the text is wiped, not just hidden. */
export async function deleteMessage(messageId: string): Promise<ActionState> {
  const id = uuid.safeParse(messageId)
  const viewer = await getViewer()
  if (!viewer || !id.success) return { error: 'Not found.' }
  const updated = await db
    .update(dmMessages)
    .set({ body: '', deletedAt: new Date() })
    .where(and(eq(dmMessages.id, id.data), eq(dmMessages.senderId, viewer.id), isNull(dmMessages.deletedAt)))
    .returning({ id: dmMessages.id })
  return updated.length ? { success: 'Deleted.' } : { error: 'You can only delete your own messages.' }
}

export async function reportMessage(messageId: string, reason: string, details: string): Promise<ActionState> {
  const p = z
    .object({ messageId: uuid, reason: z.enum(REPORT_REASONS), details: z.string().trim().max(1000).optional() })
    .safeParse({ messageId, reason, details: details || undefined })
  if (!p.success) return { error: 'Choose a reason for the report.' }
  const viewer = await getViewer()
  if (!viewer) return { error: 'Please log in.' }
  const limited = await throttle(`dm:report:${viewer.id}`, 10)
  if (limited) return limited

  const [msg] = await db.select().from(dmMessages).where(eq(dmMessages.id, p.data.messageId)).limit(1)
  if (!msg || !msg.senderId || msg.deletedAt) return { error: 'That message is not available.' }
  const [conv] = await db.select().from(dmConversations).where(eq(dmConversations.id, msg.conversationId)).limit(1)
  if (!conv || (conv.userLow !== viewer.id && conv.userHigh !== viewer.id)) return { error: 'That message is not available.' }
  if (msg.senderId === viewer.id) return { error: 'You cannot report your own message.' }

  // Snapshot: the reported message and up to five before it. Admins see only this.
  const context = await db
    .select()
    .from(dmMessages)
    .where(and(eq(dmMessages.conversationId, conv.id), lte(dmMessages.createdAt, msg.createdAt)))
    .orderBy(desc(dmMessages.createdAt))
    .limit(6)
  const names = new Map<string, string>()
  for (const id of [conv.userLow, conv.userHigh]) {
    const person = await loadPersonById(id)
    if (person) names.set(id, `${person.name} (${person.ntlId})`)
  }
  const snapshot = context
    .reverse()
    .map((m) => `${names.get(m.senderId ?? '') ?? 'Former member'} · ${m.createdAt.toISOString()}: ${m.deletedAt ? '[deleted]' : m.body}`)
    .join('\n')

  const inserted = await db
    .insert(dmReports)
    .values({ conversationId: conv.id, messageId: msg.id, reporterId: viewer.id, reportedUserId: msg.senderId, reason: p.data.reason, details: p.data.details ?? null, snapshot })
    .onConflictDoNothing()
    .returning({ id: dmReports.id })
  return inserted.length ? { success: 'Thanks. An NTL administrator will review this. Consider blocking the person.' } : { success: 'You already reported this message.' }
}
