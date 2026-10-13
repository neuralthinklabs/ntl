import { Resend } from 'resend'

let client: Resend | null = null

function getResend() {
  if (!process.env.RESEND_API_KEY) return null
  if (!client) client = new Resend(process.env.RESEND_API_KEY)
  return client
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const resend = getResend()
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set - skipping send to ${to}: "${subject}"`)
    return
  }
  const from = process.env.EMAIL_FROM || 'Neural Think Labs <hello@neuralthinklabs.org>'
  try {
    await resend.emails.send({ from, to, subject: subject.replace(/[\r\n]+/g, ' '), html })
  } catch (err) {
    // A transient provider failure must not break the user-facing action.
    console.error('[email] send failed:', err)
  }
}

export function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const wrap = (inner: string) => `
  <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color:#0d0f12; line-height:1.55;">
    ${inner}
    <p style="color:#555">Neural Think Labs</p>
  </div>`

export function problemConfirmationEmail(title: string) {
  return wrap(`
    <h2>Thanks for submitting a problem</h2>
    <p>We received "<strong>${escapeHtml(title)}</strong>". Our team reviews new submissions within 1-2 weeks and will email you when its status changes.</p>`)
}

export function problemAdminNotifyEmail(title: string, submitter: string, url: string) {
  return wrap(`
    <h2>New problem submitted</h2>
    <p><strong>${escapeHtml(title)}</strong><br/>from ${escapeHtml(submitter)}</p>
    <p><a href="${escapeHtml(url)}">Review it in the admin portal</a></p>`)
}

const STATUS_COPY: Record<string, string> = {
  in_review: 'is now being reviewed by our team',
  accepted: 'has been accepted',
  in_progress: 'is now in progress',
  resolved: 'has been marked as resolved',
  declined: 'was not taken forward this time',
  submitted: 'has been returned to the submitted queue',
}

export function problemStatusEmail(title: string, status: string, note: string | null | undefined, url: string) {
  return wrap(`
    <h2>Update on your problem submission</h2>
    <p>"<strong>${escapeHtml(title)}</strong>" ${escapeHtml(STATUS_COPY[status] ?? `is now: ${status}`)}.</p>
    ${note ? `<p style="background:#f4f6f8;padding:12px;border-radius:8px"><strong>Note from the team:</strong><br/>${escapeHtml(note)}</p>` : ''}
    <p><a href="${escapeHtml(url)}">View your submissions</a></p>`)
}

export function contactAckEmail(name: string) {
  return wrap(`
    <h2>We got your message, ${escapeHtml(name)}</h2>
    <p>Thanks for reaching out to Neural Think Labs. Someone from our team will get back to you soon.</p>`)
}

export function contactNotifyEmail(name: string, email: string, message: string) {
  return wrap(`
    <h2>New contact form submission</h2>
    <p><strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(email)})</p>
    <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>`)
}

export function pledgeReceivedEmail(goalTitle: string, amount: string, ref: string, instructions: string) {
  return wrap(`
    <h2>Thank you for your pledge</h2>
    <p>We recorded your pledge of <strong>${escapeHtml(amount)}</strong> to "<strong>${escapeHtml(goalTitle)}</strong>".</p>
    <p>Your reference: <strong>${escapeHtml(ref)}</strong></p>
    <p>${instructions ? escapeHtml(instructions).replace(/\n/g, '<br/>') : 'We will email you payment details shortly.'}</p>
    <p>The campaign's progress bar updates once our team has confirmed your payment.</p>`)
}

export function pledgeAdminNotifyEmail(who: string, goalTitle: string, amount: string, url: string) {
  return wrap(`
    <h2>New pledge to confirm</h2>
    <p>${escapeHtml(who)} pledged <strong>${escapeHtml(amount)}</strong> to "${escapeHtml(goalTitle)}".</p>
    <p><a href="${escapeHtml(url)}">Open pledges in the admin portal</a></p>`)
}

export function pledgeConfirmedEmail(goalTitle: string, amount: string) {
  return wrap(`
    <h2>Payment confirmed - thank you</h2>
    <p>We have received your <strong>${escapeHtml(amount)}</strong> for "<strong>${escapeHtml(goalTitle)}</strong>". It now counts toward the campaign's progress.</p>`)
}

export function eventRegistrationEmail(title: string, when: string, where: string, waitlisted: boolean) {
  return wrap(`
    <h2>${waitlisted ? 'You are on the waitlist' : 'You are registered'}</h2>
    <p><strong>${escapeHtml(title)}</strong><br/>${escapeHtml(when)}<br/>${escapeHtml(where)}</p>
    ${waitlisted ? '<p>The event is full. We will email you if a place opens up.</p>' : ''}`)
}
