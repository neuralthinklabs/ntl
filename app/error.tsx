'use client'

// P2 #14: Next.js error boundary for the whole app. Without this, an
// uncaught error in a Server or Client Component rendered a blank/generic
// Next.js error page with no way back into the site. Must be a Client
// Component ('use client') — error.tsx always is.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-red-500">
        Something went wrong
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
        We hit a snag
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        Please try again. If this keeps happening, let us know via the
        contact page.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90"
        >
          Try again
        </button>
        <a
          href="/contact"
          className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-slate-50"
        >
          Contact us
        </a>
      </div>
    </div>
  )
}
