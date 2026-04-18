import fs from 'fs'
import path from 'path'

import Resume from '../models/resumeModel.js'

export const uploadResumeImage = async (req, res) => {
  try {
    const resumeId = req.params.id
    const resume = await Resume.findOne({ _id: resumeId, userId: req.user._id })

    if (!resume) {
      return res.status(404).json({ message: "Resume not found or not authorized" });
    }

    // use process cwd to locate uploads folder
    const uploadsFolder = path.join(process.cwd(), 'uploads')
    const baseUrl = `${req.protocol}://${req.get('host')}`

    const newThumbnail = req.files?.thumbnail?.[0]
    const newProfileImage = req.files?.profileImage?.[0] || null

    if (newThumbnail) {
      if (resume.thumbnailLink) {
        const oldThumbnail = path.join(uploadsFolder, path.basename(resume.thumbnailLink))
        if (fs.existsSync(oldThumbnail)) {
          fs.unlinkSync(oldThumbnail)
        }
      }
      resume.thumbnailLink = `${baseUrl}/uploads/${newThumbnail.filename}`
    }

    // same for profilepreview image
    if (newProfileImage) {
      if (resume.profileinfo?.profileImage) {
        const oldProfile = path.join(uploadsFolder, path.basename(resume.profileinfo.profilePreviewUrl))
        if (fs.existsSync(oldProfile)) {
          fs.unlinkSync(oldProfile)
        }
      }
      resume.profileinfo.profilePreviewUrl = `${baseUrl}/uploads/${newProfileImage.filename}`
    }

    await resume.save()
    res.status(200).json({
      message: "Image uploaded successfully",
      thumbnailLink: resume.thumbnailLink,
      profilePreviewUrl: resume.profileinfo?.profilePreviewUrl,
    })
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ message: "Failed to upload image", error: error.message });
  }
}
