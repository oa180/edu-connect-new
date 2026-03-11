const db = require('../db.js')
const { sendMail } = require('./mailer.js')

async function sendPinnedMessageEmailToGroupTeachersAndStudents({ groupId, content }) {
  const groupName = await db.query(
    `SELECT name FROM ChatGroup WHERE id = ?`,
    [groupId]
  )

  const users = await db.query(
    `SELECT DISTINCT u.email
     FROM ChatGroupMember m
     JOIN \`User\` u ON u.id = m.userId
     WHERE m.groupId = ? AND u.role IN ('TEACHER', 'STUDENT') AND u.email IS NOT NULL AND u.email <> ''`,
    [groupId]
  )
  const emails = Array.from(new Set(users.map(r => r.email).filter(Boolean)))
  console.log('users', emails)
  if (emails.length === 0) return { sent: false, skipped: true, reason: 'No teacher/student emails found' }

  const subject = `New pinned message to your group ${groupName[0].name}`
  const text = `${content}`

  // Use BCC to avoid leaking recipients.
  return sendMail({ to: emails, subject, text })
}

module.exports = { sendPinnedMessageEmailToGroupTeachersAndStudents }
