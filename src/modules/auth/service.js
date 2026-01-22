// const bcrypt = require('bcryptjs')
const db = require('../../db.js')
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../utils/token.js')

async function login(email, password) {
  const users = await db.query('SELECT id, email, name, phoneNumber, grade, major, password, role FROM `User` WHERE email = ? LIMIT 1', [email])
  const user = users[0]
  if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 })
  // const ok = await bcrypt.compare(password, user.password)
  const ok = String(password) === String(user.password)
  if (!ok) throw Object.assign(new Error('Invalid credentials'), { status: 401 })
  const accessToken = signAccessToken(user)
  const refreshToken = signRefreshToken(user)
  const decoded = verifyRefreshToken(refreshToken)
  const expiresAt = new Date(decoded.exp * 1000)
  await db.query('INSERT INTO RefreshToken (userId, token, expiresAt) VALUES (?, ?, ?)', [user.id, refreshToken, expiresAt])
  return { accessToken, refreshToken, user: { id: user.id, email: user.email, name: user.name, phoneNumber: user.phoneNumber, grade: user.grade, major: user.major, role: user.role } }
}

async function refresh(token) {
  const decoded = verifyRefreshToken(token)
  const rows = await db.query('SELECT id, userId, revoked FROM RefreshToken WHERE token = ? LIMIT 1', [token])
  const stored = rows[0]
  if (!stored || stored.revoked) throw Object.assign(new Error('Invalid token'), { status: 401 })
  const userId = parseInt(decoded.sub, 10)
  const users = await db.query('SELECT id, email, name, phoneNumber, grade, major, role FROM `User` WHERE id = ? LIMIT 1', [userId])
  const user = users[0]
  if (!user) throw Object.assign(new Error('Invalid token'), { status: 401 })
  const accessToken = signAccessToken(user)
  return { accessToken }
}

async function logout(token) {
  const rows = await db.query('SELECT id, revoked FROM RefreshToken WHERE token = ? LIMIT 1', [token])
  const stored = rows[0]
  if (!stored) return
  if (stored.revoked) return
  await db.query('UPDATE RefreshToken SET revoked = 1 WHERE token = ?', [token])
}

module.exports = { login, refresh, logout }
