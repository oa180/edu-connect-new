const db = require('../db.js')

function registerSocketHandlers(io, socket) {
  const userId = socket.user.id
  socket.join(`user:${userId}`)

  socket.on('private:message', async ({ toUserId, content }) => {
    const otherId = parseInt(toUserId, 10)
    const rel = await db.query('SELECT 1 FROM TeacherStudent WHERE (teacherId = ? AND studentId = ?) OR (teacherId = ? AND studentId = ?) LIMIT 1', [userId, otherId, otherId, userId])
    if (!rel[0]) return
    await db.query('INSERT INTO Message (senderId, receiverId, content) VALUES (?, ?, ?)', [userId, otherId, content])
    const rows = await db.query('SELECT * FROM Message WHERE senderId = ? AND receiverId = ? ORDER BY id DESC LIMIT 1', [userId, otherId])
    const msg = rows[0]
    const payload = { ...msg, sender: { id: socket.user.id, name: socket.user.name, role: socket.user.role } }
    io.to(`user:${otherId}`).emit('private:message', payload)
    io.to(`user:${userId}`).emit('private:message', payload)
  })

  socket.on('group:message', async ({ groupId, content }) => {
    const gid = parseInt(groupId, 10)
    const memberRows = await db.query('SELECT canPost FROM ChatGroupMember WHERE groupId = ? AND userId = ? LIMIT 1', [gid, userId])
    if (!memberRows[0]) return
    const groupRows = await db.query('SELECT adminOnly FROM ChatGroup WHERE id = ? LIMIT 1', [gid])
    const group = groupRows[0]
    const canPost = !!memberRows[0].canPost
    const isAdminOnly = !!(group && group.adminOnly)
    const isAdmin = socket.user.role === 'ADMIN'
    if ((isAdminOnly && !isAdmin) || !canPost) return
    await db.query('INSERT INTO GroupMessage (groupId, senderId, content) VALUES (?, ?, ?)', [gid, userId, content])
    const rows = await db.query('SELECT * FROM GroupMessage WHERE groupId = ? AND senderId = ? ORDER BY id DESC LIMIT 1', [gid, userId])
    const msg = rows[0]
    const members = await db.query('SELECT userId FROM ChatGroupMember WHERE groupId = ?', [gid])
    const payload = { ...msg, sender: { id: socket.user.id, name: socket.user.name, role: socket.user.role } }
    members.forEach(m => io.to(`user:${m.userId}`).emit('group:message', payload))
  })

  socket.on('message:read', async ({ messageId }) => {
    const mid = parseInt(messageId, 10)
    const rows = await db.query('SELECT id, senderId, receiverId, isRead FROM Message WHERE id = ? LIMIT 1', [mid])
    const msg = rows[0]
    if (!msg) return
    if (msg.receiverId !== userId) return
    await db.query('UPDATE Message SET isRead = 1 WHERE id = ?', [mid])
    const updated = { ...msg, isRead: 1, reader: { id: socket.user.id, name: socket.user.name, role: socket.user.role } }
    io.to(`user:${msg.senderId}`).emit('message:read', updated)
  })
}

module.exports = registerSocketHandlers
