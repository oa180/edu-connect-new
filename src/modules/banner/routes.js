const { Router } = require('express')
const { param } = require('express-validator')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const auth = require('../../middlewares/auth.middleware.js')
const controller = require('./controller.js')
const { BANNERS_DIR } = require('./service.js')

const router = Router()

function ensureDir() {
  fs.mkdirSync(BANNERS_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      ensureDir()
      cb(null, BANNERS_DIR)
    } catch (e) {
      cb(e)
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase()
    cb(null, `${Date.now()}${ext}`)
  }
})

function fileFilter(req, file, cb) {
  const allowed = new Set(['image/jpeg', 'image/jpg', 'image/png'])
  if (!allowed.has(file.mimetype)) return cb(Object.assign(new Error('Only jpg, jpeg, png files are allowed'), { status: 400 }))
  cb(null, true)
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
})

router.use(auth)
router.post('/', upload.single('image'), controller.uploadBanner)
router.get('/', controller.listBanners)
router.get('/:id', [param('id').isInt()], controller.getBanner)
router.get('/:id/image', [param('id').isInt()], controller.getBannerImage)

module.exports = router
