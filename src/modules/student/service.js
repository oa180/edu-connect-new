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
