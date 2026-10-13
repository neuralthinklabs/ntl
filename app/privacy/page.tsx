import type { Metadata } from 'next'
import { LegalPage } from '@/components/site/legal-page'

export const metadata: Metadata = { title: 'Privacy policy' }

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="[date]">
      <p>
        <strong>Draft template.</strong> Replace the bracketed parts with your organisation&apos;s details and have it reviewed by a qualified lawyer for the places you operate in (for example GDPR, India&apos;s DPDP Act).
      </p>
      <p>Neural Think Labs (“we”, “us”) runs this website. This policy explains what we collect and why.</p>
      <h2>What we collect</h2>
      <ul>
        <li><strong>Account details:</strong> name, email address and password (stored hashed by our authentication provider).</li>
        <li><strong>What you submit:</strong> problem descriptions, attachments, event registrations, pledges, volunteer and contact messages.</li>
        <li><strong>Technical data:</strong> IP address and basic usage analytics, used to keep the site secure and understand how it is used.</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To run your account, review problems you submit and email you about their status.</li>
        <li>To record and confirm pledges, and to respond to messages.</li>
        <li>To protect the site from abuse, spam and fraud.</li>
      </ul>
      <h2>Who processes it</h2>
      <p>We use Supabase (database, authentication, file storage), Resend (email), Cloudflare Turnstile (spam protection), Vercel/Netlify (hosting) and Vercel Analytics. [Add any payment processor.] They process data on our behalf.</p>
      <h2>Your choices</h2>
      <p>You can view and edit your profile at any time. To access, correct, export or delete your data, email <a href="mailto:hello@neuralthinklabs.org">hello@neuralthinklabs.org</a>. We keep problem submissions and pledge records for as long as needed to run the programme and meet legal obligations.</p>
      <h2>Contact</h2>
      <p>[Registered name and address]. Questions: <a href="mailto:hello@neuralthinklabs.org">hello@neuralthinklabs.org</a>.</p>
    </LegalPage>
  )
}
