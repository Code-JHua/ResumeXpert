import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { connectDB } from './config/db.js'
import userRoutes from './routes/userRoutes.js'

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { ensureDefaultAdmin } from './config/seedAdmin.js'
import { ensureDefaultTemplates } from './config/seedTemplates.js'
import resumeRoutes from './routes/resumeRouter.js'
import templateRoutes from './routes/templateRoutes.js'
import publicRoutes from './routes/publicRoutes.js'
import adminRoutes from './routes/adminRoutes.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsDir = path.join(process.cwd(), 'uploads')
const frontendDistDir = path.resolve(__dirname, '../frontend/dist')

const app = express()
const PORT = process.env.PORT || 4000;
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

fs.mkdirSync(uploadsDir, { recursive: true })

app.set('trust proxy', 1)
app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: true,
  })
)

// connect to db
connectDB()
  .then(() => ensureDefaultAdmin())
  .then(() => ensureDefaultTemplates())
  .then(() => {
    console.log('Default admin ensured: admin / 88888888')
    console.log('Default templates ensured')
  })
  .catch((error) => {
    console.error('Failed to initialize default admin', error)
  })

//middleware
app.use(express.json())

app.use('/api/auth', userRoutes)
app.use('/api/resume', resumeRoutes)
app.use('/api/templates', templateRoutes)
app.use('/api/public', publicRoutes)
app.use('/api/admin', adminRoutes)

app.use(
  '/uploads',
  express.static(uploadsDir, {
    setHeaders: (res, path) => {
      res.setHeader('Access-Control-Allow-Origin', '*')
    }
  })
)

if (fs.existsSync(frontendDistDir)) {
  app.use(express.static(frontendDistDir))

  app.get(/^(?!\/api|\/uploads).*/, (req, res) => {
    res.sendFile(path.join(frontendDistDir, 'index.html'))
  })
}

app.get('/', (req, res) => {
  if (fs.existsSync(frontendDistDir)) {
    res.sendFile(path.join(frontendDistDir, 'index.html'))
    return
  }

  res.send('API WORKING')
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
