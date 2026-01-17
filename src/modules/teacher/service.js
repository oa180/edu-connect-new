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
