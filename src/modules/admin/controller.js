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

async function getAllGroups(req, res, next) {
  try { const data = await service.getAllGroups(); res.json(data) } catch (e) { next(e) }
}

async function deleteGroup(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try { await service.deleteGroup(parseInt(req.params.id,10)); res.status(204).end() } catch (e) { next(e) }
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

async function pinMessage(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try { const data = await service.pinMessage(parseInt(req.params.groupId,10), parseInt(req.params.messageId,10), req.user.id); res.json(data) } catch (e) { next(e) }
}

async function unpinMessage(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try { const data = await service.unpinMessage(parseInt(req.params.groupId,10), parseInt(req.params.messageId,10)); res.json(data) } catch (e) { next(e) }
}

module.exports = { createUser, updateUser, deleteUser, createGroup, addGroupMembers, getAllUsers, getAllGroups, deleteGroup, removeGroupMember, updateGroupSettings, updateMemberPosting, pinMessage, unpinMessage }
