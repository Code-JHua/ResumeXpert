import html2pdf from 'html2pdf.js'
import axiosInstance from '../utils/axiosInstance'
import { API_PATHS } from '../utils/apiPaths'

const PDF_OVERRIDE_ID = '__pdf_color_override__'

const applyPdfOverride = () => {
  const override = document.createElement('style')
  override.id = PDF_OVERRIDE_ID
  override.textContent = `
    * {
      color: #000 !important;
      background-color: #fff !important;
      border-color: #000 !important;
    }
  `
  document.head.appendChild(override)
}

const removePdfOverride = () => {
  document.getElementById(PDF_OVERRIDE_ID)?.remove()
}

export const recordExportLog = async (resumeId, payload) => {
  try {
    await axiosInstance.post(API_PATHS.RESUME.CREATE_EXPORT_LOG(resumeId), payload)
  } catch (error) {
    console.error('Failed to record export log:', error)
  }
}

export const getResumeMarkdownExport = async (resumeId) => {
  const response = await axiosInstance.get(API_PATHS.RESUME.EXPORT_MARKDOWN(resumeId))
  return response.data
}

export const exportResumeAsDocx = async ({ resumeId, fileName, triggerSource = 'output_center' }) => {
  const response = await axiosInstance.get(API_PATHS.RESUME.EXPORT_DOCX(resumeId), {
    responseType: 'blob',
    params: {
      triggerSource,
    },
  })

  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
  const url = URL.createObjectURL(blob)
  const anchor = window.document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

export const exportResumeAsPdf = async ({ element, fileName, resumeId, templateId, triggerSource = 'editor' }) => {
  const startedAt = Date.now()
  applyPdfOverride()

  try {
    await html2pdf()
      .set({
        margin: 0,
        filename: fileName,
        image: { type: 'png', quality: 1.0 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#FFFFFF',
          logging: false,
          windowWidth: element.scrollWidth,
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
        },
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy'],
        },
      })
      .from(element)
      .save()

    if (resumeId) {
      await recordExportLog(resumeId, {
        format: 'pdf',
        templateId,
        status: 'success',
        fileName,
        triggerSource,
        exportDurationMs: Date.now() - startedAt,
      })
    }
  } catch (error) {
    if (resumeId) {
      await recordExportLog(resumeId, {
        format: 'pdf',
        templateId,
        status: 'failed',
        fileName,
        triggerSource,
        errorMessage: error.message,
        exportDurationMs: Date.now() - startedAt,
        metadata: {
          message: error.message,
        }
      })
    }
    throw error
  } finally {
    removePdfOverride()
  }
}

export const exportResumeAsMarkdown = async ({ resumeId, fileName, triggerSource = 'output_center' }) => {
  const startedAt = Date.now()

  try {
    const response = await getResumeMarkdownExport(resumeId)

    if (response.status === 'not_ready') {
      await recordExportLog(resumeId, {
        format: 'markdown',
        status: 'failed',
        fileName,
        triggerSource,
        errorMessage: response.message,
        exportDurationMs: Date.now() - startedAt,
        metadata: {
          status: 'not_ready',
        },
      })

      return response
    }

    const content = response.content || ''
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = window.document.createElement('a')
    anchor.href = url
    anchor.download = fileName
    anchor.click()
    URL.revokeObjectURL(url)

    await recordExportLog(resumeId, {
      format: 'markdown',
      status: 'success',
      fileName,
      triggerSource,
      exportDurationMs: Date.now() - startedAt,
    })

    return response
  } catch (error) {
    await recordExportLog(resumeId, {
      format: 'markdown',
      status: 'failed',
      fileName,
      triggerSource,
      errorMessage: error.message,
      exportDurationMs: Date.now() - startedAt,
      metadata: {
        message: error.message,
      },
    })
    throw error
  }
}
