import React, { useEffect, useMemo, useRef, useState } from 'react'
import { LuGithub, LuGlobe, LuMail, LuPhone } from 'react-icons/lu'
import { RiLinkedinLine } from 'react-icons/ri'
import { AnimatedText } from './RenderResume'
import { resolveBlockConfig } from '../utils/templateBlocks'
import { formatYearMonth } from '../utils/helper'
import { FreeBlocksSection } from './ResumeSection'

const SectionTitle = ({ children, theme }) => (
  <div className='mb-3 border-b pb-2 text-sm font-black uppercase tracking-[0.24em]' style={{ color: theme.headingColor, borderColor: theme.accentColor }}>
    {children}
  </div>
)

const FlexibleTemplate = ({ resumeData = {}, containerWidth, theme = {}, templateMeta }) => {
  const resumeRef = useRef(null)
  const [baseWidth, setBaseWidth] = useState(900)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    if (resumeRef.current && containerWidth > 0) {
      const actualWidth = resumeRef.current.offsetWidth
      setBaseWidth(actualWidth)
      setScale(containerWidth / actualWidth)
    }
  }, [containerWidth])

  const blockConfig = useMemo(() => resolveBlockConfig(templateMeta, resumeData?.template), [templateMeta, resumeData?.template])
  const layoutMode = resumeData?.template?.settings?.layoutMode || templateMeta?.blockSchema?.layoutMode || 'two-column'

  const renderSection = (block) => {
    switch (block.key) {
      case 'summary':
        return resumeData?.profileInfo?.summary ? <p className='text-sm leading-7 text-slate-700'><AnimatedText>{resumeData.profileInfo.summary}</AnimatedText></p> : null
      case 'workExperience':
        return (
          <div className='space-y-4'>
            {(resumeData.workExperience || []).filter((item) => item?.role || item?.company || item?.description).map((item, index) => (
              <div key={`${block.key}-${index}`} className='rounded-2xl border border-slate-200 p-4'>
                <div className='flex items-start justify-between gap-4'>
                  <div>
                    <div className='text-base font-bold text-slate-900'><AnimatedText>{item.role}</AnimatedText></div>
                    <div className='mt-1 text-sm text-slate-500'><AnimatedText>{item.company}</AnimatedText></div>
                  </div>
                  <div className='text-xs font-semibold' style={{ color: theme.accentColor }}>
                    <AnimatedText>{`${formatYearMonth(item.startDate)} - ${formatYearMonth(item.endDate)}`}</AnimatedText>
                  </div>
                </div>
                {item.description && <p className='mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700'><AnimatedText>{item.description}</AnimatedText></p>}
              </div>
            ))}
          </div>
        )
      case 'projects':
        return (
          <div className='space-y-4'>
            {(resumeData.projects || []).filter((item) => item?.title || item?.description).map((item, index) => (
              <div key={`${block.key}-${index}`} className='rounded-2xl border border-slate-200 p-4'>
                <div className='flex items-center justify-between gap-4'>
                  <div className='text-base font-bold text-slate-900'><AnimatedText>{item.title}</AnimatedText></div>
                  <div className='flex gap-3 text-xs'>
                    {item.github && <a href={item.github} target='_blank' rel='noreferrer' style={{ color: theme.accentColor }}><LuGithub size={14} /></a>}
                    {item.liveDemo && <a href={item.liveDemo} target='_blank' rel='noreferrer' style={{ color: theme.accentColor }}><LuGlobe size={14} /></a>}
                  </div>
                </div>
                <p className='mt-3 text-sm leading-7 text-slate-700'><AnimatedText>{item.description}</AnimatedText></p>
              </div>
            ))}
          </div>
        )
      case 'education':
        return (
          <div className='space-y-3'>
            {(resumeData.education || []).filter((item) => item?.degree || item?.institution).map((item, index) => (
              <div key={`${block.key}-${index}`} className='rounded-2xl bg-slate-50 p-4'>
                <div className='text-sm font-bold text-slate-900'><AnimatedText>{item.degree}</AnimatedText></div>
                <div className='mt-1 text-sm text-slate-600'><AnimatedText>{item.institution}</AnimatedText></div>
                <div className='mt-1 text-xs text-slate-500'><AnimatedText>{`${formatYearMonth(item.startDate)} - ${formatYearMonth(item.endDate)}`}</AnimatedText></div>
              </div>
            ))}
          </div>
        )
      case 'skills':
        return (
          <div className='flex flex-wrap gap-2'>
            {(resumeData.skills || []).filter((item) => item?.name).map((item, index) => (
              <span key={`${block.key}-${index}`} className='rounded-full px-3 py-1 text-xs font-semibold' style={{ backgroundColor: theme.tagBackground, color: theme.headingColor }}>
                <AnimatedText>{item.name}</AnimatedText>
              </span>
            ))}
          </div>
        )
      case 'certifications':
        return (
          <div className='space-y-3'>
            {(resumeData.certifications || []).filter((item) => item?.title || item?.issuer || item?.year).map((item, index) => (
              <div key={`${block.key}-${index}`} className='rounded-2xl bg-slate-50 p-4'>
                <div className='text-sm font-bold text-slate-900'><AnimatedText>{item.title}</AnimatedText></div>
                <div className='mt-1 text-xs text-slate-500'><AnimatedText>{[item.issuer, item.year].filter(Boolean).join(' · ')}</AnimatedText></div>
              </div>
            ))}
          </div>
        )
      case 'languages':
        return (
          <div className='flex flex-wrap gap-2'>
            {(resumeData.languages || []).filter((item) => item?.name).map((item, index) => (
              <span key={`${block.key}-${index}`} className='rounded-full px-3 py-1 text-xs font-semibold' style={{ backgroundColor: theme.tagBackground, color: theme.headingColor }}>
                <AnimatedText>{item.name}</AnimatedText>
              </span>
            ))}
          </div>
        )
      case 'interests':
        return (
          <div className='flex flex-wrap gap-2'>
            {(resumeData.interests || []).filter(Boolean).map((item, index) => (
              <span key={`${block.key}-${index}`} className='rounded-full px-3 py-1 text-xs font-semibold' style={{ backgroundColor: theme.tagBackground, color: theme.headingColor }}>
                <AnimatedText>{item}</AnimatedText>
              </span>
            ))}
          </div>
        )
      case 'freeBlocks':
        return <FreeBlocksSection blocks={resumeData.freeBlocks || []} itemClassName='mb-4 last:mb-0' />
      default:
        return null
    }
  }

  const visibleBlocks = blockConfig.filter((block) => block.visible !== false)
  const mainBlocks = visibleBlocks.filter((block) => layoutMode === 'single' || block.column !== 'sidebar')
  const sidebarBlocks = layoutMode === 'two-column' ? visibleBlocks.filter((block) => block.column === 'sidebar') : []

  return (
    <div
      ref={resumeRef}
      className='bg-white p-8 text-slate-900'
      style={{
        transform: containerWidth > 0 ? `scale(${scale})` : undefined,
        transformOrigin: 'top left',
        width: containerWidth > 0 ? `${baseWidth}px` : undefined,
        fontFamily: theme.fontFamily,
      }}
    >
      <div className='rounded-[32px] border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-8 shadow-sm'>
        <div className='flex flex-col gap-6 border-b border-slate-200 pb-6 lg:flex-row lg:items-start lg:justify-between'>
          <div>
            <div className='text-4xl font-black tracking-tight' style={{ color: theme.headingColor }}>
              <AnimatedText>{resumeData?.profileInfo?.fullName || resumeData?.title || 'Resume'}</AnimatedText>
            </div>
            <div className='mt-3 text-lg font-semibold' style={{ color: theme.accentColor }}>
              <AnimatedText>{resumeData?.profileInfo?.designation}</AnimatedText>
            </div>
          </div>
          <div className='grid gap-2 text-sm text-slate-600'>
            {resumeData?.contactInfo?.email && <a href={`mailto:${resumeData.contactInfo.email}`} className='flex items-center gap-2'><LuMail size={14} />{resumeData.contactInfo.email}</a>}
            {resumeData?.contactInfo?.phone && <div className='flex items-center gap-2'><LuPhone size={14} />{resumeData.contactInfo.phone}</div>}
            {resumeData?.contactInfo?.linkedin && <a href={resumeData.contactInfo.linkedin} target='_blank' rel='noreferrer' className='flex items-center gap-2'><RiLinkedinLine size={14} />LinkedIn</a>}
            {resumeData?.contactInfo?.github && <a href={resumeData.contactInfo.github} target='_blank' rel='noreferrer' className='flex items-center gap-2'><LuGithub size={14} />GitHub</a>}
          </div>
        </div>

        <div className={`mt-6 grid gap-6 ${layoutMode === 'two-column' ? 'lg:grid-cols-[minmax(0,1fr)_280px]' : 'grid-cols-1'}`}>
          <div className='space-y-5'>
            {mainBlocks.map((block) => {
              const content = renderSection(block)
              if (!content) return null

              return (
                <section key={block.key} className='rounded-3xl border border-slate-200 p-5'>
                  <SectionTitle theme={theme}>{block.title}</SectionTitle>
                  {content}
                </section>
              )
            })}
          </div>

          {layoutMode === 'two-column' && (
            <div className='space-y-5'>
              {sidebarBlocks.map((block) => {
                const content = renderSection(block)
                if (!content) return null

                return (
                  <section key={block.key} className='rounded-3xl border border-slate-200 p-5'>
                    <SectionTitle theme={theme}>{block.title}</SectionTitle>
                    {content}
                  </section>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FlexibleTemplate
