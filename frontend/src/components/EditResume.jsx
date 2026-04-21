import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import DashboardLayout from './DashboardLayout'
import { containerStyles, iconStyles, statusStyles } from '../assets/dummystyle'
import StepProgress from './StepProgress'
import {
  ProfileInfoForm,
  ContactInfoForm,
  WorkExperienceForm,
  EducationDetailsForm,
  SkillsInfoForm,
  ProjectDetailForm,
  CertificationInfoForm,
  AdditionalInfoForm
} from './Forms'
import axiosInstance from '../utils/axiosInstance'
import { API_PATHS } from '../utils/apiPaths'
import { Loader2, Check } from 'lucide-react'
import html2canvas from 'html2canvas'
import { fixTailwindColors, dataURLtoFile } from '../utils/helper'
import ThemeSelector from './ThemeSelector'
import RenderResume from './RenderResume'
import Modal from './Modal'
import { useTranslation } from 'react-i18next'
import ResumeVersionManager from './ResumeVersionManager.jsx'
import ResumeEditorHeader from './resume-editor/ResumeEditorHeader.jsx'
import ResumePreviewPanel from './resume-editor/ResumePreviewPanel.jsx'
import ResumeEditorActions from './resume-editor/ResumeEditorActions.jsx'
import { exportResumeAsPdf } from '../services/resumeExportService.js'



// resize obserber hook
const useResizeObserver = () => {
  const [size, setSize] = useState({ width: 0, height: 0 })
  const ref = useCallback((node) => {
    if (node) {
      const resizeObserver = new ResizeObserver(entries => {
        setSize({ width: entries[0].contentRect.width, height: entries[0].contentRect.height })
      })

      resizeObserver.observe(node)
    }
  }, [])
  return { ...size, ref }
}

const EditResume = () => {
  const { id: resumeId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { t } = useTranslation()
  const resumeDownloadRef = useRef(null)
  const thumbnailRef = useRef(null)

  const [openThemeSelector, setOpenThemeSelector] = useState(false)
  const [openPreviewModal, setOpenPreviewModal] = useState(false)
  const [openVersionModal, setOpenVersionModal] = useState(false)
  const [currentPage, setCurrentPage] = useState("profile-info")
  const pages = ["profile-info", "contact-info", "work-experience", "education-info", "skills", "projects", "certifications", "additionalInfo"]
  const [progress, setProgress] = useState(Math.round((pages.indexOf("profile-info") / (pages.length - 1)) * 100))
  const [isLoading, setIsLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [markdownSyncing, setMarkdownSyncing] = useState(false)
  const [markdownSyncState, setMarkdownSyncState] = useState({
    hasDocument: false,
    syncStatus: 'not_synced',
    lastSyncedAt: null,
  })

  const { width: previewWidth, ref: previewContainerRef } = useResizeObserver();

  const [resumeData, setResumeData] = useState({
    title: "Professional Resume",
    thumbnailLink: "",
    profileInfo: {
      fullName: "",
      designation: "",
      summary: "",
    },
    template: {
      theme: "01",
      colorPalette: []
    },
    contactInfo: {
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      github: "",
      website: "",
    },
    workExperience: [
      {
        company: "",
        role: "",
        startDate: "",
        endDate: "",
        description: "",
      },
    ],
    education: [
      {
        degree: "",
        institution: "",
        startDate: "",
        endDate: "",
      },
    ],
    skills: [
      {
        name: "",
        progress: 0,
      },
    ],
    projects: [
      {
        title: "",
        description: "",
        github: "",
        liveDemo: "",
      },
    ],
    certifications: [
      {
        title: "",
        issuer: "",
        year: "",
      },
    ],
    languages: [
      {
        name: "",
        progress: 0,
      },
    ],
    interests: [""],
    freeBlocks: [],
  })

  // Calculate completion percentage
  const calculateCompletion = () => {
    let completedFields = 0;
    let totalFields = 0;

    // Profile Info
    totalFields += 3;
    if (resumeData.profileInfo.fullName) completedFields++;
    if (resumeData.profileInfo.designation) completedFields++;
    if (resumeData.profileInfo.summary) completedFields++;

    // Contact Info
    totalFields += 2;
    if (resumeData.contactInfo.email) completedFields++;
    if (resumeData.contactInfo.phone) completedFields++;

    // Work Experience
    resumeData.workExperience.forEach(exp => {
      totalFields += 5;
      if (exp.company) completedFields++;
      if (exp.role) completedFields++;
      if (exp.startDate) completedFields++;
      if (exp.endDate) completedFields++;
      if (exp.description) completedFields++;
    });

    // Education
    resumeData.education.forEach(edu => {
      totalFields += 4;
      if (edu.degree) completedFields++;
      if (edu.institution) completedFields++;
      if (edu.startDate) completedFields++;
      if (edu.endDate) completedFields++;
    });

    // Skills
    resumeData.skills.forEach(skill => {
      totalFields += 2;
      if (skill.name) completedFields++;
      if (skill.progress > 0) completedFields++;
    });

    // Projects
    resumeData.projects.forEach(project => {
      totalFields += 4;
      if (project.title) completedFields++;
      if (project.description) completedFields++;
      if (project.github) completedFields++;
      if (project.liveDemo) completedFields++;
    });

    // Certifications
    resumeData.certifications.forEach(cert => {
      totalFields += 3;
      if (cert.title) completedFields++;
      if (cert.issuer) completedFields++;
      if (cert.year) completedFields++;
    });

    // Languages
    resumeData.languages.forEach(lang => {
      totalFields += 2;
      if (lang.name) completedFields++;
      if (lang.progress > 0) completedFields++;
    });

    // Interests
    totalFields += resumeData.interests.length;
    completedFields += resumeData.interests.filter(i => i.trim() !== "").length;

    const percentage = Math.round((completedFields / totalFields) * 100);
    setCompletionPercentage(percentage);
    return percentage;
  };

  useEffect(() => {
    calculateCompletion();
  }, [resumeData]);

  // Validate Inputs
  const validateAndNext = (e) => {
    const errors = []

    switch (currentPage) {
      case "profile-info":
        const { fullName, designation, summary } = resumeData.profileInfo
        if (!fullName.trim()) errors.push(t('editResume.validation.fullNameRequired'))
        if (!designation.trim()) errors.push(t('editResume.validation.designationRequired'))
        if (!summary.trim()) errors.push(t('editResume.validation.summaryRequired'))
        break

      case "contact-info":
        const { email, phone } = resumeData.contactInfo
        if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) errors.push(t('editResume.validation.validEmailRequired'))
        if (!phone.trim() || !/^\d{11}$/.test(phone)) errors.push(t('editResume.validation.validPhoneRequired'))
        break

      case "work-experience":
        resumeData.workExperience.forEach(({ company, role, startDate, endDate }, index) => {
          if (!company || !company.trim()) errors.push(t('editResume.validation.companyRequired', { index: index + 1 }))
          if (!role || !role.trim()) errors.push(t('editResume.validation.roleRequired', { index: index + 1 }))
          if (!startDate || !endDate) errors.push(t('editResume.validation.datesRequired', { index: index + 1 }))
        })
        break

      case "education-info":
        resumeData.education.forEach(({ degree, institution, startDate, endDate }, index) => {
          if (!degree.trim()) errors.push(t('editResume.validation.degreeRequired', { index: index + 1 }))
          if (!institution.trim()) errors.push(t('editResume.validation.institutionRequired', { index: index + 1 }))
          if (!startDate || !endDate) errors.push(t('editResume.validation.eduDatesRequired', { index: index + 1 }))
        })
        break

      case "skills":
        resumeData.skills.forEach(({ name, progress }, index) => {
          if (!name.trim()) errors.push(t('editResume.validation.skillNameRequired', { index: index + 1 }))
          if (progress < 1 || progress > 100)
            errors.push(t('editResume.validation.skillProgressRange', { index: index + 1 }))
        })
        break

      case "projects":
        resumeData.projects.forEach(({ title, description }, index) => {
          if (!title.trim()) errors.push(t('editResume.validation.projectTitleRequired', { index: index + 1 }))
          if (!description.trim()) errors.push(t('editResume.validation.projectDescRequired', { index: index + 1 }))
        })
        break

      case "certifications":
        resumeData.certifications.forEach(({ title = "", issuer = "", year = "" }, index) => {
          const hasAnyValue = [title, issuer, year].some((value) => value.trim())
          if (!hasAnyValue) return

          if (!title.trim()) errors.push(t('editResume.validation.certTitleRequired', { index: index + 1 }))
          if (!issuer.trim()) errors.push(t('editResume.validation.issuerRequired', { index: index + 1 }))
        })
        break

      case "additionalInfo":
        if (resumeData.languages.length === 0 || !resumeData.languages[0].name?.trim()) {
          errors.push(t('editResume.validation.languageRequired'))
        }
        if (resumeData.interests.length === 0 || !resumeData.interests[0]?.trim()) {
          errors.push(t('editResume.validation.interestRequired'))
        }
        break

      default:
        break
    }

    if (errors.length > 0) {
      setErrorMsg(errors.join(", "))
      return
    }

    setErrorMsg("")
    goToNextStep()
  }

  const goToNextStep = () => {
    if (currentPage === "additionalInfo") setOpenPreviewModal(true)

    const currentIndex = pages.indexOf(currentPage)
    if (currentIndex !== -1 && currentIndex < pages.length - 1) {
      const nextIndex = currentIndex + 1
      setCurrentPage(pages[nextIndex])

      const percent = Math.round((nextIndex / (pages.length - 1)) * 100)
      setProgress(percent)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const goBack = () => {
    if (currentPage === "profile-info") navigate("/dashboard")

    const currentIndex = pages.indexOf(currentPage)
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1
      setCurrentPage(pages[prevIndex])

      const percent = Math.round((prevIndex / (pages.length - 1)) * 100)
      setProgress(percent)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const renderForm = () => {
    switch (currentPage) {
      case "profile-info":
        return (
          <ProfileInfoForm
            profileData={resumeData?.profileInfo}
            updateSection={(key, value) => updateSection("profileInfo", key, value)}
            onNext={validateAndNext}
          />
        )

      case "contact-info":
        return (
          <ContactInfoForm
            contactInfo={resumeData?.contactInfo}
            updateSection={(key, value) => updateSection("contactInfo", key, value)}
          />
        )

      case "work-experience":
        return (
          <WorkExperienceForm
            workExperience={resumeData?.workExperience}
            updateArrayItem={(index, key, value) => {
              updateArrayItem("workExperience", index, key, value)
            }}
            addArrayItem={(newItem) => addArrayItem("workExperience", newItem)}
            removeArrayItem={(index) => removeArrayItem("workExperience", index)}
          />
        )

      case "education-info":
        return (
          <EducationDetailsForm
            educationInfo={resumeData?.education}
            updateArrayItem={(index, key, value) => {
              updateArrayItem("education", index, key, value)
            }}
            addArrayItem={(newItem) => addArrayItem("education", newItem)}
            removeArrayItem={(index) => removeArrayItem("education", index)}
          />
        )

      case "skills":
        return (
          <SkillsInfoForm
            skillsInfo={resumeData?.skills}
            updateArrayItem={(index, key, value) => {
              updateArrayItem("skills", index, key, value)
            }}
            addArrayItem={(newItem) => addArrayItem("skills", newItem)}
            removeArrayItem={(index) => removeArrayItem("skills", index)}
          />
        )

      case "projects":
        return (
          <ProjectDetailForm
            projectInfo={resumeData?.projects}
            updateArrayItem={(index, key, value) => {
              updateArrayItem("projects", index, key, value)
            }}
            addArrayItem={(newItem) => addArrayItem("projects", newItem)}
            removeArrayItem={(index) => removeArrayItem("projects", index)}
          />
        )

      case "certifications":
        return (
          <CertificationInfoForm
            certifications={resumeData?.certifications}
            updateArrayItem={(index, key, value) => {
              updateArrayItem("certifications", index, key, value)
            }}
            addArrayItem={(newItem) => addArrayItem("certifications", newItem)}
            removeArrayItem={(index) => removeArrayItem("certifications", index)}
          />
        )

      case "additionalInfo":
        return (
          <AdditionalInfoForm
            languages={resumeData.languages}
            interests={resumeData.interests}
            freeBlocks={resumeData.freeBlocks || []}
            updateArrayItem={(section, index, key, value) => updateArrayItem(section, index, key, value)}
            addArrayItem={(section, newItem) => addArrayItem(section, newItem)}
            removeArrayItem={(section, index) => removeArrayItem(section, index)}
          />
        )

      default:
        return null
    }
  }

  const updateSection = (section, key, value) => {
    setResumeData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }))
  }

  const updateArrayItem = (section, index, key, value) => {
    setResumeData((prev) => {
      const updatedArray = [...prev[section]]

      if (key === null) {
        updatedArray[index] = value
      } else {
        updatedArray[index] = {
          ...updatedArray[index],
          [key]: value,
        }
      }

      return {
        ...prev,
        [section]: updatedArray,
      }
    })
  }

  const addArrayItem = (section, newItem) => {
    setResumeData((prev) => ({
      ...prev,
      [section]: [...prev[section], newItem],
    }))
  }

  const removeArrayItem = (section, index) => {
    setResumeData((prev) => {
      const updatedArray = [...prev[section]]
      updatedArray.splice(index, 1)
      return {
        ...prev,
        [section]: updatedArray,
      }
    })
  }

  const fetchResumeDetailsById = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.RESUME.GET_BY_ID(resumeId))

      if (response.data && response.data.profileInfo) {
        const resumeInfo = response.data

        setResumeData((prevState) => ({
          ...prevState,
          title: resumeInfo?.title || "Untitled",
          template: resumeInfo?.template || prevState?.template,
          profileInfo: resumeInfo?.profileInfo || prevState?.profileInfo,
          contactInfo: resumeInfo?.contactInfo || prevState?.contactInfo,
          workExperience: resumeInfo?.workExperience || prevState?.workExperience,
          education: resumeInfo?.education || prevState?.education,
          skills: resumeInfo?.skills || prevState?.skills,
          projects: resumeInfo?.projects || prevState?.projects,
          certifications: resumeInfo?.certifications || prevState?.certifications,
          languages: resumeInfo?.languages || prevState?.languages,
          interests: resumeInfo?.interests || prevState?.interests,
          freeBlocks: resumeInfo?.freeBlocks || prevState?.freeBlocks,
        }))

        if (resumeInfo?.sourceDocumentId) {
          try {
            const markdownResponse = await axiosInstance.get(API_PATHS.RESUME.GET_MARKDOWN(resumeId))
            setMarkdownSyncState({
              hasDocument: true,
              syncStatus: markdownResponse.data.syncStatus || 'not_synced',
              lastSyncedAt: markdownResponse.data.lastSyncedAt || null,
            })
          } catch (markdownError) {
            setMarkdownSyncState({
              hasDocument: true,
              syncStatus: 'error',
              lastSyncedAt: null,
            })
          }
        } else {
          setMarkdownSyncState({
            hasDocument: false,
            syncStatus: 'not_synced',
            lastSyncedAt: null,
          })
        }
      }
    } catch (error) {
      console.error("Error fetching resume:", error)
      toast.error(t('editResume.toast.loadingFailed'))
    }
  }

  const uploadResumeImages = async () => {
    try {
      setIsLoading(true)

      const thumbnailElement = thumbnailRef.current
      if (!thumbnailElement) {
        throw new Error("Thumbnail element not found")
      }

      // Clone the thumbnail element and prepare it for html2canvas
      const fixedThumbnail = fixTailwindColors(thumbnailElement)

      if (!fixedThumbnail) {
        throw new Error("Failed to process thumbnail element")
      }

      // Position the clone off-screen and add it to DOM (required by html2canvas)
      fixedThumbnail.style.position = "absolute"
      fixedThumbnail.style.top = "-9999px"
      fixedThumbnail.style.left = "0"
      fixedThumbnail.style.opacity = "0"
      const { width, height } = thumbnailElement.getBoundingClientRect()
      fixedThumbnail.style.width = `${width}px`
      fixedThumbnail.style.height = `${height}px`
      document.body.appendChild(fixedThumbnail)

      // Create a style override to ensure consistent colors
      const override = document.createElement("style")
      override.id = "__pdf_color_override__"
      override.textContent = `
        * {
          color: #000 !important;
          background-color: #fff !important;
          border-color: #000 !important;
          box-shadow: none !important;
        }
      `
      document.head.appendChild(override)

      let thumbnailCanvas
      try {
        thumbnailCanvas = await html2canvas(fixedThumbnail, {
          scale: 0.5,
          backgroundColor: "#FFFFFF",
          logging: false,
          useCORS: true,
        })
      } finally {
        // Clean up: remove clone and style override
        if (document.body.contains(fixedThumbnail)) {
          document.body.removeChild(fixedThumbnail)
        }
        const existingOverride = document.getElementById("__pdf_color_override__")
        if (existingOverride) {
          document.head.removeChild(existingOverride)
        }
      }

      const thumbnailDataUrl = thumbnailCanvas.toDataURL("image/png")
      const thumbnailFile = dataURLtoFile(
        thumbnailDataUrl,
        `thumbnail-${resumeId}.png`
      )

      const formData = new FormData()
      formData.append("thumbnail", thumbnailFile)

      const uploadResponse = await axiosInstance.put(
        API_PATHS.RESUME.UPLOAD_IMAGES(resumeId),
        formData
        // Remove Content-Type header - browser sets it automatically for FormData
      )

      const thumbnailLink = uploadResponse.data?.thumbnailLink || resumeData.thumbnailLink || ""
      await updateResumeDetails(thumbnailLink)

      toast.success(t('editResume.toast.updated'))
      navigate("/dashboard")
    } catch (error) {
      console.error("Error Uploading Images:", error)

      try {
        await updateResumeDetails(resumeData.thumbnailLink || "")
        toast.success(t('editResume.toast.updated'))
        navigate("/dashboard")
      } catch (updateError) {
        console.error("Error saving resume after upload failure:", updateError)
        toast.error(t('editResume.toast.uploadFailed'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const updateResumeDetails = async (thumbnailLink) => {
    // Don't set isLoading here - it's already managed by uploadResumeImages
    // This prevents race conditions and UI state flickering

    try {
      await axiosInstance.put(API_PATHS.RESUME.UPDATE(resumeId), {
        ...resumeData,
        thumbnailLink: thumbnailLink || "",
        completion: completionPercentage,
      })

      if (markdownSyncState.hasDocument) {
        setMarkdownSyncState((prev) => ({
          ...prev,
          syncStatus: 'outdated',
        }))
      }
    } catch (err) {
      console.error("Error updating resume:", err)
      // Re-throw the error so the caller can handle it
      throw new Error("Failed to update resume details")
    }
  }

  const handleDeleteResume = async () => {
    try {
      setIsLoading(true)
      await axiosInstance.delete(API_PATHS.RESUME.DELETE(resumeId))
      toast.success(t('editResume.toast.deleted'))
      navigate("/dashboard")
    } catch (error) {
      console.error("Error deleting resume:", error)
      toast.error(t('editResume.toast.deleteFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const downloadPDF = async () => {
    const element = resumeDownloadRef.current
    if (!element) {
      toast.error(t('editResume.toast.pdfErrorDetail'))
      return
    }

    setIsDownloading(true)
    setDownloadSuccess(false)
    const toastId = toast.loading(t('editResume.toast.pdfGenerating'))

    try {
      await exportResumeAsPdf({
        element,
        fileName: `${resumeData.title.replace(/[^a-z0-9]/gi, "_")}.pdf`,
        resumeId,
        templateId: resumeData?.template?.theme || '01',
        triggerSource: 'editor',
      })

      toast.success(t('editResume.toast.pdfSuccess'), { id: toastId })
      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 3000)
    } catch (err) {
      console.error('PDF error:', err)
      toast.error(t('editResume.toast.pdfError'), { id: toastId })
    } finally {
      setIsDownloading(false)
    }
  }

  const updateTheme = (theme) => {
    setResumeData(prev => ({
      ...prev,
      template: {
        theme: theme,
        colorPalette: []
      }
    }));
  }

  const handleSyncMarkdown = async () => {
    try {
      setMarkdownSyncing(true)
      const response = await axiosInstance.post(API_PATHS.RESUME.SYNC_MARKDOWN_FROM_RESUME(resumeId), {
        title: `${resumeData.title || 'Resume'} Markdown`,
      })

      setMarkdownSyncState({
        hasDocument: true,
        syncStatus: response.data.document?.syncStatus || 'synced',
        lastSyncedAt: response.data.document?.lastSyncedAt || new Date().toISOString(),
      })

      toast.success('已根据当前表单内容同步 Markdown')
    } catch (error) {
      console.error('Error syncing markdown from resume:', error)
      toast.error('同步 Markdown 失败')
    } finally {
      setMarkdownSyncing(false)
    }
  }

  useEffect(() => {
    if (resumeId) {
      fetchResumeDetailsById()
    }
  }, [resumeId])

  useEffect(() => {
    if (searchParams.get('openVersions') === '1') {
      setOpenVersionModal(true)
    }
  }, [searchParams])

  return (
    <div>
      <DashboardLayout>
        <div className={containerStyles.main}>
          <ResumeEditorHeader
            title={resumeData.title}
            setTitle={(value) => setResumeData(prev => ({ ...prev, title: value }))}
            onOpenMarkdown={() => navigate(`/resume/${resumeId}/markdown`)}
            onSyncMarkdown={handleSyncMarkdown}
            markdownSyncing={markdownSyncing}
            markdownSyncState={markdownSyncState}
            onOpenVersions={() => setOpenVersionModal(true)}
            onOpenThemeSelector={() => setOpenThemeSelector(true)}
            onOpenOutputCenter={() => navigate(`/share?resumeId=${resumeId}`)}
            onDeleteResume={handleDeleteResume}
            onOpenPreview={() => setOpenPreviewModal(true)}
            isLoading={isLoading}
            t={t}
          />

          {markdownSyncState.hasDocument && (
            <div className='mb-6 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900'>
              <div className='font-semibold'>Markdown 同步提醒</div>
              <div className='mt-1'>
                当前 Markdown 文档状态：{markdownSyncState.syncStatus}
                {markdownSyncState.lastSyncedAt ? `，上次同步时间：${new Date(markdownSyncState.lastSyncedAt).toLocaleString('zh-CN')}` : ''}
              </div>
              <div className='mt-2'>
                如果你刚修改了表单内容，建议进入 Markdown 模式重新生成，避免两种编辑模式的内容不同步。
              </div>
              <button
                onClick={() => navigate(`/resume/${resumeId}/markdown`)}
                className='mt-3 rounded-2xl border border-amber-300 bg-white px-4 py-2 font-semibold text-amber-800'
              >
                前往 Markdown 模式处理同步
              </button>
            </div>
          )}

          {searchParams.get('derivedFromJob') === '1' && (
            <div className='mb-6 rounded-3xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-900'>
              <div className='font-semibold'>岗位定制版简历</div>
              <div className='mt-1'>当前简历来自岗位闭环派生，建议优先围绕目标岗位关键词、项目成果和工作经历进行定向优化。</div>
              <div className='mt-3 flex flex-wrap gap-3'>
                {searchParams.get('jobDescriptionId') && (
                  <button
                    onClick={() => navigate(`/jobs?resumeId=${resumeId}&jobId=${searchParams.get('jobDescriptionId')}`)}
                    className='rounded-2xl border border-sky-300 bg-white px-4 py-2 font-semibold text-sky-800'
                  >
                    返回岗位分析页
                  </button>
                )}
                {searchParams.get('versionId') && (
                  <button
                    onClick={() => setOpenVersionModal(true)}
                    className='rounded-2xl border border-sky-300 bg-white px-4 py-2 font-semibold text-sky-800'
                  >
                    查看关联版本
                  </button>
                )}
                <button
                  onClick={() => {
                    const next = new URLSearchParams(searchParams)
                    next.delete('derivedFromJob')
                    setSearchParams(next)
                  }}
                  className='rounded-2xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700'
                >
                  关闭提示
                </button>
              </div>
            </div>
          )}

          <div className={containerStyles.grid}>
            <div className={containerStyles.formContainer}>
              <StepProgress progress={progress} />
              {renderForm()}
              <ResumeEditorActions
                errorMsg={errorMsg}
                goBack={goBack}
                uploadResumeImages={uploadResumeImages}
                validateAndNext={validateAndNext}
                currentPage={currentPage}
                isLoading={isLoading}
                t={t}
              />
            </div>

            <ResumePreviewPanel
              completionPercentage={completionPercentage}
              previewContainerRef={previewContainerRef}
              previewWidth={previewWidth}
              templateId={resumeData?.template?.theme || '01'}
              resumeData={resumeData}
              t={t}
            />
          </div>
        </div>

        <Modal isOpen={openThemeSelector} onClose={() => setOpenThemeSelector(false)} title={t('editResume.modal.changeTheme')}>
          <div className={containerStyles.modalContent}>
            <ThemeSelector selectedTheme={resumeData?.template?.theme}
              setSelectedTheme={updateTheme} resumeData={resumeData} onClose={() => setOpenThemeSelector(false)}
            />
          </div>
        </Modal>

        <Modal isOpen={openVersionModal} onClose={() => setOpenVersionModal(false)} title='历史版本管理'>
          <div className={containerStyles.modalContent}>
            <ResumeVersionManager
              resumeId={resumeId}
              highlightVersionId={searchParams.get('versionId') || ''}
              onRestore={(restoredResume) => {
                setResumeData((prevState) => ({
                  ...prevState,
                  title: restoredResume?.title || prevState.title,
                  template: restoredResume?.template || prevState.template,
                  profileInfo: restoredResume?.profileInfo || prevState.profileInfo,
                  contactInfo: restoredResume?.contactInfo || prevState.contactInfo,
                  workExperience: restoredResume?.workExperience || prevState.workExperience,
                  education: restoredResume?.education || prevState.education,
                  skills: restoredResume?.skills || prevState.skills,
                  projects: restoredResume?.projects || prevState.projects,
                  certifications: restoredResume?.certifications || prevState.certifications,
                  languages: restoredResume?.languages || prevState.languages,
                  interests: restoredResume?.interests || prevState.interests,
                  freeBlocks: restoredResume?.freeBlocks || prevState.freeBlocks,
                }))
              }}
            />
          </div>
        </Modal>

        <Modal isOpen={openPreviewModal} onClose={() => setOpenPreviewModal(false)}
          title={resumeData.title}
          showActionBtn
          actionBtnText={isDownloading ? t('editResume.modal.generating')
            : downloadSuccess ? t('editResume.modal.downloaded') : t('editResume.modal.downloadPDF')}
          actionBtnIcon={
            isLoading ? (
              <Loader2 size={16} className='animate-spin' />
            ) :
                downloadSuccess ? (
                  <Check size={16} className=' text-white'/>
                ) : (
                    <Download size={16} />
                )
          }
          onActionBtnClick={downloadPDF}
        >
          <div className=' relative'>
            <div className=' text-center mb-4'>
              <div className={statusStyles.modalBadge}>
                <div className={iconStyles.pulseDot}></div>
                <span >{t('editResume.completion')}: {completionPercentage}% {t('editResume.completion')}</span>
              </div>
            </div>

            <div className={containerStyles.pdfPreview}>
              <div ref={resumeDownloadRef} className=' a4-wrapper'>
                <div className=' w-full h-full'>
                  <RenderResume key={`pdf-${resumeData?.template?.theme}`}
                    templateId={resumeData?.template?.theme || ''}
                    resumeData={resumeData}
                    containerWidth={null}
                  ></RenderResume>
                </div>
              </div>
            </div>
          </div>
        </Modal>

        <div style={{ display: 'none' }} ref={thumbnailRef}>
          <div className={containerStyles.hiddenThumbnail}>
            <RenderResume key={`thumbnail-${resumeData?.template?.theme}`}
              templateId={resumeData?.template?.theme || ''}
              resumeData={resumeData}
              containerWidth={null}
            ></RenderResume>
          </div>
        </div>
      </DashboardLayout>
    </div>
  )
}

export default EditResume
