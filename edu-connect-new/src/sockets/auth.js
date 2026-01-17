const jwt = require('jsonwebtoken')
const config = require('../config/index.js')

function authenticateSocket(socket, next) {
  try {
    const auth = socket.handshake && socket.handshake.auth
    const token = auth && auth.token
    if (!token) return next(new Error('Unauthorized'))
    const payload = jwt.verify(token, config.jwt.accessSecret)
    socket.user = { id: parseInt(payload.sub, 10), role: payload.role }
    next()
  } catch (e) { next(new Error('Unauthorized')) }
}

module.exports = { authenticateSocket }
