import Resume from '../models/resumeModel.js'
import path from 'path'
import fs from 'fs'




export const createResume = async (req, res) => {
  try {
    const { title } = req.body

    // Default template
    const defaultResumeData = {
      profileInfo: {
        profileImg: null,
        previewUrl: '',
        fullName: '',
        designation: '',
        summary: '',
      },
      contactInfo: {
        email: '',
        phone: '',
        location: '',
        linkedin: '',
        github: '',
        website: '',
      },
      workExperience: [
        {
          company: '',
          role: '',
          startDate: '',
          endDate: '',
          description: '',
        },
      ],
      education: [
        {
          degree: '',
          institution: '',
          startDate: '',
          endDate: '',
        },
      ],
      skills: [
        {
          name: '',
          progress: 0,
        },
      ],
      projects: [
        {
          title: '',
          description: '',
          github: '',
          liveDemo: '',
        },
      ],
      certifications: [
        {
          title: '',
          issuer: '',
          year: '',
        },
      ],
      languages: [
        {
          name: '',
          progress: '',
        },
      ],
      interests: [''],
      contentSource: 'structured',
      sourceDocumentId: null,
      sourceImportId: null,
      derivedFromResumeId: null,
      derivedFromVersionId: null,
      targetJobDescriptionId: null,
      freeBlocks: [],
      status: 'active',
    };

    // Create a new resume document
    const newResume = await Resume.create({
      userId: req.user._id,
      title,
      ...defaultResumeData,
      ...req.body,
    });
    res.status(201).json(newResume);
  } catch (error) {
    res.status(500).json({ message: "Failed to create resume", error: error.message });
  }
};

// Get Function
export const getUserResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id }).sort({ updatedAt: -1 })
    res.json(resumes)
  } catch (error) {
    res.status(500).json({ message: "Failed to get resumes", error: error.message });
  }
}

//Get resume by id
export const getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id })

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }
    res.json(resume)
  } catch (error) {
    res.status(500).json({ message: "Failed to get resume by id", error: error.message });
  }
}

// update resumes
export const updateResume = async (req, res) => {
  try {
    console.log('Update request for resume:', req.params.id)

    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id })
    if (!resume) {
      return res.status(404).json({ message: "Resume not found or not authorized" });
    }

    // Update each field individually to avoid issues with nested objects and _id
    if (req.body.title !== undefined) resume.title = req.body.title
    if (req.body.thumbnailLink !== undefined) resume.thumbnailLink = req.body.thumbnailLink
    if (req.body.completion !== undefined) resume.completion = req.body.completion
    if (req.body.contentSource !== undefined) resume.contentSource = req.body.contentSource
    if (req.body.sourceDocumentId !== undefined) resume.sourceDocumentId = req.body.sourceDocumentId
    if (req.body.sourceImportId !== undefined) resume.sourceImportId = req.body.sourceImportId
    if (req.body.derivedFromResumeId !== undefined) resume.derivedFromResumeId = req.body.derivedFromResumeId
    if (req.body.derivedFromVersionId !== undefined) resume.derivedFromVersionId = req.body.derivedFromVersionId
    if (req.body.targetJobDescriptionId !== undefined) resume.targetJobDescriptionId = req.body.targetJobDescriptionId
    if (req.body.freeBlocks !== undefined) resume.freeBlocks = req.body.freeBlocks
    if (req.body.status !== undefined) resume.status = req.body.status

    if (req.body.profileInfo) resume.profileInfo = { ...resume.profileInfo, ...req.body.profileInfo }
    if (req.body.contactInfo) resume.contactInfo = { ...resume.contactInfo, ...req.body.contactInfo }
    if (req.body.template) resume.template = req.body.template

    if (req.body.workExperience) resume.workExperience = req.body.workExperience
    if (req.body.education) resume.education = req.body.education
    if (req.body.skills) resume.skills = req.body.skills
    if (req.body.projects) resume.projects = req.body.projects
    if (req.body.certifications) resume.certifications = req.body.certifications
    if (req.body.languages) resume.languages = req.body.languages
    if (req.body.interests) resume.interests = req.body.interests

    // Save updated resume
    const savedResume = await resume.save()
    console.log('Resume updated successfully')
    res.json(savedResume)
  } catch (error) {
    console.error('Update resume error:', error)
    res.status(500).json({ message: "Failed to update resume", error: error.message });
  }
}

// Delete resumes
export const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id })
    if (!resume) {
      return res.status(404).json({ message: "Resume not found or not authorized" });
    }

    // create a uploads and store the resume there
    const uploadsFolder = path.join(process.cwd(), 'uploads')

    //delete thummnail function 
    if (resume.thumbnailLink) {
      const oldThumbnail = path.join(uploadsFolder, path.basename(resume.thumbnailLink))
      if (fs.existsSync(oldThumbnail)) {
        fs.unlinkSync(oldThumbnail)
      }
    }

    if (resume.profileInfo?.profilePreviewUrl) {
      const oldProfile = path.join(
        uploadsFolder,
        path.basename(resume.profileInfo?.profilePreviewUrl)
      )
      if (fs.existsSync(oldProfile)) {
        fs.unlinkSync(oldProfile)
      }
    }

    // delete resume
    const deleted = await Resume.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
    if (!deleted) {
      return res.status(404).json({ message: "Resume not found or not authorized" });
    }
    res.json({ message: "Resume deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Failed to delete resume", error: error.message });
  }
}
