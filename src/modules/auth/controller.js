const { validationResult } = require('express-validator')
const service = require('./service.js')

async function login(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try {
    const result = await service.login(req.body.email, req.body.password)
    res.json(result)
  } catch (e) { next(e) }
}

async function refresh(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try {
    const result = await service.refresh(req.body.refreshToken)
    res.json(result)
  } catch (e) { next(e) }
}

async function logout(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try {
    await service.logout(req.body.refreshToken)
    res.status(204).end()
  } catch (e) { next(e) }
}

module.exports = { login, refresh, logout }
