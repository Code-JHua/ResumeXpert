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

export const exportResumeAsPdf = async ({ element, fileName, resumeId, templateId }) => {
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
      })
    }
  } catch (error) {
    if (resumeId) {
      await recordExportLog(resumeId, {
        format: 'pdf',
        templateId,
        status: 'failed',
        metadata: {
          message: error.message,
        },
      })
    }
    throw error
  } finally {
    removePdfOverride()
  }
}
