import bcrypt from 'bcryptjs'
import User from '../models/userModel.js'

const DEFAULT_ADMIN = {
  name: 'admin',
  email: 'admin',
  password: '88888888',
  role: 'admin',
  status: 'active',
}

export const ensureDefaultAdmin = async () => {
  const existingAdmin = await User.findOne({
    $or: [
      { email: DEFAULT_ADMIN.email },
      { name: DEFAULT_ADMIN.name, role: 'admin' },
    ],
  })

  if (existingAdmin) {
    let shouldSave = false

    if (existingAdmin.role !== 'admin') {
      existingAdmin.role = 'admin'
      shouldSave = true
    }

    if (existingAdmin.status !== 'active') {
      existingAdmin.status = 'active'
      shouldSave = true
    }

    if (shouldSave) {
      await existingAdmin.save()
    }

    return existingAdmin
  }

  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, salt)

  return User.create({
    ...DEFAULT_ADMIN,
    password: hashedPassword,
  })
}
