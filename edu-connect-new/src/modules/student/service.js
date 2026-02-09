const db = require('../../db.js')

async function getMyTeachers(studentId) {
  const rows = await db.query(
    'SELECT u.id, u.email FROM TeacherStudent ts JOIN `User` u ON u.id = ts.teacherId WHERE ts.studentId = ?',
    [studentId]
  )
  return rows.map(r => ({ id: r.id, email: r.email }))
}

module.exports = { getMyTeachers }

async function listMyAttendance(studentId, { groupId, dateFrom, dateTo } = {}) {
  const clauses = ['ar.studentId = ?']
  const params = [studentId]
  if (groupId) { clauses.push('s.groupId = ?'); params.push(groupId) }
  if (dateFrom) { clauses.push('s.date >= ?'); params.push(dateFrom) }
  if (dateTo) { clauses.push('s.date <= ?'); params.push(dateTo) }
  const where = `WHERE ${clauses.join(' AND ')}`
  const q = `
    SELECT ar.id, ar.sessionId, s.groupId, s.date, ar.status, ar.note, ar.takenAt, ar.takenById
    FROM AttendanceRecord ar
    JOIN AttendanceSession s ON s.id = ar.sessionId
    ${where}
    ORDER BY s.date DESC, ar.id DESC
  `
  return db.query(q, params)
}

module.exports.listMyAttendance = listMyAttendance

async function getMyGroups(studentId) {
  const groups = await db.query(
    `SELECT g.id, g.name, g.adminOnly, g.createdById, g.createdAt
     FROM ChatGroup g
     JOIN ChatGroupMember m ON m.groupId = g.id
     WHERE m.userId = ?
     ORDER BY g.id DESC`,
    [studentId]
  )
  if (groups.length === 0) return []
  const ids = groups.map(g => g.id)
  const placeholders = ids.map(() => '?').join(',')
  const members = await db.query(
    `SELECT m.groupId, u.id as userId, u.email, u.name, u.phoneNumber, u.grade, u.major, u.role
     FROM ChatGroupMember m JOIN \`User\` u ON u.id = m.userId
     WHERE m.groupId IN (${placeholders})`,
    ids
  )
  const byGroup = new Map(groups.map(g => [g.id, { ...g, admins: [], teachers: [], students: [] }]))
  for (const row of members) {
    const entry = byGroup.get(row.groupId)
    if (!entry) continue
    const user = { id: row.userId, email: row.email, name: row.name, phoneNumber: row.phoneNumber, grade: row.grade, major: row.major, role: row.role }
    if (['ADMIN','SUPER_ADMIN','MANAGER'].includes(row.role)) entry.admins.push(user)
    else if (row.role === 'TEACHER') entry.teachers.push(user)
    else if (row.role === 'STUDENT') entry.students.push(user)
  }
  return Array.from(byGroup.values())
}

async function getMyGroupById(studentId, groupId) {
  // Verify student is a member
  const memberCheck = await db.query('SELECT 1 FROM ChatGroupMember WHERE groupId = ? AND userId = ? LIMIT 1', [groupId, studentId])
  if (!memberCheck[0]) throw Object.assign(new Error('Not a member of this group'), { status: 403 })
  const groupRows = await db.query('SELECT id, name, adminOnly, createdById, createdAt FROM ChatGroup WHERE id = ? LIMIT 1', [groupId])
  const group = groupRows[0]
  if (!group) throw Object.assign(new Error('Group not found'), { status: 404 })
  const members = await db.query(
    `SELECT u.id as userId, u.email, u.name, u.phoneNumber, u.grade, u.major, u.role
     FROM ChatGroupMember m
     JOIN \`User\` u ON u.id = m.userId
     WHERE m.groupId = ?`,
    [groupId]
  )
  const admins = []
  const teachers = []
  const students = []
  for (const u of members) {
    const user = { id: u.userId, email: u.email, name: u.name, phoneNumber: u.phoneNumber, grade: u.grade, major: u.major, role: u.role }
    if (['ADMIN','SUPER_ADMIN','MANAGER'].includes(u.role)) admins.push(user)
    else if (u.role === 'TEACHER') teachers.push(user)
    else if (u.role === 'STUDENT') students.push(user)
  }
  return { ...group, admins, teachers, students }
}

module.exports.getMyGroups = getMyGroups
module.exports.getMyGroupById = getMyGroupById
