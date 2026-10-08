import { SectionLabel } from '@/components/site/ui'
import { GoalIcon } from './goal-icon'
import { developmentChain, goals, ntlLoop, principles } from '@/lib/ntldgs'

const card = 'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'

export function SystemSection() {
  return (
    <section id="system" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
      <SectionLabel className="text-brand-muted">The system</SectionLabel>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        From vision to impact.
      </h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={card}>
          <h3 className="text-base font-semibold text-ink">The development system</h3>
          {/* A sequence, so an ordered list with visible arrows. */}
          <ol className="mt-3 flex flex-wrap gap-y-1.5">
            {developmentChain.map((s, i) => (
              <li key={s} className="flex items-center">
                <span className="rounded-full border border-slate-300 px-2.5 py-0.5 text-xs text-slate-600">
                  {s}
                </span>
                {i < developmentChain.length - 1 && (
                  <span aria-hidden="true" className="px-1 text-slate-300">→</span>
                )}
              </li>
            ))}
          </ol>
        </div>

        <div className={card}>
          <h3 className="text-base font-semibold text-ink">
            The NTL loop: People. Participation. Progress.
          </h3>
          <ol className="mt-3 list-decimal pl-5 text-sm leading-relaxed text-slate-600">
            {ntlLoop.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <p className="mt-2 text-xs text-slate-500">…and inspiration starts the loop again.</p>
        </div>

        <div id="principles" className={card}>
          <h3 className="text-base font-semibold text-ink">Guiding our path</h3>
          <ul className="mt-3 list-disc pl-5 text-sm leading-relaxed text-slate-600 marker:text-brand">
            {principles.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>

        <div className={card}>
          <h3 className="text-base font-semibold text-ink">A new symbolic language</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {goals.map((g, i) => (
              <GoalIcon key={g.slug} index={i} className="size-9" />
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">12 unique symbols. A shared visual DNA.</p>
        </div>
      </div>
    </section>
  )
}
