import type { Metadata } from 'next'
import Link from 'next/link'
import { eq } from 'drizzle-orm'
import { ArrowRight, Globe, HeartHandshake, Sparkles } from 'lucide-react'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { IconTile, SectionLabel } from '@/components/site/ui'
import { VolunteerForm } from '@/components/volunteer/volunteer-form'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { profiles } from '@/db/schema'

export const metadata: Metadata = { title: 'Volunteer', description: 'Your skills can help solve real problems.' }
export const dynamic = 'force-dynamic'

const why = [
  { icon: HeartHandshake, title: 'Make a real impact', text: 'Work on meaningful projects that matter to real communities.' },
  { icon: Sparkles, title: 'Build your skills', text: 'Gain experience and new perspectives across disciplines.' },
  { icon: Globe, title: 'Join a global community', text: 'Connect with people who share your values.' },
]

const steps = [
  { title: 'Fill out the application below', text: 'Takes about 5–10 minutes.' },
  { title: 'Our team reviews your application', text: 'We will be in touch within 1–2 weeks.' },
  { title: 'Get started', text: 'Join the team and make an impact.' },
]

export default async function VolunteerPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const profile = user ? await db.query.profiles.findFirst({ where: eq(profiles.id, user.id) }) : null

  return (
    <SiteShell>
      <PageHero title="Volunteer" description="Your skills can help solve real problems." image="/images/volunteer-hands.png" />

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionLabel>Why volunteer?</SectionLabel>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {why.map((w) => (
            <div key={w.title} className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="flex justify-center"><IconTile icon={w.icon} className="size-12" /></div>
              <h3 className="mt-4 text-base font-semibold text-ink">{w.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{w.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-2">
          <div>
            <SectionLabel>How it works</SectionLabel>
            <ol className="mt-6 flex flex-col gap-5">
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground">{i + 1}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{s.title}</h3>
                    <p className="mt-0.5 text-sm text-slate-600">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl bg-ink p-8 text-white">
            <h3 className="text-xl font-semibold tracking-tight">Ready to get involved?</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/75">Apply now and our team will match you with a project that fits your skills and interests.</p>
            <a href="#apply" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90">
              Go to the application <ArrowRight className="size-4" />
            </a>
            <p className="mt-6 text-sm text-white/75">
              Have questions? Read the{' '}
              <Link href="/faq" className="font-medium text-brand underline">FAQ</Link> or{' '}
              <Link href="/contact" className="font-medium text-brand underline">contact us</Link>.
            </p>
          </div>
        </div>

        <section id="apply" aria-labelledby="apply-heading" className="mx-auto mt-20 max-w-3xl scroll-mt-24">
          <SectionLabel>Application</SectionLabel>
          <h2 id="apply-heading" className="mt-2 text-2xl font-semibold tracking-tight text-ink">Apply to volunteer</h2>
          <div className="mt-6">
            {user ? (
              <VolunteerForm defaultName={profile?.fullName ?? ''} />
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <p className="text-sm leading-relaxed text-slate-600">
                  Create a free account or log in first, so we can email you about your application and you can track it.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Link href={`/auth/login?next=${encodeURIComponent('/volunteer')}`} className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand/90">Log in</Link>
                  <Link href={`/auth/signup?next=${encodeURIComponent('/volunteer')}`} className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-ink hover:bg-slate-50">Create an account</Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </SiteShell>
  )
}
