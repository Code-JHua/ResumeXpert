import React from 'react'
import { useTranslation } from 'react-i18next'
import { translateWithFallback } from '../utils/i18n'

const TemplateBlockConfigurator = ({ blocks = [], layoutMode = 'two-column', onLayoutModeChange, onBlocksChange }) => {
  const { t } = useTranslation()
  const tt = (key, fallback, options) => translateWithFallback(t, key, fallback, options)
  const updateBlock = (index, patch) => {
    const next = blocks.map((block, currentIndex) => currentIndex === index ? { ...block, ...patch } : block)
    onBlocksChange(next)
  }

  return (
    <div className='rounded-3xl border border-slate-200 bg-white p-5 space-y-4'>
      <div>
        <div className='text-sm font-semibold text-slate-800'>{tt('templateBlockConfigurator.title', '模板片段系统')}</div>
        <p className='mt-1 text-xs text-slate-500'>{tt('templateBlockConfigurator.description', '你可以控制区块显隐、标题、顺序以及左右栏归属，这就是 Phase G 的自由创作基础。')}</p>
      </div>

      <label className='text-sm text-slate-700'>
        <div className='mb-2 font-semibold'>{tt('templateBlockConfigurator.layoutMode', '布局模式')}</div>
        <select value={layoutMode} onChange={(e) => onLayoutModeChange(e.target.value)} className='w-full rounded-2xl border border-slate-200 px-4 py-3'>
          <option value='single'>{tt('templateBlockConfigurator.layouts.single', '单栏布局')}</option>
          <option value='two-column'>{tt('templateBlockConfigurator.layouts.twoColumn', '双栏布局')}</option>
        </select>
      </label>

      <div className='space-y-3'>
        {blocks.map((block, index) => (
          <div key={block.key} className='rounded-2xl border border-slate-200 p-4'>
            <div className='grid grid-cols-1 gap-3'>
              <input
                value={block.title || ''}
                onChange={(e) => updateBlock(index, { title: e.target.value })}
                className='min-w-0 rounded-2xl border border-slate-200 px-4 py-3'
                placeholder={tt('templateBlockConfigurator.blockTitlePlaceholder', '区块标题')}
              />
              <div className='grid grid-cols-1 gap-3 sm:grid-cols-[120px_minmax(0,1fr)]'>
                <input
                  type='number'
                  value={block.order || 0}
                  onChange={(e) => updateBlock(index, { order: Number(e.target.value) })}
                  className='rounded-2xl border border-slate-200 px-4 py-3'
                />
                <select
                  value={block.column || 'main'}
                  onChange={(e) => updateBlock(index, { column: e.target.value })}
                  className='rounded-2xl border border-slate-200 px-4 py-3'
                >
                  <option value='main'>{tt('templateBlockConfigurator.columns.main', '主栏')}</option>
                  <option value='sidebar'>{tt('templateBlockConfigurator.columns.sidebar', '侧栏')}</option>
                  <option value='full'>{tt('templateBlockConfigurator.columns.full', '全宽')}</option>
                </select>
              </div>
            </div>
            <div className='mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <div className='break-all text-sm font-semibold text-slate-700'>{block.key}</div>
              <label className='inline-flex items-center gap-2 text-sm text-slate-600'>
                <input type='checkbox' checked={block.visible !== false} onChange={(e) => updateBlock(index, { visible: e.target.checked })} />
                {tt('templateBlockConfigurator.showBlock', '显示该区块')}
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TemplateBlockConfigurator
