const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

export function verificationEmailHtml(name: string, token: string): string {
  const verifyUrl = `${APP_URL}/verify-email?token=${encodeURIComponent(token)}`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your email — ClarityOS</title>
  <style>
    body { margin: 0; padding: 0; background: #F8F9FC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #18181B; }
    .wrapper { max-width: 560px; margin: 48px auto; padding: 0 16px; }
    .card { background: #FFFFFF; border: 1px solid #E4E4E7; border-radius: 12px; padding: 40px 36px; }
    .logo { font-size: 18px; font-weight: 700; color: #4F46E5; letter-spacing: -0.02em; margin-bottom: 32px; }
    h1 { font-size: 22px; font-weight: 600; margin: 0 0 12px; letter-spacing: -0.02em; color: #18181B; }
    p { font-size: 15px; line-height: 1.6; color: #52525B; margin: 0 0 24px; }
    .btn { display: inline-block; padding: 12px 24px; background: #4F46E5; color: #FFFFFF !important; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none; letter-spacing: -0.01em; }
    .divider { border: none; border-top: 1px solid #E4E4E7; margin: 28px 0; }
    .link-text { font-size: 13px; color: #A1A1AA; word-break: break-all; }
    .footer { margin-top: 28px; font-size: 12px; color: #A1A1AA; text-align: center; line-height: 1.5; }
  </style>
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
