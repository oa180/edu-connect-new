const service = require('./service.js')

async function getMyTeachers(req, res, next) {
  try { const data = await service.getMyTeachers(req.user.id); res.json(data) } catch (e) { next(e) }
}

module.exports = { getMyTeachers }
