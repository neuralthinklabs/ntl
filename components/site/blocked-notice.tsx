import { Lock } from 'lucide-react'
import { Countdown } from './countdown'
import type { PageBlock } from '@/lib/site-controls'

export function BlockedNotice({ block }: { block: PageBlock }) {
  return (
    <div className="mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
      <span className="flex size-14 items-center justify-center rounded-full bg-slate-100 text-slate-600">
        <Lock className="size-6" aria-hidden />
      </span>
      <h1 className="mt-6 text-balance text-2xl font-semibold tracking-tight text-ink">{block.title}</h1>
      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">{block.message}</p>
      {block.showCountdown && block.opensAt && (
        <p className="mt-6 text-sm text-slate-700">
          Opens in{' '}
          <Countdown to={block.opensAt} endText="Opening now…" refreshOnDone className="rounded-md bg-ink px-2.5 py-1 font-mono font-semibold text-white" />
        </p>
      )}
    </div>
  )
}
