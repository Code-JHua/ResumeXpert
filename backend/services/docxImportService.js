import mammoth from 'mammoth'
import { mapPdfTextToResumeDraft } from './pdfImportService.js'

export const extractDocxText = async (base64Content) => {
  const buffer = Buffer.from(base64Content, 'base64')
  const result = await mammoth.extractRawText({ buffer })

  return {
    rawText: result.value || '',
    messages: result.messages || [],
  }
}

export const mapDocxTextToResumeDraft = (rawText = '') => {
  return mapPdfTextToResumeDraft(rawText)
}
