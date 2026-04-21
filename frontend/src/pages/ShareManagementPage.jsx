import React from 'react'
import DashboardLayout from '../components/DashboardLayout'

const ShareManagementPage = () => {
  return (
    <DashboardLayout activeMenu='share'>
      <div className='px-4'>
        <div className='rounded-3xl bg-white p-8 border border-slate-200 shadow-sm'>
          <h1 className='text-3xl font-black text-slate-900'>分享管理</h1>
          <p className='mt-3 text-slate-600'>Phase D 将在这里接入分享页、权限控制和访问统计。当前版本已为统一输出中心预留接口和页面入口。</p>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ShareManagementPage
