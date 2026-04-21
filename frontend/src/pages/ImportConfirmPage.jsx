import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import axiosInstance from '../utils/axiosInstance'
import { API_PATHS } from '../utils/apiPaths'
import toast from 'react-hot-toast'

const defaultDraft = {
  title: '',
  profileInfo: {
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
  workExperience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
  interests: [],
  freeBlocks: [],
}

const normalizeDraft = (draft = {}) => ({
  ...defaultDraft,
  ...draft,
  profileInfo: {
    ...defaultDraft.profileInfo,
    ...(draft.profileInfo || {}),
  },
  contactInfo: {
    ...defaultDraft.contactInfo,
    ...(draft.contactInfo || {}),
  },
  workExperience: draft.workExperience || [],
  education: draft.education || [],
  skills: draft.skills || [],
  projects: draft.projects || [],
  certifications: draft.certifications || [],
  languages: draft.languages || [],
  interests: draft.interests || [],
  freeBlocks: draft.freeBlocks || [],
})

const buildManualCorrections = (originalDraft, currentDraft) => {
  const corrections = []

  const compareObject = (basePath, originalValue, currentValue) => {
    const original = originalValue || {}
    const current = currentValue || {}

    Object.keys(current).forEach((key) => {
      const field = basePath ? `${basePath}.${key}` : key
      const nextOriginal = original[key]
      const nextCurrent = current[key]

      if (Array.isArray(nextCurrent)) {
        if (JSON.stringify(nextOriginal || []) !== JSON.stringify(nextCurrent)) {
          corrections.push({ field, value: nextCurrent })
        }
        return
      }

      if (nextCurrent && typeof nextCurrent === 'object') {
        compareObject(field, nextOriginal || {}, nextCurrent)
        return
      }

      if ((nextOriginal ?? '') !== (nextCurrent ?? '')) {
        corrections.push({ field, value: nextCurrent })
      }
    })
  }

  compareObject('', normalizeDraft(originalDraft), normalizeDraft(currentDraft))
  return corrections
}

const updateListItem = (items, index, patch) =>
  items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))

const ConfidenceBadge = ({ tone, text }) => {
  const toneStyles = {
    high: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    medium: 'bg-amber-50 border-amber-200 text-amber-700',
    low: 'bg-rose-50 border-rose-200 text-rose-700',
  }

  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneStyles[tone] || toneStyles.medium}`}>{text}</span>
}

const SectionCard = ({ title, description, children }) => (
  <div className='rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-4'>
    <div>
      <h2 className='text-xl font-bold text-slate-800'>{title}</h2>
      {description && <p className='mt-1 text-sm text-slate-500'>{description}</p>}
    </div>
    {children}
  </div>
)

const ImportConfirmPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [resumeImport, setResumeImport] = useState(null)
  const [draft, setDraft] = useState(defaultDraft)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const unresolvedFields = useMemo(() => resumeImport?.unresolvedFields || [], [resumeImport])
  const confidenceSummary = useMemo(() => resumeImport?.confidenceSummary || {}, [resumeImport])
  const hasConfirmedResume = Boolean(resumeImport?.confirmedResumeId)
  const isFailedImport = resumeImport?.status === 'failed'
  const confidenceFields = confidenceSummary.fields || {}

  const fetchImport = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get(API_PATHS.IMPORTS.GET_BY_ID(id))
      setResumeImport(response.data)
      setDraft(normalizeDraft(response.data.mappedResumeDraft))
    } catch (error) {
      toast.error('加载导入记录失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) fetchImport()
  }, [id])

  const handleProfileChange = (key, value) => {
    setDraft((prev) => ({
      ...prev,
      profileInfo: {
        ...prev.profileInfo,
        [key]: value,
      },
    }))
  }

  const handleContactChange = (key, value) => {
    setDraft((prev) => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        [key]: value,
      },
    }))
  }

  const handleWorkExperienceChange = (index, key, value) => {
    setDraft((prev) => ({
      ...prev,
      workExperience: updateListItem(prev.workExperience || [], index, { [key]: value }),
    }))
  }

  const handleEducationChange = (index, key, value) => {
    setDraft((prev) => ({
      ...prev,
      education: updateListItem(prev.education || [], index, { [key]: value }),
    }))
  }

  const handleSkillChange = (index, value) => {
    setDraft((prev) => ({
      ...prev,
      skills: updateListItem(prev.skills || [], index, { name: value }),
    }))
  }

  const handleConfirm = async () => {
    try {
      setSubmitting(true)
      const manualCorrections = buildManualCorrections(resumeImport?.mappedResumeDraft, draft)

      const response = await axiosInstance.put(API_PATHS.IMPORTS.CONFIRM(id), {
        mappedResumeDraft: draft,
        manualCorrections,
      })

      toast.success(hasConfirmedResume ? '已打开已生成简历' : '导入确认成功，已生成简历')
      navigate(`/resume/${response.data.resumeId}`)
    } catch (error) {
      toast.error('确认导入失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout activeMenu='imports'>
      <div className='space-y-6 px-4'>
        <div className='rounded-3xl bg-white p-8 border border-slate-200 shadow-sm'>
          <h1 className='text-3xl font-black text-slate-900'>导入确认</h1>
          <p className='mt-2 text-slate-600'>先把关键字段修正到位，再生成正式 Resume。保守识别的内容会保留在自由块和原始文本里，后续还能继续编辑。</p>
        </div>

        {loading && (
          <div className='rounded-3xl bg-white p-8 border border-slate-200 shadow-sm text-slate-500'>
            正在加载导入结果...
          </div>
        )}

        {!loading && resumeImport && isFailedImport && (
          <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
            <div className='xl:col-span-2 space-y-6'>
              <SectionCard title='导入失败' description='当前这条导入记录未能生成可确认草稿，你可以查看失败原因后重新导入。'>
                <div className='rounded-2xl bg-rose-50 border border-rose-200 p-4 text-rose-700'>
                  {resumeImport.failureReason || '系统未返回明确失败原因'}
                </div>
              </SectionCard>

              <SectionCard title='原始信息'>
                <div className='space-y-2 text-sm text-slate-600'>
                  <div>来源类型：{resumeImport.sourceType}</div>
                  <div>原始文件：{resumeImport.originalFileName || '粘贴内容'}</div>
                  <div>状态：{resumeImport.status}</div>
                </div>
              </SectionCard>

              <SectionCard title='原始文本'>
                <pre className='max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700'>
                  {resumeImport.rawText || '失败导入没有可用文本。'}
                </pre>
              </SectionCard>
            </div>

            <div className='space-y-6'>
              <SectionCard title='下一步建议'>
                <div className='space-y-3 text-sm text-slate-600'>
                  <div>1. 如果是 PDF，请确认文件是文本型 PDF，而不是扫描图片。</div>
                  <div>2. 如果是 Markdown，请检查是否包含标题、邮箱等基础信息。</div>
                  <div>3. 重新上传后，系统会生成一条新的导入记录，不会覆盖原失败记录。</div>
                </div>
              </SectionCard>

              <SectionCard title='操作'>
                <div className='space-y-3'>
                  <button onClick={() => navigate('/imports')} className='w-full rounded-2xl bg-violet-600 px-4 py-3 font-semibold text-white'>
                    返回导入中心重试
                  </button>
                </div>
              </SectionCard>
            </div>
          </div>
        )}

        {!loading && resumeImport && !isFailedImport && (
          <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
            <div className='xl:col-span-2 space-y-6'>
              <SectionCard title='基本信息' description='这里优先确认会影响简历主标题和抬头区的字段。'>
                <input
                  value={draft.title}
                  onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder='简历标题'
                  className='w-full rounded-2xl border border-slate-200 px-4 py-3'
                />
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <input
                    value={draft.profileInfo.fullName}
                    onChange={(e) => handleProfileChange('fullName', e.target.value)}
                    placeholder='姓名'
                    className='rounded-2xl border border-slate-200 px-4 py-3'
                  />
                  <input
                    value={draft.profileInfo.designation}
                    onChange={(e) => handleProfileChange('designation', e.target.value)}
                    placeholder='职位'
                    className='rounded-2xl border border-slate-200 px-4 py-3'
                  />
                </div>
                <textarea
                  value={draft.profileInfo.summary}
                  onChange={(e) => handleProfileChange('summary', e.target.value)}
                  placeholder='个人简介'
                  rows={5}
                  className='w-full rounded-2xl border border-slate-200 px-4 py-3'
                />
              </SectionCard>

              <SectionCard title='联系方式' description='建议至少确认邮箱和电话，避免导入时被换行或格式化打断。'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <input value={draft.contactInfo.email} onChange={(e) => handleContactChange('email', e.target.value)} placeholder='邮箱' className='rounded-2xl border border-slate-200 px-4 py-3' />
                  <input value={draft.contactInfo.phone} onChange={(e) => handleContactChange('phone', e.target.value)} placeholder='电话' className='rounded-2xl border border-slate-200 px-4 py-3' />
                  <input value={draft.contactInfo.location} onChange={(e) => handleContactChange('location', e.target.value)} placeholder='地点' className='rounded-2xl border border-slate-200 px-4 py-3' />
                  <input value={draft.contactInfo.linkedin} onChange={(e) => handleContactChange('linkedin', e.target.value)} placeholder='LinkedIn' className='rounded-2xl border border-slate-200 px-4 py-3' />
                  <input value={draft.contactInfo.github} onChange={(e) => handleContactChange('github', e.target.value)} placeholder='GitHub' className='rounded-2xl border border-slate-200 px-4 py-3' />
                  <input value={draft.contactInfo.website} onChange={(e) => handleContactChange('website', e.target.value)} placeholder='个人网站' className='rounded-2xl border border-slate-200 px-4 py-3' />
                </div>
              </SectionCard>

              <SectionCard title='工作经历' description='先开放岗位、公司、时间和描述的修正，足够支撑导入确认。'>
                {(draft.workExperience || []).length === 0 && <div className='text-sm text-slate-500'>暂无识别内容，后续可在正式编辑页补充。</div>}
                {(draft.workExperience || []).map((item, index) => (
                  <div key={`work-${index}`} className='rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                      <input value={item.role || ''} onChange={(e) => handleWorkExperienceChange(index, 'role', e.target.value)} placeholder='职位' className='rounded-2xl border border-slate-200 px-4 py-3 bg-white' />
                      <input value={item.company || ''} onChange={(e) => handleWorkExperienceChange(index, 'company', e.target.value)} placeholder='公司' className='rounded-2xl border border-slate-200 px-4 py-3 bg-white' />
                      <input value={item.startDate || ''} onChange={(e) => handleWorkExperienceChange(index, 'startDate', e.target.value)} placeholder='开始时间' className='rounded-2xl border border-slate-200 px-4 py-3 bg-white' />
                      <input value={item.endDate || ''} onChange={(e) => handleWorkExperienceChange(index, 'endDate', e.target.value)} placeholder='结束时间' className='rounded-2xl border border-slate-200 px-4 py-3 bg-white' />
                    </div>
                    <textarea
                      value={item.description || ''}
                      onChange={(e) => handleWorkExperienceChange(index, 'description', e.target.value)}
                      rows={4}
                      placeholder='经历描述'
                      className='w-full rounded-2xl border border-slate-200 px-4 py-3 bg-white'
                    />
                  </div>
                ))}
              </SectionCard>

              <SectionCard title='教育与技能' description='把高频会展示在模板里的字段集中到一块，确认速度更快。'>
                <div className='space-y-4'>
                  <div>
                    <div className='mb-3 text-sm font-semibold text-slate-700'>教育经历</div>
                    {(draft.education || []).length === 0 && <div className='text-sm text-slate-500'>暂无识别内容</div>}
                    {(draft.education || []).map((item, index) => (
                      <div key={`edu-${index}`} className='rounded-2xl bg-slate-50 border border-slate-200 p-4 mb-3'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                          <input value={item.degree || ''} onChange={(e) => handleEducationChange(index, 'degree', e.target.value)} placeholder='学位/专业' className='rounded-2xl border border-slate-200 px-4 py-3 bg-white' />
                          <input value={item.institution || ''} onChange={(e) => handleEducationChange(index, 'institution', e.target.value)} placeholder='学校' className='rounded-2xl border border-slate-200 px-4 py-3 bg-white' />
                          <input value={item.startDate || ''} onChange={(e) => handleEducationChange(index, 'startDate', e.target.value)} placeholder='开始时间' className='rounded-2xl border border-slate-200 px-4 py-3 bg-white' />
                          <input value={item.endDate || ''} onChange={(e) => handleEducationChange(index, 'endDate', e.target.value)} placeholder='结束时间' className='rounded-2xl border border-slate-200 px-4 py-3 bg-white' />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className='mb-3 text-sm font-semibold text-slate-700'>技能</div>
                    {(draft.skills || []).length === 0 && <div className='text-sm text-slate-500'>暂无识别内容</div>}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                      {(draft.skills || []).map((skill, index) => (
                        <input
                          key={`skill-${index}`}
                          value={skill.name || ''}
                          onChange={(e) => handleSkillChange(index, e.target.value)}
                          placeholder={`技能 ${index + 1}`}
                          className='rounded-2xl border border-slate-200 px-4 py-3'
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title='自由块与原始文本' description='无法稳定映射的内容会保留在这里，避免导入过程中丢信息。'>
                <div>
                  <div className='font-semibold mb-3 text-slate-700'>自由块</div>
                  {(draft.freeBlocks || []).length === 0 && <div className='text-sm text-slate-500'>没有未映射内容</div>}
                  {(draft.freeBlocks || []).map((block, index) => (
                    <div key={`free-${index}`} className='rounded-2xl bg-amber-50 border border-amber-200 p-4 mb-3'>
                      <div className='font-medium text-amber-900'>{block.title || '未分类内容'}</div>
                      <div className='mt-2 whitespace-pre-wrap text-amber-800'>{block.content || '暂无内容'}</div>
                    </div>
                  ))}
                </div>

                <div>
                  <div className='font-semibold mb-3 text-slate-700'>原始文本</div>
                  <pre className='max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700'>
                    {resumeImport.rawText || '未保存原始文本'}
                  </pre>
                </div>
              </SectionCard>
            </div>

            <div className='space-y-6'>
              <SectionCard title='导入摘要'>
                <div className='space-y-2 text-sm text-slate-600'>
                  <div>来源类型：{resumeImport.sourceType}</div>
                  <div>原始文件：{resumeImport.originalFileName || '粘贴内容'}</div>
                  <div>状态：{resumeImport.status}</div>
                </div>
              </SectionCard>

              <SectionCard title='识别置信度'>
                <div className='flex flex-wrap gap-2'>
                  <ConfidenceBadge tone='high' text={`高置信 ${confidenceSummary.high || 0}`} />
                  <ConfidenceBadge tone='medium' text={`中置信 ${confidenceSummary.medium || 0}`} />
                  <ConfidenceBadge tone='low' text={`低置信 ${confidenceSummary.low || 0}`} />
                </div>
                {Object.keys(confidenceFields).length > 0 && (
                  <div className='mt-3 space-y-2 text-sm text-slate-600'>
                    {Object.entries(confidenceFields).map(([field, score]) => (
                      <div key={field} className='flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3'>
                        <span>{field}</span>
                        <span>{Math.round(Number(score || 0) * 100)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard title='待确认字段'>
                {unresolvedFields.length === 0 && <div className='text-sm text-emerald-600'>核心字段已完成识别</div>}
                {unresolvedFields.length > 0 && (
                  <div className='space-y-2'>
                    {unresolvedFields.map((field) => {
                      const label = typeof field === 'string' ? field : field.label || field.field || JSON.stringify(field)
                      return (
                        <div key={label} className='rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700'>
                          {label}
                        </div>
                      )
                    })}
                  </div>
                )}
              </SectionCard>

              <SectionCard title='下一步'>
                <button
                  onClick={handleConfirm}
                  disabled={submitting}
                  className='w-full rounded-2xl bg-violet-600 px-4 py-3 font-semibold text-white disabled:opacity-60'
                >
                  {submitting ? '生成中...' : hasConfirmedResume ? '打开已生成 Resume' : '确认并生成 Resume'}
                </button>
              </SectionCard>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default ImportConfirmPage
