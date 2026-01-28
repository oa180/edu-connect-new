function authorize(...roles) {
  return (req, res, next) => {
    const allowed = new Set(roles)
    if (allowed.has('ADMIN')) {
      allowed.add('SUPER_ADMIN')
      allowed.add('MANAGER')
    }
    if (!req.user || !allowed.has(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' })
    }
    next()
  }
}

module.exports = authorize
