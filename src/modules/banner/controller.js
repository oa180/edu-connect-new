const { validationResult } = require('express-validator')
const service = require('./service.js')

async function uploadBanner(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: 'image file is required' })
    const created = await service.createBanner({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      createdById: req.user ? req.user.id : null
    })
    const baseUrl = `${req.protocol}://${req.get('host')}`
    const url = `${baseUrl}/uploads/banners/${created.filename}`
    res.status(201).json({ ...created, url })
  } catch (e) { next(e) }
}

async function getBanner(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try {
    const id = parseInt(req.params.id, 10)
    const banner = await service.getBannerById(id)
    if (!banner) return res.status(404).json({ message: 'Not found' })
    const baseUrl = `${req.protocol}://${req.get('host')}`
    const url = `${baseUrl}/uploads/banners/${banner.filename}`
    res.json({ ...banner, url })
  } catch (e) { next(e) }
}

async function getBannerImage(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try {
    const id = parseInt(req.params.id, 10)
    const banner = await service.getBannerById(id)
    if (!banner) return res.status(404).json({ message: 'Not found' })
    const filePath = service.getBannerFilePath(banner.filename)
    res.sendFile(filePath)
  } catch (e) { next(e) }
}

module.exports = { uploadBanner, getBanner, getBannerImage }
