import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { connectDB } from './config/db.js'
import userRoutes from './routes/userRoutes.js'

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import resumeRoutes from './routes/resumeRouter.js'

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

//middleware
app.use(express.json())

app.use('/api/auth', userRoutes)
app.use('/api/resume', resumeRoutes)

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
