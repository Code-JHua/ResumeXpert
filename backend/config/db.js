import mongoose from 'mongoose'

export const connectDB = async () => {
  await mongoose.connect('mongodb+srv://hjh17607090915_db_user:resume123@cluster0.bkbk8kw.mongodb.net/RESUME')
  .then(() => {
    console.log('MongoDB connected')
  })
}