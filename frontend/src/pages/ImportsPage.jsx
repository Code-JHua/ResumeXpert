import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import axiosInstance from '../utils/axiosInstance'
import { API_PATHS } from '../utils/apiPaths'
import toast from 'react-hot-toast'
import { formatDateTime } from '../utils/career'

const getImportAction = (item) => {
  if (item.status === 'confirmed' && item.confirmedResumeId) {
    return {
      label: '打开简历',
      onClickPath: `/resume/${item.confirmedResumeId}`,
    }
  }

  if (item.status === 'failed') {
    return {
      label: '查看失败详情',
      onClickPath: `/imports/${item._id}/confirm`,
    }
  }

  return {
    label: '继续确认',
    onClickPath: `/imports/${item._id}/confirm`,
  }
}

const ImportsPage = () => {
  const navigate = useNavigate()
  const [mode, setMode] = useState('markdown')
  const [markdownText, setMarkdownText] = useState('')
  const [selectedMarkdownFileName, setSelectedMarkdownFileName] = useState('')
  const [selectedPdfFileName, setSelectedPdfFileName] = useState('')
  const [pdfBase64Content, setPdfBase64Content] = useState('')
  const [selectedDocxFileName, setSelectedDocxFileName] = useState('')
  const [docxBase64Content, setDocxBase64Content] = useState('')
  const [imports, setImports] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const fetchImports = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.IMPORTS.GET_ALL)
      setImports(response.data)
    } catch (error) {
      toast.error('加载导入记录失败')
    }
  }

  useEffect(() => {
    fetchImports()
  }, [])

  const handleMarkdownFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const text = await file.text()
    setMarkdownText(text)
    setSelectedMarkdownFileName(file.name)
  }

  const handlePdfFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    let binary = ''
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte)
    })

    setPdfBase64Content(btoa(binary))
    setSelectedPdfFileName(file.name)
  }

  const handleDocxFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    let binary = ''
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte)
    })

    setDocxBase64Content(btoa(binary))
    setSelectedDocxFileName(file.name)
  }

  const handleMarkdownImport = async () => {
    if (!markdownText.trim()) {
      toast.error('请先粘贴或选择 Markdown 内容')
      return
    }

    try {
      setSubmitting(true)
      const response = await axiosInstance.post(API_PATHS.IMPORTS.CREATE_MARKDOWN, {
        rawText: markdownText,
        originalFileName: selectedMarkdownFileName || 'pasted-resume.md',
      })

      toast.success('Markdown 已解析，请确认导入结果')
      fetchImports()
      navigate(`/imports/${response.data._id}/confirm`)
    } catch (error) {
      toast.error('Markdown 导入失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePdfImport = async () => {
    if (!pdfBase64Content) {
      toast.error('请先选择 PDF 文件')
      return
    }

    try {
      setSubmitting(true)
      const response = await axiosInstance.post(API_PATHS.IMPORTS.CREATE_PDF, {
        base64Content: pdfBase64Content,
        originalFileName: selectedPdfFileName || 'resume.pdf',
      })

      toast.success('PDF 已解析，请确认导入结果')
      fetchImports()
      navigate(`/imports/${response.data._id}/confirm`)
    } catch (error) {
      const failureReason = error.response?.data?.failureReason
      toast.error(failureReason || 'PDF 导入失败')
      fetchImports()
    } finally {
      setSubmitting(false)
    }
  }

  const handleDocxImport = async () => {
    if (!docxBase64Content) {
      toast.error('请先选择 DOCX 文件')
      return
    }

    try {
      setSubmitting(true)
      const response = await axiosInstance.post(API_PATHS.IMPORTS.CREATE_DOCX, {
        base64Content: docxBase64Content,
        originalFileName: selectedDocxFileName || 'resume.docx',
      })

      toast.success('DOCX 已解析，请确认导入结果')
      fetchImports()
      navigate(`/imports/${response.data._id}/confirm`)
    } catch (error) {
      const failureReason = error.response?.data?.failureReason
      toast.error(failureReason || 'DOCX 导入失败')
      fetchImports()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout activeMenu='imports'>
      <div className='space-y-8 px-4'>
        <div className='rounded-3xl bg-white p-8 border border-slate-200 shadow-sm'>
          <h1 className='text-3xl font-black text-slate-900'>导入中心</h1>
          <p className='mt-3 text-slate-600'>当前已支持 Markdown、文本型 PDF 和 Word（DOCX）导入，所有结果都会先进入确认流程，再生成正式简历。</p>
        </div>

        <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
          <div className='xl:col-span-2 rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-5'>
            <div className='flex gap-3'>
              <button
                onClick={() => setMode('markdown')}
                className={`rounded-2xl px-5 py-3 font-semibold ${mode === 'markdown' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                Markdown 导入
              </button>
              <button
                onClick={() => setMode('pdf')}
                className={`rounded-2xl px-5 py-3 font-semibold ${mode === 'pdf' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                PDF 导入
              </button>
              <button
                onClick={() => setMode('docx')}
                className={`rounded-2xl px-5 py-3 font-semibold ${mode === 'docx' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                Word 导入
              </button>
            </div>

            {mode === 'markdown' && (
              <div className='space-y-4'>
                <div className='rounded-2xl bg-slate-50 border border-slate-200 p-4'>
                  <div className='font-semibold text-slate-800 mb-2'>方式一：上传 Markdown 文件</div>
                  <input type='file' accept='.md,text/markdown' onChange={handleMarkdownFileChange} className='block w-full text-sm text-slate-600' />
                  {selectedMarkdownFileName && <div className='mt-2 text-sm text-slate-500'>已选择：{selectedMarkdownFileName}</div>}
                </div>

                <div>
                  <div className='font-semibold text-slate-800 mb-2'>方式二：直接粘贴 Markdown 内容</div>
                  <textarea
                    value={markdownText}
                    onChange={(e) => setMarkdownText(e.target.value)}
                    placeholder='# 张三&#10;前端工程师&#10;&#10;## Summary&#10;...'
                    rows={18}
                    className='w-full rounded-2xl border border-slate-200 px-4 py-3 font-mono text-sm'
                  />
                </div>

                <button
                  onClick={handleMarkdownImport}
                  disabled={submitting}
                  className='rounded-2xl bg-violet-600 px-6 py-3 text-white font-semibold disabled:opacity-60'
                >
                  {submitting ? '解析中...' : '开始导入 Markdown'}
                </button>
              </div>
            )}

            {mode === 'pdf' && (
              <div className='space-y-4'>
                <div className='rounded-2xl bg-slate-50 border border-slate-200 p-4'>
                  <div className='font-semibold text-slate-800 mb-2'>上传文本型 PDF</div>
                  <input type='file' accept='application/pdf,.pdf' onChange={handlePdfFileChange} className='block w-full text-sm text-slate-600' />
                  {selectedPdfFileName && <div className='mt-2 text-sm text-slate-500'>已选择：{selectedPdfFileName}</div>}
                </div>

                <div className='rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900'>
                  当前仅支持文本型 PDF。扫描件 / 图片型 PDF 会在后续 OCR 阶段接入。
                </div>

                <button
                  onClick={handlePdfImport}
                  disabled={submitting}
                  className='rounded-2xl bg-violet-600 px-6 py-3 text-white font-semibold disabled:opacity-60'
                >
                  {submitting ? '解析中...' : '开始导入 PDF'}
                </button>
              </div>
            )}

            {mode === 'docx' && (
              <div className='space-y-4'>
                <div className='rounded-2xl bg-slate-50 border border-slate-200 p-4'>
                  <div className='font-semibold text-slate-800 mb-2'>上传 Word 文档（.docx）</div>
                  <input type='file' accept='.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document' onChange={handleDocxFileChange} className='block w-full text-sm text-slate-600' />
                  {selectedDocxFileName && <div className='mt-2 text-sm text-slate-500'>已选择：{selectedDocxFileName}</div>}
                </div>

                <div className='rounded-2xl bg-sky-50 border border-sky-200 p-4 text-sm text-sky-900'>
                  Phase G 已补上 Word 导入 MVP：系统会抽取 DOCX 文本并映射为待确认简历草稿，复杂表格和图片内容会保留到补充区。
                </div>

                <button
                  onClick={handleDocxImport}
                  disabled={submitting}
                  className='rounded-2xl bg-violet-600 px-6 py-3 text-white font-semibold disabled:opacity-60'
                >
                  {submitting ? '解析中...' : '开始导入 DOCX'}
                </button>
              </div>
            )}
          </div>

          <div className='rounded-3xl bg-white p-6 border border-slate-200 shadow-sm'>
            <h2 className='text-xl font-bold text-slate-800 mb-4'>最近导入记录</h2>
            <div className='space-y-3'>
              {imports.length === 0 && <div className='text-sm text-slate-500'>还没有导入记录。</div>}
              {imports.map((item) => (
                <div key={item._id} className='rounded-2xl border border-slate-200 bg-slate-50 p-4'>
                  <div className='flex items-start justify-between gap-3'>
                    <div>
                      <div className='font-semibold text-slate-800'>{item.originalFileName || '未命名导入'}</div>
                      <div className='mt-1 text-sm text-slate-500'>{item.sourceType} · {item.status}</div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-700'
                        : item.status === 'failed'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-violet-50 text-violet-700'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div className='mt-1 text-xs text-slate-400'>{formatDateTime(item.createdAt)}</div>
                  {item.failureReason && <div className='mt-2 text-sm text-rose-600'>{item.failureReason}</div>}
                  <div className='mt-3 flex gap-2'>
                    <button onClick={() => navigate(getImportAction(item).onClickPath)} className='text-sm text-violet-700 font-semibold'>
                      {getImportAction(item).label}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ImportsPage
