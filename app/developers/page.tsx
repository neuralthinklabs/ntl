import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { SectionLabel } from '@/components/site/ui'

export const metadata: Metadata = {
  title: 'Sign in with NTL ID',
  description: 'Add “Sign in with NTL ID” to your website using standard OpenID Connect.',
  alternates: { canonical: '/developers' },
}

const code = 'overflow-x-auto rounded-xl bg-ink p-4 text-xs leading-relaxed text-white'

export default function DevelopersPage() {
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://YOUR-PROJECT.supabase.co'
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? ''

  return (
    <SiteShell>
      <PageHero
        title="Sign in with NTL ID"
        description="One account across Neural Think Labs. Add NTL ID sign-in to your website with standard OpenID Connect."
      />
      <div className="mx-auto flex max-w-3xl flex-col gap-12 px-4 py-16 sm:px-6">
        <section>
          <SectionLabel>1. Get registered</SectionLabel>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            NTL registers each partner site. <Link href="/contact" className="font-medium text-brand-muted underline">Contact us</Link> with
            your app name and your redirect URL (the address on your site that receives the sign-in result). You will get a client ID and a client secret.
            Keep the secret on your server only.
          </p>
        </section>

        <section>
          <SectionLabel>2. Connect with OpenID Connect</SectionLabel>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            Any OpenID Connect library works. Use the authorization code flow with PKCE. Point it at the discovery document and it will find every endpoint:
          </p>
          <pre className={`${code} mt-3`}>{`${supabase}/auth/v1/.well-known/openid-configuration`}</pre>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            Request the scopes <code className="font-mono text-xs">openid profile email</code>. Example for Auth.js:
          </p>
          <pre className={`${code} mt-3`}>{`providers: [{
  id: 'ntl',
  name: 'NTL ID',
  type: 'oidc',
  issuer: '<the "issuer" value from the discovery document>',
  clientId: process.env.NTL_CLIENT_ID,
  clientSecret: process.env.NTL_CLIENT_SECRET,
}]`}</pre>
        </section>

        <section>
          <SectionLabel>3. Identify the person</SectionLabel>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            Store the user&apos;s <code className="font-mono text-xs">sub</code> value as the account key. It never changes. Do not use the NTL ID or the email as the key.
            To read the NTL ID and public name, call the userinfo endpoint with the access token:
          </p>
          <pre className={`${code} mt-3`}>{`GET ${site}/api/ntl/userinfo
Authorization: Bearer <access_token>

{ "sub": "…", "ntl_id": "NTL-7K3M-9QX2", "name": "Asha Rao" }`}</pre>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            <code className="font-mono text-xs">name</code> is omitted for people who chose not to show their name publicly. Typing an NTL ID is never proof of identity: it is a public identifier.
          </p>
        </section>

        <section>
          <SectionLabel>Rules for partner sites</SectionLabel>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-700 marker:text-brand">
            <li>Ask only for the scopes you need.</li>
            <li>Never ask for or store NTL passwords.</li>
            <li>Offer a way to delete a person&apos;s data on your site when they ask.</li>
            <li>People can remove your access at any time from their NTL dashboard.</li>
          </ul>
        </section>
      </div>
    </SiteShell>
  )
}
