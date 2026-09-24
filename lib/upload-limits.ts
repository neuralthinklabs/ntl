// Single source of truth for problem-attachment upload limits. Imported by
// both the client form (components/problems/problem-form.tsx) for
// immediate feedback and the server action (actions/problems.ts) for
// enforcement — the client check is a UX nicety only, never trust it alone.
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB per file
export const MAX_FILES = 5

export function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${bytes}B`
}
