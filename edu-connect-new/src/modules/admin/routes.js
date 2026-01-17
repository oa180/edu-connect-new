const { Router } = require('express')
const { body, param } = require('express-validator')
const auth = require('../../middlewares/auth.middleware.js')
const authorize = require('../../middlewares/role.middleware.js')
const controller = require('./controller.js')

const router = Router()
router.use(auth, authorize('ADMIN'))

router.post('/users', [body('email').isEmail(), body('password').isLength({ min: 6 }), body('role').isIn(['ADMIN','TEACHER','STUDENT'])], controller.createUser)
router.put('/users/:id', [param('id').isInt(), body('email').optional().isEmail(), body('password').optional().isLength({ min: 6 }), body('role').optional().isIn(['ADMIN','TEACHER','STUDENT'])], controller.updateUser)
router.delete('/users/:id', [param('id').isInt()], controller.deleteUser)
router.post('/assign-student', [body('teacherId').isInt(), body('studentId').isInt()], controller.assignStudent)
router.post('/groups', [body('name').isString().isLength({ min: 1 })], controller.createGroup)
router.post('/groups/:id/members', [param('id').isInt(), body('userIds').isArray({ min: 1 })], controller.addGroupMembers)

module.exports = router
