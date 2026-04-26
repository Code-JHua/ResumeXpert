import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, Eye, LayoutTemplate, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DUMMY_RESUME_DATA } from '../utils/data'
import { getTemplateMetadata, mergeTemplateMetadata } from '../utils/templateRegistry'
import { fetchTemplateById, fetchTemplates } from '../services/queryService'
import { queryKeys } from '../lib/queryKeys'
import { translateWithFallback } from '../utils/i18n'

const RenderResume = lazy(() => import('./RenderResume'))

const PreviewFallback = () => (
  <div className='rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-6'>
    <div className='mb-4 text-sm font-medium text-slate-500'>正在生成模板预览...</div>
    <div className='space-y-4 animate-pulse'>
      <div className='h-6 w-1/3 rounded-full bg-slate-200' />
      <div className='h-4 w-2/3 rounded-full bg-slate-200' />
      <div className='h-24 rounded-[24px] bg-slate-100' />
      <div className='h-24 rounded-[24px] bg-slate-100' />
      <div className='h-40 rounded-[24px] bg-slate-100' />
    </div>
  </div>
)

const TemplateCardSkeleton = () => (
  <div className='animate-pulse rounded-[28px] border border-slate-200 bg-white p-4'>
    <div className='h-6 w-1/2 rounded-full bg-slate-200' />
    <div className='mt-3 h-4 w-full rounded-full bg-slate-100' />
    <div className='mt-2 h-4 w-4/5 rounded-full bg-slate-100' />
    <div className='mt-4 flex gap-2'>
      <div className='h-7 w-16 rounded-full bg-slate-100' />
      <div className='h-7 w-20 rounded-full bg-slate-100' />
      <div className='h-7 w-14 rounded-full bg-slate-100' />
    </div>
  </div>
)

const ThemeSelector = ({ selectedTheme, setSelectedTheme, resumeData, onClose }) => {
  const { t } = useTranslation()
  const tt = (key, fallback, options) => translateWithFallback(t, key, fallback, options)
  const [selectedTemplateId, setSelectedTemplateId] = useState('')

  const templatesQuery = useQuery({
    queryKey: queryKeys.templates({ scope: 'all', sourceType: '' }),
    queryFn: () => fetchTemplates({}),
    placeholderData: (previous) => previous,
    select: (data) => mergeTemplateMetadata(data),
  })

  const templates = templatesQuery.data || mergeTemplateMetadata()

  useEffect(() => {
    if (selectedTemplateId || !templates.length) return

    const fallback = templates.find((item) => item.rendererKey === selectedTheme || item.id === resumeData?.template?.templateId) || templates[0]
    if (fallback) {
      setSelectedTemplateId(fallback.id)
    }
  }, [selectedTemplateId, templates, selectedTheme, resumeData?.template?.templateId])

  const selectedTemplateSummary = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) || templates[0] || null,
    [templates, selectedTemplateId]
  )

  const templateDetailQuery = useQuery({
    queryKey: queryKeys.template(selectedTemplateSummary?.id),
    queryFn: () => fetchTemplateById(selectedTemplateSummary.id),
    enabled: Boolean(selectedTemplateSummary?.id),
    placeholderData: () => selectedTemplateSummary || undefined,
  })

  const selectedTemplate = useMemo(
    () => getTemplateMetadata(templateDetailQuery.data || selectedTemplateSummary),
    [templateDetailQuery.data, selectedTemplateSummary]
  )

  const previewResume = useMemo(() => ({
    ...(resumeData || DUMMY_RESUME_DATA),
    template: {
      ...(resumeData?.template || {}),
      theme: selectedTemplate?.rendererKey || selectedTheme || '01',
      templateId: selectedTemplate?.id || resumeData?.template?.templateId,
      settings: resumeData?.template?.settings || {},
    },
  }), [resumeData, selectedTemplate, selectedTheme])

  const handleApply = () => {
    if (!selectedTemplate) return

    setSelectedTheme({
      theme: selectedTemplate.rendererKey,
      templateId: selectedTemplate.id,
      settings: resumeData?.template?.settings || {},
    })
    onClose()
  }

  return (
    <div className='mx-auto max-w-7xl px-4 space-y-6'>
      <div className='flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white px-6 py-5 shadow-sm xl:flex-row xl:items-center xl:justify-between'>
        <div className='max-w-3xl'>
          <div className='inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-violet-700'>
            <Sparkles className='h-3.5 w-3.5' />
            {tt('themeSelector.previewBadge', 'Theme Preview')}
          </div>
          <div className='mt-3 text-2xl font-black text-slate-900'>{tt('themeSelector.previewTitle', '模板预览与切换')}</div>
          <div className='mt-2 text-sm leading-6 text-slate-500'>
            {tt('themeSelector.previewDescription', '这里仅保留模板浏览和实时预览。选中后直接应用到当前简历，不再在这个页面修改主题参数。')}
          </div>
        </div>

        <button
          className='inline-flex w-full items-center justify-center gap-3 rounded-[20px] bg-slate-900 px-6 py-3 text-sm font-black text-white shadow-lg shadow-slate-300 transition hover:bg-slate-800 xl:w-auto'
          onClick={handleApply}
          disabled={!selectedTemplate}
        >
          <Check size={18} />
          {t('themeSelector.applyChanges')}
        </button>
      </div>

      <div className='grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]'>
        <div className='rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm'>
          <div className='mb-4 flex items-center justify-between'>
            <div>
              <div className='text-lg font-black text-slate-900'>{tt('themeSelector.listTitle', '模板列表')}</div>
              <div className='mt-1 text-sm text-slate-500'>{tt('themeSelector.templateListDescription', '左侧选模板，右侧只负责预览效果。')}</div>
            </div>
            <div className='rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500'>
              {templatesQuery.isPending && !templatesQuery.data
                ? tt('themeSelector.loadingCount', '加载中')
                : tt('themeSelector.count', '{{count}} 个', { count: templates.length })}
            </div>
          </div>

          <div className='max-h-[72vh] space-y-3 overflow-auto pr-1'>
            {templatesQuery.isPending && !templatesQuery.data && Array.from({ length: 4 }).map((_, index) => (
              <TemplateCardSkeleton key={`template-selector-skeleton-${index}`} />
            ))}

            {!(templatesQuery.isPending && !templatesQuery.data) && templates.map((template) => (
              <button
                key={template.id}
                type='button'
                onClick={() => setSelectedTemplateId(template.id)}
                className={`w-full rounded-[28px] border p-4 text-left transition-all ${
                  selectedTemplate?.id === template.id
                    ? 'border-violet-300 bg-violet-50 shadow-sm shadow-violet-100'
                    : 'border-slate-200 bg-white hover:border-violet-200 hover:bg-slate-50'
                }`}
              >
                <div className='flex items-start justify-between gap-3'>
                  <div className='min-w-0'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <span className='text-lg font-black text-slate-900'>{template.name}</span>
                      <span className='rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500'>
                        {template.sourceType === 'official'
                          ? tt('themeSelector.sourceType.official', '官方')
                          : template.sourceType === 'custom'
                            ? tt('themeSelector.sourceType.custom', '个人')
                            : tt('themeSelector.sourceType.community', '社区')}
                      </span>
                    </div>
                    <p className='mt-2 text-sm leading-6 text-slate-600'>{template.description || tt('themeSelector.noDescription', '暂无描述')}</p>
                    <div className='mt-3 flex flex-wrap gap-2'>
                      {(template.tags || []).slice(0, 4).map((tag) => (
                        <span key={tag} className='rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500'>{tag}</span>
                      ))}
                    </div>
                  </div>
                  {selectedTemplate?.id === template.id && (
                    <span className='flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-white'>
                      <Check size={16} />
                    </span>
                  )}
                </div>
                <div className='mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-500'>
                  <span className='inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1'>
                    <LayoutTemplate size={14} />
                    {template.rendererKey}
                  </span>
                  <span className='inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1'>
                    <Eye size={14} />
                    {tt('themeSelector.previewOnly', '仅预览')}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className='space-y-5'>
          <div className='rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <div className='text-2xl font-black text-slate-900'>{selectedTemplate?.name || tt('themeSelector.previewName', '模板预览')}</div>
                <div className='mt-2 text-sm leading-6 text-slate-500'>
                  {tt('themeSelector.previewHelp', '使用当前简历内容实时渲染效果，确认无误后再应用到编辑器。')}
                </div>
              </div>
              <div className='rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700'>
                {selectedTemplate?.sourceType === 'official'
                  ? tt('themeSelector.sourceLabel.official', '官方模板')
                  : selectedTemplate?.sourceType === 'custom'
                    ? tt('themeSelector.sourceLabel.custom', '个人模板')
                    : tt('themeSelector.sourceLabel.community', '社区模板')}
              </div>
            </div>
          </div>

          <div className='rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm'>
            {!selectedTemplate && <PreviewFallback />}
            {selectedTemplate && (
              <Suspense fallback={<PreviewFallback />}>
                <RenderResume
                  templateId={selectedTemplate.rendererKey}
                  templateMeta={selectedTemplate}
                  resumeData={previewResume}
                  containerWidth={null}
                />
              </Suspense>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ThemeSelector
