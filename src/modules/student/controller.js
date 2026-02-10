const service = require('./service.js')
const { validationResult } = require('express-validator')

async function getMyTeachers(req, res, next) {
  try { const data = await service.getMyTeachers(req.user.id); res.json(data) } catch (e) { next(e) }
}

module.exports = { getMyTeachers }

async function listMyAttendance(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try {
    const { groupId, dateFrom, dateTo } = req.query
    const data = await service.listMyAttendance(req.user.id, {
      groupId: groupId ? parseInt(groupId, 10) : undefined,
      dateFrom,
      dateTo
    })
    res.json(data)
  } catch (e) { next(e) }
}

module.exports.listMyAttendance = listMyAttendance

async function getMyGroups(req, res, next) {
  try {
    const data = await service.getMyGroups(req.user.id)
    res.json(data)
  } catch (e) { next(e) }
}

async function getMyGroupById(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try {
    const groupId = parseInt(req.params.groupId, 10)
    const data = await service.getMyGroupById(req.user.id, groupId)
    res.json(data)
  } catch (e) { next(e) }
}

module.exports.getMyGroups = getMyGroups
module.exports.getMyGroupById = getMyGroupById
