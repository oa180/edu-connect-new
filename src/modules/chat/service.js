const db = require('../../db.js')

async function getChatUsers(currentUser) {
  if (currentUser.role === 'ADMIN') {
    return db.query('SELECT id, email, name, phoneNumber, grade, major, role FROM `User` WHERE id <> ? ORDER BY id DESC', [currentUser.id])
  }
  if (currentUser.role === 'TEACHER') {
    return db.query(
      'SELECT u.id, u.email, u.name, u.phoneNumber, u.grade, u.major, u.role FROM TeacherStudent ts JOIN `User` u ON u.id = ts.studentId WHERE ts.teacherId = ? ORDER BY u.id DESC',
      [currentUser.id]
    )
  }
  // STUDENT
  return db.query(
    'SELECT u.id, u.email, u.name, u.phoneNumber, u.grade, u.major, u.role FROM TeacherStudent ts JOIN `User` u ON u.id = ts.teacherId WHERE ts.studentId = ? ORDER BY u.id DESC',
    [currentUser.id]
  )
}

async function getPrivateMessages(userId, otherId, { skip, limit }) {
  const rel = await db.query(
    'SELECT 1 FROM TeacherStudent WHERE (teacherId = ? AND studentId = ?) OR (teacherId = ? AND studentId = ?) LIMIT 1',
    [userId, otherId, otherId, userId]
  )
  if (!rel[0]) throw Object.assign(new Error('Forbidden'), { status: 403 })
  const safeLimit = Number.isInteger(limit) ? Math.min(Math.max(limit, 1), 100) : 20
  const safeSkip = Number.isInteger(skip) ? Math.max(skip, 0) : 0
  const items = await db.query(
    `SELECT id, senderId, receiverId, content, createdAt, isRead
     FROM Message
     WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)
     ORDER BY createdAt DESC
     LIMIT ${safeLimit} OFFSET ${safeSkip}`,
    [userId, otherId, otherId, userId]
  )
  const totalRows = await db.query(
    'SELECT COUNT(*) as cnt FROM Message WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)',
    [userId, otherId, otherId, userId]
  )
  const total = totalRows[0]?.cnt || 0
  return { items: items.reverse(), total }
}

async function getGroupMessages(userId, groupId, { skip, limit }) {
  const member = await db.query('SELECT 1 FROM ChatGroupMember WHERE groupId = ? AND userId = ? LIMIT 1', [groupId, userId])
  if (!member[0]) throw Object.assign(new Error('Forbidden'), { status: 403 })
  const safeLimit = Number.isInteger(limit) ? Math.min(Math.max(limit, 1), 100) : 20
  const safeSkip = Number.isInteger(skip) ? Math.max(skip, 0) : 0
  const items = await db.query(
    `SELECT gm.id, gm.groupId, gm.senderId, gm.content, gm.createdAt,
            u.id as senderUserId, u.name as senderName, u.role as senderRole
     FROM GroupMessage gm
     JOIN \`User\` u ON u.id = gm.senderId
     WHERE gm.groupId = ?
     ORDER BY gm.createdAt DESC
     LIMIT ${safeLimit} OFFSET ${safeSkip}`,
    [groupId]
  )
  const totalRows = await db.query('SELECT COUNT(*) as cnt FROM GroupMessage WHERE groupId = ?', [groupId])
  const total = totalRows[0]?.cnt || 0
  const shaped = items.reverse().map(m => ({
    id: m.id,
    groupId: m.groupId,
    senderId: m.senderId,
    sender: { id: m.senderUserId, name: m.senderName, role: m.senderRole },
    content: m.content,
    createdAt: m.createdAt
  }))
  return { items: shaped, total }
}

module.exports = { getChatUsers, getPrivateMessages, getGroupMessages }
