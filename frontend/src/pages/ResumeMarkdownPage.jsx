import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import DashboardLayout from '../components/DashboardLayout'
import axiosInstance from '../utils/axiosInstance'
import { API_PATHS } from '../utils/apiPaths'

const defaultDocument = {
  title: '',
  content: '',
  syncStatus: 'not_synced',
  lastSyncedAt: null,
}

const buildInitialMarkdown = (resume) => {
  if (!resume) return ''

  const lines = []
  if (resume.profileInfo?.fullName) lines.push(`# ${resume.profileInfo.fullName}`)
  if (resume.profileInfo?.designation) lines.push(resume.profileInfo.designation)
  lines.push('')

  if (resume.profileInfo?.summary) {
    lines.push('## Summary')
    lines.push(resume.profileInfo.summary)
    lines.push('')
  }

  const contactLines = [
    resume.contactInfo?.email,
    resume.contactInfo?.phone,
    resume.contactInfo?.location,
    resume.contactInfo?.linkedin,
    resume.contactInfo?.github,
    resume.contactInfo?.website,
  ].filter(Boolean)

  if (contactLines.length) {
    lines.push('## Contact')
    contactLines.forEach((line) => lines.push(`- ${line}`))
    lines.push('')
  }

  if (resume.workExperience?.length) {
    lines.push('## Work Experience')
    resume.workExperience.forEach((item) => {
      const title = [item.role, item.company].filter(Boolean).join(' @ ')
      if (title) lines.push(`- ${title}`)
      if (item.description) lines.push(`  ${item.description}`)
    })
    lines.push('')
  }

  if (resume.education?.length) {
    lines.push('## Education')
    resume.education.forEach((item) => {
      const title = [item.degree, item.institution].filter(Boolean).join(' - ')
      if (title) lines.push(`- ${title}`)
    })
    lines.push('')
  }

  if (resume.skills?.length) {
    lines.push('## Skills')
    resume.skills.forEach((skill) => {
      if (skill.name) lines.push(`- ${skill.name}`)
    })
    lines.push('')
  }

  return lines.join('\n').trim()
}

const formatLastSync = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('zh-CN')
}

const ResumeMarkdownPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [resume, setResume] = useState(null)
  const [document, setDocument] = useState(defaultDocument)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)

  const previewContent = useMemo(() => {
    return document.content || '还没有 Markdown 内容，先在左侧开始编写。'
  }, [document.content])

  const fetchResumeAndDocument = async () => {
    try {
      setLoading(true)
      const resumeResponse = await axiosInstance.get(API_PATHS.RESUME.GET_BY_ID(id))
      setResume(resumeResponse.data)

      try {
        const documentResponse = await axiosInstance.get(API_PATHS.RESUME.GET_MARKDOWN(id))
        setDocument({
          title: documentResponse.data.title || `${resumeResponse.data.title} Markdown`,
          content: documentResponse.data.content || '',
          syncStatus: documentResponse.data.syncStatus || 'not_synced',
          lastSyncedAt: documentResponse.data.lastSyncedAt || null,
        })
      } catch (error) {
        if (error.response?.status !== 404) {
          throw error
        }

        const generatedMarkdown = buildInitialMarkdown(resumeResponse.data)
        setDocument({
          title: `${resumeResponse.data.title} Markdown`,
          content: generatedMarkdown,
          syncStatus: 'not_synced',
          lastSyncedAt: null,
        })
      }
    } catch (error) {
      toast.error('加载 Markdown 文档失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchResumeAndDocument()
    }
  }, [id])

  const saveDocument = async () => {
    try {
      setSaving(true)
      const payload = {
        title: document.title || `${resume?.title || 'Resume'} Markdown`,
        content: document.content,
        parsedStructuredSnapshot: {
          resumeId: id,
          title: resume?.title || '',
        },
        syncStatus: 'synced',
        lastSyncedAt: new Date().toISOString(),
      }

      try {
        await axiosInstance.put(API_PATHS.RESUME.UPDATE_MARKDOWN(id), payload)
      } catch (error) {
        if (error.response?.status !== 404) {
          throw error
        }

        setCreating(true)
        await axiosInstance.post(API_PATHS.RESUME.CREATE_MARKDOWN(id), payload)
      }

      setDocument((prev) => ({
        ...prev,
        syncStatus: 'synced',
        lastSyncedAt: new Date().toISOString(),
      }))
      toast.success('Markdown 已保存')
    } catch (error) {
      toast.error('保存 Markdown 失败')
    } finally {
      setSaving(false)
      setCreating(false)
    }
  }

  const exportMarkdown = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.RESUME.EXPORT_MARKDOWN(id))
      const content = response.data.content || document.content
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const anchor = window.document.createElement('a')
      anchor.href = url
      anchor.download = `${(resume?.title || 'resume').replace(/[^a-z0-9]/gi, '_')}.md`
      anchor.click()
      URL.revokeObjectURL(url)
      toast.success('Markdown 已导出')
    } catch (error) {
      toast.error('导出 Markdown 失败')
    }
  }

  return (
    <DashboardLayout activeMenu='dashboard'>
      <div className='space-y-6 px-4'>
        <div className='rounded-3xl bg-white p-6 border border-slate-200 shadow-sm flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <div>
            <h1 className='text-3xl font-black text-slate-900'>Markdown 编辑模式</h1>
            <p className='mt-2 text-slate-600'>维护这份简历对应的 Markdown 文档资产。当前版本支持加载、创建、保存与导出。</p>
          </div>
          <div className='flex flex-wrap gap-3'>
            <button onClick={() => navigate(`/resume/${id}`)} className='rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700'>
              返回表单编辑
            </button>
            <button onClick={exportMarkdown} className='rounded-2xl border border-violet-200 px-5 py-3 font-semibold text-violet-700'>
              导出 Markdown
            </button>
            <button onClick={saveDocument} disabled={saving} className='rounded-2xl bg-violet-600 px-5 py-3 font-semibold text-white disabled:opacity-60'>
              {saving ? (creating ? '创建中...' : '保存中...') : '保存 Markdown'}
            </button>
          </div>
        </div>

        {loading && (
          <div className='rounded-3xl bg-white p-8 border border-slate-200 shadow-sm text-slate-500'>
            正在加载 Markdown 文档...
          </div>
        )}

        {!loading && (
          <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
            <div className='rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-4'>
              <div className='grid grid-cols-1 gap-4'>
                <input
                  value={document.title}
                  onChange={(e) => setDocument((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder='Markdown 文档标题'
                  className='w-full rounded-2xl border border-slate-200 px-4 py-3'
                />
                <textarea
                  value={document.content}
                  onChange={(e) => setDocument((prev) => ({ ...prev, content: e.target.value, syncStatus: 'outdated' }))}
                  rows={26}
                  className='w-full rounded-2xl border border-slate-200 px-4 py-3 font-mono text-sm'
                  placeholder='# 张三\n前端工程师\n\n## Summary\n...'
                />
              </div>
            </div>

            <div className='space-y-6'>
              <div className='rounded-3xl bg-white p-6 border border-slate-200 shadow-sm'>
                <h2 className='text-xl font-bold text-slate-800 mb-4'>文档状态</h2>
                <div className='space-y-2 text-sm text-slate-600'>
                  <div>关联简历：{resume?.title || '—'}</div>
                  <div>内容来源：{resume?.contentSource || 'structured'}</div>
                  <div>同步状态：{document.syncStatus}</div>
                  <div>上次同步：{formatLastSync(document.lastSyncedAt)}</div>
                </div>
              </div>

              <div className='rounded-3xl bg-white p-6 border border-slate-200 shadow-sm'>
                <h2 className='text-xl font-bold text-slate-800 mb-4'>结构化来源摘要</h2>
                <div className='space-y-2 text-sm text-slate-600'>
                  <div>姓名：{resume?.profileInfo?.fullName || '—'}</div>
                  <div>职位：{resume?.profileInfo?.designation || '—'}</div>
                  <div>工作经历：{resume?.workExperience?.length || 0} 条</div>
                  <div>教育经历：{resume?.education?.length || 0} 条</div>
                  <div>技能：{resume?.skills?.length || 0} 项</div>
                </div>
              </div>

              <div className='rounded-3xl bg-white p-6 border border-slate-200 shadow-sm'>
                <h2 className='text-xl font-bold text-slate-800 mb-4'>预览</h2>
                <pre className='whitespace-pre-wrap break-words rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700'>
                  {previewContent}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default ResumeMarkdownPage
