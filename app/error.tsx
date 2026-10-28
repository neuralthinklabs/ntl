'use client'

import { DotGrid, GeoShapes } from '@/components/brand/graphics'

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-ink px-4 text-center text-white">
      <DotGrid className="absolute inset-0 text-white/10" />
      <div className="relative max-w-md">
        <GeoShapes className="mx-auto mb-6 w-24 stroke-white opacity-60" />
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Something went wrong</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">We hit a snag</h1>
        <span aria-hidden className="mx-auto mt-3 block h-0.5 w-10 bg-brand" />
        <p className="mt-4 text-sm leading-relaxed text-white/70">Please try again. If this keeps happening, let us know via the contact page.</p>
        <div className="mt-8 flex justify-center gap-3">
          <button type="button" onClick={() => reset()} className="inline-flex h-11 items-center rounded-lg bg-brand px-6 text-sm font-semibold text-brand-foreground hover:brightness-110">
            Try again
          </button>
          <a href="/contact" className="inline-flex h-11 items-center rounded-lg border border-brand/60 px-6 text-sm font-semibold text-brand hover:bg-brand/10">
            Contact us
          </a>
        </div>
      </div>
    </div>
  )
}
