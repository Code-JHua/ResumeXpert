import React, { useState, useEffect, useRef } from 'react'
import { getTemplateMetadata, loadTemplateRenderer } from '../utils/templateRegistry.js'
import { getDensityClassName, resolveTemplateTheme } from '../utils/templateTheme.js'

// 逐字母动画组件 - 支持输入淡入和删除淡出
export const AnimatedText = ({ children, className = '' }) => {
  const text = String(children || '')
  const prevTextRef = useRef('')
  const [letters, setLetters] = useState([])

  useEffect(() => {
    const prevText = prevTextRef.current
    const newLetters = []
    const prevLetters = prevText.split('')
    const currentLetters = text.split('')

    // 找出最长长度
    const maxLength = Math.max(prevLetters.length, currentLetters.length)

    for (let i = 0; i < maxLength; i++) {
      const prevChar = prevLetters[i]
      const currentChar = currentLetters[i]

      if (prevChar === currentChar) {
        // 字符没变
        newLetters.push({
          char: currentChar,
          key: `stable-${i}`,
          status: 'stable'
        })
      } else if (currentChar !== undefined && prevChar === undefined) {
        // 新增的字符（输入）
        newLetters.push({
          char: currentChar,
          key: `new-${Date.now()}-${i}`,
          status: 'entering'
        })
      } else if (currentChar === undefined && prevChar !== undefined) {
        // 删除的字符 - 先保留用于淡出动画
        newLetters.push({
          char: prevChar,
          key: `removing-${Date.now()}-${i}`,
          status: 'leaving'
        })
      } else if (currentChar !== prevChar) {
        // 替换的字符
        newLetters.push({
          char: currentChar,
          key: `replace-${Date.now()}-${i}`,
          status: 'entering'
        })
      }
    }

    setLetters(newLetters)
    prevTextRef.current = text

    // 清除已完成删除动画的字母
    const timer = setTimeout(() => {
      setLetters(prev => prev.filter(letter => letter.status !== 'leaving'))
    }, 200)

    return () => clearTimeout(timer)
  }, [text])

  return (
    <span className={`inline-block ${className}`}>
      {letters.map((letter) => {
        let animationClass = ''

        if (letter.status === 'entering') {
          animationClass = 'animate-letter-in'
        } else if (letter.status === 'leaving') {
          animationClass = 'animate-letter-out'
        }

        return (
          <span
            key={letter.key}
            className={`inline-block ${animationClass}`}
          >
            {letter.char}
          </span>
        )
      })}
    </span>
  )
}

const RenderResume = ({
  templateId,
  templateMeta,
  resumeData,
  containerWidth
}) => {
  const [Renderer, setRenderer] = useState(null)
  const template = getTemplateMetadata(templateMeta || { rendererKey: templateId || '01' })
  const theme = resolveTemplateTheme(template, resumeData?.template)

  useEffect(() => {
    let cancelled = false

    loadTemplateRenderer(template?.rendererKey || templateId)
      .then((nextRenderer) => {
        if (!cancelled) {
          setRenderer(() => nextRenderer)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRenderer(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [template?.rendererKey, templateId])

  if (!Renderer) {
    return (
      <div className='rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-6'>
        <div className='space-y-4 animate-pulse'>
          <div className='h-6 w-1/3 rounded-full bg-slate-200' />
          <div className='h-4 w-2/3 rounded-full bg-slate-200' />
          <div className='grid gap-3'>
            <div className='h-24 rounded-[24px] bg-slate-100' />
            <div className='h-24 rounded-[24px] bg-slate-100' />
            <div className='h-40 rounded-[24px] bg-slate-100' />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={getDensityClassName(theme.density)}
      style={{
        '--resume-accent': theme.accentColor,
        '--resume-heading': theme.headingColor,
        '--resume-tag-bg': theme.tagBackground,
        '--resume-font-family': theme.fontFamily,
      }}
    >
      <Renderer resumeData={resumeData} containerWidth={containerWidth} theme={theme} templateMeta={template} />
    </div>
  )
}

export default RenderResume
