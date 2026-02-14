const { Router } = require('express')
const { param } = require('express-validator')
const auth = require('../../middlewares/auth.middleware.js')
const controller = require('./controller.js')

const router = Router()
router.use(auth)
router.get('/users', controller.getChatUsers)
router.get('/private/:userId', [param('userId').isInt()], controller.getPrivateMessages)
router.get('/groups/:groupId', [param('groupId').isInt()], controller.getGroupMessages)
router.get('/pins', controller.listPinnedMessages)
router.get('/groups/:groupId/pin', [param('groupId').isInt()], controller.getPinnedMessageByGroupId)
router.post('/groups/:groupId/messages/:messageId/pin', [param('groupId').isInt(), param('messageId').isInt()], controller.pinGroupMessage)
router.delete('/groups/:groupId/messages/:messageId/pin', [param('groupId').isInt(), param('messageId').isInt()], controller.unpinGroupMessage)

module.exports = router
