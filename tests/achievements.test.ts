import { test } from 'node:test'
import assert from 'node:assert/strict'
import { earnedSlugs } from '../lib/achievement-rules'

test('nothing earned with no activity', () => {
  assert.deepEqual(earnedSlugs({ problems: 0, eventsAttended: 0, confirmedPledges: 0 }), [])
})

test('thresholds', () => {
  assert.deepEqual(earnedSlugs({ problems: 1, eventsAttended: 0, confirmedPledges: 0 }), ['first-problem'])
  assert.deepEqual(earnedSlugs({ problems: 5, eventsAttended: 0, confirmedPledges: 0 }), ['first-problem', 'five-problems'])
  assert.deepEqual(earnedSlugs({ problems: 0, eventsAttended: 3, confirmedPledges: 1 }), ['first-event', 'regular', 'first-backer'])
})
