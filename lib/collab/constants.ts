// Safe to import from client components (no DB imports).
export const COMMUNITY_MAX_FILES = 3
export const COMMUNITY_MAX_FILE_BYTES = 5 * 1024 * 1024 // matches the community-media bucket limit

export const MESSAGE_MAX = 4000

export const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]
export const TASK_STATUS_LABEL: Record<string, string> = { todo: 'To do', in_progress: 'In progress', review: 'In review', done: 'Done' }
export const TASK_PRIORITIES = ['low', 'normal', 'high'] as const
export type TaskPriority = (typeof TASK_PRIORITIES)[number]
export const TASK_PRIORITY_LABEL: Record<string, string> = { low: 'Low', normal: 'Normal', high: 'High' }

/** Groups that get a task board: project groups and the internal NTL workspaces. */
const TASK_KINDS: readonly string[] = ['project', 'department', 'leadership', 'zone', 'operations']
export const hasTasks = (kind: string) => TASK_KINDS.includes(kind)

export const RSVP_RESPONSES = ['going', 'maybe', 'no'] as const
export const RSVP_LABEL: Record<string, string> = { going: 'Going', maybe: 'Maybe', no: "Can't go" }

export const DIGEST_OPTIONS = ['off', 'daily', 'weekly'] as const
export const DIGEST_LABEL: Record<string, string> = {
  off: 'No emails (in-app notifications only)',
  daily: 'Daily summary of unread notifications',
  weekly: 'Weekly summary of unread notifications',
}
