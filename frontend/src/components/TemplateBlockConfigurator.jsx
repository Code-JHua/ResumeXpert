import React from 'react'

const TemplateBlockConfigurator = ({ blocks = [], layoutMode = 'two-column', onLayoutModeChange, onBlocksChange }) => {
  const updateBlock = (index, patch) => {
    const next = blocks.map((block, currentIndex) => currentIndex === index ? { ...block, ...patch } : block)
    onBlocksChange(next)
  }

  return (
    <div className='rounded-3xl border border-slate-200 bg-white p-5 space-y-4'>
      <div>
        <div className='text-sm font-semibold text-slate-800'>模板片段系统</div>
        <p className='mt-1 text-xs text-slate-500'>你可以控制区块显隐、标题、顺序以及左右栏归属，这就是 Phase G 的自由创作基础。</p>
      </div>

      <label className='text-sm text-slate-700'>
        <div className='mb-2 font-semibold'>布局模式</div>
        <select value={layoutMode} onChange={(e) => onLayoutModeChange(e.target.value)} className='w-full rounded-2xl border border-slate-200 px-4 py-3'>
          <option value='single'>单栏布局</option>
          <option value='two-column'>双栏布局</option>
        </select>
      </label>

      <div className='space-y-3'>
        {blocks.map((block, index) => (
          <div key={block.key} className='rounded-2xl border border-slate-200 p-4'>
            <div className='grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_100px_120px]'>
              <input value={block.title || ''} onChange={(e) => updateBlock(index, { title: e.target.value })} className='rounded-2xl border border-slate-200 px-4 py-3' />
              <input type='number' value={block.order || 0} onChange={(e) => updateBlock(index, { order: Number(e.target.value) })} className='rounded-2xl border border-slate-200 px-4 py-3' />
              <select value={block.column || 'main'} onChange={(e) => updateBlock(index, { column: e.target.value })} className='rounded-2xl border border-slate-200 px-4 py-3'>
                <option value='main'>主栏</option>
                <option value='sidebar'>侧栏</option>
                <option value='full'>全宽</option>
              </select>
            </div>
            <div className='mt-3 flex items-center justify-between'>
              <div className='text-sm font-semibold text-slate-700'>{block.key}</div>
              <label className='inline-flex items-center gap-2 text-sm text-slate-600'>
                <input type='checkbox' checked={block.visible !== false} onChange={(e) => updateBlock(index, { visible: e.target.checked })} />
                显示该区块
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TemplateBlockConfigurator
