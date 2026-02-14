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
     WHERE gm.groupId = ? AND gm.isPinnedOriginal = 0
     ORDER BY gm.createdAt DESC
     LIMIT ${safeLimit} OFFSET ${safeSkip}`,
    [groupId]
  )
  const totalRows = await db.query('SELECT COUNT(*) as cnt FROM GroupMessage WHERE groupId = ? AND gm.isPinnedOriginal = 0', [groupId])
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

async function listPinnedMessages(currentUser, { skip, limit }) {
  const safeLimit = Number.isInteger(limit) ? Math.min(Math.max(limit, 1), 100) : 20
  const safeSkip = Number.isInteger(skip) ? Math.max(skip, 0) : 0

  if (currentUser.role === 'ADMIN') {
    const items = await db.query(
      `SELECT gm.id, gm.groupId, gm.senderId, gm.content, gm.createdAt, gm.isPinned, gm.pinnedById, gm.pinnedAt, gm.isPinnedOriginal,
              su.id as senderUserId, su.name as senderName, su.role as senderRole,
              pu.id as pinnedByUserId, pu.name as pinnedByName, pu.role as pinnedByRole
       FROM GroupMessage gm
       JOIN \`User\` su ON su.id = gm.senderId
       LEFT JOIN \`User\` pu ON pu.id = gm.pinnedById
       WHERE gm.isPinned = 1
       ORDER BY gm.pinnedAt DESC, gm.id DESC
       LIMIT ${safeLimit} OFFSET ${safeSkip}`
    )
    const totalRows = await db.query('SELECT COUNT(*) as cnt FROM GroupMessage WHERE isPinned = 1')
    const total = totalRows[0]?.cnt || 0
    return {
      items: items.map(m => ({
        id: m.id,
        groupId: m.groupId,
        senderId: m.senderId,
        sender: { id: m.senderUserId, name: m.senderName, role: m.senderRole },
        content: m.content,
        createdAt: m.createdAt,
        isPinned: !!m.isPinned,
        isPinnedOriginal: !!m.isPinnedOriginal,
        pinnedAt: m.pinnedAt,
        pinnedById: m.pinnedById,
        pinnedBy: m.pinnedById ? { id: m.pinnedByUserId, name: m.pinnedByName, role: m.pinnedByRole } : null
      })),
      total
    }
  }

  // Teacher / Student: only pinned messages in groups they are a member of
  const items = await db.query(
    `SELECT gm.id, gm.groupId, gm.senderId, gm.content, gm.createdAt, gm.isPinned, gm.pinnedById, gm.pinnedAt, gm.isPinnedOriginal,
            su.id as senderUserId, su.name as senderName, su.role as senderRole,
            pu.id as pinnedByUserId, pu.name as pinnedByName, pu.role as pinnedByRole
     FROM GroupMessage gm
     JOIN ChatGroupMember m ON m.groupId = gm.groupId AND m.userId = ?
     JOIN \`User\` su ON su.id = gm.senderId
     LEFT JOIN \`User\` pu ON pu.id = gm.pinnedById
     WHERE gm.isPinned = 1
     ORDER BY gm.pinnedAt DESC, gm.id DESC
     LIMIT ${safeLimit} OFFSET ${safeSkip}`,
    [currentUser.id]
  )
  const totalRows = await db.query(
    `SELECT COUNT(*) as cnt
     FROM GroupMessage gm
     JOIN ChatGroupMember m ON m.groupId = gm.groupId AND m.userId = ?
     WHERE gm.isPinned = 1`,
    [currentUser.id]
  )
  const total = totalRows[0]?.cnt || 0
  return {
    items: items.map(m => ({
      id: m.id,
      groupId: m.groupId,
      senderId: m.senderId,
      sender: { id: m.senderUserId, name: m.senderName, role: m.senderRole },
      content: m.content,
      createdAt: m.createdAt,
      isPinned: !!m.isPinned,
      isPinnedOriginal: !!m.isPinnedOriginal,
      pinnedAt: m.pinnedAt,
      pinnedById: m.pinnedById,
      pinnedBy: m.pinnedById ? { id: m.pinnedByUserId, name: m.pinnedByName, role: m.pinnedByRole } : null
    })),
    total
  }
}

async function getPinnedMessageByGroupId(currentUser, groupId) {
  if (currentUser.role !== 'ADMIN') {
    const member = await db.query('SELECT 1 FROM ChatGroupMember WHERE groupId = ? AND userId = ? LIMIT 1', [groupId, currentUser.id])
    if (!member[0]) throw Object.assign(new Error('Forbidden'), { status: 403 })
  }
  const items = await db.query(
    `SELECT gm.id, gm.groupId, gm.senderId, gm.content, gm.createdAt, gm.isPinned, gm.pinnedById, gm.pinnedAt, gm.isPinnedOriginal,
            su.id as senderUserId, su.name as senderName, su.role as senderRole,
            pu.id as pinnedByUserId, pu.name as pinnedByName, pu.role as pinnedByRole
     FROM GroupMessage gm
     JOIN \`User\` su ON su.id = gm.senderId
     LEFT JOIN \`User\` pu ON pu.id = gm.pinnedById
     WHERE gm.groupId = ? AND gm.isPinned = 1
     ORDER BY gm.pinnedAt DESC, gm.id DESC`,
    [groupId]
  )
  return items.map(m => ({
    id: m.id,
    groupId: m.groupId,
    senderId: m.senderId,
    sender: { id: m.senderUserId, name: m.senderName, role: m.senderRole },
    content: m.content,
    createdAt: m.createdAt,
    isPinned: !!m.isPinned,
    isPinnedOriginal: !!m.isPinnedOriginal,
    pinnedAt: m.pinnedAt,
    pinnedById: m.pinnedById,
    pinnedBy: m.pinnedById ? { id: m.pinnedByUserId, name: m.pinnedByName, role: m.pinnedByRole } : null
  }))
}

module.exports = { getChatUsers, getPrivateMessages, getGroupMessages, listPinnedMessages, getPinnedMessageByGroupId }
