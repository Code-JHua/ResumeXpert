import React from 'react'
import { ArrowLeft, Download, Loader2, Save } from 'lucide-react'
import { buttonStyles, statusStyles } from '../../assets/dummystyle'

const ResumeEditorActions = ({
  errorMsg,
  goBack,
  uploadResumeImages,
  validateAndNext,
  currentPage,
  isLoading,
  t,
}) => {
  return (
    <div className='p-4 sm:p-6'>
      {errorMsg && (
        <div className={statusStyles.error}>
          {errorMsg}
        </div>
      )}

      <div className='flex flex-wrap items-center justify-end gap-3'>
        <button className={buttonStyles.back} onClick={goBack} disabled={isLoading}>
          <ArrowLeft size={16} />
          <span className='text-sm'>{t('editResume.buttons.back')}</span>
        </button>

        <button className={buttonStyles.save} onClick={uploadResumeImages} disabled={isLoading}>
          {isLoading ? <Loader2 size={16} className='animate-spin' /> : <Save size={16} />}
          {isLoading ? t('editResume.saving') : t('editResume.buttons.save')}
        </button>

        <button className={buttonStyles.next} onClick={validateAndNext} disabled={isLoading}>
          {currentPage === 'additionalInfo' && <Download size={16} />}
          {currentPage === 'additionalInfo' ? t('editResume.buttons.previewAndDownload') : t('editResume.buttons.next')}
          {currentPage === 'additionalInfo' && <ArrowLeft size={16} className='rotate-180' />}
        </button>
      </div>
    </div>
  )
}

export default ResumeEditorActions
