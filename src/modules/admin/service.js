// const bcrypt = require('bcryptjs')
const db = require('../../db.js')

async function createUser({ email, password, role, name, phoneNumber, grade, major }) {
  // const hash = await bcrypt.hash(password, 10)
  await db.query(
    'INSERT INTO `User` (email, password, role, name, phoneNumber, grade, major, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
    [email, /*hash*/ password, role, name || null, phoneNumber || null, grade || null, major || null]
  )
  const rows = await db.query('SELECT id, email, name, phoneNumber, grade, major, role, createdAt, updatedAt FROM `User` WHERE email = ? LIMIT 1', [email])
  return rows[0]
}

async function updateUser(id, { email, password, role, name, phoneNumber, grade, major }) {
  const fields = []
  const params = []
  if (email) { fields.push('email = ?'); params.push(email) }
  // if (password) { fields.push('password = ?'); params.push(await bcrypt.hash(password, 10)) }
  if (password) { fields.push('password = ?'); params.push(password) }
  if (role) { fields.push('role = ?'); params.push(role) }
  if (typeof name !== 'undefined') { fields.push('name = ?'); params.push(name) }
  if (typeof phoneNumber !== 'undefined') { fields.push('phoneNumber = ?'); params.push(phoneNumber) }
  if (typeof grade !== 'undefined') { fields.push('grade = ?'); params.push(grade) }
  if (typeof major !== 'undefined') { fields.push('major = ?'); params.push(major) }
  if (!fields.length) {
    const rows = await db.query('SELECT id, email, name, phoneNumber, grade, major, role, createdAt, updatedAt FROM `User` WHERE id = ? LIMIT 1', [id])
    return rows[0]
  }
  params.push(id)
  await db.query(`UPDATE \`User\` SET ${fields.join(', ')} WHERE id = ?`, params)
  const rows = await db.query('SELECT id, email, name, phoneNumber, grade, major, role, createdAt, updatedAt FROM `User` WHERE id = ? LIMIT 1', [id])
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

async function createGroup(adminId, name, { admins_ids = [], students_ids = [], teachers_ids = [] } = {}) {
  await db.query('INSERT INTO ChatGroup (name, createdById) VALUES (?, ?)', [name, adminId])
  const rows = await db.query('SELECT id, name, createdById, createdAt FROM ChatGroup WHERE name = ? ORDER BY id DESC LIMIT 1', [name])
  const group = rows[0]
  if (!group) return null
  // Validate roles for provided IDs
  const uniqueAdmins = Array.from(new Set((admins_ids || []).map(x => parseInt(x, 10)).filter(x => !Number.isNaN(x))))
  const uniqueStudents = Array.from(new Set((students_ids || []).map(x => parseInt(x, 10)).filter(x => !Number.isNaN(x))))
  const uniqueTeachers = Array.from(new Set((teachers_ids || []).map(x => parseInt(x, 10)).filter(x => !Number.isNaN(x))))

  const invalid = { admins_invalid: [], students_invalid: [], teachers_invalid: [] }

  if (uniqueAdmins.length) {
    const placeholders = uniqueAdmins.map(() => '?').join(',')
    const rows = await db.query(`SELECT id, role FROM \`User\` WHERE id IN (${placeholders})`, uniqueAdmins)
    const roleMap = new Map(rows.map(r => [r.id, r.role]))
    uniqueAdmins.forEach(id => { const r = roleMap.get(id); if (!r || !['ADMIN','SUPER_ADMIN','MANAGER'].includes(r)) invalid.admins_invalid.push(id) })
  }
  if (uniqueStudents.length) {
    const placeholders = uniqueStudents.map(() => '?').join(',')
    const rows = await db.query(`SELECT id, role FROM \`User\` WHERE id IN (${placeholders})`, uniqueStudents)
    const roleMap = new Map(rows.map(r => [r.id, r.role]))
    uniqueStudents.forEach(id => { const r = roleMap.get(id); if (!r || r !== 'STUDENT') invalid.students_invalid.push(id) })
  }
  if (uniqueTeachers.length) {
    const placeholders = uniqueTeachers.map(() => '?').join(',')
    const rows = await db.query(`SELECT id, role FROM \`User\` WHERE id IN (${placeholders})`, uniqueTeachers)
    const roleMap = new Map(rows.map(r => [r.id, r.role]))
    uniqueTeachers.forEach(id => { const r = roleMap.get(id); if (!r || r !== 'TEACHER') invalid.teachers_invalid.push(id) })
  }

  if (invalid.admins_invalid.length || invalid.students_invalid.length || invalid.teachers_invalid.length) {
    const err = Object.assign(new Error('Invalid member roles for group creation'), { status: 400 })
    err.details = invalid
    throw err
  }

  // Combine unique member IDs from all provided arrays
  const allIds = new Set()
  ;[...uniqueAdmins, ...uniqueStudents, ...uniqueTeachers].forEach(id => {
    const num = parseInt(id, 10)
    if (!Number.isNaN(num)) allIds.add(num)
  })
  // Ensure creator is included as admin/member
  if (!allIds.has(adminId)) allIds.add(adminId)
  if (allIds.size > 0) {
    const ids = Array.from(allIds)
    const values = ids.map(() => '(?, ?)').join(',')
    const params = ids.flatMap(uid => [group.id, uid])
    await db.query(`INSERT IGNORE INTO ChatGroupMember (groupId, userId) VALUES ${values}`, params)
  }
  const members = await db.query('SELECT id, groupId, userId FROM ChatGroupMember WHERE groupId = ?', [group.id])
  return { ...group, members }
}

async function addGroupMembers(groupId, { admins_ids = [], students_ids = [], teachers_ids = [] } = {}) {
  // Validate roles similar to createGroup
  const uniqueAdmins = Array.from(new Set((admins_ids || []).map(x => parseInt(x, 10)).filter(x => !Number.isNaN(x))))
  const uniqueStudents = Array.from(new Set((students_ids || []).map(x => parseInt(x, 10)).filter(x => !Number.isNaN(x))))
  const uniqueTeachers = Array.from(new Set((teachers_ids || []).map(x => parseInt(x, 10)).filter(x => !Number.isNaN(x))))

  const invalid = { admins_invalid: [], students_invalid: [], teachers_invalid: [] }

  if (uniqueAdmins.length) {
    const placeholders = uniqueAdmins.map(() => '?').join(',')
    const rows = await db.query(`SELECT id, role FROM \`User\` WHERE id IN (${placeholders})`, uniqueAdmins)
    const roleMap = new Map(rows.map(r => [r.id, r.role]))
    uniqueAdmins.forEach(id => { const r = roleMap.get(id); if (!r || !['ADMIN','SUPER_ADMIN','MANAGER'].includes(r)) invalid.admins_invalid.push(id) })
  }
  if (uniqueStudents.length) {
    const placeholders = uniqueStudents.map(() => '?').join(',')
    const rows = await db.query(`SELECT id, role FROM \`User\` WHERE id IN (${placeholders})`, uniqueStudents)
    const roleMap = new Map(rows.map(r => [r.id, r.role]))
    uniqueStudents.forEach(id => { const r = roleMap.get(id); if (!r || r !== 'STUDENT') invalid.students_invalid.push(id) })
  }
  if (uniqueTeachers.length) {
    const placeholders = uniqueTeachers.map(() => '?').join(',')
    const rows = await db.query(`SELECT id, role FROM \`User\` WHERE id IN (${placeholders})`, uniqueTeachers)
    const roleMap = new Map(rows.map(r => [r.id, r.role]))
    uniqueTeachers.forEach(id => { const r = roleMap.get(id); if (!r || r !== 'TEACHER') invalid.teachers_invalid.push(id) })
  }

  if (invalid.admins_invalid.length || invalid.students_invalid.length || invalid.teachers_invalid.length) {
    const err = Object.assign(new Error('Invalid member roles for adding to group'), { status: 400 })
    err.details = invalid
    throw err
  }

  const allIds = [...new Set([...uniqueAdmins, ...uniqueStudents, ...uniqueTeachers])]
  if (allIds.length === 0) return { id: groupId, members: await db.query('SELECT id, groupId, userId FROM ChatGroupMember WHERE groupId = ?', [groupId]) }

  const values = allIds.map(() => '(?, ?)').join(',')
  const params = allIds.flatMap(uid => [groupId, uid])
  await db.query(`INSERT IGNORE INTO ChatGroupMember (groupId, userId) VALUES ${values}`, params)
  const members = await db.query('SELECT id, groupId, userId FROM ChatGroupMember WHERE groupId = ?', [groupId])
  return { id: groupId, members }
}

module.exports = { createUser, updateUser, deleteUser, assignStudent, createGroup, addGroupMembers }

// New admin features
async function getAllUsers() {
  return db.query('SELECT id, email, name, phoneNumber, password, grade, major, role, createdAt FROM `User` ORDER BY id DESC')
}

async function getUserById(id) {
  const rows = await db.query('SELECT id, email, name, phoneNumber, password, grade, major, role, createdAt FROM `User` WHERE id = ? LIMIT 1', [id])
  return rows[0] || null
}

async function getAllGroups() {
  const groups = await db.query('SELECT g.id, g.name, g.adminOnly, g.createdById, g.createdAt FROM ChatGroup g ORDER BY g.id DESC')
  if (groups.length === 0) return []
  const ids = groups.map(g => g.id)
  const placeholders = ids.map(() => '?').join(',')
  const members = await db.query(
    `SELECT m.groupId, u.id as userId, u.email, u.name, u.phoneNumber, u.grade, u.major, u.role
     FROM ChatGroupMember m JOIN \`User\` u ON u.id = m.userId
     WHERE m.groupId IN (${placeholders})`, ids)
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

async function deleteGroup(groupId) {
  await db.query('DELETE FROM ChatGroup WHERE id = ?', [groupId])
}

async function getGroupById(groupId) {
  const rows = await db.query('SELECT id, name, adminOnly, createdById, createdAt FROM ChatGroup WHERE id = ? LIMIT 1', [groupId])
  const group = rows[0]
  if (!group) return null
  const members = await db.query(
    'SELECT u.id as userId, u.email, u.name, u.phoneNumber, u.grade, u.major, u.role FROM ChatGroupMember m JOIN `User` u ON u.id = m.userId WHERE m.groupId = ?',
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

async function updateGroup(groupId, { name, admins_ids = [], students_ids = [], teachers_ids = [] } = {}) {
  // Update group name
  await db.query('UPDATE ChatGroup SET name = ? WHERE id = ?', [name, groupId])
  // Validate roles for provided IDs
  const uniqueAdmins = Array.from(new Set((admins_ids || []).map(x => parseInt(x, 10)).filter(x => !Number.isNaN(x))))
  const uniqueStudents = Array.from(new Set((students_ids || []).map(x => parseInt(x, 10)).filter(x => !Number.isNaN(x))))
  const uniqueTeachers = Array.from(new Set((teachers_ids || []).map(x => parseInt(x, 10)).filter(x => !Number.isNaN(x))))

  const invalid = { admins_invalid: [], students_invalid: [], teachers_invalid: [] }

  if (uniqueAdmins.length) {
    const placeholders = uniqueAdmins.map(() => '?').join(',')
    const rows = await db.query(`SELECT id, role FROM \`User\` WHERE id IN (${placeholders})`, uniqueAdmins)
    const roleMap = new Map(rows.map(r => [r.id, r.role]))
    uniqueAdmins.forEach(id => { const r = roleMap.get(id); if (!r || !['ADMIN','SUPER_ADMIN','MANAGER'].includes(r)) invalid.admins_invalid.push(id) })
  }
  if (uniqueStudents.length) {
    const placeholders = uniqueStudents.map(() => '?').join(',')
    const rows = await db.query(`SELECT id, role FROM \`User\` WHERE id IN (${placeholders})`, uniqueStudents)
    const roleMap = new Map(rows.map(r => [r.id, r.role]))
    uniqueStudents.forEach(id => { const r = roleMap.get(id); if (!r || r !== 'STUDENT') invalid.students_invalid.push(id) })
  }
  if (uniqueTeachers.length) {
    const placeholders = uniqueTeachers.map(() => '?').join(',')
    const rows = await db.query(`SELECT id, role FROM \`User\` WHERE id IN (${placeholders})`, uniqueTeachers)
    const roleMap = new Map(rows.map(r => [r.id, r.role]))
    uniqueTeachers.forEach(id => { const r = roleMap.get(id); if (!r || r !== 'TEACHER') invalid.teachers_invalid.push(id) })
  }

  if (invalid.admins_invalid.length || invalid.students_invalid.length || invalid.teachers_invalid.length) {
    const err = Object.assign(new Error('Invalid member roles for update'), { status: 400 })
    err.details = invalid
    throw err
  }

  const desired = [...new Set([...uniqueAdmins, ...uniqueStudents, ...uniqueTeachers])]
  // Delete members not in desired set
  if (desired.length === 0) {
    await db.query('DELETE FROM ChatGroupMember WHERE groupId = ?', [groupId])
  } else {
    const placeholders = desired.map(() => '?').join(',')
    await db.query(`DELETE FROM ChatGroupMember WHERE groupId = ? AND userId NOT IN (${placeholders})`, [groupId, ...desired])
  }
  // Insert missing desired members
  if (desired.length) {
    const values = desired.map(() => '(?, ?)').join(',')
    const params = desired.flatMap(uid => [groupId, uid])
    await db.query(`INSERT IGNORE INTO ChatGroupMember (groupId, userId) VALUES ${values}`, params)
  }
  return getGroupById(groupId)
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

async function createPinnedMessage(groupId, content, adminId) {
  // Unpin any existing pinned messages for this group (single pin policy)
  await db.query('UPDATE GroupMessage SET isPinned = 0, pinnedById = NULL, pinnedAt = NULL WHERE groupId = ? AND isPinned = 1', [groupId])
  // Create a new pinned message authored by the admin
  await db.query('INSERT INTO GroupMessage (groupId, senderId, content, isPinned, pinnedById, pinnedAt) VALUES (?, ?, ?, 1, ?, NOW())', [groupId, adminId, content, adminId])
  const rows = await db.query('SELECT id, groupId, senderId, content, createdAt, isPinned, pinnedById, pinnedAt FROM GroupMessage WHERE groupId = ? AND isPinned = 1 ORDER BY pinnedAt DESC LIMIT 1', [groupId])
  return rows[0]
}

async function unpinGroupMessage(groupId, messageId) {
  const rows = await db.query('SELECT id, groupId, isPinned FROM GroupMessage WHERE id = ? AND groupId = ? LIMIT 1', [messageId, groupId])
  const msg = rows[0]
  if (!msg) throw Object.assign(new Error('Not found'), { status: 404 })
  if (!msg.isPinned) return
  await db.query('UPDATE GroupMessage SET isPinned = 0, pinnedById = NULL, pinnedAt = NULL WHERE id = ? AND groupId = ?', [messageId, groupId])
}

module.exports.getAllUsers = getAllUsers
module.exports.getUserById = getUserById
module.exports.getAllGroups = getAllGroups
module.exports.deleteGroup = deleteGroup
module.exports.getGroupById = getGroupById
module.exports.updateGroup = updateGroup
module.exports.removeGroupMember = removeGroupMember
module.exports.updateGroupSettings = updateGroupSettings
module.exports.updateMemberPosting = updateMemberPosting
module.exports.createPinnedMessage = createPinnedMessage
module.exports.unpinGroupMessage = unpinGroupMessage

// Attendance (Admin)
async function createAttendanceSession(adminId, { groupId, date }) {
  // normalize date to YYYY-MM-DD
  const sessionDate = date ? String(date).slice(0, 10) : null
  // ensure group exists
  const g = await db.query('SELECT id FROM ChatGroup WHERE id = ? LIMIT 1', [groupId])
  if (!g[0]) throw Object.assign(new Error('Group not found'), { status: 404 })
  // enforce one session per group per day (return existing if present)
  const existing = await db.query('SELECT id, groupId, date, createdById, createdAt FROM AttendanceSession WHERE groupId = ? AND date = ? LIMIT 1', [groupId, sessionDate || new Date().toISOString().slice(0,10)])
  if (existing[0]) return existing[0]
  await db.query('INSERT INTO AttendanceSession (groupId, date, createdById) VALUES (?, ?, ?)', [groupId, sessionDate || new Date().toISOString().slice(0,10), adminId])
  const rows = await db.query('SELECT id, groupId, date, createdById, createdAt FROM AttendanceSession WHERE groupId = ? AND date = ? ORDER BY id DESC LIMIT 1', [groupId, sessionDate || new Date().toISOString().slice(0,10)])
  return rows[0]
}

async function upsertAttendanceRecords(sessionId, records = [], takenById) {
  if (!Array.isArray(records) || records.length === 0) return { sessionId, updated: 0 }
  // find session and group
  const s = await db.query('SELECT id, groupId FROM AttendanceSession WHERE id = ? LIMIT 1', [sessionId])
  const session = s[0]
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 })
  // validate students: must be members of the group and STUDENT role
  const studentIds = [...new Set(records.map(r => parseInt(r.studentId, 10)).filter(v => Number.isInteger(v)))]
  if (studentIds.length === 0) return { sessionId, updated: 0 }
  const placeholders = studentIds.map(() => '?').join(',')
  const users = await db.query(`SELECT u.id, u.role FROM \`User\` u WHERE u.id IN (${placeholders})`, studentIds)
  const roleMap = new Map(users.map(u => [u.id, u.role]))
  const members = await db.query(`SELECT userId FROM ChatGroupMember WHERE groupId = ? AND userId IN (${placeholders})`, [session.groupId, ...studentIds])
  const memberSet = new Set(members.map(m => m.userId))
  const invalid = []
  studentIds.forEach(id => {
    const role = roleMap.get(id)
    if (!role || role !== 'STUDENT' || !memberSet.has(id)) invalid.push(id)
  })
  if (invalid.length) {
    const err = Object.assign(new Error('Some studentIds are invalid or not members of the group'), { status: 400 })
    err.details = { invalid }
    throw err
  }
  // upsert
  let count = 0
  for (const rec of records) {
    const status = String(rec.status || '').toUpperCase()
    const note = typeof rec.note === 'undefined' ? null : rec.note
    await db.query(
      'INSERT INTO AttendanceRecord (sessionId, studentId, status, note, takenById) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status = VALUES(status), note = VALUES(note), takenById = VALUES(takenById), takenAt = NOW()',
      [sessionId, rec.studentId, status, note, takenById]
    )
    count += 1
  }
  return { sessionId, updated: count }
}

async function updateAttendanceRecordAdmin(recordId, { status, note }) {
  const rows = await db.query('SELECT id FROM AttendanceRecord WHERE id = ? LIMIT 1', [recordId])
  if (!rows[0]) throw Object.assign(new Error('Record not found'), { status: 404 })
  const fields = []
  const params = []
  if (typeof status !== 'undefined') { fields.push('status = ?'); params.push(String(status).toUpperCase()) }
  if (typeof note !== 'undefined') { fields.push('note = ?'); params.push(note) }
  if (!fields.length) return rows[0]
  params.push(recordId)
  await db.query(`UPDATE AttendanceRecord SET ${fields.join(', ')} WHERE id = ?`, params)
  const r = await db.query('SELECT id, sessionId, studentId, status, note, takenAt, takenById FROM AttendanceRecord WHERE id = ? LIMIT 1', [recordId])
  return r[0]
}

async function listAttendanceSessionsAdmin({ groupId, dateFrom, dateTo }) {
  const clauses = []
  const params = []
  if (groupId) { clauses.push('groupId = ?'); params.push(groupId) }
  if (dateFrom) { clauses.push('date >= ?'); params.push(dateFrom) }
  if (dateTo) { clauses.push('date <= ?'); params.push(dateTo) }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  return db.query(`SELECT id, groupId, date, createdById, createdAt FROM AttendanceSession ${where} ORDER BY date DESC, id DESC`, params)
}

async function getAttendanceSessionAdmin(sessionId) {
  const s = await db.query('SELECT id, groupId, date, createdById, createdAt FROM AttendanceSession WHERE id = ? LIMIT 1', [sessionId])
  const session = s[0]
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 })
  const records = await db.query('SELECT id, sessionId, studentId, status, note, takenAt, takenById FROM AttendanceRecord WHERE sessionId = ? ORDER BY id ASC', [sessionId])
  return { ...session, records }
}

module.exports.createAttendanceSession = createAttendanceSession
module.exports.upsertAttendanceRecords = upsertAttendanceRecords
module.exports.updateAttendanceRecordAdmin = updateAttendanceRecordAdmin
module.exports.listAttendanceSessionsAdmin = listAttendanceSessionsAdmin
module.exports.getAttendanceSessionAdmin = getAttendanceSessionAdmin
