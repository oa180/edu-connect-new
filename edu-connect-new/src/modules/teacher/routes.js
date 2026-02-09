const { Router } = require('express')
const auth = require('../../middlewares/auth.middleware.js')
const authorize = require('../../middlewares/role.middleware.js')
const controller = require('./controller.js')
const { body, param, query } = require('express-validator')

const router = Router()
router.use(auth, authorize('TEACHER'))
router.get('/students', controller.getMyStudents)
router.post('/assign-student', [body('studentId').isInt()], controller.assignStudent)
router.get('/groups', controller.getMyGroups)
router.get('/groups/:groupId', [
  param('groupId').isInt().withMessage('groupId must be an integer')
], controller.getMyGroupById)

// Attendance (Teacher)
router.post('/attendance/sessions', [
  body('groupId').isInt(),
  body('date').optional().isString()
], controller.createAttendanceSession)
router.get('/attendance/sessions', controller.listAttendanceSessions)
router.get('/attendance/sessions/:sessionId', [param('sessionId').isInt()], controller.getAttendanceSession)
router.post('/attendance/sessions/:sessionId/records', [
  param('sessionId').isInt(),
  body('records').isArray({ min: 1 }),
  body('records.*.studentId').isInt(),
  body('records.*.status').isIn(['PRESENT','ABSENT','LATE','EXCUSED']),
  body('records.*.note').optional().isString()
], controller.upsertAttendanceRecords)
router.patch('/attendance/records/:id', [
  param('id').isInt(),
  body('status').optional().isIn(['PRESENT','ABSENT','LATE','EXCUSED']),
  body('note').optional().isString()
], controller.updateAttendanceRecord)

module.exports = router
