import React, { useState, useEffect, useRef } from 'react'
import { getTemplateById } from '../utils/templateRegistry.js'

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
  resumeData,
  containerWidth
}) => {
  const template = getTemplateById(templateId)
  const Renderer = template?.renderer

  if (!Renderer) {
    return null
  }

  return <Renderer resumeData={resumeData} containerWidth={containerWidth} />
}

export default RenderResume
