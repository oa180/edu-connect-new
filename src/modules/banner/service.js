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

function getBannerFilePath(filename) {
  return path.join(BANNERS_DIR, filename)
}

module.exports = { createBanner, getBannerById, getBannerFilePath, BANNERS_DIR }
