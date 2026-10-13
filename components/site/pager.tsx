import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// Server-rendered pager. `basePath` may already contain a query string
// (e.g. "/admin/contributions?status=pledged"); `page` is appended correctly.
export function Pager({ page, totalPages, basePath }: { page: number; totalPages: number; basePath: string }) {
  if (totalPages <= 1) return null

  const hrefFor = (p: number) => {
    if (p <= 1) return basePath
    return `${basePath}${basePath.includes('?') ? '&' : '?'}page=${p}`
  }
  const btn = 'inline-flex size-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition-colors hover:bg-slate-50'

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-2">
      <Link
        href={hrefFor(Math.max(1, page - 1))}
        aria-label="Previous page"
        aria-disabled={page <= 1}
        className={`${btn} ${page <= 1 ? 'pointer-events-none opacity-40' : ''}`}
      >
        <ChevronLeft className="size-4" />
      </Link>
      <span className="text-sm text-slate-600">
        Page {page} of {totalPages}
      </span>
      <Link
        href={hrefFor(Math.min(totalPages, page + 1))}
        aria-label="Next page"
        aria-disabled={page >= totalPages}
        className={`${btn} ${page >= totalPages ? 'pointer-events-none opacity-40' : ''}`}
      >
        <ChevronRight className="size-4" />
      </Link>
    </nav>
  )
}
