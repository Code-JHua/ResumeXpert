import React from 'react'
import { Palette, Trash2, Download, Save, FileCode2, RefreshCw } from 'lucide-react'
import { buttonStyles, containerStyles } from '../../assets/dummystyle'
import { TitleInput } from '../Inputs'

const ResumeEditorHeader = ({
  title,
  setTitle,
  onOpenMarkdown,
  onSyncMarkdown,
  markdownSyncing,
  markdownSyncState,
  onOpenVersions,
  onOpenThemeSelector,
  onDeleteResume,
  onOpenPreview,
  isLoading,
  t,
}) => {
  return (
    <div className={containerStyles.header}>
      <TitleInput title={title} setTitle={setTitle} />
      <div className='flex flex-wrap items-center gap-3'>
        <button onClick={onOpenMarkdown} className={buttonStyles.theme}>
          <FileCode2 size={16} />
          <span className='text-sm'>Markdown</span>
          {markdownSyncState?.hasDocument && (
            <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
              markdownSyncState.syncStatus === 'synced'
                ? 'bg-emerald-100 text-emerald-700'
                : markdownSyncState.syncStatus === 'outdated'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-600'
            }`}>
              {markdownSyncState.syncStatus}
            </span>
          )}
        </button>
        <button onClick={onSyncMarkdown} className={buttonStyles.theme} disabled={markdownSyncing}>
          <RefreshCw size={16} className={markdownSyncing ? 'animate-spin' : ''} />
          <span className='text-sm'>{markdownSyncing ? '同步中' : '同步 Markdown'}</span>
        </button>
        <button onClick={onOpenVersions} className={buttonStyles.theme}>
          <Save size={16} />
          <span className='text-sm'>版本</span>
        </button>
        <button onClick={onOpenThemeSelector} className={buttonStyles.theme}>
          <Palette size={16} />
          <span className='text-sm'>{t('editResume.buttons.theme')}</span>
        </button>
        <button onClick={onDeleteResume} className={buttonStyles.delete} disabled={isLoading}>
          <Trash2 size={16} />
          <span className='text-sm'>{t('editResume.buttons.delete')}</span>
        </button>
        <button onClick={onOpenPreview} className={buttonStyles.download}>
          <Download size={16} />
          <span className='text-sm'>{t('editResume.buttons.download')}</span>
        </button>
      </div>
    </div>
  )
}

export default ResumeEditorHeader
