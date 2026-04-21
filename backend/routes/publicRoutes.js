import express from 'express'
import { getPublicSharePage } from '../controllers/exportController.js'

const publicRoutes = express.Router()

publicRoutes.get('/share/:slug', getPublicSharePage)

export default publicRoutes
