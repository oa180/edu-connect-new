const http = require('http')
const { Server } = require('socket.io')
const app = require('./app.js')
const config = require('./config/index.js')
const { authenticateSocket } = require('./sockets/auth.js')
const registerSocketHandlers = require('./sockets/index.js')

const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*'} })

io.use(authenticateSocket)
io.on('connection', (socket) => {
  registerSocketHandlers(io, socket)
})

const port = config.port || 3000
server.listen(port, () => {})
