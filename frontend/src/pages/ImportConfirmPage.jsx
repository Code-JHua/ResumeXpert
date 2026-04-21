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

const ImportConfirmPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [resumeImport, setResumeImport] = useState(null)
  const [draft, setDraft] = useState(defaultDraft)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const unresolvedFields = useMemo(() => resumeImport?.unresolvedFields || [], [resumeImport])

  const fetchImport = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get(API_PATHS.IMPORTS.GET_BY_ID(id))
      setResumeImport(response.data)
      setDraft({
        ...defaultDraft,
        ...(response.data.mappedResumeDraft || {}),
        profileInfo: {
          ...defaultDraft.profileInfo,
          ...(response.data.mappedResumeDraft?.profileInfo || {}),
        },
        contactInfo: {
          ...defaultDraft.contactInfo,
          ...(response.data.mappedResumeDraft?.contactInfo || {}),
        },
      })
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

  const handleConfirm = async () => {
    try {
      setSubmitting(true)
      const manualCorrections = [
        { field: 'title', value: draft.title },
        { field: 'profileInfo.fullName', value: draft.profileInfo.fullName },
        { field: 'profileInfo.designation', value: draft.profileInfo.designation },
        { field: 'contactInfo.email', value: draft.contactInfo.email },
      ]

      const response = await axiosInstance.put(API_PATHS.IMPORTS.CONFIRM(id), {
        mappedResumeDraft: draft,
        manualCorrections,
      })

      toast.success('导入确认成功，已生成简历')
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
          <p className='mt-2 text-slate-600'>检查关键字段后生成正式 Resume。当前页面优先开放核心字段修正，详细优化仍在正式编辑页完成。</p>
        </div>

        {loading && (
          <div className='rounded-3xl bg-white p-8 border border-slate-200 shadow-sm text-slate-500'>
            正在加载导入结果...
          </div>
        )}

        {!loading && resumeImport && (
          <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
            <div className='xl:col-span-2 space-y-6'>
              <div className='rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-4'>
                <h2 className='text-xl font-bold text-slate-800'>基本信息</h2>
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
              </div>

              <div className='rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-4'>
                <h2 className='text-xl font-bold text-slate-800'>联系方式</h2>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <input value={draft.contactInfo.email} onChange={(e) => handleContactChange('email', e.target.value)} placeholder='邮箱' className='rounded-2xl border border-slate-200 px-4 py-3' />
                  <input value={draft.contactInfo.phone} onChange={(e) => handleContactChange('phone', e.target.value)} placeholder='电话' className='rounded-2xl border border-slate-200 px-4 py-3' />
                  <input value={draft.contactInfo.location} onChange={(e) => handleContactChange('location', e.target.value)} placeholder='地点' className='rounded-2xl border border-slate-200 px-4 py-3' />
                  <input value={draft.contactInfo.linkedin} onChange={(e) => handleContactChange('linkedin', e.target.value)} placeholder='LinkedIn' className='rounded-2xl border border-slate-200 px-4 py-3' />
                  <input value={draft.contactInfo.github} onChange={(e) => handleContactChange('github', e.target.value)} placeholder='GitHub' className='rounded-2xl border border-slate-200 px-4 py-3' />
                  <input value={draft.contactInfo.website} onChange={(e) => handleContactChange('website', e.target.value)} placeholder='个人网站' className='rounded-2xl border border-slate-200 px-4 py-3' />
                </div>
              </div>

              <div className='rounded-3xl bg-white p-6 border border-slate-200 shadow-sm'>
                <h2 className='text-xl font-bold text-slate-800 mb-4'>识别预览</h2>
                <div className='space-y-5 text-sm text-slate-700'>
                  <div>
                    <div className='font-semibold mb-2'>工作经历</div>
                    {(draft.workExperience || []).length === 0 && <div className='text-slate-500'>暂无识别内容</div>}
                    {(draft.workExperience || []).map((item, index) => (
                      <div key={`${item.role}-${index}`} className='rounded-2xl bg-slate-50 border border-slate-200 p-4 mb-3'>
                        <div className='font-medium'>{item.role || '未识别职位'}</div>
                        {item.company && <div className='text-slate-500'>{item.company}</div>}
                        {item.description && <div className='mt-2 whitespace-pre-wrap'>{item.description}</div>}
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className='font-semibold mb-2'>技能</div>
                    <div className='flex flex-wrap gap-2'>
                      {(draft.skills || []).map((skill, index) => (
                        <span key={`${skill.name}-${index}`} className='rounded-full bg-violet-50 text-violet-700 px-3 py-1'>
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className='font-semibold mb-2'>自由块</div>
                    {(draft.freeBlocks || []).length === 0 && <div className='text-slate-500'>没有未映射内容</div>}
                    {(draft.freeBlocks || []).map((block, index) => (
                      <div key={`${block.title}-${index}`} className='rounded-2xl bg-amber-50 border border-amber-200 p-4 mb-3'>
                        <div className='font-medium text-amber-900'>{block.title || '未分类内容'}</div>
                        <div className='mt-2 whitespace-pre-wrap text-amber-800'>{block.content}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className='space-y-6'>
              <div className='rounded-3xl bg-white p-6 border border-slate-200 shadow-sm'>
                <h2 className='text-xl font-bold text-slate-800 mb-4'>导入摘要</h2>
                <div className='space-y-2 text-sm text-slate-600'>
                  <div>来源类型：{resumeImport.sourceType}</div>
                  <div>原始文件：{resumeImport.originalFileName || '粘贴内容'}</div>
                  <div>状态：{resumeImport.status}</div>
                </div>
              </div>

              <div className='rounded-3xl bg-white p-6 border border-slate-200 shadow-sm'>
                <h2 className='text-xl font-bold text-slate-800 mb-4'>待确认字段</h2>
                {unresolvedFields.length === 0 && <div className='text-sm text-emerald-600'>核心字段已完成识别</div>}
                {unresolvedFields.length > 0 && (
                  <div className='space-y-2'>
                    {unresolvedFields.map((field) => (
                      <div key={field} className='rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700'>
                        {field}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className='rounded-3xl bg-white p-6 border border-slate-200 shadow-sm'>
                <button
                  onClick={handleConfirm}
                  disabled={submitting}
                  className='w-full rounded-2xl bg-violet-600 px-4 py-3 font-semibold text-white disabled:opacity-60'
                >
                  {submitting ? '生成中...' : '确认并生成 Resume'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default ImportConfirmPage
