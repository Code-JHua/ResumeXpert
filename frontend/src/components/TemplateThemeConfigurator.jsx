import React from 'react'

const densityOptions = [
  { value: 'compact', label: '紧凑' },
  { value: 'comfortable', label: '标准' },
  { value: 'spacious', label: '舒展' },
]

const fontOptions = [
  { value: '"Segoe UI", "PingFang SC", sans-serif', label: '现代无衬线' },
  { value: '"Microsoft YaHei", "PingFang SC", sans-serif', label: '雅黑中文' },
  { value: '"Georgia", "Times New Roman", serif', label: '经典衬线' },
]

const TemplateThemeConfigurator = ({ template, value, onChange }) => {
  const presets = template?.themeSchema?.presets || []

  const handlePatch = (patch) => {
    onChange({
      ...value,
      ...patch,
    })
  }

  return (
    <div className='rounded-3xl border border-slate-200 bg-white p-5 space-y-4'>
      <div>
        <div className='text-sm font-semibold text-slate-800'>主题参数</div>
        <p className='mt-1 text-xs text-slate-500'>当前模板支持颜色、字体与版式密度配置，后续社区模板会复用这套参数协议。</p>
      </div>

      {presets.length > 0 && (
        <div>
          <div className='text-xs font-semibold text-slate-600 mb-2'>预设主题</div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
            {presets.map((preset) => (
              <button
                key={preset.id}
                type='button'
                onClick={() => handlePatch({
                  accentColor: preset.accentColor,
                  headingColor: preset.headingColor,
                  tagBackground: preset.tagBackground,
                })}
                className='rounded-2xl border border-slate-200 p-3 text-left hover:border-violet-300 transition-colors'
              >
                <div className='flex items-center gap-2'>
                  <span className='h-4 w-4 rounded-full border border-white shadow-sm' style={{ backgroundColor: preset.accentColor }} />
                  <span className='text-sm font-semibold text-slate-700'>{preset.label}</span>
                </div>
                <div className='mt-2 flex gap-2'>
                  <span className='h-3 w-8 rounded-full' style={{ backgroundColor: preset.headingColor }} />
                  <span className='h-3 w-8 rounded-full' style={{ backgroundColor: preset.tagBackground }} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <label className='text-sm text-slate-700'>
          <div className='mb-2 font-semibold'>强调色</div>
          <input type='color' value={value.accentColor || '#4f46e5'} onChange={(e) => handlePatch({ accentColor: e.target.value })} className='h-11 w-full rounded-2xl border border-slate-200 bg-white p-1' />
        </label>
        <label className='text-sm text-slate-700'>
          <div className='mb-2 font-semibold'>标题色</div>
          <input type='color' value={value.headingColor || '#0f172a'} onChange={(e) => handlePatch({ headingColor: e.target.value })} className='h-11 w-full rounded-2xl border border-slate-200 bg-white p-1' />
        </label>
        <label className='text-sm text-slate-700'>
          <div className='mb-2 font-semibold'>标签底色</div>
          <input type='color' value={value.tagBackground || '#ede9fe'} onChange={(e) => handlePatch({ tagBackground: e.target.value })} className='h-11 w-full rounded-2xl border border-slate-200 bg-white p-1' />
        </label>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <label className='text-sm text-slate-700'>
          <div className='mb-2 font-semibold'>字体方案</div>
          <select value={value.fontFamily || fontOptions[0].value} onChange={(e) => handlePatch({ fontFamily: e.target.value })} className='w-full rounded-2xl border border-slate-200 px-4 py-3'>
            {fontOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className='text-sm text-slate-700'>
          <div className='mb-2 font-semibold'>信息密度</div>
          <select value={value.density || 'comfortable'} onChange={(e) => handlePatch({ density: e.target.value })} className='w-full rounded-2xl border border-slate-200 px-4 py-3'>
            {densityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>
    </div>
  )
}

export default TemplateThemeConfigurator
