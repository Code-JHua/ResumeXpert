import React from 'react'
import { containerStyles, iconStyles, statusStyles } from '../../assets/dummystyle'
import RenderResume from '../RenderResume'

const ResumePreviewPanel = ({ completionPercentage, previewContainerRef, previewWidth, templateId, resumeData, t }) => {
  return (
    <div className='hidden lg:block'>
      <div className={containerStyles.previewContainer}>
        <div className='text-center mb-4'>
          <div className={statusStyles.completionBadge}>
            <div className={iconStyles.pulseDot}></div>
            <span>{t('editResume.preview')} - {completionPercentage}% {t('editResume.completion')}</span>
          </div>
        </div>

        <div className='preview-container relative' ref={previewContainerRef}>
          <div className={containerStyles.previewInner}>
            <RenderResume
              key={`preview-${templateId}`}
              templateId={templateId}
              resumeData={resumeData}
              containerWidth={previewWidth}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResumePreviewPanel
