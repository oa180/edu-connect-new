const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const routes = require('./routes/index.js')
const errorHandler = require('./middlewares/error.middleware.js')
const swaggerUi = require('swagger-ui-express')
const openapiSpec = require('./docs/openapi.js')
const config = require('./config/index.js')
const path = require('path')

const app = express()
app.use(helmet())
app.use(cors({
  origin: true,
  credentials: false,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}))
app.options('*', cors())
app.use(express.json({ limit: '1mb' }))
app.use(morgan('combined'))

app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')))

app.use('/api', routes)
if (process.env.SWAGGER_ENABLED !== 'false') {
  const swaggerOptions = {
    swaggerOptions: {
      url: '/api/docs.json'
    },
    explorer: true
  }
  app.use('/api/docs', swaggerUi.serve)
  app.get('/api/docs', swaggerUi.setup(null, swaggerOptions))
  app.get('/api/docs.json', (req, res) => {
    const dynamicSpec = { ...openapiSpec, servers: [{ url: `${req.protocol}://${req.get('host')}/api` }] }
    res.json(dynamicSpec)
  })
}
app.use(errorHandler)

module.exports = app
