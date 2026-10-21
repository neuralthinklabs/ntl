// Date helpers. The time-zone maths lives in lib/tz.ts (the tested copy);
// this file re-exports it under the older names and keeps the formatters.
export { isValidTimeZone, zonedLocalToDate, dateToZonedLocal } from './tz'
export { zonedLocalToDate as zonedLocalToUtc, dateToZonedLocal as utcToZonedInput } from './tz'

export function formatInZone(date: Date, tz: string, opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-US', { timeZone: tz, ...opts }).format(date)
}

/** Stable, timezone-explicit date formatting for server-rendered content. */
export function formatDate(date: Date | string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...opts }).format(new Date(date))
}
