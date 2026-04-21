import React from 'react'
import { Palette, Trash2, Download, Save } from 'lucide-react'
import { buttonStyles, containerStyles } from '../../assets/dummystyle'
import { TitleInput } from '../Inputs'

const ResumeEditorHeader = ({
  title,
  setTitle,
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
