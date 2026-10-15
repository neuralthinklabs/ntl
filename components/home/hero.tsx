import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { btnOnDark, btnPrimary } from '@/lib/ui'
import { HeroArt } from './hero-art'

export function HomeHero() {
  return (
    <section className="relative overflow-hidden bg-ink text-white">
      <div aria-hidden="true" className="bg-hero-glow absolute inset-0" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/60">
            Innovation <span className="mx-1 text-white/30">/</span> Impact <span className="mx-1 text-white/30">/</span> Together
          </p>
          <h1 className="mt-6 text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Real people. Real problems. <span className="text-gradient">Better futures.</span>
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-white/70 sm:text-lg">
            Neural Think Labs connects people, knowledge and resources, and turns them into real projects across
            education, research, products, services and community problem-solving.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/portfolio" className={btnPrimary}>
              Explore our work <ArrowRight className="size-4" />
            </Link>
            <Link href="/problems" className={btnOnDark}>
              Submit a problem
            </Link>
          </div>
        </div>

        <div className="relative">
          <HeroArt className="mx-auto w-full max-w-md" />
          <p className="absolute right-0 top-1/4 hidden max-w-[7rem] border-l border-white/20 pl-4 text-sm leading-snug text-white/80 xl:block">
            Better products. Bigger impact.
          </p>
        </div>
      </div>
    </section>
  )
}
