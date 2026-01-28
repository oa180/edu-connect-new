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
// 1. Add this at the top level of your app (very important for Nginx)
app.set('trust proxy', true);

if (process.env.SWAGGER_ENABLED !== 'false') {
  // 2. Define the setup options separately
  const swaggerOptions = {
    swaggerOptions: {
      url: '/api/docs.json', // Relative path so it matches the current protocol
    },
    explorer: true
  };

  // 3. Serve the UI using the relative path
  app.use('/api/docs', swaggerUi.serve);
  
  app.get('/api/docs', swaggerUi.setup(null, swaggerOptions));

  // 4. Update the JSON generator
  app.get('/api/docs.json', (req, res) => {
    // If you are still seeing HTTPS errors, hardcode 'http' here temporarily:
    // const protocol = 'http'; 
    const protocol = req.protocol; 
    
    const dynamicSpec = { 
      ...openapiSpec, 
      servers: [{ url: `${protocol}://${req.get('host')}/api` }] 
    };
    res.json(dynamicSpec);
  });
}
app.use(errorHandler)

module.exports = app
