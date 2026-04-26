import User from '../models/userModel.js'
import jwt from 'jsonwebtoken'

const resolveTokenUser = async (authorizationHeader) => {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authorizationHeader.split(' ')[1]
  const decoded = jwt.verify(token, process.env.JWT_SECRET)
  return User.findById(decoded.id).select('-password')
}

export const protect = async (req, res, next) => {
  try {
    req.user = await resolveTokenUser(req.headers.authorization)

    if (req.user) {
      if (req.user.status === 'disabled') {
        return res.status(403).json({ message: 'Account disabled' })
      }
      next()
    }
    else {
      res.status(401).json({ message: 'Not authorized, no token found' })
    }
  }
  catch (error) {
    res.status(401).json({ message: 'Token failed', error: error.message })
  }
}

export const optionalProtect = async (req, res, next) => {
  try {
    req.user = await resolveTokenUser(req.headers.authorization)
    if (req.user?.status === 'disabled') {
      req.user = null
    }
    next()
  } catch (error) {
    req.user = null
    next()
  }
}

export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' })
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' })
  }

  next()
}
