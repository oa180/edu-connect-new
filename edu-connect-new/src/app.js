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
app.set('trust proxy', true);
app.use('/api', routes)
if (process.env.SWAGGER_ENABLED !== 'false') {
  // Use a relative path that works with the browser URL
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(null, { 
    swaggerOptions: {
      url: '/api/docs.json' 
    }
  }));

  app.get('/api/docs.json', (req, res) => {
    // This will now correctly show https://yourdomain.com/api or http://76.13.102.118/api
    const dynamicSpec = { 
      ...openapiSpec, 
      servers: [{ url: `${req.protocol}://${req.get('host')}/api` }] 
    };
    res.json(dynamicSpec);
  });
}
app.use(errorHandler)

module.exports = app
