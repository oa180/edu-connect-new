const { Router } = require('express')
const { body, param } = require('express-validator')
const auth = require('../../middlewares/auth.middleware.js')
const authorize = require('../../middlewares/role.middleware.js')
const controller = require('./controller.js')

const router = Router()
router.use(auth, authorize('ADMIN'))

router.get('/users', controller.getAllUsers)
router.post('/users', [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['ADMIN','TEACHER','STUDENT']),
  body('name').optional().isString(),
  body('phoneNumber').optional().isString().isLength({ max: 32 }),
  body('grade').optional().isString(),
  body('major').optional().isString(),
  body('grade').custom((value, { req }) => {
    if (req.body.role === 'STUDENT' && (!value || String(value).trim() === '')) {
      throw new Error('grade is required for STUDENT')
    }
    return true
  }),
  body('major').custom((value, { req }) => {
    if (req.body.role === 'TEACHER' && (!value || String(value).trim() === '')) {
      throw new Error('major is required for TEACHER')
    }
    return true
  })
], controller.createUser)
router.put('/users/:id', [
  param('id').isInt(),
  body('email').optional().isEmail(),
  body('password').optional().isLength({ min: 6 }),
  body('role').optional().isIn(['ADMIN','TEACHER','STUDENT']),
  body('name').optional().isString(),
  body('phoneNumber').optional().isString().isLength({ max: 32 }),
  body('grade').optional().isString(),
  body('major').optional().isString(),
  body().custom((body) => {
    if (body.role === 'STUDENT' && (!body.grade || String(body.grade).trim() === '')) {
      throw new Error('grade is required for STUDENT')
    }
    if (body.role === 'TEACHER' && (!body.major || String(body.major).trim() === '')) {
      throw new Error('major is required for TEACHER')
    }
    return true
  })
], controller.updateUser)
router.delete('/users/:id', [param('id').isInt()], controller.deleteUser)
router.post('/groups', [
  body('name').isString().isLength({ min: 1 }),
  body('admins_ids').optional().isArray(),
  body('admins_ids.*').optional().isInt(),
  body('students_ids').optional().isArray(),
  body('students_ids.*').optional().isInt(),
  body('teachers_ids').optional().isArray(),
  body('teachers_ids.*').optional().isInt()
], controller.createGroup)
router.get('/groups', controller.getAllGroups)
router.delete('/groups/:id', [param('id').isInt()], controller.deleteGroup)
router.post('/groups/:id/members', [
  param('id').isInt(),
  body('admins_ids').optional().isArray(),
  body('admins_ids.*').optional().isInt(),
  body('students_ids').optional().isArray(),
  body('students_ids.*').optional().isInt(),
  body('teachers_ids').optional().isArray(),
  body('teachers_ids.*').optional().isInt()
], controller.addGroupMembers)
router.delete('/groups/:id/members/:userId', [param('id').isInt(), param('userId').isInt()], controller.removeGroupMember)
router.patch('/groups/:id/settings', [param('id').isInt(), body('adminOnly').isBoolean()], controller.updateGroupSettings)
router.patch('/groups/:id/members/:userId', [param('id').isInt(), param('userId').isInt(), body('canPost').isBoolean()], controller.updateMemberPosting)
router.post('/groups/:groupId/pin', [param('groupId').isInt(), body('content').isString().isLength({ min: 1 })], controller.createPinnedMessage)
router.delete('/groups/:groupId/pin', [param('groupId').isInt()], controller.unpinGroup)

module.exports = router
