// Pure rules (no database import) so they can be unit-tested.
// Titles/points live in the `achievements` table (seeded by migration 0012);
// this file only decides WHICH slugs a person has earned.
export type ActivityCounts = {
  problems: number
  eventsAttended: number
  confirmedPledges: number
}

export function earnedSlugs(c: ActivityCounts): string[] {
  const out: string[] = []
  if (c.problems >= 1) out.push('first-problem')
  if (c.problems >= 5) out.push('five-problems')
  if (c.eventsAttended >= 1) out.push('first-event')
  if (c.eventsAttended >= 3) out.push('regular')
  if (c.confirmedPledges >= 1) out.push('first-backer')
  return out
}
