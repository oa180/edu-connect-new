const service = require('./service.js')
const { validationResult } = require('express-validator')

async function getMyStudents(req, res, next) {
  try { const data = await service.getMyStudents(req.user.id); res.json(data) } catch (e) { next(e) }
}

async function assignStudent(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try {
    const data = await service.assignStudent(req.user.id, parseInt(req.body.studentId, 10))
    res.status(201).json(data)
  } catch (e) { next(e) }
}

module.exports = { getMyStudents, assignStudent }
