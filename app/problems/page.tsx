import type { Metadata } from 'next'
import { ArrowRight } from 'lucide-react'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { ProblemForm } from '@/components/problems/problem-form'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Submit a Problem — Neural Think Labs',
  description:
    'Real-world problems need real solutions. Tell us what is happening, and help us turn it into action.',
}

export default async function ProblemsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const problemFormUrl = process.env.NEXT_PUBLIC_PROBLEM_FORM_URL

  return (
    <SiteShell>
      <PageHero
        title="Submit a Problem"
        description="Real-world problems need real solutions. Tell us what is happening, and help us turn it into action."
      />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        {problemFormUrl && (
          <div className="mb-10 flex flex-col items-start justify-between gap-4 rounded-2xl bg-ink p-6 text-white sm:flex-row sm:items-center sm:p-8">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                In a hurry? Submit via Google Form
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-white/60">
                A quick way to send us your problem statement. Prefer file
                attachments or to track your submission&apos;s status? Use
                the guided form below instead.
              </p>
            </div>
            
              href={problemFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90"
            >
              Open Google Form <ArrowRight className="size-4" />
            </a>
          </div>
        )}
        <ProblemForm isLoggedIn={!!user} />
      </div>
    </SiteShell>
  )
}