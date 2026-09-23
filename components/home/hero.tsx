import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function HomeHero() {
  return (
    <section className="relative overflow-hidden bg-ink text-white">
      <div className="absolute inset-0">
        <Image
          src="/images/hero-mountain.png"
          alt=""
          fill
          priority
          className="object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/90 to-ink/40" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
        <div className="max-w-2xl">
          <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Real People.
            <br />
            Real Problems.
            <br />
            <span className="text-brand">Better Futures.</span>
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-white/70">
            Neural Think Labs connects people, knowledge, resources and ideas —
            and turns them into real projects, products and ventures across
            education, innovation, research, products, services, publishing and
            community problem-solving.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/volunteer"
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90"
            >
              Get Involved
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Explore Our Work
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
