const db = require('../../db.js')

async function getMyStudents(teacherId) {
  const rows = await db.query(
    'SELECT u.id, u.email FROM TeacherStudent ts JOIN `User` u ON u.id = ts.studentId WHERE ts.teacherId = ?',
    [teacherId]
  )
  return rows.map(r => ({ id: r.id, email: r.email }))
}

async function assignStudent(teacherId, studentId) {
  const sRows = await db.query('SELECT id, role FROM `User` WHERE id = ? LIMIT 1', [studentId])
  const student = sRows[0]
  if (!student || student.role !== 'STUDENT') {
    throw Object.assign(new Error('Invalid student'), { status: 400 })
  }
  await db.query('INSERT IGNORE INTO TeacherStudent (teacherId, studentId) VALUES (?, ?)', [teacherId, studentId])
  return { teacherId, studentId }
}

module.exports = { getMyStudents, assignStudent }

// Attendance (Teacher)
async function ensureTeacherInGroup(teacherId, groupId) {
  // teacher must be TEACHER and member of the group
  const u = await db.query('SELECT id, role FROM `User` WHERE id = ? LIMIT 1', [teacherId])
  if (!u[0] || u[0].role !== 'TEACHER') throw Object.assign(new Error('Not a teacher'), { status: 403 })
  const m = await db.query('SELECT 1 FROM ChatGroupMember WHERE groupId = ? AND userId = ? LIMIT 1', [groupId, teacherId])
  if (!m[0]) throw Object.assign(new Error('Not a member of this group'), { status: 403 })
}

async function createAttendanceSession(teacherId, { groupId, date }) {
  await ensureTeacherInGroup(teacherId, groupId)
  const sessionDate = date ? String(date).slice(0, 10) : new Date().toISOString().slice(0,10)
  const existing = await db.query('SELECT id, groupId, date, createdById, createdAt FROM AttendanceSession WHERE groupId = ? AND date = ? LIMIT 1', [groupId, sessionDate])
  if (existing[0]) return existing[0]
  await db.query('INSERT INTO AttendanceSession (groupId, date, createdById) VALUES (?, ?, ?)', [groupId, sessionDate, teacherId])
  const rows = await db.query('SELECT id, groupId, date, createdById, createdAt FROM AttendanceSession WHERE groupId = ? AND date = ? ORDER BY id DESC LIMIT 1', [groupId, sessionDate])
  return rows[0]
}

async function upsertAttendanceRecords(sessionId, records = [], takenById) {
  if (!Array.isArray(records) || records.length === 0) return { sessionId, updated: 0 }
  const s = await db.query('SELECT id, groupId FROM AttendanceSession WHERE id = ? LIMIT 1', [sessionId])
  const session = s[0]
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 })
  await ensureTeacherInGroup(takenById, session.groupId)
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

async function updateAttendanceRecord(recordId, { status, note }, teacherId) {
  const r = await db.query('SELECT id, sessionId FROM AttendanceRecord WHERE id = ? LIMIT 1', [recordId])
  const rec = r[0]
  if (!rec) throw Object.assign(new Error('Record not found'), { status: 404 })
  const s = await db.query('SELECT id, groupId FROM AttendanceSession WHERE id = ? LIMIT 1', [rec.sessionId])
  const session = s[0]
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 })
  await ensureTeacherInGroup(teacherId, session.groupId)
  const fields = []
  const params = []
  if (typeof status !== 'undefined') { fields.push('status = ?'); params.push(String(status).toUpperCase()) }
  if (typeof note !== 'undefined') { fields.push('note = ?'); params.push(note) }
  if (!fields.length) return rec
  params.push(recordId)
  await db.query(`UPDATE AttendanceRecord SET ${fields.join(', ')} WHERE id = ?`, params)
  const out = await db.query('SELECT id, sessionId, studentId, status, note, takenAt, takenById FROM AttendanceRecord WHERE id = ? LIMIT 1', [recordId])
  return out[0]
}

async function listAttendanceSessions(teacherId, { groupId, dateFrom, dateTo }) {
  const clauses = ['groupId IN (SELECT groupId FROM ChatGroupMember WHERE userId = ?)']
  const params = [teacherId]
  if (groupId) { clauses.push('groupId = ?'); params.push(groupId) }
  if (dateFrom) { clauses.push('date >= ?'); params.push(dateFrom) }
  if (dateTo) { clauses.push('date <= ?'); params.push(dateTo) }
  const where = `WHERE ${clauses.join(' AND ')}`
  return db.query(`SELECT id, groupId, date, createdById, createdAt FROM AttendanceSession ${where} ORDER BY date DESC, id DESC`, params)
}

async function getAttendanceSession(teacherId, sessionId) {
  const s = await db.query('SELECT id, groupId, date, createdById, createdAt FROM AttendanceSession WHERE id = ? LIMIT 1', [sessionId])
  const session = s[0]
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 })
  await ensureTeacherInGroup(teacherId, session.groupId)
  const records = await db.query('SELECT id, sessionId, studentId, status, note, takenAt, takenById FROM AttendanceRecord WHERE sessionId = ? ORDER BY id ASC', [sessionId])
  return { ...session, records }
}

module.exports.createAttendanceSession = createAttendanceSession
module.exports.upsertAttendanceRecords = upsertAttendanceRecords
module.exports.updateAttendanceRecord = updateAttendanceRecord
module.exports.listAttendanceSessions = listAttendanceSessions
module.exports.getAttendanceSession = getAttendanceSession
