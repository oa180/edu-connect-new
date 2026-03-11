const nodemailer = require('nodemailer')
const config = require('../config/index.js')

let transporter = null

function getTransporter() {
  const { host, port, user, pass } = config.mail || {}
  if (!host || !port || !user || !pass) return null
  if (transporter) return transporter
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  })
  return transporter
}

async function sendMail({ to, cc, bcc, subject, text, html }) {
  const t = getTransporter()
  const from = (config.mail && (config.mail.from || config.mail.user)) || undefined
  if (!t || !from) {
    return { sent: false, skipped: true, reason: 'SMTP is not configured' }
  }
  console.log('log', { from, to, cc, bcc, subject, text, html })
  await t.sendMail({ from, to, cc, bcc, subject, text, html })
  return { sent: true }
}

module.exports = { sendMail }
