import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import {
  CheckCircle2,
  Copy,
  Heart,
  PencilLine,
  Plus,
  Search,
  Sparkles,
  Stars,
  Trash2,
} from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import TemplateBlockConfigurator from '../components/TemplateBlockConfigurator'
import TemplateThemeConfigurator from '../components/TemplateThemeConfigurator'
import axiosInstance from '../utils/axiosInstance'
import { API_PATHS } from '../utils/apiPaths'
import { getTemplateMetadata, mergeTemplateMetadata } from '../utils/templateRegistry'
import { DUMMY_RESUME_DATA } from '../utils/data'
import { fetchTemplateById, fetchTemplates } from '../services/queryService'
import { queryKeys } from '../lib/queryKeys'
import { translateWithFallback } from '../utils/i18n'

const RenderResume = lazy(() => import('../components/RenderResume'))

const initialDraft = {
  name: '',
  description: '',
  rendererKey: 'flex',
  sourceType: 'custom',
  category: 'general',
}

const libraryScopes = [
  { value: 'all', label: '全部模板' },
  { value: 'favorites', label: '我的收藏' },
  { value: 'mine', label: '我的模板' },
]

const reviewStatusCopy = {
  reserved: '未提交',
  pending: '待审核',
  approved: '已发布',
  rejected: '已驳回',
  official: '官方模板',
}

const sourceTypeCopy = {
  official: '官方',
  custom: '个人',
  community: '社区',
}

const categoryOptions = [
  { value: 'general', label: '通用' },
  { value: 'product', label: '产品 / 设计' },
  { value: 'engineering', label: '工程 / 技术' },
  { value: 'business', label: '商业 / 运营' },
]

const managementPanels = [
  { value: 'details', label: '模板详情' },
  { value: 'layout', label: '排版编辑' },
  { value: 'create', label: '新建模板' },
]

const PanelSkeleton = ({ className = 'h-40' }) => (
  <div className={`animate-pulse rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/70 ${className}`} />
)

const PreviewFallback = ({ text = '正在生成模板预览...' }) => (
  <div className='rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-6'>
    <div className='mb-4 text-sm font-medium text-slate-500'>{text}</div>
    <div className='space-y-4 animate-pulse'>
      <div className='h-6 w-1/3 rounded-full bg-slate-200' />
      <div className='h-4 w-2/3 rounded-full bg-slate-200' />
      <div className='h-24 rounded-[24px] bg-slate-100' />
      <div className='h-24 rounded-[24px] bg-slate-100' />
      <div className='h-40 rounded-[24px] bg-slate-100' />
    </div>
  </div>
)

const scrollPanelClassName = 'h-[min(72vh,960px)] overflow-y-auto pr-2'
const listPanelHeightClassName = 'h-[calc(min(72vh,960px)+9.5rem)]'
const scrollCardClassName = `flex ${listPanelHeightClassName} flex-col`
const scrollAreaStyle = {
  scrollbarWidth: 'thin',
  scrollbarColor: '#94a3b8 transparent',
}

const TemplatesPage = () => {
  const { t } = useTranslation()
  const tt = (key, fallback, options) => translateWithFallback(t, key, fallback, options)
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [scope, setScope] = useState('all')
  const [sourceType, setSourceType] = useState('')
  const [activeTemplateId, setActiveTemplateId] = useState('')
  const [activePanel, setActivePanel] = useState('details')
  const [submitterNote, setSubmitterNote] = useState('')
  const [draft, setDraft] = useState(initialDraft)
  const [templateBaseline, setTemplateBaseline] = useState(null)
  const [tabHighlightStyle, setTabHighlightStyle] = useState(null)
  const tabContainerRef = useRef(null)
  const tabButtonRefs = useRef({})
  const getScopeLabel = (value) => {
    if (value === 'favorites') return tt('templatesPage.scopes.favorites', '我的收藏')
    if (value === 'mine') return tt('templatesPage.scopes.mine', '我的模板')
    return tt('templatesPage.scopes.all', '全部模板')
  }
  const getReviewStatusLabel = (value) => {
    if (value === 'pending') return tt('templatesPage.reviewStatus.pending', '待审核')
    if (value === 'approved') return tt('templatesPage.reviewStatus.approved', '已发布')
    if (value === 'rejected') return tt('templatesPage.reviewStatus.rejected', '已驳回')
    if (value === 'official') return tt('templatesPage.reviewStatus.official', '官方模板')
    return tt('templatesPage.reviewStatus.reserved', '未提交')
  }
  const getSourceTypeLabel = (value) => {
    if (value === 'official') return tt('templatesPage.sourceType.official', '官方')
    if (value === 'custom') return tt('templatesPage.sourceType.custom', '个人')
    if (value === 'community') return tt('templatesPage.sourceType.community', '社区')
    return value || ''
  }
  const getCategoryLabel = (value) => {
    if (value === 'product') return tt('templatesPage.categories.product', '产品 / 设计')
    if (value === 'engineering') return tt('templatesPage.categories.engineering', '工程 / 技术')
    if (value === 'business') return tt('templatesPage.categories.business', '商业 / 运营')
    return tt('templatesPage.categories.general', '通用')
  }
  const getPanelLabel = (value) => {
    if (value === 'layout') return tt('templatesPage.panels.layout', '排版编辑')
    if (value === 'create') return tt('templatesPage.panels.create', '新建模板')
    return tt('templatesPage.panels.details', '模板详情')
  }

  const templateFilters = useMemo(() => ({
    ...(scope !== 'all' ? { scope } : {}),
    ...(sourceType ? { sourceType } : {}),
  }), [scope, sourceType])

  const templatesQuery = useQuery({
    queryKey: queryKeys.templates({ scope, sourceType }),
    queryFn: () => fetchTemplates(templateFilters),
    placeholderData: (previous) => previous,
    select: (data) => mergeTemplateMetadata(data),
  })

  const templates = templatesQuery.data || []
  const templatesLoading = templatesQuery.status === 'pending' && !templatesQuery.data

  const filteredTemplates = useMemo(() => {
    if (!searchTerm.trim()) {
      return templates
    }

    const keyword = searchTerm.trim().toLowerCase()
    return templates.filter((template) => {
      const haystack = [
        template.name,
        template.description,
        template.authorName,
        ...(template.tags || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(keyword)
    })
  }, [templates, searchTerm])

  useEffect(() => {
    if (!activeTemplateId && templates[0]) {
      setActiveTemplateId(templates[0].id)
    }
  }, [activeTemplateId, templates])

  useEffect(() => {
    if (activeTemplateId && !templates.some((template) => template.id === activeTemplateId)) {
      setActiveTemplateId(filteredTemplates[0]?.id || templates[0]?.id || '')
    }
  }, [activeTemplateId, filteredTemplates, templates])

  const activeTemplateSummary = useMemo(
    () => filteredTemplates.find((template) => template.id === activeTemplateId)
      || templates.find((template) => template.id === activeTemplateId)
      || filteredTemplates[0]
      || templates[0]
      || null,
    [filteredTemplates, templates, activeTemplateId]
  )

  const templateDetailQuery = useQuery({
    queryKey: queryKeys.template(activeTemplateSummary?.id),
    queryFn: () => fetchTemplateById(activeTemplateSummary.id),
    enabled: Boolean(activeTemplateSummary?.id),
    placeholderData: () => activeTemplateSummary || undefined,
  })

  const activeTemplate = useMemo(
    () => getTemplateMetadata(templateDetailQuery.data || activeTemplateSummary),
    [templateDetailQuery.data, activeTemplateSummary]
  )

  useEffect(() => {
    setSubmitterNote(activeTemplate?.communityMeta?.submitterNote || '')
    if (activeTemplate?.id) {
      setTemplateBaseline({
        id: activeTemplate.id,
        name: activeTemplate.name || '',
        description: activeTemplate.description || '',
        category: activeTemplate.category || 'general',
        submitterNote: activeTemplate?.communityMeta?.submitterNote || '',
        themeSchema: activeTemplate.themeSchema || {},
        blockSchema: activeTemplate.blockSchema || {},
      })
    } else {
      setTemplateBaseline(null)
    }
  }, [activeTemplate?.id])

  const previewResume = useMemo(() => ({
    ...DUMMY_RESUME_DATA,
    template: {
      ...(DUMMY_RESUME_DATA.template || {}),
      theme: activeTemplate?.rendererKey || '01',
      templateId: activeTemplate?.id || DUMMY_RESUME_DATA.template?.templateId,
      settings: {
        ...(activeTemplate?.themeSchema?.defaultConfig || DUMMY_RESUME_DATA.template?.settings || {}),
        layoutMode: activeTemplate?.blockSchema?.layoutMode || 'two-column',
        blockConfig: activeTemplate?.blockSchema?.blocks || [],
      },
    },
  }), [activeTemplate])

  const syncTemplateAcrossCaches = (incomingTemplate) => {
    const nextTemplate = getTemplateMetadata(incomingTemplate)

    queryClient.setQueriesData({ queryKey: ['templates'] }, (previous) => {
      if (!Array.isArray(previous)) return previous
      const exists = previous.some((item) => item.id === nextTemplate.id)

      if (!exists) {
        return [nextTemplate, ...previous]
      }

      return previous.map((item) => item.id === nextTemplate.id ? { ...item, ...nextTemplate } : item)
    })

    queryClient.setQueryData(queryKeys.template(nextTemplate.id), nextTemplate)
    return nextTemplate
  }

  const detailsDirty = useMemo(() => {
    if (!activeTemplate?.isOwned || !templateBaseline || templateBaseline.id !== activeTemplate.id) {
      return false
    }

    return JSON.stringify({
      name: activeTemplate.name || '',
      description: activeTemplate.description || '',
      category: activeTemplate.category || 'general',
      submitterNote,
    }) !== JSON.stringify({
      name: templateBaseline.name,
      description: templateBaseline.description,
      category: templateBaseline.category,
      submitterNote: templateBaseline.submitterNote,
    })
  }, [activeTemplate, submitterNote, templateBaseline])

  const layoutDirty = useMemo(() => {
    if (!activeTemplate?.isOwned || !templateBaseline || templateBaseline.id !== activeTemplate.id) {
      return false
    }

    return JSON.stringify({
      themeSchema: activeTemplate.themeSchema || {},
      blockSchema: activeTemplate.blockSchema || {},
    }) !== JSON.stringify({
      themeSchema: templateBaseline.themeSchema || {},
      blockSchema: templateBaseline.blockSchema || {},
    })
  }, [activeTemplate, templateBaseline])

  const createDraftDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(initialDraft),
    [draft]
  )

  useEffect(() => {
    const hasPendingChanges = detailsDirty || layoutDirty || createDraftDirty
    const handleBeforeUnload = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }

    if (hasPendingChanges) {
      window.addEventListener('beforeunload', handleBeforeUnload)
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [detailsDirty, layoutDirty, createDraftDirty])

  useEffect(() => {
    const syncTabHighlight = () => {
      const container = tabContainerRef.current
      const activeButton = tabButtonRefs.current[activePanel]

      if (!container || !activeButton) {
        setTabHighlightStyle(null)
        return
      }

      setTabHighlightStyle({
        width: activeButton.offsetWidth,
        height: activeButton.offsetHeight,
        transform: `translate(${activeButton.offsetLeft}px, ${activeButton.offsetTop}px)`,
      })
    }

    syncTabHighlight()
    window.addEventListener('resize', syncTabHighlight)
    return () => window.removeEventListener('resize', syncTabHighlight)
  }, [activePanel, activeTemplate?.id, detailsDirty, layoutDirty, createDraftDirty])

  const removeTemplateFromCaches = (templateId) => {
    queryClient.setQueriesData({ queryKey: ['templates'] }, (previous) => {
      if (!Array.isArray(previous)) return previous
      return previous.filter((item) => item.id !== templateId)
    })
    queryClient.removeQueries({ queryKey: queryKeys.template(templateId) })
  }

  const favoriteMutation = useMutation({
    mutationFn: (templateId) => axiosInstance.post(API_PATHS.TEMPLATES.TOGGLE_FAVORITE(templateId)),
    onSuccess: (response) => {
      syncTemplateAcrossCaches(response.data)
      toast.success(response.data.isFavorite
        ? tt('templatesPage.toasts.favorited', '已加入收藏')
        : tt('templatesPage.toasts.unfavorited', '已取消收藏'))
    },
    onError: () => {
      toast.error(tt('templatesPage.toasts.favoriteFailed', '更新收藏失败'))
    },
  })

  const createTemplateMutation = useMutation({
    mutationFn: (payload) => axiosInstance.post(API_PATHS.TEMPLATES.CREATE, payload),
    onSuccess: (response) => {
      const nextTemplate = syncTemplateAcrossCaches(response.data)
      setDraft(initialDraft)
      setActiveTemplateId(nextTemplate.id)
      setActivePanel('details')
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast.success(tt('templatesPage.toasts.created', '个人模板已创建'))
    },
    onError: () => {
      toast.error(tt('templatesPage.toasts.createFailed', '创建模板失败'))
    },
  })

  const duplicateTemplateMutation = useMutation({
    mutationFn: (templateId) => axiosInstance.post(API_PATHS.TEMPLATES.DUPLICATE(templateId)),
    onSuccess: (response) => {
      const nextTemplate = syncTemplateAcrossCaches(response.data)
      setActiveTemplateId(nextTemplate.id)
      setActivePanel('layout')
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast.success(tt('templatesPage.toasts.duplicated', '已复制到我的模板，继续编辑排版吧'))
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || tt('templatesPage.toasts.duplicateFailed', '复制模板失败'))
    },
  })

  const updateTemplateMutation = useMutation({
    mutationFn: ({ templateId, payload }) => axiosInstance.put(API_PATHS.TEMPLATES.UPDATE(templateId), payload),
    onSuccess: (response) => {
      const nextTemplate = syncTemplateAcrossCaches(response.data)
      setTemplateBaseline({
        id: nextTemplate.id,
        name: nextTemplate.name || '',
        description: nextTemplate.description || '',
        category: nextTemplate.category || 'general',
        submitterNote: nextTemplate?.communityMeta?.submitterNote || '',
        themeSchema: nextTemplate.themeSchema || {},
        blockSchema: nextTemplate.blockSchema || {},
      })
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast.success(tt('templatesPage.toasts.updated', '模板已更新'))
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || tt('templatesPage.toasts.updateFailed', '保存模板失败'))
    },
  })

  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId) => axiosInstance.delete(API_PATHS.TEMPLATES.DELETE(templateId)),
    onSuccess: (_, templateId) => {
      removeTemplateFromCaches(templateId)
      if (activeTemplateId === templateId) {
        const next = filteredTemplates.find((item) => item.id !== templateId) || templates.find((item) => item.id !== templateId)
        setActiveTemplateId(next?.id || '')
      }
      toast.success(tt('templatesPage.toasts.deleted', '模板已删除'))
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || tt('templatesPage.toasts.deleteFailed', '删除模板失败'))
    },
  })

  const submitCommunityMutation = useMutation({
    mutationFn: ({ templateId, payload }) => axiosInstance.post(API_PATHS.TEMPLATES.SUBMIT_COMMUNITY(templateId), payload),
    onSuccess: (response) => {
      const nextTemplate = syncTemplateAcrossCaches(response.data)
      setTemplateBaseline({
        id: nextTemplate.id,
        name: nextTemplate.name || '',
        description: nextTemplate.description || '',
        category: nextTemplate.category || 'general',
        submitterNote: nextTemplate?.communityMeta?.submitterNote || '',
        themeSchema: nextTemplate.themeSchema || {},
        blockSchema: nextTemplate.blockSchema || {},
      })
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast.success(tt('templatesPage.toasts.submitted', '模板已提交社区审核'))
    },
    onError: () => {
      toast.error(tt('templatesPage.toasts.submitFailed', '提交社区审核失败'))
    },
  })

  const updateCurrentTemplate = (patch) => {
    if (!activeTemplate) return
    syncTemplateAcrossCaches({ ...activeTemplate, ...patch })
  }

  const handleCreateTemplate = (e) => {
    e.preventDefault()
    if (!draft.name.trim()) {
      toast.error(tt('templatesPage.toasts.nameRequired', '请填写模板名称'))
      return
    }

    createTemplateMutation.mutate({
      ...draft,
      themeSchema: {
        defaultConfig: {},
        presets: [],
        supportedOptions: ['accentColor', 'headingColor', 'tagBackground', 'fontFamily', 'density'],
      },
      blockSchema: {
        layoutMode: 'two-column',
        availableLayouts: ['single', 'two-column'],
        blocks: activeTemplate?.blockSchema?.blocks || [],
      },
    })
  }

  const handleUpdateTemplate = () => {
    if (!activeTemplate?.isOwned) {
      toast.error(tt('templatesPage.toasts.onlyOwnedEditable', '只有你的模板可以编辑'))
      return
    }

    updateTemplateMutation.mutate({
      templateId: activeTemplate.id,
      payload: {
        name: activeTemplate.name,
        description: activeTemplate.description,
        category: activeTemplate.category,
        themeSchema: activeTemplate.themeSchema,
        blockSchema: activeTemplate.blockSchema,
        communityMeta: {
          ...(activeTemplate.communityMeta || {}),
          submitterNote,
        },
      },
    })
  }

  const handleDeleteTemplate = () => {
    if (!activeTemplate?.isOwned) {
      toast.error(tt('templatesPage.toasts.officialDeleteBlocked', '官方模板不支持删除'))
      return
    }

    deleteTemplateMutation.mutate(activeTemplate.id)
  }

  const handleSubmitCommunity = () => {
    if (!activeTemplate?.isOwned) {
      toast.error(tt('templatesPage.toasts.onlyOwnedSubmittable', '只有你的模板可以提交社区'))
      return
    }

    submitCommunityMutation.mutate({
      templateId: activeTemplate.id,
      payload: {
        submitterNote,
      },
    })
  }

  const handleDuplicateTemplate = () => {
    if (!activeTemplate?.id) return
    duplicateTemplateMutation.mutate(activeTemplate.id)
  }

  return (
    <DashboardLayout activeMenu='templates'>
      <div className='space-y-6 px-4 pb-8'>
        <section className='overflow-hidden rounded-[36px] border border-slate-200 bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.18),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.16),_transparent_30%),linear-gradient(135deg,#f8fafc_0%,#fffef8_46%,#ffffff_100%)] p-8 shadow-[0_32px_80px_-54px_rgba(148,163,184,0.95)]'>
          <div className='flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between'>
            <div className='max-w-3xl'>
              <div className='inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600'>
                <Stars className='h-4 w-4 text-amber-500' />
                {tt('templatesPage.badge', 'Template Manager')}
              </div>
              <h1 className='mt-4 font-serif text-4xl font-black tracking-tight text-slate-900'>{tt('templatesPage.title', '模板管理中心')}</h1>
              <p className='mt-3 max-w-2xl text-base leading-7 text-slate-600'>
                {tt('templatesPage.description', '在这里统一浏览官方模板、预览社区模板，并管理你自己的模板资产。模板套用已迁回简历编辑页，不再在这里选择简历应用。')}
              </p>
            </div>

            <div className='grid gap-3 sm:grid-cols-2 xl:min-w-[420px]'>
              <div className='rounded-[28px] border border-white/70 bg-white/80 px-5 py-4 shadow-lg shadow-slate-200/70 backdrop-blur'>
                <div className='text-xs font-semibold uppercase tracking-[0.2em] text-slate-400'>{tt('templatesPage.currentSelection', '当前选中模板')}</div>
                <div className='mt-2 text-lg font-black text-slate-900'>{activeTemplate?.name || (templatesLoading ? tt('templatesPage.loadingState', '正在加载...') : tt('templatesPage.unselected', '未选择模板'))}</div>
              </div>
              <div className='rounded-[28px] border border-white/70 bg-white/80 px-5 py-4 shadow-lg shadow-slate-200/70 backdrop-blur'>
                <div className='text-xs font-semibold uppercase tracking-[0.2em] text-slate-400'>{tt('templatesPage.managementState', '管理状态')}</div>
                <div className='mt-2 text-lg font-black text-slate-900'>{activeTemplate?.isOwned ? tt('templatesPage.editable', '可编辑') : tt('templatesPage.readonly', '只读预览')}</div>
              </div>
            </div>
          </div>
        </section>

        <section className='grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]'>
          <aside className='space-y-5'>
            <div className='rounded-[32px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70'>
              <div className='relative'>
                <Search className='pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={tt('templatesPage.searchPlaceholder', '搜索模板、作者、关键词')}
                  className='w-full rounded-[24px] border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white'
                />
              </div>

              <div className='mt-4 grid gap-3'>
                <div className='flex flex-wrap gap-2'>
                  {libraryScopes.map((item) => (
                    <button
                      key={item.value}
                      type='button'
                      onClick={() => setScope(item.value)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        scope === item.value
                          ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                      }`}
                    >
                        {getScopeLabel(item.value)}
                    </button>
                  ))}
                </div>

                <select
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                  className='rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white'
                >
                  <option value=''>{tt('templatesPage.allSources', '全部来源')}</option>
                  <option value='official'>{tt('templatesPage.sourceLabel.official', '官方模板')}</option>
                  <option value='custom'>{tt('templatesPage.sourceLabel.custom', '个人模板')}</option>
                  <option value='community'>{tt('templatesPage.sourceLabel.community', '社区模板')}</option>
                </select>
              </div>
            </div>

            <div className={`rounded-[32px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 ${scrollCardClassName}`}>
              <div className='flex items-center justify-between'>
                <div>
                  <div className='text-xl font-black text-slate-900'>{tt('templatesPage.listTitle', '模板列表')}</div>
                  <p className='mt-1 text-sm text-slate-500'>{tt('templatesPage.listDescription', '这里负责查找模板和切换预览对象。')}</p>
                </div>
                <div className='rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700'>
                  {templatesLoading ? tt('templatesPage.loadingCount', '加载中') : tt('templatesPage.count', '{{count}} 个', { count: filteredTemplates.length })}
                </div>
              </div>

              <div className='mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto pr-2' style={scrollAreaStyle}>
                {templatesLoading && Array.from({ length: 5 }).map((_, index) => (
                  <PanelSkeleton key={`template-skeleton-${index}`} className='h-28' />
                ))}

                {!templatesLoading && filteredTemplates.map((template) => {
                  const isSelected = activeTemplate?.id === template.id
                  return (
                    <button
                      key={template.id}
                      type='button'
                      onClick={() => setActiveTemplateId(template.id)}
                      className={`w-full rounded-[28px] border p-4 text-left transition-all ${
                        isSelected
                          ? 'border-slate-900 bg-slate-900 text-white shadow-2xl shadow-slate-300/70'
                          : 'border-slate-200 bg-slate-50/70 hover:border-amber-200 hover:bg-white'
                      }`}
                    >
                      <div className='flex items-start justify-between gap-3'>
                        <div>
                          <div className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-900'}`}>{template.name}</div>
                          <div className={`mt-1 text-xs uppercase tracking-[0.22em] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                            {template.authorName || tt('templatesPage.defaultAuthor', 'ResumeXpert')}
                          </div>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${isSelected ? 'bg-white/10 text-white' : 'bg-white text-slate-600'}`}>
                          {getSourceTypeLabel(template.sourceType)}
                        </span>
                      </div>
                      <p className={`mt-3 line-clamp-2 text-sm ${isSelected ? 'text-slate-200' : 'text-slate-600'}`}>
                        {template.description || tt('templatesPage.noDescription', '暂无描述')}
                      </p>
                      <div className='mt-4 flex flex-wrap gap-2'>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${isSelected ? 'bg-white/10 text-slate-100' : 'bg-slate-100 text-slate-500'}`}>
                          {getReviewStatusLabel(template.communityMeta?.reviewStatus)}
                        </span>
                        {template.isFavorite && (
                          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${isSelected ? 'bg-amber-400/20 text-amber-100' : 'bg-amber-50 text-amber-700'}`}>
                            {tt('templatesPage.favorited', '已收藏')}
                          </span>
                        )}
                        {template.isOwned && (
                          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${isSelected ? 'bg-emerald-400/20 text-emerald-100' : 'bg-emerald-50 text-emerald-700'}`}>
                            {tt('templatesPage.owned', '我的模板')}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}

                {!templatesLoading && filteredTemplates.length === 0 && (
                  <div className='rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500'>
                    {tt('templatesPage.empty', '没有匹配的模板，试试切换筛选或清空关键词。')}
                  </div>
                )}
              </div>
            </div>
          </aside>

          <div className='space-y-6'>
            {(activeTemplate || templateDetailQuery.isFetching) ? (
              <>
                <section className='rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70'>
                  {!activeTemplate && <PanelSkeleton className='h-56' />}
                  {activeTemplate && (
                    <div className='flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between'>
                      <div className='max-w-2xl'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <span className='rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500'>
                            {getSourceTypeLabel(activeTemplate.sourceType)}
                          </span>
                          <span className='rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700'>
                            {getReviewStatusLabel(activeTemplate.communityMeta?.reviewStatus)}
                          </span>
                        </div>
                        <h2 className='mt-4 text-4xl font-black tracking-tight text-slate-900'>{activeTemplate.name}</h2>
                        <p className='mt-3 text-base leading-7 text-slate-600'>{activeTemplate.description || tt('templatesPage.noDescription', '暂无描述')}</p>
                        <div className='mt-4 inline-flex items-center rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600'>
                          {tt('templatesPage.authorPrefix', '作者：')}{activeTemplate.authorName || tt('templatesPage.defaultAuthor', 'ResumeXpert')}
                        </div>

                        <div className='mt-5 flex flex-wrap gap-2'>
                          {(activeTemplate.tags || []).slice(0, 6).map((tag) => (
                            <span key={tag} className='rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600'>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className='w-full max-w-md rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_100%)] p-5 shadow-lg shadow-slate-100/80'>
                        <div className='text-xs font-semibold uppercase tracking-[0.22em] text-slate-500'>{tt('templatesPage.actionsBadge', 'Template Actions')}</div>
                        <div className='mt-2 text-2xl font-black text-slate-900'>{tt('templatesPage.actionsTitle', '模板资产操作')}</div>
                        <p className='mt-2 text-sm leading-6 text-slate-600'>
                          {tt('templatesPage.actionsDescription', '这里保留模板收藏、投稿和自有模板管理能力。模板套用已迁回编辑页的主题弹层。')}
                        </p>

                        <div className='mt-4 grid gap-3 sm:grid-cols-2'>
                          <button
                            type='button'
                            onClick={() => favoriteMutation.mutate(activeTemplate.id)}
                            disabled={favoriteMutation.isPending}
                            className='inline-flex items-center justify-center gap-2 rounded-[20px] border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-60'
                          >
                            <Heart className={`h-4 w-4 ${activeTemplate.isFavorite ? 'fill-current text-rose-500' : ''}`} />
                            {activeTemplate.isFavorite ? tt('templatesPage.favorited', '已收藏') : tt('templatesPage.favoriteTemplate', '收藏模板')}
                          </button>
                          {activeTemplate.isOwned ? (
                            <button
                              type='button'
                              onClick={handleDeleteTemplate}
                              disabled={deleteTemplateMutation.isPending}
                              className='inline-flex items-center justify-center gap-2 rounded-[20px] border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700 disabled:opacity-60'
                            >
                              <Trash2 className='h-4 w-4' />
                              {deleteTemplateMutation.isPending ? tt('templatesPage.deleting', '删除中...') : tt('templatesPage.deleteTemplate', '删除模板')}
                            </button>
                          ) : (
                            <button
                              type='button'
                              onClick={handleDuplicateTemplate}
                              disabled={duplicateTemplateMutation.isPending || !activeTemplate.allowDuplicate}
                              className='inline-flex items-center justify-center gap-2 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-60'
                            >
                              <Copy className='h-4 w-4' />
                              {duplicateTemplateMutation.isPending ? tt('templatesPage.duplicating', '复制中...') : tt('templatesPage.duplicateTemplate', '复制为我的模板')}
                            </button>
                          )}
                        </div>
                        {!activeTemplate.isOwned && (
                          <div className='mt-3 text-xs leading-6 text-slate-500'>
                            {tt('templatesPage.readonlyHint', '官方模板与社区模板保持只读。如果你想修改排版，请先复制成自己的模板后再编辑。')}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </section>

                <section className='grid gap-6 2xl:grid-cols-[minmax(0,1.15fr)_420px]'>
                  <div className='rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70'>
                    <div className='mb-4 flex items-center justify-between'>
                      <div>
                        <div className='text-xl font-black text-slate-900'>{tt('templatesPage.previewTitle', '模板预览')}</div>
                        <p className='mt-1 text-sm text-slate-500'>{tt('templatesPage.previewDescription', '这里仅用于确认模板外观，不承担模板套用行为。')}</p>
                      </div>
                      <div className='rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500'>
                        {activeTemplate?.rendererKey || '01'}
                      </div>
                    </div>

                    <div className={scrollPanelClassName} style={scrollAreaStyle}>
                      {!activeTemplate && <PreviewFallback text={tt('templatesPage.loadingDetails', '正在加载模板详情...')} />}
                      {activeTemplate && (
                        <Suspense fallback={<PreviewFallback />}>
                          <RenderResume
                            templateId={activeTemplate.rendererKey}
                            templateMeta={activeTemplate}
                            resumeData={previewResume}
                            containerWidth={null}
                          />
                        </Suspense>
                      )}
                    </div>
                  </div>

                  <div className='space-y-4'>
                    <div className='rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_100%)] p-5 shadow-xl shadow-slate-200/70'>
                      <div className='flex flex-col gap-4'>
                        <div className='flex items-start gap-3'>
                          <div className='rounded-2xl bg-slate-900 p-3 text-white'>
                            <PencilLine className='h-5 w-5' />
                          </div>
                          <div>
                            <div className='text-lg font-black text-slate-900'>{tt('templatesPage.workbenchTitle', '模板工作台')}</div>
                            <p className='mt-1 text-sm text-slate-500'>{tt('templatesPage.workbenchDescription', '右侧改成单面板切换，点击按钮后只显示对应设置区域。')}</p>
                          </div>
                        </div>

                        <div className='rounded-[26px] border border-slate-200 bg-white/80 p-2 shadow-inner shadow-slate-100'>
                          <div ref={tabContainerRef} className='relative grid grid-cols-3 gap-2'>
                          {tabHighlightStyle && (
                            <div
                              className='pointer-events-none absolute left-0 top-0 rounded-full bg-slate-900 shadow-lg shadow-slate-300 transition-all duration-300 ease-out'
                              style={tabHighlightStyle}
                            />
                          )}
                          {managementPanels.map((panel) => (
                            <button
                              key={panel.value}
                              ref={(node) => {
                                if (node) {
                                  tabButtonRefs.current[panel.value] = node
                                }
                              }}
                              type='button'
                              onClick={() => setActivePanel(panel.value)}
                              className={`relative z-10 inline-flex min-w-0 items-center justify-center gap-2 rounded-full px-3 py-2 text-center text-[clamp(13px,1vw,16px)] font-semibold leading-none whitespace-nowrap transition-all duration-300 ${
                                activePanel === panel.value
                                  ? 'text-white'
                                  : 'bg-transparent text-slate-600 hover:bg-amber-50 hover:text-slate-900'
                              }`}
                            >
                              <span className='truncate'>{getPanelLabel(panel.value)}</span>
                              {panel.value === 'details' && detailsDirty && (
                                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${activePanel === panel.value ? 'bg-amber-300' : 'bg-amber-500'}`} />
                              )}
                              {panel.value === 'layout' && layoutDirty && (
                                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${activePanel === panel.value ? 'bg-amber-300' : 'bg-amber-500'}`} />
                              )}
                              {panel.value === 'create' && createDraftDirty && (
                                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${activePanel === panel.value ? 'bg-sky-300' : 'bg-sky-500'}`} />
                              )}
                            </button>
                          ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {activePanel === 'details' && (
                      <div className='rounded-[32px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70'>
                        <div className={scrollPanelClassName} style={scrollAreaStyle}>
                          <div className='flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between'>
                            <div>
                              <div className='text-xl font-black text-slate-900'>{tt('templatesPage.detailsTitle', '当前模板详情')}</div>
                              <p className='mt-1 text-sm text-slate-500'>{tt('templatesPage.detailsDescription', '管理模板名称、描述、分类、投稿说明和排版配置。')}</p>
                            </div>
                            <div className='rounded-[24px] bg-slate-50 px-4 py-3 text-sm text-slate-600'>
                              {activeTemplate?.isOwned ? tt('templatesPage.ownedHint', '这是你的模板，可继续维护与投稿。') : tt('templatesPage.officialHint', '这是官方模板，仅支持预览与收藏。')}
                            </div>
                          </div>

                          {detailsDirty && activeTemplate?.isOwned && (
                            <div className='mt-5 rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900'>
                              {tt('templatesPage.unsavedDetails', '你有未保存的模板变更，记得保存后再离开当前页面。')}
                            </div>
                          )}

                          {activeTemplate?.isOwned ? (
                            <>
                              <div className='mt-5 grid gap-4'>
                                <input
                                  value={activeTemplate?.name || ''}
                                  onChange={(e) => updateCurrentTemplate({ name: e.target.value })}
                                  className='rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition'
                                  placeholder={tt('templatesPage.namePlaceholder', '模板名称')}
                                />
                                <textarea
                                  value={activeTemplate?.description || ''}
                                  onChange={(e) => updateCurrentTemplate({ description: e.target.value })}
                                  rows={3}
                                  className='rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition'
                                  placeholder={tt('templatesPage.descriptionPlaceholder', '模板描述')}
                                />
                                <select
                                  value={activeTemplate?.category || 'general'}
                                  onChange={(e) => updateCurrentTemplate({ category: e.target.value })}
                                  className='rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition'
                                >
                                  {categoryOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{getCategoryLabel(option.value)}</option>
                                  ))}
                                </select>
                                <textarea
                                  value={submitterNote}
                                  onChange={(e) => setSubmitterNote(e.target.value)}
                                  rows={3}
                                  className='rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition'
                                  placeholder={tt('templatesPage.submitterNotePlaceholder', '社区投稿说明')}
                                />
                              </div>

                              <div className='mt-5 grid gap-3 xl:grid-cols-2'>
                                <button
                                  type='button'
                                  onClick={handleUpdateTemplate}
                                  disabled={updateTemplateMutation.isPending}
                                  className='rounded-[22px] border border-slate-200 px-5 py-3 font-semibold text-slate-700 disabled:opacity-60'
                                >
                                  {updateTemplateMutation.isPending ? tt('templatesPage.saving', '保存中...') : tt('templatesPage.saveTemplate', '保存模板')}
                                </button>
                                <button
                                  type='button'
                                  onClick={handleSubmitCommunity}
                                  disabled={submitCommunityMutation.isPending}
                                  className='inline-flex items-center justify-center gap-2 rounded-[22px] bg-amber-500 px-5 py-3 font-semibold text-white shadow-lg shadow-amber-200 disabled:opacity-60'
                                >
                                  <CheckCircle2 className='h-4 w-4' />
                                  {submitCommunityMutation.isPending ? tt('templatesPage.submitting', '提交中...') : tt('templatesPage.submitCommunity', '提交社区审核')}
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className='mt-5 grid gap-4 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600'>
                              <div>{tt('templatesPage.namePrefix', '模板名称：')}{activeTemplate?.name || tt('templatesPage.untitledTemplate', '未命名模板')}</div>
                              <div>{tt('templatesPage.authorPrefix', '作者：')}{activeTemplate?.authorName || tt('templatesPage.defaultAuthor', 'ResumeXpert')}</div>
                              <div>{tt('templatesPage.categoryPrefix', '分类：')}{getCategoryLabel(activeTemplate?.category)}</div>
                              <div>{tt('templatesPage.reviewStatusPrefix', '投稿状态：')}{getReviewStatusLabel(activeTemplate?.communityMeta?.reviewStatus)}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {activePanel === 'layout' && (
                      <div className='rounded-[32px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70'>
                        <div className={scrollPanelClassName} style={scrollAreaStyle}>
                          <div className='flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between'>
                            <div>
                              <div className='text-xl font-black text-slate-900'>{tt('templatesPage.layoutTitle', '排版编辑')}</div>
                              <p className='mt-1 text-sm text-slate-500'>{tt('templatesPage.layoutDescription', '这里只修改模板的主题参数和区块布局，不会改动任何真实简历内容。')}</p>
                            </div>
                            <div className='rounded-[24px] bg-slate-50 px-4 py-3 text-sm text-slate-600'>
                              {activeTemplate?.isOwned ? tt('templatesPage.layoutOwnedHint', '你的模板可直接调色、调字体和调区块布局。') : tt('templatesPage.layoutReadonlyHint', '当前模板只读，复制后即可编辑排版。')}
                            </div>
                          </div>

                          {layoutDirty && activeTemplate?.isOwned && (
                            <div className='mt-5 rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900'>
                              {tt('templatesPage.unsavedLayout', '排版参数有未保存变更，保存模板后才会正式写入你的模板资产。')}
                            </div>
                          )}

                          {activeTemplate?.isOwned ? (
                            <div className='mt-5 space-y-4'>
                              <TemplateThemeConfigurator
                                template={activeTemplate}
                                value={activeTemplate?.themeSchema?.defaultConfig || {}}
                                onChange={(nextConfig) => updateCurrentTemplate({
                                  themeSchema: {
                                    ...(activeTemplate.themeSchema || {}),
                                    defaultConfig: nextConfig,
                                  },
                                })}
                              />

                              <TemplateBlockConfigurator
                                blocks={activeTemplate?.blockSchema?.blocks || []}
                                layoutMode={activeTemplate?.blockSchema?.layoutMode || 'two-column'}
                                onLayoutModeChange={(layoutMode) => updateCurrentTemplate({
                                  blockSchema: {
                                    ...(activeTemplate.blockSchema || {}),
                                    layoutMode,
                                  },
                                })}
                                onBlocksChange={(blocks) => updateCurrentTemplate({
                                  blockSchema: {
                                    ...(activeTemplate.blockSchema || {}),
                                    blocks,
                                  },
                                })}
                              />
                            </div>
                          ) : (
                            <div className='mt-5 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-sm leading-7 text-slate-500'>
                              {tt('templatesPage.layoutReadonlyHelp', '当前模板不开放直接编辑。先点上方“复制为我的模板”，再到这里调整主题色、字体、布局模式和区块顺序。')}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {activePanel === 'create' && (
                      <form onSubmit={handleCreateTemplate} className='rounded-[32px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70'>
                        <div className={scrollPanelClassName} style={scrollAreaStyle}>
                          <div className='flex items-start gap-3'>
                            <div className='rounded-2xl bg-blue-100 p-3 text-blue-700'>
                              <Plus className='h-5 w-5' />
                            </div>
                            <div>
                              <div className='text-xl font-black text-slate-900'>{tt('templatesPage.createTitle', '新建我的模板')}</div>
                              <p className='mt-1 text-sm text-slate-500'>{tt('templatesPage.createDescription', '创建新的个人模板资产，后续可继续编辑、删除或投稿。')}</p>
                            </div>
                          </div>

                          {createDraftDirty && (
                            <div className='mt-5 rounded-[22px] border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900'>
                              {tt('templatesPage.createDraftHint', '新模板草稿还没创建，提交后会进入你的模板列表并自动切回详情面板。')}
                            </div>
                          )}

                          <div className='mt-5 grid gap-4'>
                            <input
                              value={draft.name}
                              onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                              placeholder={tt('templatesPage.namePlaceholder', '模板名称')}
                              className='rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white'
                            />
                            <textarea
                              value={draft.description}
                              onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
                              placeholder={tt('templatesPage.createDescriptionPlaceholder', '描述适用场景、风格与推荐人群')}
                              rows={3}
                              className='rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white'
                            />
                            <div className='grid gap-3 sm:grid-cols-2'>
                              <select
                                value={draft.rendererKey}
                                onChange={(e) => setDraft((prev) => ({ ...prev, rendererKey: e.target.value }))}
                                className='rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white'
                              >
                                <option value='flex'>{tt('templatesPage.renderers.flex', '灵活布局渲染器')}</option>
                                <option value='01'>{tt('templatesPage.renderers.r01', '渲染器 01')}</option>
                                <option value='02'>{tt('templatesPage.renderers.r02', '渲染器 02')}</option>
                                <option value='03'>{tt('templatesPage.renderers.r03', '渲染器 03')}</option>
                              </select>
                              <select
                                value={draft.category}
                                onChange={(e) => setDraft((prev) => ({ ...prev, category: e.target.value }))}
                                className='rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white'
                              >
                                {categoryOptions.map((option) => (
                                  <option key={option.value} value={option.value}>{getCategoryLabel(option.value)}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <button
                            type='submit'
                            disabled={createTemplateMutation.isPending}
                            className='mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[22px] bg-slate-900 px-5 py-3 font-semibold text-white shadow-xl shadow-slate-300 disabled:opacity-60'
                          >
                            <Sparkles className='h-4 w-4' />
                            {createTemplateMutation.isPending ? tt('templatesPage.creating', '创建中...') : tt('templatesPage.createTemplate', '创建个人模板')}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </section>
              </>
            ) : (
              <div className='space-y-6'>
                <PanelSkeleton className='h-56' />
                <PanelSkeleton className='h-[40rem]' />
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}

export default TemplatesPage
