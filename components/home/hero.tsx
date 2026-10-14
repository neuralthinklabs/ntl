import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { btnPrimary } from '@/lib/ui'

// A real sequence, so numbering is meaningful here.
const steps = [
  { title: 'A problem is submitted', text: 'Anyone can describe a real problem with context and evidence.' },
  { title: 'The team reviews it', text: 'Most submissions get a decision within 1–2 weeks.' },
  { title: 'People build a response', text: 'Volunteers, partners and researchers turn it into a project.' },
  { title: 'Progress is public', text: 'Updates and funding are shown openly. Only confirmed payments count.' },
]

export function HomeHero() {
  return (
    <section className="relative overflow-hidden bg-ink text-white">
      <div className="absolute inset-0">
        <Image src="/images/hero-mountain.png" alt="" fill priority sizes="100vw" className="object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/95 to-ink/70" />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
        <div>
          <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
            Real people. Real problems. Better futures.
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-white/70 sm:text-lg">
            Neural Think Labs connects people, knowledge and resources, and turns them into real projects across
            education, research, products, services and community problem-solving.
          </p>
          <div className="mt-9">
            <Link href="/portfolio" className={btnPrimary}>
              Explore our work <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur sm:p-8">
          <h2 className="text-base font-semibold text-white">How a problem becomes a project</h2>
          <ol className="mt-6 flex flex-col gap-6">
            {steps.map((s, i) => (
              <li
                key={s.title}
                className={
                  'relative pl-11 ' +
                  (i < steps.length - 1
                    ? "before:absolute before:bottom-[-1.5rem] before:left-[0.9rem] before:top-8 before:w-px before:bg-white/15"
                    : '')
                }
              >
                <span className="absolute left-0 top-0 flex size-7 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-foreground">
                  {i + 1}
                </span>
                <p className="text-sm font-semibold text-white">{s.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-white/60">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
