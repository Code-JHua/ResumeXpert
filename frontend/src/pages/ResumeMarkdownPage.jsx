import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import DashboardLayout from '../components/DashboardLayout'
import axiosInstance from '../utils/axiosInstance'
import { API_PATHS } from '../utils/apiPaths'
import { exportResumeAsMarkdown } from '../services/resumeExportService'

const defaultDocument = {
  title: '',
  content: '',
  syncStatus: 'not_synced',
  lastSyncedAt: null,
  parsedStructuredSnapshot: null,
}

const defaultApplyResult = {
  unresolvedFields: [],
  confidenceSummary: {},
  parsedSections: null,
  overwriteSummary: [],
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

const buildDriftSummary = (snapshot, resume) => {
  if (!snapshot || !resume) return []

  const diffs = []

  if ((snapshot.title || '') !== (resume.title || '')) {
    diffs.push('简历标题已变化')
  }

  if ((snapshot.profileInfo?.fullName || '') !== (resume.profileInfo?.fullName || '')) {
    diffs.push('姓名已变化')
  }

  if ((snapshot.profileInfo?.designation || '') !== (resume.profileInfo?.designation || '')) {
    diffs.push('职位已变化')
  }

  if ((snapshot.profileInfo?.summary || '') !== (resume.profileInfo?.summary || '')) {
    diffs.push('个人简介已变化')
  }

  if ((snapshot.contactInfo?.email || '') !== (resume.contactInfo?.email || '')) {
    diffs.push('邮箱已变化')
  }

  if ((snapshot.workExperience?.length || 0) !== (resume.workExperience?.length || 0)) {
    diffs.push('工作经历条目数已变化')
  }

  if ((snapshot.education?.length || 0) !== (resume.education?.length || 0)) {
    diffs.push('教育经历条目数已变化')
  }

  if ((snapshot.skills?.length || 0) !== (resume.skills?.length || 0)) {
    diffs.push('技能条目数已变化')
  }

  if ((snapshot.freeBlocks?.length || 0) !== (resume.freeBlocks?.length || 0)) {
    diffs.push('自由块数量已变化')
  }

  return diffs
}

const ResumeMarkdownPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [resume, setResume] = useState(null)
  const [document, setDocument] = useState(defaultDocument)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)
  const [syncingFromResume, setSyncingFromResume] = useState(false)
  const [applyingToResume, setApplyingToResume] = useState(false)
  const [previewingApply, setPreviewingApply] = useState(false)
  const [applyResult, setApplyResult] = useState(defaultApplyResult)

  const previewContent = useMemo(() => {
    return document.content || '还没有 Markdown 内容，先在左侧开始编写。'
  }, [document.content])

  const driftSummary = useMemo(() => {
    return buildDriftSummary(document.parsedStructuredSnapshot, resume)
  }, [document.parsedStructuredSnapshot, resume])

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
          parsedStructuredSnapshot: documentResponse.data.parsedStructuredSnapshot || null,
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
          parsedStructuredSnapshot: null,
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
      const nextSyncStatus = 'outdated'
      const payload = {
        title: document.title || `${resume?.title || 'Resume'} Markdown`,
        content: document.content,
        parsedStructuredSnapshot: document.parsedStructuredSnapshot || null,
        syncStatus: nextSyncStatus,
        lastSyncedAt: document.lastSyncedAt || null,
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
        syncStatus: nextSyncStatus,
      }))
      toast.success('Markdown 草稿已保存，等待同步到简历')
    } catch (error) {
      toast.error('保存 Markdown 失败')
    } finally {
      setSaving(false)
      setCreating(false)
    }
  }

  const syncFromResume = async () => {
    try {
      setSyncingFromResume(true)
      const response = await axiosInstance.post(API_PATHS.RESUME.SYNC_MARKDOWN_FROM_RESUME(id), {
        title: document.title || `${resume?.title || 'Resume'} Markdown`,
      })

      setDocument({
        title: response.data.document?.title || `${resume?.title || 'Resume'} Markdown`,
        content: response.data.content || '',
        syncStatus: response.data.document?.syncStatus || 'synced',
        lastSyncedAt: response.data.document?.lastSyncedAt || new Date().toISOString(),
        parsedStructuredSnapshot: response.data.document?.parsedStructuredSnapshot || resume,
      })
      setResume((prev) => (prev ? { ...prev, contentSource: 'markdown' } : prev))
      toast.success('已根据表单内容重新生成 Markdown')
    } catch (error) {
      toast.error('从表单生成 Markdown 失败')
    } finally {
      setSyncingFromResume(false)
    }
  }

  const applyToResume = async () => {
    try {
      setApplyingToResume(true)
      const response = await axiosInstance.post(API_PATHS.RESUME.APPLY_MARKDOWN_TO_RESUME(id), {
        title: document.title || `${resume?.title || 'Resume'} Markdown`,
        content: document.content,
      })

      setResume(response.data.resume)
      setDocument({
        title: response.data.document?.title || document.title,
        content: response.data.document?.content || document.content,
        syncStatus: response.data.document?.syncStatus || 'synced',
        lastSyncedAt: response.data.document?.lastSyncedAt || new Date().toISOString(),
        parsedStructuredSnapshot: response.data.document?.parsedStructuredSnapshot || response.data.resume,
      })
      setApplyResult({
        unresolvedFields: response.data.unresolvedFields || [],
        confidenceSummary: response.data.confidenceSummary || {},
        parsedSections: response.data.parsedSections || null,
        overwriteSummary: [],
      })
      toast.success('Markdown 已回写到简历')
    } catch (error) {
      toast.error('应用 Markdown 到简历失败')
    } finally {
      setApplyingToResume(false)
    }
  }

  const previewApplyToResume = async () => {
    try {
      setPreviewingApply(true)
      const response = await axiosInstance.post(API_PATHS.RESUME.PREVIEW_APPLY_MARKDOWN(id), {
        content: document.content,
      })

      setApplyResult({
        unresolvedFields: response.data.unresolvedFields || [],
        confidenceSummary: response.data.confidenceSummary || {},
        parsedSections: response.data.parsedSections || null,
        overwriteSummary: response.data.overwriteSummary || [],
      })
      toast.success('已生成应用前差异预览')
    } catch (error) {
      toast.error('预览应用影响失败')
    } finally {
      setPreviewingApply(false)
    }
  }

  const exportMarkdown = async () => {
    try {
      const response = await exportResumeAsMarkdown({
        resumeId: id,
        fileName: `${(resume?.title || 'resume').replace(/[^a-z0-9]/gi, '_')}.md`,
        triggerSource: 'markdown_page',
      })

      if (response.status === 'not_ready') {
        toast.error('Markdown 文档尚未准备好，请先同步或保存 Markdown')
        return
      }

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
            <p className='mt-2 text-slate-600'>维护这份简历对应的 Markdown 文档资产。现在已经支持从表单重新生成 Markdown，以及把 Markdown 解析结果回写到结构化简历。</p>
          </div>
          <div className='flex flex-wrap gap-3'>
            <button onClick={() => navigate(`/resume/${id}`)} className='rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700'>
              返回表单编辑
            </button>
            <button onClick={syncFromResume} disabled={syncingFromResume} className='rounded-2xl border border-emerald-200 px-5 py-3 font-semibold text-emerald-700 disabled:opacity-60'>
              {syncingFromResume ? '生成中...' : '从表单重新生成'}
            </button>
            <button onClick={previewApplyToResume} disabled={previewingApply} className='rounded-2xl border border-amber-200 px-5 py-3 font-semibold text-amber-700 disabled:opacity-60'>
              {previewingApply ? '预览中...' : '预览应用影响'}
            </button>
            <button onClick={applyToResume} disabled={applyingToResume} className='rounded-2xl border border-sky-200 px-5 py-3 font-semibold text-sky-700 disabled:opacity-60'>
              {applyingToResume ? '应用中...' : '应用到简历'}
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
                <h2 className='text-xl font-bold text-slate-800 mb-4'>漂移摘要</h2>
                {driftSummary.length === 0 && (
                  <div className='text-sm text-emerald-600'>当前结构化简历与 Markdown 快照没有检测到明显漂移。</div>
                )}
                {driftSummary.length > 0 && (
                  <div className='space-y-2'>
                    {driftSummary.map((item) => (
                      <div key={item} className='rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800'>
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className='rounded-3xl bg-white p-6 border border-slate-200 shadow-sm'>
                <h2 className='text-xl font-bold text-slate-800 mb-4'>结构化来源摘要</h2>
                <div className='space-y-2 text-sm text-slate-600'>
                  <div>姓名：{resume?.profileInfo?.fullName || '—'}</div>
                  <div>职位：{resume?.profileInfo?.designation || '—'}</div>
                  <div>工作经历：{resume?.workExperience?.length || 0} 条</div>
                  <div>教育经历：{resume?.education?.length || 0} 条</div>
                  <div>技能：{resume?.skills?.length || 0} 项</div>
                  <div>自由块：{resume?.freeBlocks?.length || 0} 个</div>
                </div>
              </div>

              <div className='rounded-3xl bg-white p-6 border border-slate-200 shadow-sm'>
                <h2 className='text-xl font-bold text-slate-800 mb-4'>同步结果</h2>
                <div className='space-y-3 text-sm text-slate-600'>
                  <div>未解析字段：{applyResult.unresolvedFields.length || 0} 项</div>
                  {applyResult.parsedSections && (
                    <div>识别标题：{applyResult.parsedSections.headings?.length || 0} 个</div>
                  )}
                  <div>高置信：{applyResult.confidenceSummary.high || 0}</div>
                  <div>中置信：{applyResult.confidenceSummary.medium || 0}</div>
                  <div>低置信：{applyResult.confidenceSummary.low || 0}</div>
                </div>

                {applyResult.unresolvedFields.length > 0 && (
                  <div className='mt-4 space-y-2'>
                    {applyResult.unresolvedFields.map((field) => (
                      <div key={field} className='rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800'>
                        {field}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className='rounded-3xl bg-white p-6 border border-slate-200 shadow-sm'>
                <h2 className='text-xl font-bold text-slate-800 mb-4'>应用前覆盖摘要</h2>
                {applyResult.overwriteSummary.length === 0 && (
                  <div className='text-sm text-slate-500'>先点击“预览应用影响”，这里会列出 Markdown 回写将覆盖的关键字段。</div>
                )}
                {applyResult.overwriteSummary.length > 0 && (
                  <div className='space-y-3'>
                    {applyResult.overwriteSummary.map((item) => (
                      <div key={item.field} className='rounded-2xl bg-sky-50 border border-sky-200 p-4 text-sm text-sky-900'>
                        <div className='font-semibold'>{item.field}</div>
                        <div className='mt-2'>当前值：{item.currentValue || '—'}</div>
                        <div className='mt-1'>新值：{item.nextValue || '—'}</div>
                      </div>
                    ))}
                  </div>
                )}
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
