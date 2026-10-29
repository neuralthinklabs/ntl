import type { Metadata } from 'next'
import { LegalPage } from '@/components/site/legal-page'
import { legal } from '@/lib/legal'

export const metadata: Metadata = { title: 'Privacy policy' }

// The static page is built on the host, so the platform's own build variables
// tell us which provider is really in use.
const onNetlify = !!process.env.NETLIFY
const onVercel = !!process.env.VERCEL
const hosting = onNetlify ? 'Netlify' : onVercel ? 'Vercel' : 'our hosting provider'
const analytics = onVercel ? ' and Vercel Analytics (privacy-friendly page-view statistics that do not use cookies)' : ''

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated={legal.updated}>
      {!legal.reviewed && (
        <p>
          <strong>Draft.</strong> This policy has not yet been reviewed by a lawyer.
        </p>
      )}
      <p>
        {legal.name} (“we”, “us”) runs this website. This policy explains what personal information we collect, why, who
        handles it, and the choices you have.
      </p>

      <h2>Who is responsible</h2>
      <p>
        {legal.name}
        {legal.address ? `, ${legal.address}` : ''}. Privacy questions and requests:{' '}
        <a href={`mailto:${legal.email}`}>{legal.email}</a>.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Account details:</strong> name, email address and password (stored hashed by our authentication provider), and your NTL ID, a public identifier we generate for you.</li>
        <li><strong>Profile:</strong> an optional bio. Your name and NTL ID are shown publicly only where you are credited (a project, portfolio item or blog post) and only if “show my name publicly” is on in your profile.</li>
        <li><strong>What you submit:</strong> problem descriptions and attachments, event registrations, pledges (amount, reference and note), volunteer details and contact messages.</li>
        <li><strong>Payments:</strong> pledges are promises, and payment is made outside this site (for example bank transfer). We never collect card numbers. We record a payment reference an admin enters when confirming a payment.</li>
        <li><strong>Technical data:</strong> IP address and basic request data, used to keep the site secure (rate limiting and abuse prevention). Rate-limit records are deleted automatically after a short time.</li>
        <li><strong>Sign in with NTL ID:</strong> if you use your NTL ID to sign in to another website, that site receives your account ID and, depending on what you approve, your NTL ID, public name and email. You can remove any app&apos;s access at any time under Connected apps.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To run your account, review problems you submit and email you about their status.</li>
        <li>To record and confirm pledges, run events, and answer messages.</li>
        <li>To credit people publicly for their contributions, where they have allowed it.</li>
        <li>To protect the site from abuse, spam and fraud, and to understand how it is used.</li>
      </ul>
      <p>We do not sell your personal information, and we do not show third-party advertising or use advertising cookies.</p>

      <h2>Cookies</h2>
      <p>
        We use only essential cookies: the sign-in session cookie. The spam check on our contact form (Cloudflare
        Turnstile) may set its own technical cookies when it runs.
      </p>

      <h2>Who processes it for us</h2>
      <p>
        Supabase (database, authentication, file storage), Resend (email), Cloudflare Turnstile (spam protection) and{' '}
        {hosting} (hosting{analytics}). They process data on our behalf and may do so in other countries.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep account data while your account exists. We keep problem submissions and pledge records for as long as
        needed to run the programme and meet legal and accounting obligations. Contact messages are kept until handled
        and for a reasonable period afterwards.
      </p>

      <h2>Your rights</h2>
      <p>
        You can view and edit your profile at any time. You can ask us to access, correct, export or delete your
        personal information, withdraw consent, or raise a complaint by emailing{' '}
        <a href={`mailto:${legal.email}`}>{legal.email}</a>. We will respond within a reasonable time. If you are
        unhappy with our response you may also contact your local data-protection authority.
      </p>

      <h2>Children</h2>
      <p>This site is not intended for people under 18. If you believe a child has given us personal information, contact us and we will delete it.</p>

      <h2>Changes</h2>
      <p>We will update this page when our practices change and show the date above.</p>
    </LegalPage>
  )
}
