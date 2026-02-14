const { validationResult } = require('express-validator')
const service = require('./service.js')
const { getPagination } = require('../../utils/pagination.js')

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


async function createGroup(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try {
    const { name, admins_ids = [], students_ids = [], teachers_ids = [] } = req.body
    const data = await service.createGroup(req.user.id, name, { admins_ids, students_ids, teachers_ids })
    res.status(201).json(data)
  } catch (e) { next(e) }
}

async function addGroupMembers(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try {
    const groupId = parseInt(req.params.id, 10)
    const { admins_ids = [], students_ids = [], teachers_ids = [] } = req.body
    const data = await service.addGroupMembers(groupId, { admins_ids, students_ids, teachers_ids })
    res.json(data)
  } catch (e) { next(e) }
}

async function getAllUsers(req, res, next) {
  try { const data = await service.getAllUsers(); res.json(data) } catch (e) { next(e) }
}

async function getUserById(req, res, next) {
  try {
    const user = await service.getUserById(parseInt(req.params.id, 10))
    if (!user) return res.status(404).json({ message: 'Not found' })
    res.json(user)
  } catch (e) { next(e) }
}

async function getAllGroups(req, res, next) {
  try { const data = await service.getAllGroups(); res.json(data) } catch (e) { next(e) }
}

async function getGroupById(req, res, next) {
  try {
    const data = await service.getGroupById(parseInt(req.params.id, 10))
    if (!data) return res.status(404).json({ message: 'Not found' })
    res.json(data)
  } catch (e) { next(e) }
}

async function deleteGroup(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try { await service.deleteGroup(parseInt(req.params.id,10)); res.status(204).end() } catch (e) { next(e) }
}

async function updateGroup(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try {
    const groupId = parseInt(req.params.id, 10)
    const { name, admins_ids = [], students_ids = [], teachers_ids = [] } = req.body
    const data = await service.updateGroup(groupId, { name, admins_ids, students_ids, teachers_ids })
    res.json(data)
  } catch (e) { next(e) }
}

async function removeGroupMember(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try { await service.removeGroupMember(parseInt(req.params.id,10), parseInt(req.params.userId,10)); res.status(204).end() } catch (e) { next(e) }
}

async function updateGroupSettings(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try { const data = await service.updateGroupSettings(parseInt(req.params.id,10), { adminOnly: !!req.body.adminOnly }); res.json(data) } catch (e) { next(e) }
}

async function updateMemberPosting(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try { const data = await service.updateMemberPosting(parseInt(req.params.id,10), parseInt(req.params.userId,10), { canPost: !!req.body.canPost }); res.json(data) } catch (e) { next(e) }
}

async function createPinnedMessage(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try {
    const groupId = parseInt(req.params.groupId, 10)
    const { content } = req.body
    const data = await service.createPinnedMessage(groupId, content, req.user.id)
    res.status(201).json(data)
  } catch (e) { next(e) }
}

async function unpinGroup(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try {
    const groupId = parseInt(req.params.groupId, 10)
    const messageId = parseInt(req.params.messageId, 10)
    await service.unpinGroupMessage(groupId, messageId)
    res.status(204).end()
  } catch (e) { next(e) }
}

async function listPinnedMessages(req, res, next) {
  try {
    const page = getPagination(req.query)
    const data = await service.listPinnedMessagesAdmin(page)
    res.json(data)
  } catch (e) { next(e) }
}

async function listPinnedMessagesByGroup(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try {
    const groupId = parseInt(req.params.groupId, 10)
    const page = getPagination(req.query)
    const data = await service.listPinnedMessagesByGroupAdmin(groupId, page)
    res.json(data)
  } catch (e) { next(e) }
}

// Attendance (Admin)
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
    const data = await service.updateAttendanceRecordAdmin(recordId, { status: req.body.status, note: req.body.note })
    res.json(data)
  } catch (e) { next(e) }
}

async function listAttendanceSessions(req, res, next) {
  try {
    const { groupId, dateFrom, dateTo } = req.query
    const data = await service.listAttendanceSessionsAdmin({ groupId: groupId ? parseInt(groupId, 10) : undefined, dateFrom, dateTo })
    res.json(data)
  } catch (e) { next(e) }
}

async function getAttendanceSession(req, res, next) {
  try {
    const sessionId = parseInt(req.params.sessionId, 10)
    const data = await service.getAttendanceSessionAdmin(sessionId)
    res.json(data)
  } catch (e) { next(e) }
}

module.exports = {
  createUser,
  updateUser,
  deleteUser,
  getAllUsers,
  getUserById,
  createGroup,
  addGroupMembers,
  getAllGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  removeGroupMember,
  updateGroupSettings,
  updateMemberPosting,
  createPinnedMessage,
  unpinGroup,
  listPinnedMessages,
  listPinnedMessagesByGroup,
  createAttendanceSession,
  listAttendanceSessions,
  getAttendanceSession,
  upsertAttendanceRecords,
  updateAttendanceRecord
}
