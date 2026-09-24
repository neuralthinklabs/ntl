import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { SiteShell } from '@/components/site/site-shell'

export const metadata: Metadata = {
  title: 'Problem Submitted — Neural Think Labs',
}

export default async function ProblemConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; incomplete?: string }>
}) {
  const { incomplete } = await searchParams

  return (
    <SiteShell>
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center sm:px-6">
        {incomplete === '1' ? (
          <>
            <span className="flex size-14 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <AlertTriangle className="size-7" />
            </span>
            <h1 className="mt-6 text-xl font-semibold tracking-tight text-ink">
              Your problem was submitted — but not every attachment made it
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              We saved your title, description and details, but one or more
              files failed to upload. You can check which ones from{' '}
              <Link href="/problems/mine" className="font-medium underline">
                My Problems
              </Link>{' '}
              — our team can also see this and will follow up if anything is
              missing that they need.
            </p>
          </>
        ) : (
          <>
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
          </>
        )}
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
