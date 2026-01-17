const { validationResult } = require('express-validator')
const service = require('./service.js')

async function createUser(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try { const data = await service.createUser(req.body); res.status(201).json(data) } catch (e) { next(e) }
}

async function updateUser(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try { const data = await service.updateUser(parseInt(req.params.id,10), req.body); res.json(data) } catch (e) { next(e) }
}

async function deleteUser(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try { await service.deleteUser(parseInt(req.params.id,10)); res.status(204).end() } catch (e) { next(e) }
}

async function assignStudent(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try { const data = await service.assignStudent(req.body.teacherId, req.body.studentId); res.json(data) } catch (e) { next(e) }
}

async function createGroup(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try { const data = await service.createGroup(req.user.id, req.body.name); res.status(201).json(data) } catch (e) { next(e) }
}

async function addGroupMembers(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try { const data = await service.addGroupMembers(parseInt(req.params.id,10), req.body.userIds); res.json(data) } catch (e) { next(e) }
}

module.exports = { createUser, updateUser, deleteUser, assignStudent, createGroup, addGroupMembers }
