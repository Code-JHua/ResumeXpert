import React from 'react'
import { NavLink } from 'react-router-dom'

const items = [
  { to: '/dashboard', label: '简历中心' },
  { to: '/imports', label: '导入中心' },
  { to: '/jobs', label: '岗位 / ATS' },
  { to: '/cover-letters', label: '求职信' },
  { to: '/applications', label: '投递管理' },
  { to: '/share', label: '分享管理' },
  { to: '/templates', label: '模板中心' },
]

const CareerNav = () => {
  return (
    <div className='flex flex-wrap items-center gap-2'>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            isActive
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-200'
              : 'bg-white text-slate-600 border border-slate-200 hover:border-violet-300 hover:text-violet-700'
          }`}
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  )
}

export default CareerNav
