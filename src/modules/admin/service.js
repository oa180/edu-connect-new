const bcrypt = require('bcryptjs')
const db = require('../../db.js')

async function createUser({ email, password, role, name }) {
  const hash = await bcrypt.hash(password, 10)
  await db.query('INSERT INTO `User` (email, password, role, name, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())', [email, hash, role, name || null])
  const rows = await db.query('SELECT id, email, name, role, createdAt, updatedAt FROM `User` WHERE email = ? LIMIT 1', [email])
  return rows[0]
}

async function updateUser(id, { email, password, role, name }) {
  const fields = []
  const params = []
  if (email) { fields.push('email = ?'); params.push(email) }
  if (password) { fields.push('password = ?'); params.push(await bcrypt.hash(password, 10)) }
  if (role) { fields.push('role = ?'); params.push(role) }
  if (typeof name !== 'undefined') { fields.push('name = ?'); params.push(name) }
  if (!fields.length) {
    const rows = await db.query('SELECT id, email, name, role, createdAt, updatedAt FROM `User` WHERE id = ? LIMIT 1', [id])
    return rows[0]
  }
  params.push(id)
  await db.query(`UPDATE \`User\` SET ${fields.join(', ')} WHERE id = ?`, params)
  const rows = await db.query('SELECT id, email, name, role, createdAt, updatedAt FROM `User` WHERE id = ? LIMIT 1', [id])
  return rows[0]
}

async function deleteUser(id) {
  await db.query('DELETE FROM `User` WHERE id = ?', [id])
}

async function assignStudent(teacherId, studentId) {
  const tRows = await db.query('SELECT id, role FROM `User` WHERE id = ? LIMIT 1', [teacherId])
  const sRows = await db.query('SELECT id, role FROM `User` WHERE id = ? LIMIT 1', [studentId])
  const teacher = tRows[0]; const student = sRows[0]
  if (!teacher || teacher.role !== 'TEACHER') throw Object.assign(new Error('Invalid teacher'), { status: 400 })
  if (!student || student.role !== 'STUDENT') throw Object.assign(new Error('Invalid student'), { status: 400 })
  await db.query('INSERT IGNORE INTO TeacherStudent (teacherId, studentId) VALUES (?, ?)', [teacherId, studentId])
  return { teacherId, studentId }
}

async function createGroup(adminId, name) {
  await db.query('INSERT INTO ChatGroup (name, createdById) VALUES (?, ?)', [name, adminId])
  const rows = await db.query('SELECT id, name, createdById, createdAt FROM ChatGroup WHERE name = ? ORDER BY id DESC LIMIT 1', [name])
  return rows[0]
}

async function addGroupMembers(groupId, userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) return { id: groupId, members: [] }
  const values = userIds.map(() => '(?, ?)').join(',')
  const params = userIds.flatMap(uid => [groupId, uid])
  await db.query(`INSERT IGNORE INTO ChatGroupMember (groupId, userId) VALUES ${values}`, params)
  const members = await db.query('SELECT id, groupId, userId FROM ChatGroupMember WHERE groupId = ?', [groupId])
  return { id: groupId, members }
}

module.exports = { createUser, updateUser, deleteUser, assignStudent, createGroup, addGroupMembers }

// New admin features
async function getAllUsers() {
  return db.query('SELECT id, email, name, role, createdAt FROM `User` ORDER BY id DESC')
}

async function getAllGroups() {
  return db.query('SELECT g.id, g.name, g.adminOnly, g.createdById, g.createdAt, (SELECT COUNT(*) FROM ChatGroupMember m WHERE m.groupId = g.id) AS memberCount FROM ChatGroup g ORDER BY g.id DESC')
}

async function deleteGroup(groupId) {
  await db.query('DELETE FROM ChatGroup WHERE id = ?', [groupId])
}

async function removeGroupMember(groupId, userId) {
  await db.query('DELETE FROM ChatGroupMember WHERE groupId = ? AND userId = ?', [groupId, userId])
}

async function updateGroupSettings(groupId, { adminOnly }) {
  await db.query('UPDATE ChatGroup SET adminOnly = ? WHERE id = ?', [adminOnly ? 1 : 0, groupId])
  const rows = await db.query('SELECT id, name, adminOnly, createdById, createdAt FROM ChatGroup WHERE id = ? LIMIT 1', [groupId])
  return rows[0]
}

async function updateMemberPosting(groupId, userId, { canPost }) {
  await db.query('UPDATE ChatGroupMember SET canPost = ? WHERE groupId = ? AND userId = ?', [canPost ? 1 : 0, groupId, userId])
  const rows = await db.query('SELECT id, groupId, userId, canPost FROM ChatGroupMember WHERE groupId = ? AND userId = ? LIMIT 1', [groupId, userId])
  return rows[0]
}

async function pinMessage(groupId, messageId, pinnedById) {
  // Validate message belongs to group
  const rows = await db.query('SELECT id, groupId FROM GroupMessage WHERE id = ? LIMIT 1', [messageId])
  const msg = rows[0]
  if (!msg || msg.groupId !== groupId) throw Object.assign(new Error('Not found'), { status: 404 })
  await db.query('UPDATE GroupMessage SET isPinned = 1, pinnedById = ?, pinnedAt = NOW() WHERE id = ?', [pinnedById, messageId])
  const out = await db.query('SELECT id, groupId, senderId, content, createdAt, isPinned, pinnedById, pinnedAt FROM GroupMessage WHERE id = ? LIMIT 1', [messageId])
  return out[0]
}

async function unpinMessage(groupId, messageId) {
  const rows = await db.query('SELECT id, groupId FROM GroupMessage WHERE id = ? LIMIT 1', [messageId])
  const msg = rows[0]
  if (!msg || msg.groupId !== groupId) throw Object.assign(new Error('Not found'), { status: 404 })
  await db.query('UPDATE GroupMessage SET isPinned = 0, pinnedById = NULL, pinnedAt = NULL WHERE id = ?', [messageId])
  const out = await db.query('SELECT id, groupId, senderId, content, createdAt, isPinned, pinnedById, pinnedAt FROM GroupMessage WHERE id = ? LIMIT 1', [messageId])
  return out[0]
}

module.exports.getAllUsers = getAllUsers
module.exports.getAllGroups = getAllGroups
module.exports.deleteGroup = deleteGroup
module.exports.removeGroupMember = removeGroupMember
module.exports.updateGroupSettings = updateGroupSettings
module.exports.updateMemberPosting = updateMemberPosting
module.exports.pinMessage = pinMessage
module.exports.unpinMessage = unpinMessage
