import type { Metadata } from 'next'
import { LegalPage } from '@/components/site/legal-page'

export const metadata: Metadata = { title: 'Terms of use' }

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use" updated="[date]">
      <p>
        <strong>Draft template.</strong> Have this reviewed by a qualified lawyer and add your legal entity details before launch.
      </p>
      <h2>Using the site</h2>
      <p>You agree to use the site lawfully and honestly. Do not submit content that is false, abusive, infringing or harmful, and do not attempt to disrupt or gain unauthorised access to the site.</p>
      <h2>Your submissions</h2>
      <p>You keep ownership of what you submit. You give us permission to review it, discuss it internally and, where you agree, publish or act on it. Do not include other people&apos;s private information without their consent.</p>
      <h2>Pledges and payments</h2>
      <p>A pledge is a statement of intent, not a payment. A campaign&apos;s progress changes only after we confirm that payment has been received. [Describe your refund and fee policy and tax-receipt position.]</p>
      <h2>Accounts</h2>
      <p>You are responsible for keeping your login secure. We may suspend accounts that break these terms.</p>
      <h2>Liability</h2>
      <p>The site is provided “as is”. To the extent the law allows, we are not liable for indirect losses arising from its use. [Adjust for your jurisdiction.]</p>
      <h2>Contact</h2>
      <p><a href="mailto:hello@neuralthinklabs.org">hello@neuralthinklabs.org</a></p>
    </LegalPage>
  )
}
