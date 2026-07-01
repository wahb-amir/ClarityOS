const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

const BASE_STYLES = `
  body { margin: 0; padding: 0; background: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0F172A; }
  .wrapper { max-width: 580px; margin: 48px auto; padding: 0 16px; }
  .card { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 40px 36px; }
  .logo { font-size: 18px; font-weight: 700; color: #2563EB; letter-spacing: -0.03em; margin-bottom: 32px; }
  h1 { font-size: 22px; font-weight: 700; margin: 0 0 12px; letter-spacing: -0.02em; color: #0F172A; }
  p { font-size: 15px; line-height: 1.7; color: #475569; margin: 0 0 20px; }
  .btn { display: inline-block; padding: 13px 28px; background: #2563EB; color: #FFFFFF !important; border-radius: 9px; font-size: 14px; font-weight: 600; text-decoration: none; letter-spacing: -0.01em; }
  .divider { border: none; border-top: 1px solid #E2E8F0; margin: 28px 0; }
  .link-text { font-size: 12px; color: #94A3B8; word-break: break-all; }
  .meta-row { display: flex; gap: 8px; margin-bottom: 8px; font-size: 14px; }
  .meta-label { font-weight: 600; color: #334155; min-width: 80px; }
  .meta-value { color: #64748B; }
  .info-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px 18px; margin: 20px 0; }
  .footer { margin-top: 28px; font-size: 12px; color: #94A3B8; text-align: center; line-height: 1.6; }
`

/* ─── Verification Email ─────────────────────────────────── */

export function verificationEmailHtml(name: string, token: string): string {
  const verifyUrl = `${APP_URL}/verify-email?token=${encodeURIComponent(token)}`
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your email — ClarityOS</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="logo">ClarityOS</div>
      <h1>Verify your email address</h1>
      <p>Hi ${name}, welcome to ClarityOS. Click the button below to verify your email and activate your account.</p>
      <a href="${verifyUrl}" class="btn">Verify Email Address</a>
      <hr class="divider" />
      <p class="link-text">Or paste this link in your browser:<br />${verifyUrl}</p>
    </div>
    <div class="footer">
      This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.<br />
      © ${new Date().getFullYear()} ClarityOS
    </div>
  </div>
</body>
</html>`
}

export function verificationEmailText(name: string, token: string): string {
  const verifyUrl = `${APP_URL}/verify-email?token=${encodeURIComponent(token)}`
  return `Hi ${name},\n\nVerify your ClarityOS account by visiting:\n${verifyUrl}\n\nThis link expires in 24 hours.\n\nIf you didn't create an account, ignore this email.`
}

/* ─── Quote Notification Email (to Dev) ────────────────────── */

export function quoteRequestEmailHtml(
  clientName: string,
  clientEmail: string,
  quoteTitle: string,
  description: string,
  budget: string | undefined,
  timeline: string | undefined,
  quoteId: string
): string {
  const reviewUrl = `${APP_URL}/admin?tab=quotes&quoteId=${quoteId}`
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Quote Request — ClarityOS</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="logo">ClarityOS</div>
      <h1>New Quote Request</h1>
      <p>You have received a new quote request from a client. Review the details below and reply or convert it into a project.</p>
      <div class="info-box">
        <div class="meta-row"><span class="meta-label">Client</span><span class="meta-value">${clientName} &lt;${clientEmail}&gt;</span></div>
        <div class="meta-row"><span class="meta-label">Title</span><span class="meta-value">${quoteTitle}</span></div>
        ${budget ? `<div class="meta-row"><span class="meta-label">Budget</span><span class="meta-value">${budget}</span></div>` : ''}
        ${timeline ? `<div class="meta-row"><span class="meta-label">Timeline</span><span class="meta-value">${timeline}</span></div>` : ''}
      </div>
      <p><strong>Description:</strong><br />${description.replace(/\n/g, '<br />')}</p>
      <a href="${reviewUrl}" class="btn">Review Quote</a>
      <hr class="divider" />
      <p class="link-text">Or open: ${reviewUrl}</p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} ClarityOS — You are receiving this because you are the developer on this account.
    </div>
  </div>
</body>
</html>`
}

export function quoteRequestEmailText(
  clientName: string,
  clientEmail: string,
  quoteTitle: string,
  description: string,
  budget: string | undefined,
  timeline: string | undefined,
  quoteId: string
): string {
  const reviewUrl = `${APP_URL}/admin?tab=quotes&quoteId=${quoteId}`
  return [
    `New Quote Request — ClarityOS`,
    ``,
    `Client: ${clientName} <${clientEmail}>`,
    `Title: ${quoteTitle}`,
    budget  ? `Budget: ${budget}` : null,
    timeline ? `Timeline: ${timeline}` : null,
    ``,
    `Description:\n${description}`,
    ``,
    `Review at: ${reviewUrl}`,
  ].filter(Boolean).join('\n')
}

/* ─── Dev Reply to Client ───────────────────────────────── */

export function quoteReplyEmailHtml(clientName: string, quoteTitle: string, devReply: string, quoteId: string): string {
  const quoteUrl = `${APP_URL}/dashboard?tab=quotes&quoteId=${quoteId}`
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Quote Update — ClarityOS</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="logo">ClarityOS</div>
      <h1>Response to Your Quote</h1>
      <p>Hi ${clientName}, the developer has responded to your quote request <strong>"${quoteTitle}"</strong>.</p>
      <div class="info-box">
        <p style="margin:0; color:#334155;">${devReply.replace(/\n/g, '<br />')}</p>
      </div>
      <a href="${quoteUrl}" class="btn">View Quote</a>
    </div>
    <div class="footer">© ${new Date().getFullYear()} ClarityOS</div>
  </div>
</body>
</html>`
}

export function quoteReplyEmailText(clientName: string, quoteTitle: string, devReply: string, quoteId: string): string {
  const quoteUrl = `${APP_URL}/dashboard?tab=quotes&quoteId=${quoteId}`
  return `Hi ${clientName},\n\nThe developer has replied to your quote "${quoteTitle}":\n\n${devReply}\n\nView your quote: ${quoteUrl}`
}

/* ─── Project Invite Email (to Client) ─────────────────── */

export function projectInviteEmailHtml(
  clientName: string,
  projectName: string,
  rawToken: string,
  targetEmail: string
): string {
  const inviteUrl = `${APP_URL}/invite?token=${encodeURIComponent(rawToken)}`
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Project Invitation — ClarityOS</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="logo">ClarityOS</div>
      <h1>You've been invited to a project</h1>
      <p>Hi ${clientName || 'there'}, you've been invited to collaborate on the project <strong>"${projectName}"</strong>. Click the button below to accept the invitation and gain access to your project dashboard.</p>
      <div class="info-box">
        <p style="margin:0;font-size:13px;color:#64748B;">🔒 This invitation is exclusively bound to <strong>${targetEmail}</strong>. It cannot be used by another account.</p>
      </div>
      <a href="${inviteUrl}" class="btn">Accept Invitation</a>
      <hr class="divider" />
      <p class="link-text">Or paste this link:<br />${inviteUrl}</p>
    </div>
    <div class="footer">
      This link expires in 7 days. If you did not expect this invitation, you can safely ignore this email.<br />
      © ${new Date().getFullYear()} ClarityOS
    </div>
  </div>
</body>
</html>`
}

export function projectInviteEmailText(
  clientName: string,
  projectName: string,
  rawToken: string,
  targetEmail: string
): string {
  const inviteUrl = `${APP_URL}/invite?token=${encodeURIComponent(rawToken)}`
  return `Hi ${clientName || 'there'},\n\nYou've been invited to the project "${projectName}".\n\nAccept your invitation:\n${inviteUrl}\n\nThis link is exclusively bound to ${targetEmail} and expires in 7 days.\n\nIf you did not expect this, ignore this email.`
}

/* ─── Blocker Notification Email (to Client) ─────────────────── */

const BLOCKER_TYPE_LABELS: Record<string, string> = {
  client_action_required: 'Action Required from You',
  technical_issue:        'Technical Issue',
  external_dependency:    'External Dependency',
  payment_blocker:        'Payment Blocker',
}

export function blockerNotificationEmailHtml(
  clientName: string,
  projectName: string,
  blockerTitle: string,
  explanation: string,
  type: string,
  projectId: string
): string {
  const projectUrl = `${APP_URL}/project/${projectId}`
  const typeLabel = BLOCKER_TYPE_LABELS[type] ?? 'Blocker'
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Blocker — ClarityOS</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="logo">ClarityOS</div>
      <h1>A blocker was logged on "${projectName}"</h1>
      <p>Hi ${clientName || 'there'}, the dev team has flagged something that's currently blocking progress on your project.</p>
      <div class="info-box">
        <div class="meta-row"><span class="meta-label">Type</span><span class="meta-value">${typeLabel}</span></div>
        <div class="meta-row"><span class="meta-label">Title</span><span class="meta-value">${blockerTitle}</span></div>
      </div>
      <p>${explanation.replace(/\n/g, '<br />')}</p>
      <a href="${projectUrl}" class="btn">View Project</a>
      <hr class="divider" />
      <p class="link-text">Or open: ${projectUrl}</p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} ClarityOS — You are receiving this because you are the client on this project.
    </div>
  </div>
</body>
</html>`
}

export function blockerNotificationEmailText(
  clientName: string,
  projectName: string,
  blockerTitle: string,
  explanation: string,
  type: string,
  projectId: string
): string {
  const projectUrl = `${APP_URL}/project/${projectId}`
  const typeLabel = BLOCKER_TYPE_LABELS[type] ?? 'Blocker'
  return `Hi ${clientName || 'there'},\n\nA blocker was logged on your project "${projectName}":\n\nType: ${typeLabel}\nTitle: ${blockerTitle}\n\n${explanation}\n\nView your project: ${projectUrl}`
}
