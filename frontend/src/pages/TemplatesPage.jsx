import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import DashboardLayout from '../components/DashboardLayout'
import axiosInstance from '../utils/axiosInstance'
import { API_PATHS } from '../utils/apiPaths'
import { mergeTemplateMetadata } from '../utils/templateRegistry'
import RenderResume from '../components/RenderResume'
import TemplateThemeConfigurator from '../components/TemplateThemeConfigurator'
import { resolveTemplateTheme } from '../utils/templateTheme'
import { DUMMY_RESUME_DATA } from '../utils/data'

const initialDraft = {
  name: '',
  description: '',
  rendererKey: '01',
  sourceType: 'custom',
  category: 'general',
}

const TemplatesPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const resumeId = searchParams.get('resumeId') || ''

  const [templates, setTemplates] = useState([])
  const [resumes, setResumes] = useState([])
  const [activeTemplateId, setActiveTemplateId] = useState('')
  const [activeResumeId, setActiveResumeId] = useState(resumeId)
  const [themeSettings, setThemeSettings] = useState({})
  const [filters, setFilters] = useState({
    scope: 'all',
    sourceType: '',
    category: '',
  })
  const [draft, setDraft] = useState(initialDraft)

  const fetchData = async () => {
    try {
      const query = new URLSearchParams()
      if (filters.scope === 'favorites') query.set('scope', 'favorites')
      if (filters.scope === 'mine') query.set('scope', 'mine')
      if (filters.sourceType) query.set('sourceType', filters.sourceType)
      if (filters.category) query.set('category', filters.category)
      const suffix = query.toString() ? `?${query.toString()}` : ''

      const [templateResponse, resumeResponse] = await Promise.all([
        axiosInstance.get(`${API_PATHS.TEMPLATES.GET_ALL}${suffix}`),
        axiosInstance.get(API_PATHS.RESUME.GET_ALL),
      ])
      const merged = mergeTemplateMetadata(templateResponse.data)
      setTemplates(merged)
      setResumes(resumeResponse.data)
      if (!activeTemplateId && merged[0]) setActiveTemplateId(merged[0].id)
      if (!activeResumeId && resumeResponse.data[0]) setActiveResumeId(resumeResponse.data[0]._id)
    } catch (error) {
      toast.error('加载模板中心失败')
    }
  }

  useEffect(() => {
    fetchData()
  }, [filters.scope, filters.sourceType, filters.category])

  const activeTemplate = useMemo(
    () => templates.find((template) => template.id === activeTemplateId) || templates[0],
    [templates, activeTemplateId]
  )

  const activeResume = useMemo(
    () => resumes.find((resume) => resume._id === activeResumeId) || null,
    [resumes, activeResumeId]
  )

  useEffect(() => {
    if (activeTemplate) {
      setThemeSettings(resolveTemplateTheme(activeTemplate, activeResume?.template))
    }
  }, [activeTemplate?.id, activeResume?._id])

  const previewResume = useMemo(() => ({
    ...(activeResume || DUMMY_RESUME_DATA),
    template: {
      ...(activeResume?.template || {}),
      theme: activeTemplate?.rendererKey || activeResume?.template?.theme || '01',
      templateId: activeTemplate?.id || activeResume?.template?.templateId,
      settings: themeSettings,
    },
  }), [activeResume, activeTemplate, themeSettings])

  const handleToggleFavorite = async (templateId) => {
    try {
      const response = await axiosInstance.post(API_PATHS.TEMPLATES.TOGGLE_FAVORITE(templateId))
      setTemplates((prev) => prev.map((item) => item.id === templateId ? { ...item, ...response.data } : item))
      toast.success(response.data.isFavorite ? '已加入收藏' : '已取消收藏')
    } catch (error) {
      toast.error('更新收藏失败')
    }
  }

  const handleDuplicate = async (templateId) => {
    try {
      const response = await axiosInstance.post(API_PATHS.TEMPLATES.DUPLICATE(templateId))
      setTemplates((prev) => [response.data, ...prev])
      setActiveTemplateId(response.data.id)
      toast.success('模板副本已创建')
    } catch (error) {
      toast.error('复制模板失败')
    }
  }

  const handleApply = async () => {
    if (!activeTemplate || !activeResumeId) {
      toast.error('请选择模板和简历')
      return
    }

    try {
      await axiosInstance.post(API_PATHS.TEMPLATES.APPLY(activeTemplate.id), {
        resumeId: activeResumeId,
        themeSettings,
      })
      toast.success('模板已套用到当前简历')
      navigate(`/resume/${activeResumeId}`)
    } catch (error) {
      toast.error('套用模板失败')
    }
  }

  const handleCreateTemplate = async (e) => {
    e.preventDefault()
    if (!draft.name.trim()) {
      toast.error('请填写模板名称')
      return
    }

    try {
      const response = await axiosInstance.post(API_PATHS.TEMPLATES.CREATE, {
        ...draft,
        themeSchema: activeTemplate?.themeSchema || undefined,
      })
      setTemplates((prev) => [response.data, ...prev])
      setDraft(initialDraft)
      setActiveTemplateId(response.data.id)
      toast.success('模板元数据已创建')
    } catch (error) {
      toast.error('创建模板失败')
    }
  }

  const handleUpdateMetadata = async () => {
    if (!activeTemplate) return

    try {
      const response = await axiosInstance.put(API_PATHS.TEMPLATES.UPDATE(activeTemplate.id), {
        name: activeTemplate.name,
        description: activeTemplate.description,
        category: activeTemplate.category,
        status: activeTemplate.status,
        themeSchema: activeTemplate.themeSchema,
        communityMeta: activeTemplate.communityMeta,
      })
      setTemplates((prev) => prev.map((item) => item.id === activeTemplate.id ? { ...item, ...response.data } : item))
      toast.success('模板元数据已更新')
    } catch (error) {
      toast.error('更新模板失败')
    }
  }

  return (
    <DashboardLayout activeMenu='templates'>
      <div className='space-y-8 px-4'>
        <div className='flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between'>
          <div>
            <h1 className='text-3xl font-black text-slate-900'>模板中心</h1>
            <p className='mt-2 text-slate-600'>浏览官方模板、收藏常用样式、复制为个人模板，并为当前简历套用主题参数。</p>
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
            <select value={filters.scope} onChange={(e) => setFilters((prev) => ({ ...prev, scope: e.target.value }))} className='rounded-2xl border border-slate-200 px-4 py-3'>
              <option value='all'>全部模板</option>
              <option value='favorites'>仅看收藏</option>
              <option value='mine'>我的模板</option>
            </select>
            <select value={filters.sourceType} onChange={(e) => setFilters((prev) => ({ ...prev, sourceType: e.target.value }))} className='rounded-2xl border border-slate-200 px-4 py-3'>
              <option value=''>全部来源</option>
              <option value='official'>官方</option>
              <option value='custom'>个人模板</option>
              <option value='community'>社区预留</option>
            </select>
            <select value={activeResumeId} onChange={(e) => setActiveResumeId(e.target.value)} className='rounded-2xl border border-slate-200 px-4 py-3'>
              <option value=''>选择要套用的简历</option>
              {resumes.map((resume) => <option key={resume._id} value={resume._id}>{resume.title}</option>)}
            </select>
          </div>
        </div>

        <div className='grid grid-cols-1 xl:grid-cols-12 gap-6'>
          <div className='xl:col-span-4 space-y-6'>
            <div className='rounded-3xl border border-slate-200 bg-white p-5'>
              <div className='text-lg font-bold text-slate-900'>模板列表</div>
              <div className='mt-4 space-y-3 max-h-[58vh] overflow-auto'>
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type='button'
                    onClick={() => setActiveTemplateId(template.id)}
                    className={`w-full rounded-3xl border p-4 text-left transition-colors ${activeTemplate?.id === template.id ? 'border-violet-400 bg-violet-50' : 'border-slate-200 hover:border-violet-300'}`}
                  >
                    <div className='flex items-center justify-between gap-3'>
                      <div>
                        <div className='font-bold text-slate-900'>{template.name}</div>
                        <div className='mt-1 text-xs text-slate-500'>{template.authorName || 'ResumeXpert'}</div>
                      </div>
                      <span className='rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500'>{template.sourceType === 'official' ? '官方' : template.sourceType === 'custom' ? '我的模板' : '社区预留'}</span>
                    </div>
                    <p className='mt-3 text-sm text-slate-600'>{template.description || '暂无描述'}</p>
                    <div className='mt-3 flex flex-wrap gap-2'>
                      <button type='button' onClick={(e) => { e.stopPropagation(); handleToggleFavorite(template.id) }} className='rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600'>
                        {template.isFavorite ? '取消收藏' : '收藏'}
                      </button>
                      <button type='button' onClick={(e) => { e.stopPropagation(); handleDuplicate(template.id) }} className='rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600'>
                        复制模板
                      </button>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateTemplate} className='rounded-3xl border border-slate-200 bg-white p-5 space-y-4'>
              <div className='text-lg font-bold text-slate-900'>模板元数据管理</div>
              <input value={draft.name} onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))} placeholder='新模板名称' className='w-full rounded-2xl border border-slate-200 px-4 py-3' />
              <textarea value={draft.description} onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))} placeholder='描述这个模板适合谁使用' rows={3} className='w-full rounded-2xl border border-slate-200 px-4 py-3' />
              <div className='grid grid-cols-2 gap-3'>
                <select value={draft.rendererKey} onChange={(e) => setDraft((prev) => ({ ...prev, rendererKey: e.target.value }))} className='rounded-2xl border border-slate-200 px-4 py-3'>
                  <option value='01'>渲染器 01</option>
                  <option value='02'>渲染器 02</option>
                  <option value='03'>渲染器 03</option>
                </select>
                <select value={draft.sourceType} onChange={(e) => setDraft((prev) => ({ ...prev, sourceType: e.target.value }))} className='rounded-2xl border border-slate-200 px-4 py-3'>
                  <option value='custom'>个人模板</option>
                  <option value='community'>社区预留</option>
                </select>
              </div>
              <button type='submit' className='w-full rounded-2xl bg-violet-600 px-4 py-3 font-semibold text-white'>创建模板元数据</button>
            </form>
          </div>

          <div className='xl:col-span-8 space-y-6'>
            {activeTemplate && (
              <>
                <div className='rounded-3xl border border-slate-200 bg-white p-5 space-y-4'>
                  <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
                    <div>
                      <div className='text-2xl font-black text-slate-900'>{activeTemplate.name}</div>
                      <p className='mt-2 text-slate-600'>{activeTemplate.description || '暂无描述'}</p>
                      <div className='mt-3 flex flex-wrap gap-2'>
                        {(activeTemplate.tags || []).map((tag) => (
                          <span key={tag} className='rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500'>{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className='flex flex-wrap gap-3'>
                      <button onClick={handleUpdateMetadata} className='rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700'>保存元数据</button>
                      <button onClick={handleApply} className='rounded-2xl bg-violet-600 px-5 py-3 font-semibold text-white'>套用到当前简历</button>
                    </div>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <input value={activeTemplate.name || ''} onChange={(e) => setTemplates((prev) => prev.map((item) => item.id === activeTemplate.id ? { ...item, name: e.target.value } : item))} className='rounded-2xl border border-slate-200 px-4 py-3' />
                    <input value={activeTemplate.category || ''} onChange={(e) => setTemplates((prev) => prev.map((item) => item.id === activeTemplate.id ? { ...item, category: e.target.value } : item))} className='rounded-2xl border border-slate-200 px-4 py-3' />
                    <select value={activeTemplate.status || 'active'} onChange={(e) => setTemplates((prev) => prev.map((item) => item.id === activeTemplate.id ? { ...item, status: e.target.value } : item))} className='rounded-2xl border border-slate-200 px-4 py-3'>
                      <option value='draft'>草稿</option>
                      <option value='active'>启用</option>
                      <option value='archived'>归档</option>
                    </select>
                  </div>

                  <textarea value={activeTemplate.description || ''} onChange={(e) => setTemplates((prev) => prev.map((item) => item.id === activeTemplate.id ? { ...item, description: e.target.value } : item))} rows={3} className='w-full rounded-2xl border border-slate-200 px-4 py-3' />
                  <div className='rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600'>
                    社区模板预留：当前已为模板存储 `sourceType`、`communityMeta.reviewStatus`、`license`、`coverImage` 等字段，后续可直接接入发布和审核流。
                  </div>
                </div>

                <TemplateThemeConfigurator template={activeTemplate} value={themeSettings} onChange={setThemeSettings} />

                <div className='rounded-3xl border border-slate-200 bg-white p-5'>
                  <div className='mb-4'>
                    <div className='text-xl font-bold text-slate-900'>实时预览</div>
                    <div className='mt-1 text-sm text-slate-500'>预览会基于当前选中的简历数据和主题参数实时渲染。</div>
                  </div>
                  <RenderResume
                    templateId={activeTemplate.rendererKey}
                    templateMeta={activeTemplate}
                    resumeData={previewResume}
                    containerWidth={null}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default TemplatesPage
