import React, { useEffect, useMemo, useState } from 'react'
import { Check, Heart, Copy, LayoutTemplate } from 'lucide-react'
import { DUMMY_RESUME_DATA } from '../utils/data'
import RenderResume from './RenderResume'
import { useTranslation } from 'react-i18next'
import axiosInstance from '../utils/axiosInstance'
import { API_PATHS } from '../utils/apiPaths'
import { mergeTemplateMetadata } from '../utils/templateRegistry'
import TemplateThemeConfigurator from './TemplateThemeConfigurator'
import { resolveTemplateTheme } from '../utils/templateTheme'
import toast from 'react-hot-toast'

const ThemeSelector = ({ selectedTheme, setSelectedTheme, resumeData, onClose }) => {
  const { t } = useTranslation()
  const [templates, setTemplates] = useState([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [selectedSettings, setSelectedSettings] = useState({})

  const fetchTemplates = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.TEMPLATES.GET_ALL)
      const merged = mergeTemplateMetadata(response.data)
      setTemplates(merged)
      if (!selectedTemplateId && merged[0]) {
        const fallback = merged.find((item) => item.rendererKey === selectedTheme || item.id === resumeData?.template?.templateId) || merged[0]
        setSelectedTemplateId(fallback.id)
        setSelectedSettings(resolveTemplateTheme(fallback, resumeData?.template))
      }
    } catch (error) {
      setTemplates(mergeTemplateMetadata())
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) || templates[0],
    [templates, selectedTemplateId]
  )

  useEffect(() => {
    if (selectedTemplate) {
      setSelectedSettings(resolveTemplateTheme(selectedTemplate, resumeData?.template))
    }
  }, [selectedTemplate?.id])

  const previewResume = useMemo(() => ({
    ...(resumeData || DUMMY_RESUME_DATA),
    template: {
      ...(resumeData?.template || {}),
      theme: selectedTemplate?.rendererKey || selectedTheme || '01',
      templateId: selectedTemplate?.id || resumeData?.template?.templateId,
      settings: selectedSettings,
    },
  }), [resumeData, selectedSettings, selectedTemplate, selectedTheme])

  const handleApply = () => {
    if (!selectedTemplate) return

    setSelectedTheme({
      theme: selectedTemplate.rendererKey,
      templateId: selectedTemplate.id,
      settings: selectedSettings,
    })
    onClose()
  }

  const handleFavorite = async (templateId) => {
    try {
      const response = await axiosInstance.post(API_PATHS.TEMPLATES.TOGGLE_FAVORITE(templateId))
      setTemplates((prev) => prev.map((item) => (item.id === templateId ? { ...item, ...response.data } : item)))
      toast.success(response.data.isFavorite ? '已加入模板收藏' : '已取消模板收藏')
    } catch (error) {
      toast.error('更新模板收藏失败')
    }
  }

  const handleDuplicate = async (templateId) => {
    try {
      const response = await axiosInstance.post(API_PATHS.TEMPLATES.DUPLICATE(templateId))
      setTemplates((prev) => [response.data, ...prev])
      toast.success('模板已复制到“我的模板”')
    } catch (error) {
      toast.error('复制模板失败')
    }
  }

  return (
    <div className='max-w-7xl mx-auto px-4 space-y-6'>
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 bg-white rounded-2xl border border-violet-100'>
        <div>
          <div className='text-xl font-black text-slate-900'>模板中心</div>
          <div className='mt-1 text-sm text-slate-500'>选择官方模板或个人复制模板，并直接调整主题参数。</div>
        </div>
        <button className='w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black rounded-2xl hover:scale-105 transition-all shadow-lg hover:shadow-xl' onClick={handleApply}>
          <Check size={18} /> {t('themeSelector.applyChanges')}
        </button>
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-12 gap-6'>
        <div className='xl:col-span-4 rounded-3xl border border-slate-200 bg-white p-5 space-y-4 max-h-[75vh] overflow-auto'>
          {templates.map((template) => (
            <button
              key={template.id}
              type='button'
              onClick={() => setSelectedTemplateId(template.id)}
              className={`w-full rounded-3xl border p-4 text-left transition-all ${selectedTemplate?.id === template.id ? 'border-violet-400 bg-violet-50 shadow-sm' : 'border-slate-200 hover:border-violet-300'}`}
            >
              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0'>
                  <div className='flex items-center gap-2'>
                    <span className='text-base font-bold text-slate-900'>{template.name}</span>
                    <span className='rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500'>{template.sourceType === 'official' ? '官方' : template.sourceType === 'custom' ? '我的模板' : '社区预留'}</span>
                  </div>
                  <p className='mt-2 text-sm text-slate-600'>{template.description || '暂无描述'}</p>
                  <div className='mt-3 flex flex-wrap gap-2'>
                    {(template.tags || []).slice(0, 4).map((tag) => (
                      <span key={tag} className='rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500'>{tag}</span>
                    ))}
                  </div>
                </div>
                {selectedTemplate?.id === template.id && (
                  <span className='flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-white'>
                    <Check size={16} />
                  </span>
                )}
              </div>
              <div className='mt-4 flex flex-wrap gap-2'>
                <button type='button' onClick={(e) => { e.stopPropagation(); handleFavorite(template.id) }} className='inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600'>
                  <Heart size={14} className={template.isFavorite ? 'fill-rose-500 text-rose-500' : ''} />
                  {template.isFavorite ? '已收藏' : '收藏'}
                </button>
                <button type='button' onClick={(e) => { e.stopPropagation(); handleDuplicate(template.id) }} className='inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600'>
                  <Copy size={14} />
                  复制
                </button>
                <span className='inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500'>
                  <LayoutTemplate size={14} />
                  {template.rendererKey}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className='xl:col-span-8 space-y-6'>
          {selectedTemplate && (
            <>
              <TemplateThemeConfigurator
                template={selectedTemplate}
                value={selectedSettings}
                onChange={setSelectedSettings}
              />
              <div className='rounded-3xl border border-slate-200 bg-white p-5'>
                <div className='mb-4 flex items-center justify-between'>
                  <div>
                    <div className='text-xl font-bold text-slate-900'>{selectedTemplate.name} 预览</div>
                    <div className='mt-1 text-sm text-slate-500'>使用当前简历数据实时渲染，确认后会同步到编辑器。</div>
                  </div>
                </div>
                <RenderResume
                  templateId={selectedTemplate.rendererKey}
                  templateMeta={selectedTemplate}
                  resumeData={previewResume}
                  containerWidth={null}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ThemeSelector
