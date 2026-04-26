import React, { useContext, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { KeyRound, Languages, Save, ShieldCheck, UserRound } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import { UserContext } from '../context/UserContext'
import axiosInstance from '../utils/axiosInstance'
import { API_PATHS } from '../utils/apiPaths'
import LanguageSelector from '../components/LanguageSelector'
import { translateWithFallback } from '../utils/i18n'

const SettingsPage = () => {
  const { t } = useTranslation()
  const tt = (key, fallback, options) => translateWithFallback(t, key, fallback, options)
  const { user, loading, updateUser } = useContext(UserContext)
  const queryClient = useQueryClient()
  const [name, setName] = useState(user?.name || '')
  const [newPassword, setNewPassword] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const accountLabel = useMemo(() => (
    user?.email === 'admin' ? 'admin' : user?.email || ''
  ), [user])

  React.useEffect(() => {
    setName(user?.name || '')
  }, [user?.name])

  const handleProfileSave = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error(tt('settingsPage.toasts.nameRequired', '请输入用户名'))
      return
    }

    try {
      setSavingProfile(true)
      const response = await axiosInstance.put(API_PATHS.AUTH.UPDATE_PROFILE, {
        name: name.trim(),
      })
      updateUser({ ...user, ...response.data })
      queryClient.setQueriesData({ queryKey: ['templates'] }, (previous) => {
        if (!Array.isArray(previous)) return previous
        return previous.map((template) => (
          template?.isOwned
            ? { ...template, authorName: response.data.name }
            : template
        ))
      })
      queryClient.setQueriesData({ queryKey: ['template'] }, (previous) => {
        if (!previous || !previous.isOwned) return previous
        return { ...previous, authorName: response.data.name }
      })
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast.success(tt('settingsPage.toasts.profileUpdated', '账户资料已更新'))
    } catch (error) {
      toast.error(error.response?.data?.message || tt('settingsPage.toasts.profileUpdateFailed', '更新资料失败'))
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordSave = async (e) => {
    e.preventDefault()
    if (!newPassword.trim()) {
      toast.error(tt('settingsPage.toasts.passwordRequired', '请输入新密码'))
      return
    }

    try {
      setSavingPassword(true)
      await axiosInstance.put(API_PATHS.AUTH.UPDATE_PASSWORD, {
        newPassword: newPassword.trim(),
      })
      setNewPassword('')
      toast.success(tt('settingsPage.toasts.passwordUpdated', '密码已修改'))
    } catch (error) {
      toast.error(error.response?.data?.message || tt('settingsPage.toasts.passwordUpdateFailed', '修改密码失败'))
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return null
  }

  if (!user) {
    return <Navigate to='/' replace />
  }

  return (
    <DashboardLayout activeMenu='settings'>
      <div className='space-y-6 px-4 pb-8'>
        <section className='overflow-hidden rounded-[36px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(147,51,234,0.12),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(244,114,182,0.12),_transparent_28%),linear-gradient(135deg,#ffffff_0%,#faf5ff_48%,#f8fafc_100%)] p-8 shadow-[0_30px_80px_-50px_rgba(148,163,184,0.9)]'>
          <div className='flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between'>
            <div className='max-w-2xl'>
              <div className='inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-violet-700'>
                <ShieldCheck className='h-4 w-4' />
                {tt('settingsPage.badge', 'Settings')}
              </div>
              <h1 className='mt-4 font-serif text-4xl font-black tracking-tight text-slate-900'>{tt('settingsPage.title', '账户与偏好设置')}</h1>
              <p className='mt-3 text-base leading-7 text-slate-600'>
                {tt('settingsPage.description', '在这里管理你的基础资料、登录密码和语言偏好，保持账户信息与使用习惯一致。')}
              </p>
            </div>

            <div className='grid gap-3 sm:grid-cols-2'>
              <div className='rounded-[28px] border border-white/70 bg-white/80 px-5 py-4 shadow-lg shadow-violet-100/60 backdrop-blur'>
                <div className='text-xs font-semibold uppercase tracking-[0.22em] text-slate-400'>{tt('settingsPage.currentAccount', '当前账号')}</div>
                <div className='mt-2 text-lg font-black text-slate-900'>{accountLabel}</div>
              </div>
              <div className='rounded-[28px] border border-white/70 bg-white/80 px-5 py-4 shadow-lg shadow-violet-100/60 backdrop-blur'>
                <div className='text-xs font-semibold uppercase tracking-[0.22em] text-slate-400'>{tt('settingsPage.accountStatus', '账户状态')}</div>
                <div className='mt-2 text-lg font-black text-slate-900'>{user.status === 'active' ? tt('settingsPage.status.active', '启用中') : tt('settingsPage.status.disabled', '已停用')}</div>
              </div>
            </div>
          </div>
        </section>

        <section className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]'>
          <div className='space-y-6'>
            <form onSubmit={handleProfileSave} className='rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70'>
              <div className='flex items-start gap-3'>
                <div className='rounded-2xl bg-violet-100 p-3 text-violet-700'>
                  <UserRound className='h-5 w-5' />
                </div>
                <div>
                  <div className='text-xl font-black text-slate-900'>{tt('settingsPage.profile.title', '基础资料')}</div>
                  <p className='mt-1 text-sm text-slate-500'>{tt('settingsPage.profile.description', '首版仅支持修改用户名，账号标识和角色信息保持只读。')}</p>
                </div>
              </div>

              <div className='mt-6 grid gap-4'>
                <label className='text-sm font-semibold text-slate-700'>
                  {tt('settingsPage.profile.nameLabel', '用户名')}
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className='mt-2 w-full rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-normal outline-none transition focus:border-violet-300 focus:bg-white'
                    placeholder={tt('settingsPage.profile.namePlaceholder', '请输入用户名')}
                  />
                </label>
                <label className='text-sm font-semibold text-slate-700'>
                  {tt('settingsPage.profile.accountLabel', '账号')}
                  <input
                    value={accountLabel}
                    readOnly
                    className='mt-2 w-full rounded-[22px] border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-normal text-slate-500'
                  />
                </label>
                <div className='grid gap-4 md:grid-cols-2'>
                  <div className='rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600'>
                    {tt('settingsPage.profile.role', '角色：')}<span className='font-semibold text-slate-900'>{user.role}</span>
                  </div>
                  <div className='rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600'>
                    {tt('settingsPage.profile.status', '状态：')}<span className='font-semibold text-slate-900'>{user.status}</span>
                  </div>
                </div>
              </div>

              <button
                type='submit'
                disabled={savingProfile}
                className='mt-6 inline-flex items-center justify-center gap-2 rounded-[22px] bg-slate-900 px-5 py-3 font-semibold text-white shadow-lg shadow-slate-300 disabled:cursor-not-allowed disabled:opacity-70'
              >
                <Save className='h-4 w-4' />
                {savingProfile ? tt('settingsPage.buttons.saving', '保存中...') : tt('settingsPage.buttons.saveProfile', '保存资料')}
              </button>
            </form>

            <form onSubmit={handlePasswordSave} className='rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70'>
              <div className='flex items-start gap-3'>
                <div className='rounded-2xl bg-amber-100 p-3 text-amber-700'>
                  <KeyRound className='h-5 w-5' />
                </div>
                <div>
                  <div className='text-xl font-black text-slate-900'>{tt('settingsPage.password.title', '修改密码')}</div>
                  <p className='mt-1 text-sm text-slate-500'>{tt('settingsPage.password.description', '首版直接设置新密码，不需要输入旧密码。新密码至少 8 位。')}</p>
                </div>
              </div>

              <div className='mt-6'>
                <label className='text-sm font-semibold text-slate-700'>
                  {tt('settingsPage.password.label', '新密码')}
                  <input
                    type='password'
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className='mt-2 w-full rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-normal outline-none transition focus:border-amber-300 focus:bg-white'
                    placeholder={tt('settingsPage.password.placeholder', '请输入新的登录密码（至少 8 位）')}
                  />
                </label>
              </div>

              <button
                type='submit'
                disabled={savingPassword}
                className='mt-6 inline-flex items-center justify-center gap-2 rounded-[22px] bg-violet-600 px-5 py-3 font-semibold text-white shadow-lg shadow-violet-200 disabled:cursor-not-allowed disabled:opacity-70'
              >
                <KeyRound className='h-4 w-4' />
                {savingPassword ? tt('settingsPage.buttons.submitting', '提交中...') : tt('settingsPage.buttons.updatePassword', '更新密码')}
              </button>
            </form>
          </div>

          <div className='space-y-6'>
            <div className='rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70'>
              <div className='flex items-start gap-3'>
                <div className='rounded-2xl bg-sky-100 p-3 text-sky-700'>
                  <Languages className='h-5 w-5' />
                </div>
                <div>
                  <div className='text-xl font-black text-slate-900'>{tt('settingsPage.language.title', '语言偏好')}</div>
                  <p className='mt-1 text-sm text-slate-500'>{tt('settingsPage.language.description', '复用现有语言切换能力，切换后会立即生效并保存在本地。')}</p>
                </div>
              </div>

              <div className='mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-5'>
                <div className='text-sm font-semibold text-slate-700'>{tt('settingsPage.language.interface', '界面语言')}</div>
                <div className='mt-3'>
                  <LanguageSelector className='shadow-md shadow-violet-200/60' />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}

export default SettingsPage
