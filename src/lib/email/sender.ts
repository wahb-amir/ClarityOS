import nodemailer from 'nodemailer'

let _transporter: nodemailer.Transporter | null = null

export function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter

  _transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: Infinity,
  })

  return _transporter
}

export async function sendMail(options: {
  to: string
  subject: string
  html: string
  text?: string
}): Promise<void> {
  const transporter = getTransporter()
  await transporter.sendMail({
    from: `"ClarityOS" <${process.env.GMAIL_USER}>`,
    to:   options.to,
    subject: options.subject,
    html:    options.html,
    text:    options.text,
  })
}
