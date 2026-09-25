// P1 #11: shared pagination helper. Every `findMany()` that lists
// unbounded, potentially-growing data (admin problem queue, events,
// stories, a user's own problems) should go through this instead of a bare
// `findMany({ where })` with no `limit`/`offset` — otherwise those queries
// (and the page rendering them) get linearly slower as the table grows,
// with no way to reach older rows past whatever `.slice()`/happenstance
// limit was hardcoded.

export const DEFAULT_PAGE_SIZE = 20

export type PageParams = { page?: string }

export function parsePage(searchParams: PageParams | undefined) {
  const raw = Number(searchParams?.page)
  const page = Number.isFinite(raw) && raw > 1 ? Math.floor(raw) : 1
  return {
    page,
    limit: DEFAULT_PAGE_SIZE,
    offset: (page - 1) * DEFAULT_PAGE_SIZE,
  }
}

export function totalPages(totalRows: number, pageSize = DEFAULT_PAGE_SIZE) {
  return Math.max(1, Math.ceil(totalRows / pageSize))
}
