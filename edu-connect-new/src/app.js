const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const routes = require('./routes/index.js')
const errorHandler = require('./middlewares/error.middleware.js')
const swaggerUi = require('swagger-ui-express')
const openapiSpec = require('./docs/openapi.js')
const config = require('./config/index.js')

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
app.use('/api', routes)

app.set('trust proxy', true);
if (process.env.SWAGGER_ENABLED !== 'false') {
  const options = {
    swaggerOptions: {
      url: '/api/docs.json', // Use a relative path
    },
    // This part is the magic fix for the red errors in your screenshot
    customCss: '.swagger-ui .topbar { display: none }',
  };

  // Serve the UI
  app.use('/api/docs', swaggerUi.serve);
  
  // Link the setup
  app.get('/api/docs', swaggerUi.setup(null, options));
}
app.use(errorHandler)

module.exports = app
