const { Router } = require('express')
const auth = require('../../middlewares/auth.middleware.js')
const authorize = require('../../middlewares/role.middleware.js')
const controller = require('./controller.js')
const { query, param } = require('express-validator')

const router = Router()
router.use(auth, authorize('STUDENT'))
router.get('/teachers', controller.getMyTeachers)
router.get('/groups', controller.getMyGroups)
router.get('/groups/:groupId', [
  param('groupId').isInt().withMessage('groupId must be an integer')
], controller.getMyGroupById)
// Attendance (Student)
router.get('/attendance', [
  query('groupId').optional().isInt(),
  query('dateFrom').optional().isString(),
  query('dateTo').optional().isString()
], controller.listMyAttendance)

module.exports = router
