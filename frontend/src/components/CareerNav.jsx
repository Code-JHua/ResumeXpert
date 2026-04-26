import React from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { queryClient } from '../lib/queryClient'
import { queryKeys } from '../lib/queryKeys'
import { fetchResumes, fetchTemplates } from '../services/queryService'
import { translateWithFallback } from '../utils/i18n'
import {
  loadDashboardPage,
  loadSettingsPage,
  loadShareManagementPage,
  loadTemplatesPage,
} from '../utils/routeModules'

const CareerNav = () => {
  const { t } = useTranslation()
  const tt = (key, fallback, options) => translateWithFallback(t, key, fallback, options)
  const items = [
    {
      to: '/dashboard',
      label: tt('careerNav.dashboard', '简历中心'),
      preload: () => {
        loadDashboardPage()
        return queryClient.prefetchQuery({
          queryKey: queryKeys.resumes,
          queryFn: fetchResumes,
        })
      },
    },
    {
      to: '/share',
      label: tt('careerNav.share', '分享管理'),
      preload: () => {
        loadShareManagementPage()
        return queryClient.prefetchQuery({
          queryKey: queryKeys.resumes,
          queryFn: fetchResumes,
        })
      },
    },
    {
      to: '/templates',
      label: tt('careerNav.templates', '模板中心'),
      preload: () => {
        loadTemplatesPage()
        return Promise.all([
          queryClient.prefetchQuery({
            queryKey: queryKeys.templates({ scope: 'all', sourceType: '' }),
            queryFn: () => fetchTemplates({}),
          }),
          queryClient.prefetchQuery({
            queryKey: queryKeys.resumes,
            queryFn: fetchResumes,
          }),
        ])
      },
    },
    {
      to: '/settings',
      label: tt('careerNav.settings', '设置'),
      preload: () => loadSettingsPage(),
    },
  ]

  return (
    <div className='flex flex-wrap items-center gap-2'>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onMouseEnter={() => item.preload?.()}
          onFocus={() => item.preload?.()}
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
