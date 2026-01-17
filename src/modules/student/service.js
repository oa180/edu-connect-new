const db = require('../../db.js')

async function getMyTeachers(studentId) {
  const rows = await db.query(
    'SELECT u.id, u.email FROM TeacherStudent ts JOIN `User` u ON u.id = ts.teacherId WHERE ts.studentId = ?',
    [studentId]
  )
  return rows.map(r => ({ id: r.id, email: r.email }))
}

module.exports = { getMyTeachers }
