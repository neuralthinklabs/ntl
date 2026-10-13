import { test } from 'node:test'
import assert from 'node:assert/strict'
import { safeNext } from '../lib/safe-redirect.ts'
import { slugify } from '../lib/slug.ts'
import { zonedLocalToDate, dateToZonedLocal, isValidTimeZone } from '../lib/tz.ts'
import { hasValidSignatureBytes } from '../lib/file-signature.ts'

test('safeNext only allows same-site relative paths', () => {
  assert.equal(safeNext('/dashboard'), '/dashboard')
  assert.equal(safeNext('/problems?goal=live'), '/problems?goal=live')
  for (const bad of ['//evil.com', '/\\evil.com', 'https://evil.com', '@evil.com', 'javascript:alert(1)', '/a\nb', undefined, 42]) {
    assert.equal(safeNext(bad), '/dashboard', String(bad))
  }
  assert.equal(safeNext('//evil.com', '/'), '/')
})

test('slugify', () => {
  assert.equal(slugify('  Hello, World! Café  '), 'hello-world-cafe')
  assert.equal(slugify('---'), '')
})

test('time zones: wall-clock in a zone round-trips and is DST-aware', () => {
  assert.ok(isValidTimeZone('Asia/Kolkata'))
  assert.ok(!isValidTimeZone('Mars/Olympus'))
  // India has no DST: 18:30 IST == 13:00 UTC
  assert.equal(zonedLocalToDate('2026-11-05T18:30', 'Asia/Kolkata')?.toISOString(), '2026-11-05T13:00:00.000Z')
  // New York: EST (UTC-5) in November, EDT (UTC-4) in July
  assert.equal(zonedLocalToDate('2026-11-05T09:00', 'America/New_York')?.toISOString(), '2026-11-05T14:00:00.000Z')
  assert.equal(zonedLocalToDate('2026-07-05T09:00', 'America/New_York')?.toISOString(), '2026-07-05T13:00:00.000Z')
  const d = zonedLocalToDate('2026-03-01T07:15', 'Europe/London')!
  assert.equal(dateToZonedLocal(d, 'Europe/London'), '2026-03-01T07:15')
  assert.equal(zonedLocalToDate('not-a-date', 'UTC'), null)
})

test('file signatures', () => {
  const pdf = new TextEncoder().encode('%PDF-1.7 hello world!')
  assert.ok(hasValidSignatureBytes(pdf))
  const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0])
  assert.ok(hasValidSignatureBytes(png))
  const exe = new TextEncoder().encode('MZ\x90\x00 not allowed here')
  assert.ok(!hasValidSignatureBytes(exe))
  const webp = Uint8Array.from([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50, 0, 0, 0, 0])
  assert.ok(hasValidSignatureBytes(webp))
  const riffNotWebp = Uint8Array.from([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x41, 0x56, 0x49, 0x20, 0, 0, 0, 0])
  assert.ok(!hasValidSignatureBytes(riffNotWebp))
})
