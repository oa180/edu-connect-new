const { Router } = require('express')
const { body } = require('express-validator')
const controller = require('./controller.js')

const router = Router()

router.post('/login', [body('email').isEmail(), body('password').isString().isLength({ min: 6 })], controller.login)
router.post('/refresh', [body('refreshToken').isString()], controller.refresh)
router.post('/logout', [body('refreshToken').isString()], controller.logout)

module.exports = router
