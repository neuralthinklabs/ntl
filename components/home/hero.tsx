import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { btnOnDark, btnPrimary } from '@/lib/ui'
import { DotGrid, EarthGlow, NetworkNodes } from '@/components/brand/graphics'

export function HomeHero() {
  return (
    <section className="relative overflow-hidden bg-ink text-white">
      <DotGrid className="absolute inset-0 text-white/10 [mask-image:linear-gradient(to_right,black,transparent_70%)]" />
      <EarthGlow className="-right-40 top-8 size-[44rem] rounded-full opacity-90 sm:-right-24" />
      <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:py-36">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/60">
          Innovation <span className="mx-1 text-brand">/</span> Impact <span className="mx-1 text-brand">/</span> Together
        </p>
        <h1 className="mt-6 max-w-2xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          Real People.<br />Real Problems.<br />
          <span className="text-brand">Better Futures.</span>
        </h1>
        <span aria-hidden className="mt-4 block h-0.5 w-10 bg-brand" />
        <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-white/70 sm:text-lg">
          An innovation and social-impact organisation building solutions for a more inclusive, sustainable and intelligent future.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/portfolio" className={btnPrimary}>Explore our work <ArrowRight className="size-4" /></Link>
          <Link href="/problems" className={btnOnDark}>Submit a problem</Link>
        </div>
        <NetworkNodes className="mt-14 hidden w-56 opacity-80 lg:block" />
      </div>
    </section>
  )
}
