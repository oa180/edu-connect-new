const db = require('../../db.js')

async function getChatUsers(currentUser) {
  if (currentUser.role === 'ADMIN') {
    return db.query('SELECT id, email, name, role FROM `User` WHERE id <> ? ORDER BY id DESC', [currentUser.id])
  }
  if (currentUser.role === 'TEACHER') {
    return db.query(
      'SELECT u.id, u.email, u.name, u.role FROM TeacherStudent ts JOIN `User` u ON u.id = ts.studentId WHERE ts.teacherId = ? ORDER BY u.id DESC',
      [currentUser.id]
    )
  }
  // STUDENT
  return db.query(
    'SELECT u.id, u.email, u.name, u.role FROM TeacherStudent ts JOIN `User` u ON u.id = ts.teacherId WHERE ts.studentId = ? ORDER BY u.id DESC',
    [currentUser.id]
  )
}

async function getPrivateMessages(userId, otherId, { skip, limit }) {
  const rel = await db.query(
    'SELECT 1 FROM TeacherStudent WHERE (teacherId = ? AND studentId = ?) OR (teacherId = ? AND studentId = ?) LIMIT 1',
    [userId, otherId, otherId, userId]
  )
  if (!rel[0]) throw Object.assign(new Error('Forbidden'), { status: 403 })
  const items = await db.query(
    'SELECT id, senderId, receiverId, content, createdAt, isRead FROM Message WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?) ORDER BY createdAt DESC LIMIT ? OFFSET ?',
    [userId, otherId, otherId, userId, limit, skip]
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
  const items = await db.query(
    'SELECT id, groupId, senderId, content, createdAt FROM GroupMessage WHERE groupId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?',
    [groupId, limit, skip]
  )
  const totalRows = await db.query('SELECT COUNT(*) as cnt FROM GroupMessage WHERE groupId = ?', [groupId])
  const total = totalRows[0]?.cnt || 0
  return { items: items.reverse(), total }
}

module.exports = { getChatUsers, getPrivateMessages, getGroupMessages }
