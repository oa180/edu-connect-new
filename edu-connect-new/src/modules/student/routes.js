const { Router } = require('express')
const auth = require('../../middlewares/auth.middleware.js')
const authorize = require('../../middlewares/role.middleware.js')
const controller = require('./controller.js')

const router = Router()
router.use(auth, authorize('STUDENT'))
router.get('/teachers', controller.getMyTeachers)

module.exports = router
