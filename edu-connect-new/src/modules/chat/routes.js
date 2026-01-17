const { Router } = require('express')
const { param } = require('express-validator')
const auth = require('../../middlewares/auth.middleware.js')
const controller = require('./controller.js')

const router = Router()
router.use(auth)
router.get('/private/:userId', [param('userId').isInt()], controller.getPrivateMessages)
router.get('/groups/:groupId', [param('groupId').isInt()], controller.getGroupMessages)

module.exports = router
