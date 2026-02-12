const bcrypt = require('bcryptjs')
const { pool, query } = require('../src/db.js')
const config = require('../src/config/index.js')

async function ensureUser(email, password, role) {
  const rows = await query('SELECT id FROM `User` WHERE email = ? LIMIT 1', [email])
  if (rows[0]) return rows[0].id
  const hash = await bcrypt.hash(password, 10)
  await query('INSERT INTO `User` (email, password, role, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())', [email, hash, role])
  const created = await query('SELECT id FROM `User` WHERE email = ? LIMIT 1', [email])
  return created[0].id
}

async function main() {
  await query(`CREATE TABLE IF NOT EXISTS Banner (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    originalName VARCHAR(255) NULL,
    mimeType VARCHAR(64) NULL,
    size INT NULL,
    createdById INT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_banner_createdById (createdById)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)

  const email = config.admin.email
  const password = config.admin.password
  let adminId = null
  if (email && password) {
    adminId = await ensureUser(email, password, 'ADMIN')
    console.log('Ensured admin user:', email)
  } else {
    console.log('No ADMIN_EMAIL/ADMIN_PASSWORD provided; skipping admin creation')
  }
  const teacherId = await ensureUser('teacher1@example.com', 'Teacher123!', 'TEACHER')
  const studentId = await ensureUser('student1@example.com', 'Student123!', 'STUDENT')
  console.log('Ensured teacher and student sample users')

  await query('INSERT IGNORE INTO TeacherStudent (teacherId, studentId) VALUES (?, ?)', [teacherId, studentId])
  console.log('Ensured teacher-student assignment')

  const groupRows = await query('SELECT id FROM ChatGroup WHERE name = ? LIMIT 1', ['General'])
  let groupId = groupRows[0]?.id
  if (!groupId) {
    await query('INSERT INTO ChatGroup (name, createdById, createdAt) VALUES (?, ?, NOW())', ['General', adminId])
    const newRow = await query('SELECT id FROM ChatGroup WHERE name = ? ORDER BY id DESC LIMIT 1', ['General'])
    groupId = newRow[0].id
  }
  const inserts = []
  if (adminId) inserts.push(groupId, adminId)
  inserts.push(groupId, teacherId, groupId, studentId)
  const placeholders = adminId ? '(?, ?), (?, ?), (?, ?)' : '(?, ?), (?, ?)'
  await query(`INSERT IGNORE INTO ChatGroupMember (groupId, userId) VALUES ${placeholders}`, inserts)
  console.log('Ensured General group and members')
}

main().finally(async () => { try { await pool.end() } catch (e) {} })
