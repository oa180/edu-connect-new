const jwt = require('jsonwebtoken')
const config = require('../config/index.js')

function signAccessToken(user) {
  return jwt.sign({ role: user.role }, config.jwt.accessSecret, { subject: String(user.id), expiresIn: config.jwt.accessExpiresIn })
}

function signRefreshToken(user, jti) {
  return jwt.sign({ jti }, config.jwt.refreshSecret, { subject: String(user.id), expiresIn: config.jwt.refreshExpiresIn })
}

function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwt.refreshSecret)
}

module.exports = { signAccessToken, signRefreshToken, verifyRefreshToken }
