import React from 'react'
import Navbar from './Navbar'

const AppRouteFallback = () => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50'>
      <Navbar />
      <div className='container mx-auto space-y-6 px-4 pt-28 pb-8'>
        <div className='h-40 animate-pulse rounded-[36px] border border-slate-200 bg-white/70 shadow-xl shadow-slate-200/60' />
        <div className='grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]'>
          <div className='space-y-5'>
            <div className='h-28 animate-pulse rounded-[32px] border border-slate-200 bg-white/70 shadow-xl shadow-slate-200/60' />
            <div className='h-[28rem] animate-pulse rounded-[32px] border border-slate-200 bg-white/70 shadow-xl shadow-slate-200/60' />
          </div>
          <div className='space-y-5'>
            <div className='h-52 animate-pulse rounded-[32px] border border-slate-200 bg-white/70 shadow-xl shadow-slate-200/60' />
            <div className='h-[36rem] animate-pulse rounded-[32px] border border-slate-200 bg-white/70 shadow-xl shadow-slate-200/60' />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppRouteFallback
