import bcrypt from 'bcryptjs'
import User from '../models/userModel.js'

const buildUserAdminQuery = (query = {}) => {
  const filters = {}

  if (query.search?.trim()) {
    const keyword = query.search.trim()
    filters.$or = [
      { name: { $regex: keyword, $options: 'i' } },
      { email: { $regex: keyword, $options: 'i' } },
    ]
  }

  if (query.role) {
    filters.role = query.role
  }

  if (query.status) {
    filters.status = query.status
  }

  return filters
}

export const getAdminUsers = async (req, res) => {
  try {
    const users = await User.find(buildUserAdminQuery(req.query))
      .select('-password')
      .sort({ createdAt: -1 })

    res.json(users)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message })
  }
}

export const getAdminUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json(user)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user', error: error.message })
  }
}

export const updateAdminUserStatus = async (req, res) => {
  try {
    const { status } = req.body
    if (!['active', 'disabled'].includes(status)) {
      return res.status(400).json({ message: 'status must be active or disabled' })
    }

    if (String(req.user._id) === String(req.params.id) && status === 'disabled') {
      return res.status(400).json({ message: 'Admin cannot disable the current account' })
    }

    const user = await User.findById(req.params.id).select('-password')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    user.status = status
    await user.save()

    res.json(user)
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user status', error: error.message })
  }
}

export const resetAdminUserPassword = async (req, res) => {
  try {
    const newPassword = req.body.newPassword?.trim()
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'newPassword must be at least 8 characters long' })
    }

    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(newPassword, salt)
    await user.save()

    res.json({ message: 'Password reset successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset password', error: error.message })
  }
}
