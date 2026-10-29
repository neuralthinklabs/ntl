import type { Metadata } from 'next'
import { LegalPage } from '@/components/site/legal-page'
import { legal } from '@/lib/legal'

export const metadata: Metadata = { title: 'Terms of use' }

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use" updated={legal.updated}>
      {!legal.reviewed && (
        <p>
          <strong>Draft.</strong> These terms have not yet been reviewed by a lawyer.
        </p>
      )}
      <p>
        These terms apply to your use of the {legal.name} website. By using it you agree to them. If you do not agree,
        please do not use the site.
      </p>

      <h2>Using the site</h2>
      <p>Use the site lawfully and honestly. Do not submit content that is false, abusive, infringing or harmful, do not try to disrupt the site or reach areas you are not allowed to, and do not use automated tools to scrape it or send bulk messages.</p>

      <h2>Accounts and your NTL ID</h2>
      <p>You must be at least 18 to create an account. Keep your login secure and give accurate information. Your NTL ID is a public identifier, not proof of identity. We may suspend or remove accounts that break these terms.</p>

      <h2>Your submissions</h2>
      <p>You keep ownership of what you submit. You give us permission to review it, discuss it internally and, where you agree or where it is part of a public credit you enabled, publish or act on it. Do not include other people&apos;s private information without their consent. Uploaded files must be images, PDFs or Word documents you have the right to share.</p>

      <h2>Pledges and payments</h2>
      <p>
        A pledge is a statement of intent, not a payment. A campaign&apos;s progress changes only after we confirm that
        payment has been received. {legal.name} will tell you how to pay. Refunds, fees and any tax receipts are handled
        by us directly; contact <a href={`mailto:${legal.email}`}>{legal.email}</a> about a specific pledge.
      </p>

      <h2>Sign in with NTL ID</h2>
      <p>Other websites may offer sign-in with your NTL ID. They are run by third parties with their own policies. You can remove an app&apos;s access under Connected apps at any time.</p>

      <h2>Our content</h2>
      <p>Site design, text and graphics belong to {legal.name} or its licensors. Stories credit their authors; ask before reusing them.</p>

      <h2>Liability</h2>
      <p>The site is provided “as is”. To the extent the law allows, we are not liable for indirect or consequential losses arising from its use, and nothing here limits liability that cannot lawfully be limited.</p>

      <h2>Changes and governing law</h2>
      <p>
        We may update these terms and will show the date above. {legal.jurisdiction ? `These terms are governed by the laws of ${legal.jurisdiction}.` : ''}
      </p>

      <h2>Contact</h2>
      <p>
        {legal.name}
        {legal.address ? `, ${legal.address}` : ''}. <a href={`mailto:${legal.email}`}>{legal.email}</a>
      </p>
    </LegalPage>
  )
}
