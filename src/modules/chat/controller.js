const { validationResult } = require('express-validator')
const service = require('./service.js')
const { getPagination } = require('../../utils/pagination.js')

async function getChatUsers(req, res, next) {
  try {
    const data = await service.getChatUsers(req.user)
    res.json(data)
  } catch (e) { next(e) }
}

async function getPrivateMessages(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try {
    const otherId = parseInt(req.params.userId, 10)
    const page = getPagination(req.query)
    const data = await service.getPrivateMessages(req.user.id, otherId, page)
    res.json(data)
  } catch (e) { next(e) }
}

async function getGroupMessages(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try {
    const groupId = parseInt(req.params.groupId, 10)
    const page = getPagination(req.query)
    const data = await service.getGroupMessages(req.user.id, groupId, page)
    res.json(data)
  } catch (e) { next(e) }
}

async function listPinnedMessages(req, res, next) {
  try {
    const page = getPagination(req.query)
    const data = await service.listPinnedMessages(req.user, page)
    res.json(data)
  } catch (e) { next(e) }
}

async function getPinnedMessageByGroupId(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try {
    const groupId = parseInt(req.params.groupId, 10)
    const data = await service.getPinnedMessageByGroupId(req.user, groupId)
    // data is now an array
    res.json(data)
  } catch (e) { next(e) }
}

async function pinGroupMessage(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try {
    const groupId = parseInt(req.params.groupId, 10)
    const messageId = parseInt(req.params.messageId, 10)
    const data = await service.pinGroupMessage(req.user, groupId, messageId)
    res.json(data)
  } catch (e) { next(e) }
}

async function unpinGroupMessage(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try {
    const groupId = parseInt(req.params.groupId, 10)
    const messageId = parseInt(req.params.messageId, 10)
    await service.unpinGroupMessage(req.user, groupId, messageId)
    res.status(204).end()
  } catch (e) { next(e) }
}

module.exports = {
  getChatUsers,
  getPrivateMessages,
  getGroupMessages,
  listPinnedMessages,
  getPinnedMessageByGroupId,
  pinGroupMessage,
  unpinGroupMessage
}
