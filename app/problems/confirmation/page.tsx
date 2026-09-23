import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { SiteShell } from '@/components/site/site-shell'

export const metadata: Metadata = {
  title: 'Problem Submitted — Neural Think Labs',
}

export default function ProblemConfirmationPage() {
  return (
    <SiteShell>
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center sm:px-6">
        <span className="flex size-14 items-center justify-center rounded-full bg-brand/10 text-brand-muted">
          <CheckCircle2 className="size-7" />
        </span>
        <h1 className="mt-6 text-xl font-semibold tracking-tight text-ink">
          Thanks — your problem has been submitted
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          We&apos;ve emailed you a confirmation. Our team reviews new
          submissions within 1–2 weeks and will follow up with next steps.
          You can track its status from your dashboard.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            href="/problems/mine"
            className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90"
          >
            View my problems
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-slate-50"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </SiteShell>
  )
}
