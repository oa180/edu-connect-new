const jwt = require('jsonwebtoken')
const config = require('../config/index.js')
const db = require('../db.js')

async function authenticateSocket(socket, next) {
  try {
    const auth = socket.handshake && socket.handshake.auth
    const token = auth && auth.token
    if (!token) return next(new Error('Unauthorized'))
    const payload = jwt.verify(token, config.jwt.accessSecret)
    const id = parseInt(payload.sub, 10)
    const rows = await db.query('SELECT id, name, role FROM `User` WHERE id = ? LIMIT 1', [id])
    const user = rows[0]
    if (!user) return next(new Error('Unauthorized'))
    socket.user = { id: user.id, name: user.name, role: user.role }
    next()
  } catch (e) { next(new Error('Unauthorized')) }
}

module.exports = { authenticateSocket }
