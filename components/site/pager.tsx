import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// P1 #11: plain server-rendered pager (no client JS needed) — pass the
// current page, the computed total, and the base path; it builds `?page=N`
// links. Used by any list that now goes through lib/pagination.ts.
export function Pager({
  page,
  totalPages,
  basePath,
}: {
  page: number
  totalPages: number
  basePath: string
}) {
  if (totalPages <= 1) return null

  const hrefFor = (p: number) => (p <= 1 ? basePath : `${basePath}?page=${p}`)

  return (
    <nav
      aria-label="Pagination"
      className="mt-8 flex items-center justify-center gap-2"
    >
      <Link
        href={hrefFor(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className={`inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 ${
          page <= 1 ? 'pointer-events-none opacity-40' : ''
        }`}
      >
        <ChevronLeft className="size-4" />
      </Link>
      <span className="text-sm text-slate-500">
        Page {page} of {totalPages}
      </span>
      <Link
        href={hrefFor(Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        className={`inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 ${
          page >= totalPages ? 'pointer-events-none opacity-40' : ''
        }`}
      >
        <ChevronRight className="size-4" />
      </Link>
    </nav>
  )
}
