import Link from 'next/link'
import { DotGrid, NetworkNodes } from '@/components/brand/graphics'

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-ink px-4 text-center text-white">
      <DotGrid className="absolute inset-0 text-white/10" />
      <div className="relative max-w-md">
        <NetworkNodes className="mx-auto mb-6 w-40 opacity-80" />
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Page not found</h1>
        <span aria-hidden className="mx-auto mt-3 block h-0.5 w-10 bg-brand" />
        <p className="mt-4 text-sm leading-relaxed text-white/70">The page you&apos;re looking for doesn&apos;t exist or may have moved.</p>
        <Link href="/" className="mt-8 inline-flex h-11 items-center rounded-lg bg-brand px-6 text-sm font-semibold text-brand-foreground hover:brightness-110">
          Back to home
        </Link>
      </div>
    </div>
  )
}
