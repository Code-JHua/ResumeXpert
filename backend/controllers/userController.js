import User from '../models/userModel.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// generate a token JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  })
}

const buildAuthResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  token: generateToken(user._id),
})

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body

    // check if user exists
    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' })
    }
    // check password password length
    if(password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' })
    }

    // hashing password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword
    })
    res.status(201).json({
      ...buildAuthResponse(user),
    })
  } catch (error) {
    res.status(500).json({ message:'Server error' , error: error.message })
  }
}

// login function 
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body
    const account = email?.trim()
    const user = await User.findOne({
      $or: [
        { email: account },
        { name: account },
      ],
    })
    if (!user) {
      return res.status(401).json({ message: 'Invalid account or password' })
    }

    if (user.status === 'disabled') {
      return res.status(403).json({ message: 'Account disabled' })
    }

    //compare the password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid account or password' })
    }

    res.status(201).json(buildAuthResponse(user))
  } catch (error) {
    res.status(500).json({ message:'Server error' , error: error.message })
  }
}

// getuser profile function
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.json(user)
  } catch (error) {
    res.status(500).json({ message:'Server error' , error: error.message })
  }
}

export const updateUserProfile = async (req, res) => {
  try {
    const name = req.body.name?.trim()

    if (!name) {
      return res.status(400).json({ message: 'name is required' })
    }

    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    user.name = name
    await user.save()

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    })
  } catch (error) {
    res.status(500).json({ message:'Server error' , error: error.message })
  }
}

export const updateUserPassword = async (req, res) => {
  try {
    const newPassword = req.body.newPassword?.trim()

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' })
    }

    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(newPassword, salt)
    await user.save()

    res.json({ message: 'Password updated successfully' })
  } catch (error) {
    res.status(500).json({ message:'Server error' , error: error.message })
  }
}
