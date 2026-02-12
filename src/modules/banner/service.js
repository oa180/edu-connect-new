const path = require('path')
const db = require('../../db.js')

const BANNERS_DIR = path.join(__dirname, '..', '..', '..', 'public', 'uploads', 'banners')

async function createBanner({ filename, originalName, mimeType, size, createdById }) {
  await db.query(
    'INSERT INTO Banner (filename, originalName, mimeType, size, createdById) VALUES (?, ?, ?, ?, ?)',
    [filename, originalName || null, mimeType || null, size || null, createdById || null]
  )
  const rows = await db.query('SELECT id, filename, originalName, mimeType, size, createdById, createdAt FROM Banner WHERE filename = ? ORDER BY id DESC LIMIT 1', [filename])
  return rows[0]
}

async function getBannerById(id) {
  const rows = await db.query('SELECT id, filename, originalName, mimeType, size, createdById, createdAt FROM Banner WHERE id = ? LIMIT 1', [id])
  return rows[0] || null
}

async function listBanners({ skip, limit }) {
  const safeLimit = Number.isInteger(limit) ? Math.min(Math.max(limit, 1), 100) : 20
  const safeSkip = Number.isInteger(skip) ? Math.max(skip, 0) : 0
  const items = await db.query(
    `SELECT id, filename, originalName, mimeType, size, createdById, createdAt
     FROM Banner
     ORDER BY id DESC
     LIMIT ${safeLimit} OFFSET ${safeSkip}`
  )
  const totalRows = await db.query('SELECT COUNT(*) as cnt FROM Banner')
  const total = totalRows[0]?.cnt || 0
  return { items, total }
}

async function deleteBannerById(id) {
  const banner = await getBannerById(id)
  if (!banner) return null
  await db.query('DELETE FROM Banner WHERE id = ?', [id])
  return banner
}

function getBannerFilePath(filename) {
  return path.join(BANNERS_DIR, filename)
}

module.exports = { createBanner, getBannerById, listBanners, deleteBannerById, getBannerFilePath, BANNERS_DIR }
