const bcrypt = require('bcryptjs')
const db = require('../../db.js')

async function createUser({ email, password, role }) {
  const hash = await bcrypt.hash(password, 10)
  await db.query('INSERT INTO `User` (email, password, role) VALUES (?, ?, ?)', [email, hash, role])
  const rows = await db.query('SELECT id, email, role, createdAt, updatedAt FROM `User` WHERE email = ? LIMIT 1', [email])
  return rows[0]
}

async function updateUser(id, { email, password, role }) {
  const fields = []
  const params = []
  if (email) { fields.push('email = ?'); params.push(email) }
  if (password) { fields.push('password = ?'); params.push(await bcrypt.hash(password, 10)) }
  if (role) { fields.push('role = ?'); params.push(role) }
  if (!fields.length) {
    const rows = await db.query('SELECT id, email, role, createdAt, updatedAt FROM `User` WHERE id = ? LIMIT 1', [id])
    return rows[0]
  }
  params.push(id)
  await db.query(`UPDATE \`User\` SET ${fields.join(', ')} WHERE id = ?`, params)
  const rows = await db.query('SELECT id, email, role, createdAt, updatedAt FROM `User` WHERE id = ? LIMIT 1', [id])
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
