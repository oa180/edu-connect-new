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

// Attendance (Teacher)
async function createAttendanceSession(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try {
    const data = await service.createAttendanceSession(req.user.id, { groupId: parseInt(req.body.groupId, 10), date: req.body.date })
    res.status(201).json(data)
  } catch (e) { next(e) }
}

async function upsertAttendanceRecords(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try {
    const sessionId = parseInt(req.params.sessionId, 10)
    const data = await service.upsertAttendanceRecords(sessionId, req.body.records || [], req.user.id)
    res.json(data)
  } catch (e) { next(e) }
}

async function updateAttendanceRecord(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try {
    const recordId = parseInt(req.params.id, 10)
    const data = await service.updateAttendanceRecord(recordId, { status: req.body.status, note: req.body.note }, req.user.id)
    res.json(data)
  } catch (e) { next(e) }
}

async function listAttendanceSessions(req, res, next) {
  try {
    const { groupId, dateFrom, dateTo } = req.query
    const data = await service.listAttendanceSessions(req.user.id, { groupId: groupId ? parseInt(groupId, 10) : undefined, dateFrom, dateTo })
    res.json(data)
  } catch (e) { next(e) }
}

async function getAttendanceSession(req, res, next) {
  try {
    const sessionId = parseInt(req.params.sessionId, 10)
    const data = await service.getAttendanceSession(req.user.id, sessionId)
    res.json(data)
  } catch (e) { next(e) }
}

module.exports.createAttendanceSession = createAttendanceSession
module.exports.upsertAttendanceRecords = upsertAttendanceRecords
module.exports.updateAttendanceRecord = updateAttendanceRecord
module.exports.listAttendanceSessions = listAttendanceSessions
module.exports.getAttendanceSession = getAttendanceSession

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
