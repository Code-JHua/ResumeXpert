import React, { useContext } from 'react'
import Navbar from './Navbar'
import { UserContext } from '../context/UserContext'

const DashboardLayout = ({ activeMenu, children }) => {

  const { user, loading } = useContext(UserContext);

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50'>
      <Navbar activeMenu={activeMenu} />
      <div className='container mx-auto pt-28 pb-4'>
        {loading && (
          <div className='space-y-6 px-4 pb-8'>
            <div className='h-40 animate-pulse rounded-[36px] border border-slate-200 bg-white/80 shadow-xl shadow-slate-200/60' />
            <div className='grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]'>
              <div className='space-y-5'>
                <div className='h-28 animate-pulse rounded-[32px] border border-slate-200 bg-white/80 shadow-xl shadow-slate-200/60' />
                <div className='h-[26rem] animate-pulse rounded-[32px] border border-slate-200 bg-white/80 shadow-xl shadow-slate-200/60' />
              </div>
              <div className='space-y-5'>
                <div className='h-44 animate-pulse rounded-[32px] border border-slate-200 bg-white/80 shadow-xl shadow-slate-200/60' />
                <div className='h-[34rem] animate-pulse rounded-[32px] border border-slate-200 bg-white/80 shadow-xl shadow-slate-200/60' />
              </div>
            </div>
          </div>
        )}
        {!loading && user && children}
      </div>
    </div>
  )
}

export default DashboardLayout
