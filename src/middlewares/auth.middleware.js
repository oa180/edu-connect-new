const jwt = require('jsonwebtoken')
const config = require('../config/index.js')
const db = require('../db.js')

async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) return res.status(401).json({ message: 'Unauthorized' })
    const payload = jwt.verify(token, config.jwt.accessSecret)
    const rows = await db.query('SELECT id, role FROM `User` WHERE id = ? LIMIT 1', [payload.sub])
    const user = rows[0]
    if (!user) return res.status(401).json({ message: 'Unauthorized' })
    req.user = { id: user.id, role: user.role }
    next()
  } catch (e) {
    return res.status(401).json({ message: 'Unauthorized' })
  }
}

module.exports = auth
