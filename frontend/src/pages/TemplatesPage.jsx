import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import DashboardLayout from '../components/DashboardLayout'
import axiosInstance from '../utils/axiosInstance'
import { API_PATHS } from '../utils/apiPaths'
import { mergeTemplateMetadata } from '../utils/templateRegistry'
import RenderResume from '../components/RenderResume'
import TemplateThemeConfigurator from '../components/TemplateThemeConfigurator'
import TemplateBlockConfigurator from '../components/TemplateBlockConfigurator'
import { resolveTemplateTheme } from '../utils/templateTheme'
import { DEFAULT_TEMPLATE_BLOCKS } from '../utils/templateBlocks'
import { DUMMY_RESUME_DATA } from '../utils/data'

const initialDraft = {
  name: '',
  description: '',
  rendererKey: 'flex',
  sourceType: 'custom',
  category: 'general',
}

const TemplatesPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const resumeId = searchParams.get('resumeId') || ''

  const [templates, setTemplates] = useState([])
  const [reviewQueue, setReviewQueue] = useState([])
  const [resumes, setResumes] = useState([])
  const [activeTemplateId, setActiveTemplateId] = useState('')
  const [activeResumeId, setActiveResumeId] = useState(resumeId)
  const [themeSettings, setThemeSettings] = useState({})
  const [blockConfig, setBlockConfig] = useState(DEFAULT_TEMPLATE_BLOCKS)
  const [layoutMode, setLayoutMode] = useState('two-column')
  const [submitterNote, setSubmitterNote] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')
  const [filters, setFilters] = useState({
    scope: 'all',
    sourceType: '',
    category: '',
    reviewStatus: '',
  })
  const [draft, setDraft] = useState(initialDraft)

  const mergeAndSetTemplates = (templateList) => {
    const merged = mergeTemplateMetadata(templateList)
    setTemplates(merged)
    if (!activeTemplateId && merged[0]) setActiveTemplateId(merged[0].id)
    return merged
  }

  const fetchData = async () => {
    try {
      const query = new URLSearchParams()
      if (filters.scope === 'favorites') query.set('scope', 'favorites')
      if (filters.scope === 'mine') query.set('scope', 'mine')
      if (filters.sourceType) query.set('sourceType', filters.sourceType)
      if (filters.category) query.set('category', filters.category)
      if (filters.reviewStatus) query.set('reviewStatus', filters.reviewStatus)
      const suffix = query.toString() ? `?${query.toString()}` : ''

      const reviewQuery = new URLSearchParams()
      if (filters.reviewStatus) reviewQuery.set('reviewStatus', filters.reviewStatus)
      const reviewSuffix = reviewQuery.toString() ? `?${reviewQuery.toString()}` : ''

      const [templateResponse, resumeResponse, reviewResponse] = await Promise.all([
        axiosInstance.get(`${API_PATHS.TEMPLATES.GET_ALL}${suffix}`),
        axiosInstance.get(API_PATHS.RESUME.GET_ALL),
        axiosInstance.get(`${API_PATHS.TEMPLATES.GET_REVIEW_QUEUE}${reviewSuffix}`),
      ])
      mergeAndSetTemplates(templateResponse.data)
      setResumes(resumeResponse.data)
      setReviewQueue(mergeTemplateMetadata(reviewResponse.data))
      if (!activeResumeId && resumeResponse.data[0]) setActiveResumeId(resumeResponse.data[0]._id)
    } catch (error) {
      toast.error('加载模板中心失败')
    }
  }

  useEffect(() => {
    fetchData()
  }, [filters.scope, filters.sourceType, filters.category, filters.reviewStatus])

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
      setBlockConfig(activeTemplate.blockSchema?.blocks || DEFAULT_TEMPLATE_BLOCKS)
      setLayoutMode(activeTemplate.blockSchema?.layoutMode || 'two-column')
      setSubmitterNote(activeTemplate.communityMeta?.submitterNote || '')
      setReviewNotes(activeTemplate.communityMeta?.reviewNotes || '')
    }
  }, [activeTemplate?.id, activeResume?._id])

  const previewResume = useMemo(() => ({
    ...(activeResume || DUMMY_RESUME_DATA),
    template: {
      ...(activeResume?.template || {}),
      theme: activeTemplate?.rendererKey || activeResume?.template?.theme || '01',
      templateId: activeTemplate?.id || activeResume?.template?.templateId,
      settings: {
        ...themeSettings,
        layoutMode,
        blockConfig,
      },
    },
  }), [activeResume, activeTemplate, themeSettings, layoutMode, blockConfig])

  const updateCurrentTemplate = (patch) => {
    if (!activeTemplate) return
    setTemplates((prev) => prev.map((item) => item.id === activeTemplate.id ? { ...item, ...patch } : item))
  }

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
        layoutMode,
        blockConfig,
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
        blockSchema: {
          layoutMode,
          availableLayouts: ['single', 'two-column'],
          blocks: blockConfig,
        },
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
        themeSchema: {
          ...(activeTemplate.themeSchema || {}),
          defaultConfig: {
            ...(activeTemplate.themeSchema?.defaultConfig || {}),
            ...themeSettings,
          },
        },
        blockSchema: {
          ...(activeTemplate.blockSchema || {}),
          layoutMode,
          availableLayouts: ['single', 'two-column'],
          blocks: blockConfig,
        },
        communityMeta: {
          ...(activeTemplate.communityMeta || {}),
          submitterNote,
          reviewNotes,
        },
      })
      updateCurrentTemplate(response.data)
      toast.success('模板元数据已更新')
      fetchData()
    } catch (error) {
      toast.error('更新模板失败')
    }
  }

  const handleSubmitCommunity = async () => {
    if (!activeTemplate) return

    try {
      const response = await axiosInstance.post(API_PATHS.TEMPLATES.SUBMIT_COMMUNITY(activeTemplate.id), {
        submitterNote,
      })
      updateCurrentTemplate(response.data)
      toast.success('模板已提交社区审核')
      fetchData()
    } catch (error) {
      toast.error('提交社区审核失败')
    }
  }

  const handleReview = async (templateId, decision) => {
    try {
      await axiosInstance.post(API_PATHS.TEMPLATES.REVIEW(templateId), {
        decision,
        reviewNotes,
      })
      toast.success(decision === 'approved' ? '模板已通过审核' : '模板已驳回')
      fetchData()
    } catch (error) {
      toast.error('处理审核失败')
    }
  }

  return (
    <DashboardLayout activeMenu='templates'>
      <div className='space-y-8 px-4'>
        <div className='flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between'>
          <div>
            <h1 className='text-3xl font-black text-slate-900'>模板中心 / 创作工作台</h1>
            <p className='mt-2 text-slate-600'>在 Phase G 中，模板已从“选择样式”升级为“编辑区块、调整布局、提交社区和审核发布”的完整创作工作台。</p>
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-4 gap-3'>
            <select value={filters.scope} onChange={(e) => setFilters((prev) => ({ ...prev, scope: e.target.value }))} className='rounded-2xl border border-slate-200 px-4 py-3'>
              <option value='all'>全部模板</option>
              <option value='favorites'>仅看收藏</option>
              <option value='mine'>我的模板</option>
            </select>
            <select value={filters.sourceType} onChange={(e) => setFilters((prev) => ({ ...prev, sourceType: e.target.value }))} className='rounded-2xl border border-slate-200 px-4 py-3'>
              <option value=''>全部来源</option>
              <option value='official'>官方</option>
              <option value='custom'>个人模板</option>
              <option value='community'>社区模板</option>
            </select>
            <select value={filters.reviewStatus} onChange={(e) => setFilters((prev) => ({ ...prev, reviewStatus: e.target.value }))} className='rounded-2xl border border-slate-200 px-4 py-3'>
              <option value=''>全部审核状态</option>
              <option value='pending'>待审核</option>
              <option value='approved'>已通过</option>
              <option value='rejected'>已驳回</option>
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
              <div className='text-lg font-bold text-slate-900'>模板库</div>
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
                      <span className='rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500'>
                        {template.sourceType === 'official' ? '官方' : template.sourceType === 'custom' ? '我的模板' : '社区模板'}
                      </span>
                    </div>
                    <p className='mt-3 text-sm text-slate-600'>{template.description || '暂无描述'}</p>
                    <div className='mt-2 text-xs text-slate-500'>审核状态：{template.communityMeta?.reviewStatus || 'reserved'}</div>
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
              <div className='text-lg font-bold text-slate-900'>自定义模板编辑器</div>
              <p className='text-sm text-slate-500'>基于当前主题和区块配置创建新模板，推荐优先使用 `flex` 渲染器进入高自由度创作。</p>
              <input value={draft.name} onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))} placeholder='新模板名称' className='w-full rounded-2xl border border-slate-200 px-4 py-3' />
              <textarea value={draft.description} onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))} placeholder='描述这个模板适合谁使用' rows={3} className='w-full rounded-2xl border border-slate-200 px-4 py-3' />
              <div className='grid grid-cols-2 gap-3'>
                <select value={draft.rendererKey} onChange={(e) => setDraft((prev) => ({ ...prev, rendererKey: e.target.value }))} className='rounded-2xl border border-slate-200 px-4 py-3'>
                  <option value='flex'>灵活布局渲染器</option>
                  <option value='01'>渲染器 01</option>
                  <option value='02'>渲染器 02</option>
                  <option value='03'>渲染器 03</option>
                </select>
                <select value={draft.sourceType} onChange={(e) => setDraft((prev) => ({ ...prev, sourceType: e.target.value }))} className='rounded-2xl border border-slate-200 px-4 py-3'>
                  <option value='custom'>个人模板</option>
                  <option value='community'>社区候选</option>
                </select>
              </div>
              <button type='submit' className='w-full rounded-2xl bg-violet-600 px-4 py-3 font-semibold text-white'>创建模板资产</button>
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
                      <button onClick={handleUpdateMetadata} className='rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700'>保存模板配置</button>
                      <button onClick={handleApply} className='rounded-2xl bg-violet-600 px-5 py-3 font-semibold text-white'>套用到当前简历</button>
                    </div>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <input value={activeTemplate.name || ''} onChange={(e) => updateCurrentTemplate({ name: e.target.value })} className='rounded-2xl border border-slate-200 px-4 py-3' />
                    <input value={activeTemplate.category || ''} onChange={(e) => updateCurrentTemplate({ category: e.target.value })} className='rounded-2xl border border-slate-200 px-4 py-3' />
                    <select value={activeTemplate.status || 'active'} onChange={(e) => updateCurrentTemplate({ status: e.target.value })} className='rounded-2xl border border-slate-200 px-4 py-3'>
                      <option value='draft'>草稿</option>
                      <option value='active'>启用</option>
                      <option value='archived'>归档</option>
                    </select>
                  </div>

                  <textarea value={activeTemplate.description || ''} onChange={(e) => updateCurrentTemplate({ description: e.target.value })} rows={3} className='w-full rounded-2xl border border-slate-200 px-4 py-3' />
                </div>

                <TemplateThemeConfigurator template={activeTemplate} value={themeSettings} onChange={setThemeSettings} />
                <TemplateBlockConfigurator blocks={blockConfig} layoutMode={layoutMode} onLayoutModeChange={setLayoutMode} onBlocksChange={setBlockConfig} />

                <div className='rounded-3xl border border-slate-200 bg-white p-5 space-y-4'>
                  <div className='text-xl font-bold text-slate-900'>社区发布与审核</div>
                  <textarea value={submitterNote} onChange={(e) => setSubmitterNote(e.target.value)} rows={3} placeholder='提交到社区时，说明这个模板的亮点和适用人群' className='w-full rounded-2xl border border-slate-200 px-4 py-3' />
                  <textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} rows={3} placeholder='审核备注 / 驳回原因' className='w-full rounded-2xl border border-slate-200 px-4 py-3' />
                  <div className='flex flex-wrap gap-3'>
                    <button onClick={handleSubmitCommunity} className='rounded-2xl border border-emerald-200 px-5 py-3 font-semibold text-emerald-700'>提交社区审核</button>
                    <div className='rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600'>
                      当前状态：{activeTemplate.communityMeta?.reviewStatus || 'reserved'}
                      {activeTemplate.communityMeta?.reviewerName ? ` · 审核人：${activeTemplate.communityMeta.reviewerName}` : ''}
                    </div>
                  </div>
                </div>

                <div className='rounded-3xl border border-slate-200 bg-white p-5'>
                  <div className='mb-4'>
                    <div className='text-xl font-bold text-slate-900'>实时预览</div>
                    <div className='mt-1 text-sm text-slate-500'>预览会基于当前选中的简历数据、主题参数、区块配置和布局模式实时渲染。</div>
                  </div>
                  <RenderResume
                    templateId={activeTemplate.rendererKey}
                    templateMeta={{
                      ...activeTemplate,
                      blockSchema: {
                        ...(activeTemplate.blockSchema || {}),
                        layoutMode,
                        blocks: blockConfig,
                      },
                    }}
                    resumeData={previewResume}
                    containerWidth={null}
                  />
                </div>

                <div className='rounded-3xl border border-slate-200 bg-white p-5'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='text-xl font-bold text-slate-900'>社区审核台</div>
                      <div className='mt-1 text-sm text-slate-500'>本阶段提供轻量审核流，支持待审核模板的通过和驳回，为正式社区模板市场做预演。</div>
                    </div>
                    <div className='text-sm text-slate-500'>{reviewQueue.length} 个社区模板</div>
                  </div>
                  <div className='mt-4 space-y-3'>
                    {reviewQueue.length === 0 && <div className='text-sm text-slate-500'>当前没有社区模板等待审核。</div>}
                    {reviewQueue.map((item) => (
                      <div key={item.id} className='rounded-2xl border border-slate-200 p-4'>
                        <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
                          <div>
                            <div className='font-bold text-slate-900'>{item.name}</div>
                            <div className='mt-1 text-sm text-slate-600'>{item.description || '暂无描述'}</div>
                            <div className='mt-2 text-xs text-slate-500'>
                              状态：{item.communityMeta?.reviewStatus || 'reserved'}
                              {item.communityMeta?.submitterNote ? ` · 提交说明：${item.communityMeta.submitterNote}` : ''}
                            </div>
                          </div>
                          <div className='flex flex-wrap gap-2'>
                            <button onClick={() => handleReview(item.id, 'approved')} className='rounded-2xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700'>通过</button>
                            <button onClick={() => handleReview(item.id, 'rejected')} className='rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700'>驳回</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
