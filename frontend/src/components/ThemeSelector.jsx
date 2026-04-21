import React, { useEffect, useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import { DUMMY_RESUME_DATA } from '../utils/data'
import RenderResume from './RenderResume'
import Tabs from './Tabs'
import { useTranslation } from 'react-i18next'
import axiosInstance from '../utils/axiosInstance'
import { API_PATHS } from '../utils/apiPaths'
import { getRegisteredTemplates, mergeTemplateMetadata } from '../utils/templateRegistry'

const ThemeSelector = ({ selectedTheme, setSelectedTheme, resumeData, onClose }) => {
  const { t } = useTranslation()
  const TAB_DATA = [{ label: t('themeSelector.templates') }]
  const [tabValue, setTabValue] = useState('Templates')
  const [templates, setTemplates] = useState(getRegisteredTemplates())
  const [selectedTemplate, setSelectedTemplate] = useState({
    theme: selectedTheme || getRegisteredTemplates()[0]?.id || '',
    index: 0,
  })

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await axiosInstance.get(API_PATHS.TEMPLATES.GET_ALL)
        setTemplates(mergeTemplateMetadata(response.data))
      } catch (error) {
        setTemplates(getRegisteredTemplates())
      }
    }

    fetchTemplates()
  }, [])

  const selectedIndex = useMemo(() => {
    const currentIndex = templates.findIndex((template) => template.id === selectedTemplate.theme)
    return currentIndex >= 0 ? currentIndex : 0
  }, [templates, selectedTemplate.theme])

  useEffect(() => {
    if (!templates.length) return

    const preferredTheme = templates.some((template) => template.id === selectedTheme)
      ? selectedTheme
      : templates[0]?.id || ''
    const hasCurrentTheme = templates.some((template) => template.id === selectedTemplate.theme)

    setSelectedTemplate(() => ({
      theme: hasCurrentTheme ? selectedTemplate.theme : preferredTheme,
      index: selectedIndex,
    }))
  }, [templates, selectedTheme, selectedIndex, selectedTemplate.theme])

  const handleThemeSelection = () => {
    setSelectedTheme(selectedTemplate.theme)
    onClose()
  }

  return (
    <div className='max-w-7xl mx-auto px-4'>
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 p-4 sm:p-6 bg-white rounded-2xl border border-violet-100'>
        <Tabs tabs={TAB_DATA} activeTab={tabValue} setActiveTab={setTabValue} />
        <button className='w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black rounded-2xl hover:scale-105 transition-all shadow-lg hover:shadow-xl' onClick={handleThemeSelection}>
          <Check size={18} /> {t('themeSelector.applyChanges')}
        </button>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8'>
        <div className='lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-4 sm:p-6'>
          <div className='grid grid-cols-2 gap-4 max-h-[60vh] lg:max-h-[70vh] overflow-auto p-2'>
            {templates.map((template, index) => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate({
                  theme: template.id,
                  index,
                })}
                className={`
                  cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-300 h-64 relative
                  ${selectedTemplate.index === index
                    ? 'border-violet-500 shadow-lg shadow-violet-500/20 bg-violet-50'
                    : 'border-gray-200 hover:border-violet-300'
                  }
                `}
              >
                <div className={`
                  absolute top-0 left-0 right-0 z-10 px-2 py-1 text-xs font-semibold text-center
                  ${selectedTemplate.index === index ? 'bg-violet-500 text-white' : 'bg-gray-100 text-gray-700'}
                `}>
                  {template.name || `${t('themeSelector.template')} ${template.id}`}
                </div>

                <div className='absolute inset-0 p-1 pt-7 bg-gray-50 overflow-hidden' style={{ transform: 'scale(0.35)', transformOrigin: 'top left', width: '285%', height: '285%' }}>
                  <RenderResume
                    templateId={template.id}
                    resumeData={resumeData || DUMMY_RESUME_DATA}
                    containerWidth={null}
                  />
                </div>

                {selectedTemplate.index === index && (
                  <div className='absolute top-1 right-1 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center shadow-lg z-20'>
                    <Check size={12} className='text-white' />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className='lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-4 sm:p-6'>
          <RenderResume
            templateId={selectedTemplate?.theme || ''}
            resumeData={resumeData || DUMMY_RESUME_DATA}
            containerWidth={null}
          />
        </div>
      </div>
    </div>
  )
}

export default ThemeSelector
