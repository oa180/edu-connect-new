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

module.exports = { getChatUsers, getPrivateMessages, getGroupMessages }
