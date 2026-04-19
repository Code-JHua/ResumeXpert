import React, { useState } from 'react'
import { Check } from 'lucide-react'
import { DUMMY_RESUME_DATA, resumeTemplates } from '../utils/data'
import RenderResume from './RenderResume'
import Tabs from './Tabs'
import { useTranslation } from 'react-i18next'

const ThemeSelector = ({ selectedTheme, setSelectedTheme, resumeData, onClose }) => {
  const { t } = useTranslation()
  const TAB_DATA = [{ label: t('themeSelector.templates') }]
  const initialIndex = resumeTemplates.findIndex(t => t.id === selectedTheme)
  const [selectedTemplate, setSelectedTemplate] = useState({
    theme: selectedTheme || resumeTemplates[0]?.id || '',
    index: initialIndex >= 0 ? initialIndex : 0
  })

  const [tabValue, setTabValue] = useState('Templates')

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
        {/* 左侧 - 模板选择（显示实际预览） */}
        <div className='lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-4 sm:p-6'>
          <div className='grid grid-cols-2 gap-4 max-h-[60vh] lg:max-h-[70vh] overflow-auto p-2'>
            {resumeTemplates.map((template, index) => (
              <div
                key={`template_${index}`}
                onClick={() => setSelectedTemplate({
                  theme: template.id,
                  index
                })}
                className={`
                  cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-300 h-64 relative
                  ${selectedTemplate.index === index
                    ? 'border-violet-500 shadow-lg shadow-violet-500/20 bg-violet-50'
                    : 'border-gray-200 hover:border-violet-300'
                  }
                `}
              >
                {/* 模板标题 */}
                <div className={`
                  absolute top-0 left-0 right-0 z-10 px-2 py-1 text-xs font-semibold text-center
                  ${selectedTemplate.index === index ? 'bg-violet-500 text-white' : 'bg-gray-100 text-gray-700'}
                `}>
                  {template.name || `${t('themeSelector.template')} ${template.id}`}
                </div>

                {/* 实际预览 - 缩小显示 */}
                <div className='absolute inset-0 p-1 pt-7 bg-gray-50 overflow-hidden' style={{ transform: 'scale(0.35)', transformOrigin: 'top left', width: '285%', height: '285%' }}>
                  <RenderResume
                    templateId={template.id}
                    resumeData={resumeData || DUMMY_RESUME_DATA}
                    containerWidth={null}
                  />
                </div>

                {/* 选中指示器 */}
                {selectedTemplate.index === index && (
                  <div className='absolute top-1 right-1 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center shadow-lg z-20'>
                    <Check size={12} className='text-white' />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 右侧 - 大预览 */}
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
