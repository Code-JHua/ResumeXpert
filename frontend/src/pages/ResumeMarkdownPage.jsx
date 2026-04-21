import React from 'react'
import { useParams } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'

const ResumeMarkdownPage = () => {
  const { id } = useParams()

  return (
    <DashboardLayout activeMenu='dashboard'>
      <div className='px-4'>
        <div className='rounded-3xl bg-white p-8 border border-slate-200 shadow-sm'>
          <h1 className='text-3xl font-black text-slate-900'>Markdown 编辑模式</h1>
          <p className='mt-3 text-slate-600'>Resume ID: {id}</p>
          <p className='mt-2 text-slate-600'>Phase C 将在这里接入结构化内容与 Markdown 双编辑模式。当前版本已完成 Markdown 文档模型和接口预留。</p>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ResumeMarkdownPage
