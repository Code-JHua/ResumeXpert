import mongoose from 'mongoose'

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URL || 'mongodb://localhost:27017/resumexpert'
  await mongoose.connect(mongoUri)
  .then(() => {
    console.log('MongoDB connected')
  })
}