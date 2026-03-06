const db = require('../db.js')
const { sendMail } = require('./mailer.js')

async function sendPinnedMessageEmailToGroupTeachersAndStudents({ groupId, content }) {
  const users = await db.query(
    `SELECT DISTINCT u.email
     FROM ChatGroupMember m
     JOIN \`User\` u ON u.id = m.userId
     WHERE m.groupId = ? AND u.role IN ('TEACHER', 'STUDENT') AND u.email IS NOT NULL AND u.email <> ''`,
    [groupId]
  )
  const emails = Array.from(new Set(users.map(r => r.email).filter(Boolean)))
  if (emails.length === 0) return { sent: false, skipped: true, reason: 'No teacher/student emails found' }

  const subject = 'New pinned message'
  const text = `A new message was pinned in your group:\n\n${content}`

  // Use BCC to avoid leaking recipients.
  return sendMail({ bcc: emails, subject, text })
}

module.exports = { sendPinnedMessageEmailToGroupTeachersAndStudents }
