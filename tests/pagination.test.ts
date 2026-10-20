import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_PAGE_SIZE, parsePage, totalPages } from '../lib/pagination'

test('parsePage clamps junk input to page 1', () => {
  for (const bad of [undefined, {}, { page: 'abc' }, { page: '0' }, { page: '-4' }, { page: '' }]) {
    const p = parsePage(bad as { page?: string } | undefined)
    assert.equal(p.page, 1)
    assert.equal(p.offset, 0)
    assert.equal(p.limit, DEFAULT_PAGE_SIZE)
  }
})

test('parsePage computes offsets', () => {
  assert.equal(parsePage({ page: '3' }).offset, 2 * DEFAULT_PAGE_SIZE)
  assert.equal(parsePage({ page: '2.9' }).page, 2)
})

test('totalPages never drops below 1', () => {
  assert.equal(totalPages(0), 1)
  assert.equal(totalPages(DEFAULT_PAGE_SIZE), 1)
  assert.equal(totalPages(DEFAULT_PAGE_SIZE + 1), 2)
})
