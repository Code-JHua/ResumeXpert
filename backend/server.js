import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { connectDB } from './config/db.js'
import userRoutes from './routes/userRoutes.js'

import path from 'path'
import { fileURLToPath } from 'url'
import resumeRoutes from './routes/resumeRouter.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 4000;

app.use(cors())

// connect to db
connectDB()

//middleware
app.use(express.json())

app.use('/api/auth', userRoutes)
app.use('/api/resume', resumeRoutes)

app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res, path) => {
      res.setHeader('Access-Control-Allow-Origin', '*')
    }
  })
)



//routes

app.get('/', (req, res) => {
  res.send('API WORKING')
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
