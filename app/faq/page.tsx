import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'

export const metadata: Metadata = { title: 'FAQ', description: 'Answers to common questions about Neural Think Labs.' }

const faqs = [
  { q: 'What happens after I submit a problem?', a: 'Our team reviews it within 1–2 weeks. You get an email each time its status changes, and you can follow it under “My problems” in your dashboard.' },
  { q: 'How do contributions work?', a: 'You pledge an amount to a campaign and we email you how to pay. When our team confirms the payment arrived, the campaign’s progress bar updates and you get a confirmation email.' },
  { q: 'Is my pledge counted straight away?', a: 'No. Only confirmed payments change the progress bar, so the numbers you see are real.' },
  { q: 'How do I volunteer?', a: 'Use the application on the Volunteer page. We match volunteers to projects based on skills and availability.' },
  { q: 'Can I register for events?', a: 'Yes. Log in, open Events and press Register. If an event is full you can join the waitlist.' },
  { q: 'Who sees my submission?', a: 'Only our team. Attachments are stored privately. See the Privacy policy for details.' },
  { q: 'How do I delete my account or data?', a: 'Email hello@neuralthinklabs.org and we will help.' },
]

export default function FaqPage() {
  return (
    <SiteShell>
      <PageHero title="Frequently asked questions" />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <dl className="flex flex-col gap-4">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <dt className="text-base font-semibold text-ink">{f.q}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-slate-700">{f.a}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-sm text-slate-600">
          Still stuck? <Link href="/contact" className="font-medium text-brand-muted underline">Contact us</Link>.
        </p>
      </div>
    </SiteShell>
  )
}
