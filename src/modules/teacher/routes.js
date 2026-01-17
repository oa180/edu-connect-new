const { Router } = require('express')
const auth = require('../../middlewares/auth.middleware.js')
const authorize = require('../../middlewares/role.middleware.js')
const controller = require('./controller.js')
const { body } = require('express-validator')

const router = Router()
router.use(auth, authorize('TEACHER'))
router.get('/students', controller.getMyStudents)
router.post('/assign-student', [body('studentId').isInt()], controller.assignStudent)

module.exports = router
