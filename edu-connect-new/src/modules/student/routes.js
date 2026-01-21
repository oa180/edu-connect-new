const { Router } = require('express')
const auth = require('../../middlewares/auth.middleware.js')
const authorize = require('../../middlewares/role.middleware.js')
const controller = require('./controller.js')
const { query } = require('express-validator')

const router = Router()
router.use(auth, authorize('STUDENT'))
router.get('/teachers', controller.getMyTeachers)
// Attendance (Student)
router.get('/attendance', [
  query('groupId').optional().isInt(),
  query('dateFrom').optional().isString(),
  query('dateTo').optional().isString()
], controller.listMyAttendance)

module.exports = router
