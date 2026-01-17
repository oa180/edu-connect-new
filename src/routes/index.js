const { Router } = require('express')
const authRoutes = require('../modules/auth/routes.js')
const adminRoutes = require('../modules/admin/routes.js')
const teacherRoutes = require('../modules/teacher/routes.js')
const studentRoutes = require('../modules/student/routes.js')
const chatRoutes = require('../modules/chat/routes.js')

const router = Router()
router.use('/auth', authRoutes)
router.use('/admin', adminRoutes)
router.use('/teacher', teacherRoutes)
router.use('/student', studentRoutes)
router.use('/chat', chatRoutes)

module.exports = router
