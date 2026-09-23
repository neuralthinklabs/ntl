import { Resend } from 'resend'

let client: Resend | null = null

function getResend() {
  if (!process.env.RESEND_API_KEY) return null
  if (!client) client = new Resend(process.env.RESEND_API_KEY)
  return client
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  const resend = getResend()
  if (!resend) {
    console.warn(
      `[email] RESEND_API_KEY not set — skipping send to ${to}: "${subject}"`,
    )
    return
  }

  const from = process.env.EMAIL_FROM || 'Neural Think Labs <hello@neuralthinklabs.org>'

  try {
    await resend.emails.send({ from, to, subject, html })
  } catch (err) {
    // Don't let a transient email-provider failure break the user-facing
    // action (problem submission, contact form, etc.) — log and move on.
    console.error('[email] send failed:', err)
  }
}

export function problemConfirmationEmail(title: string) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Thanks for submitting a problem</h2>
      <p>We received your submission "<strong>${escapeHtml(title)}</strong>".
      Our team reviews new submissions within 1–2 weeks and will follow up
      by email with next steps.</p>
      <p>— Neural Think Labs</p>
    </div>
  `
}

export function contactAckEmail(name: string) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>We got your message, ${escapeHtml(name)}</h2>
      <p>Thanks for reaching out to Neural Think Labs. Someone from our team
      will get back to you soon.</p>
      <p>— Neural Think Labs</p>
    </div>
  `
}

export function contactNotifyEmail(name: string, email: string, message: string) {
  return `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
      <h2>New contact form submission</h2>
      <p><strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(email)})</p>
      <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
    </div>
  `
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
