import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  KeyRound,
  Shield,
  ShieldCheck,
  UserCog,
  Users,
  Search,
  FileStack,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import axiosInstance from '../utils/axiosInstance'
import { API_PATHS } from '../utils/apiPaths'
import { UserContext } from '../context/UserContext'
import { DUMMY_RESUME_DATA } from '../utils/data'
import RenderResume from '../components/RenderResume'
import { translateWithFallback } from '../utils/i18n'

const adminTabs = [
  { key: 'templates', icon: FileStack },
  { key: 'users', icon: Users },
]

const AdminPage = () => {
  const { t, i18n } = useTranslation()
  const tt = (key, fallback, options) => translateWithFallback(t, key, fallback, options)
  const locale = (i18n.language || '').startsWith('zh') ? 'zh-CN' : 'en-US'
  const { user, loading } = useContext(UserContext)
  const [activeTab, setActiveTab] = useState('templates')
  const [reviewQueue, setReviewQueue] = useState([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')
  const [userFilters, setUserFilters] = useState({
    search: '',
    role: '',
    status: '',
  })
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const getReviewStatusLabel = (status) => ({
    reserved: tt('adminPage.reviewStatus.reserved', '未提交'),
    pending: tt('adminPage.reviewStatus.pending', '待审核'),
    approved: tt('adminPage.reviewStatus.approved', '已通过'),
    rejected: tt('adminPage.reviewStatus.rejected', '已驳回'),
  }[status] || status || tt('adminPage.reviewStatus.reserved', '未提交'))
  const getSourceTypeLabel = (sourceType) => ({
    official: tt('adminPage.sourceType.official', '官方'),
    custom: tt('adminPage.sourceType.custom', '个人'),
    community: tt('adminPage.sourceType.community', '社区'),
  }[sourceType] || sourceType || '—')
  const getUserRoleLabel = (role) => ({
    user: tt('adminPage.userManagement.filters.user', '普通用户'),
    admin: tt('adminPage.userManagement.filters.admin', '管理员'),
  }[role] || role || '—')
  const getUserStatusLabel = (status) => ({
    active: tt('adminPage.userManagement.filters.active', '启用中'),
    disabled: tt('adminPage.userManagement.filters.disabled', '已停用'),
  }[status] || status || '—')

  const loadReviewQueue = async () => {
    const response = await axiosInstance.get(API_PATHS.TEMPLATES.GET_REVIEW_QUEUE)
    setReviewQueue(response.data)
    if (!selectedTemplateId && response.data[0]) {
      setSelectedTemplateId(response.data[0].id)
      setReviewNotes(response.data[0].communityMeta?.reviewNotes || '')
    }
  }

  const loadUsers = async () => {
    const query = new URLSearchParams()
    if (userFilters.search) query.set('search', userFilters.search)
    if (userFilters.role) query.set('role', userFilters.role)
    if (userFilters.status) query.set('status', userFilters.status)
    const suffix = query.toString() ? `?${query.toString()}` : ''

    const response = await axiosInstance.get(`${API_PATHS.ADMIN.GET_USERS}${suffix}`)
    setUsers(response.data)
    if (!selectedUserId && response.data[0]) {
      setSelectedUserId(response.data[0]._id)
    }
  }

  const loadSelectedUser = async () => {
    if (!selectedUserId) {
      setSelectedUser(null)
      return
    }

    const response = await axiosInstance.get(API_PATHS.ADMIN.GET_USER_BY_ID(selectedUserId))
    setSelectedUser(response.data)
  }

  useEffect(() => {
    if (!user || user.role !== 'admin') return

    if (activeTab === 'templates') {
      loadReviewQueue().catch(() => toast.error(tt('adminPage.toasts.loadReviewQueueFailed', '加载审核队列失败')))
    } else {
      loadUsers().catch(() => toast.error(tt('adminPage.toasts.loadUsersFailed', '加载用户列表失败')))
    }
  }, [activeTab, user, userFilters.search, userFilters.role, userFilters.status, t, i18n.language])

  useEffect(() => {
    if (activeTab !== 'users' || !user || user.role !== 'admin') return
    loadSelectedUser().catch(() => toast.error(tt('adminPage.toasts.loadUserDetailFailed', '加载用户详情失败')))
  }, [activeTab, selectedUserId, user, t, i18n.language])

  const selectedTemplate = useMemo(
    () => reviewQueue.find((item) => item.id === selectedTemplateId) || reviewQueue[0] || null,
    [reviewQueue, selectedTemplateId]
  )

  useEffect(() => {
    if (selectedTemplate) {
      setReviewNotes(selectedTemplate.communityMeta?.reviewNotes || '')
    }
  }, [selectedTemplate?.id])

  const handleReview = async (decision) => {
    if (!selectedTemplate) return

    try {
      await axiosInstance.post(API_PATHS.TEMPLATES.REVIEW(selectedTemplate.id), {
        decision,
        reviewNotes,
      })
      toast.success(decision === 'approved'
        ? tt('adminPage.toasts.templateApproved', '模板已通过审核')
        : tt('adminPage.toasts.templateRejected', '模板已驳回'))
      await loadReviewQueue()
    } catch (error) {
      toast.error(tt('adminPage.toasts.reviewFailed', '处理模板审核失败'))
    }
  }

  const handleUserStatus = async (status) => {
    if (!selectedUser) return

    try {
      const response = await axiosInstance.put(API_PATHS.ADMIN.UPDATE_USER_STATUS(selectedUser._id), { status })
      setSelectedUser(response.data)
      setUsers((prev) => prev.map((item) => item._id === response.data._id ? response.data : item))
      toast.success(status === 'active'
        ? tt('adminPage.toasts.userEnabled', '账号已启用')
        : tt('adminPage.toasts.userDisabled', '账号已停用'))
    } catch (error) {
      toast.error(error.response?.data?.message || tt('adminPage.toasts.updateUserStatusFailed', '更新账号状态失败'))
    }
  }

  const handlePasswordReset = async (e) => {
    e.preventDefault()
    if (!selectedUser) return

    try {
      await axiosInstance.post(API_PATHS.ADMIN.RESET_USER_PASSWORD(selectedUser._id), {
        newPassword,
      })
      setNewPassword('')
      toast.success(tt('adminPage.toasts.passwordReset', '密码已重置'))
    } catch (error) {
      toast.error(error.response?.data?.message || tt('adminPage.toasts.passwordResetFailed', '重置密码失败'))
    }
  }

  if (loading) {
    return null
  }

  if (!user) {
    return <Navigate to='/' replace />
  }

  if (user.role !== 'admin') {
    return (
      <DashboardLayout activeMenu='dashboard'>
        <div className='px-4'>
          <div className='mx-auto max-w-3xl rounded-[32px] border border-rose-100 bg-white p-10 text-center shadow-xl shadow-rose-100/50'>
            <Shield className='mx-auto mb-4 h-12 w-12 text-rose-500' />
            <h1 className='text-3xl font-black text-slate-900'>{tt('adminPage.noPermissionTitle', '当前账号没有管理员权限')}</h1>
            <p className='mt-3 text-slate-600'>{tt('adminPage.noPermissionDescription', '管理员后台已独立拆出，仅 `admin` 角色可访问模板审核与用户管理能力。')}</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout activeMenu='dashboard'>
      <div className='space-y-6 px-4 pb-8'>
        <section className='overflow-hidden rounded-[36px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_32%),linear-gradient(135deg,#fffdf7_0%,#fff8eb_48%,#f8fafc_100%)] p-8 shadow-[0_30px_80px_-50px_rgba(148,163,184,0.9)]'>
          <div className='flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between'>
            <div className='max-w-2xl'>
              <div className='inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-amber-700'>
                <ShieldCheck className='h-4 w-4' />
                {tt('adminPage.badge', 'Admin Console')}
              </div>
              <h1 className='mt-4 font-serif text-4xl font-black tracking-tight text-slate-900'>{tt('adminPage.title', '管理员后台')}</h1>
              <p className='mt-3 text-base leading-7 text-slate-600'>
                {tt('adminPage.description', '集中处理模板审核与用户管理，快速完成账号启停、密码重置等后台操作。')}
              </p>
            </div>

            <div className='grid gap-3 sm:grid-cols-2'>
              <div className='rounded-[28px] border border-white/70 bg-white/75 px-5 py-4 shadow-lg shadow-amber-100/70 backdrop-blur'>
                <div className='text-xs font-semibold uppercase tracking-[0.22em] text-slate-400'>{tt('adminPage.pendingTemplates', '待处理模板')}</div>
                <div className='mt-2 text-3xl font-black text-slate-900'>{reviewQueue.filter((item) => item.communityMeta?.reviewStatus === 'pending').length}</div>
              </div>
              <div className='rounded-[28px] border border-white/70 bg-white/75 px-5 py-4 shadow-lg shadow-amber-100/70 backdrop-blur'>
                <div className='text-xs font-semibold uppercase tracking-[0.22em] text-slate-400'>{tt('adminPage.totalUsers', '用户总数')}</div>
                <div className='mt-2 text-3xl font-black text-slate-900'>{users.length}</div>
              </div>
            </div>
          </div>
        </section>

        <section className='grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)]'>
          <aside className='rounded-[32px] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70'>
            <div className='text-sm font-semibold uppercase tracking-[0.24em] text-slate-400'>{tt('adminPage.navigation', '后台导航')}</div>
            <div className='mt-4 space-y-2'>
              {adminTabs.map((tab) => {
                const Icon = tab.icon
                const active = activeTab === tab.key
                return (
                  <button
                    key={tab.key}
                    type='button'
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex w-full items-center gap-3 rounded-[24px] px-4 py-3 text-left transition-all ${
                      active
                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-300'
                        : 'bg-slate-50 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                    }`}
                  >
                    <Icon className='h-4 w-4' />
                    <span className='font-semibold'>{tab.key === 'templates' ? tt('adminPage.tabs.templates', '模板审核') : tt('adminPage.tabs.users', '用户管理')}</span>
                  </button>
                )
              })}
            </div>
          </aside>

          {activeTab === 'templates' ? (
            <div className='grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]'>
              <div className='rounded-[32px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70'>
                <div className='flex items-center justify-between'>
                  <div>
                    <div className='text-xl font-black text-slate-900'>{tt('adminPage.reviewQueueTitle', '待审核模板')}</div>
                    <p className='mt-1 text-sm text-slate-500'>{tt('adminPage.reviewQueueDescription', '集中处理社区投稿，避免污染用户端模板中心。')}</p>
                  </div>
                  <div className='rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700'>
                    {tt('adminPage.itemCount', '{{count}} 项', { count: reviewQueue.length })}
                  </div>
                </div>

                <div className='mt-5 space-y-3 max-h-[68vh] overflow-auto pr-1'>
                  {reviewQueue.map((item) => (
                    <button
                      key={item.id}
                      type='button'
                      onClick={() => setSelectedTemplateId(item.id)}
                      className={`w-full rounded-[28px] border p-4 text-left transition-all ${
                        selectedTemplate?.id === item.id
                          ? 'border-amber-300 bg-amber-50/70 shadow-lg shadow-amber-100/60'
                          : 'border-slate-200 bg-slate-50/70 hover:border-amber-200 hover:bg-white'
                      }`}
                    >
                      <div className='flex items-start justify-between gap-3'>
                        <div>
                          <div className='font-semibold text-slate-900'>{item.name}</div>
                          <div className='mt-1 text-xs uppercase tracking-[0.22em] text-slate-400'>{item.authorName || tt('adminPage.communityCreator', 'Community Creator')}</div>
                        </div>
                        <span className='rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600'>
                          {getReviewStatusLabel(item.communityMeta?.reviewStatus)}
                        </span>
                      </div>
                      <p className='mt-3 line-clamp-2 text-sm text-slate-600'>{item.description || tt('adminPage.noDescription', '暂无描述')}</p>
                    </button>
                  ))}
                  {reviewQueue.length === 0 && (
                    <div className='rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500'>
                    {tt('adminPage.noPendingTemplates', '当前没有待处理模板。')}
                    </div>
                  )}
                </div>
              </div>

              <div className='space-y-6'>
                {selectedTemplate && (
                  <>
                    <div className='rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70'>
                      <div className='flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between'>
                        <div className='max-w-2xl'>
                          <div className='inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500'>
                            {getSourceTypeLabel(selectedTemplate.sourceType)}
                          </div>
                          <h2 className='mt-4 text-3xl font-black text-slate-900'>{selectedTemplate.name}</h2>
                          <p className='mt-3 text-slate-600'>{selectedTemplate.description || tt('adminPage.templateReview.noDescription', '暂无描述')}</p>
                          <div className='mt-4 grid gap-3 sm:grid-cols-2'>
                            <div className='rounded-[24px] bg-slate-50 px-4 py-3 text-sm text-slate-600'>
                              {tt('adminPage.templateReview.currentStatus', '当前状态')}：<span className='font-semibold text-slate-900'>{getReviewStatusLabel(selectedTemplate.communityMeta?.reviewStatus)}</span>
                            </div>
                            <div className='rounded-[24px] bg-slate-50 px-4 py-3 text-sm text-slate-600'>
                              {tt('adminPage.templateReview.submitterNote', '投稿说明')}：<span className='font-semibold text-slate-900'>{selectedTemplate.communityMeta?.submitterNote || tt('adminPage.templateReview.notFilled', '未填写')}</span>
                            </div>
                          </div>
                        </div>

                        <div className='grid gap-3 sm:grid-cols-2'>
                          <button
                            type='button'
                            onClick={() => handleReview('approved')}
                            className='inline-flex items-center justify-center gap-2 rounded-[22px] bg-emerald-600 px-5 py-3 font-semibold text-white shadow-lg shadow-emerald-200'
                          >
                            <CheckCircle2 className='h-4 w-4' />
                            {tt('adminPage.templateReview.actions.approve', '通过')}
                          </button>
                          <button
                            type='button'
                            onClick={() => handleReview('rejected')}
                            className='inline-flex items-center justify-center gap-2 rounded-[22px] border border-rose-200 px-5 py-3 font-semibold text-rose-700'
                          >
                            <XCircle className='h-4 w-4' />
                            {tt('adminPage.templateReview.actions.reject', '驳回')}
                          </button>
                        </div>
                      </div>

                      <label className='mt-6 block'>
                        <div className='mb-2 text-sm font-semibold text-slate-700'>{tt('adminPage.templateReview.reviewNotes', '审核备注')}</div>
                        <textarea
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          rows={4}
                          className='w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-amber-300 focus:bg-white'
                          placeholder={tt('adminPage.templateReview.reviewNotesPlaceholder', '记录通过理由、修改建议或驳回原因')}
                        />
                      </label>
                    </div>

                    <div className='rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70'>
                      <div className='mb-4'>
                        <div className='text-xl font-black text-slate-900'>{tt('adminPage.templateReview.previewTitle', '模板预览')}</div>
                        <p className='mt-1 text-sm text-slate-500'>{tt('adminPage.templateReview.previewDescription', '管理员在后台独立查看结构与渲染效果，不再占用用户端操作空间。')}</p>
                      </div>
                      <RenderResume
                        templateId={selectedTemplate.rendererKey}
                        templateMeta={selectedTemplate}
                        resumeData={DUMMY_RESUME_DATA}
                        containerWidth={null}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className='grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]'>
              <div className='rounded-[32px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70'>
                <div className='text-xl font-black text-slate-900'>{tt('adminPage.userManagement.title', '用户列表')}</div>
                <p className='mt-1 text-sm text-slate-500'>{tt('adminPage.userManagement.description', '支持搜索、筛选、查看详情，并执行密码重置与账号启停。')}</p>

                <div className='mt-5 space-y-3'>
                  <label className='relative block'>
                    <Search className='pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
                    <input
                      value={userFilters.search}
                      onChange={(e) => setUserFilters((prev) => ({ ...prev, search: e.target.value }))}
                      className='w-full rounded-[22px] border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-amber-300 focus:bg-white'
                      placeholder={tt('adminPage.userManagement.searchPlaceholder', '搜索姓名或邮箱')}
                    />
                  </label>

                  <div className='grid gap-3 sm:grid-cols-2'>
                    <select
                      value={userFilters.role}
                      onChange={(e) => setUserFilters((prev) => ({ ...prev, role: e.target.value }))}
                      className='rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-300 focus:bg-white'
                    >
                      <option value=''>{tt('adminPage.userManagement.filters.allRoles', '全部角色')}</option>
                      <option value='user'>{tt('adminPage.userManagement.filters.user', '普通用户')}</option>
                      <option value='admin'>{tt('adminPage.userManagement.filters.admin', '管理员')}</option>
                    </select>
                    <select
                      value={userFilters.status}
                      onChange={(e) => setUserFilters((prev) => ({ ...prev, status: e.target.value }))}
                      className='rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-300 focus:bg-white'
                    >
                      <option value=''>{tt('adminPage.userManagement.filters.allStatuses', '全部状态')}</option>
                      <option value='active'>{tt('adminPage.userManagement.filters.active', '启用中')}</option>
                      <option value='disabled'>{tt('adminPage.userManagement.filters.disabled', '已停用')}</option>
                    </select>
                  </div>
                </div>

                <div className='mt-5 space-y-3 max-h-[62vh] overflow-auto pr-1'>
                  {users.map((item) => (
                    <button
                      key={item._id}
                      type='button'
                      onClick={() => setSelectedUserId(item._id)}
                      className={`w-full rounded-[26px] border p-4 text-left transition-all ${
                        selectedUserId === item._id
                          ? 'border-amber-300 bg-amber-50/70 shadow-lg shadow-amber-100/60'
                          : 'border-slate-200 bg-slate-50/70 hover:border-amber-200 hover:bg-white'
                      }`}
                    >
                      <div className='flex items-start justify-between gap-3'>
                        <div>
                          <div className='font-semibold text-slate-900'>{item.name}</div>
                          <div className='mt-1 text-sm text-slate-500'>{item.email}</div>
                        </div>
                        <div className='text-right'>
                          <div className='rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600'>{getUserRoleLabel(item.role)}</div>
                          <div className={`mt-2 text-xs font-semibold ${item.status === 'active' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {getUserStatusLabel(item.status)}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className='space-y-6'>
                {selectedUser && (
                  <>
                    <div className='rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70'>
                      <div className='flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between'>
                        <div>
                          <div className='inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500'>
                            <UserCog className='h-4 w-4' />
                            {tt('adminPage.userDetail.badge', 'Account Detail')}
                          </div>
                          <h2 className='mt-4 text-3xl font-black text-slate-900'>{selectedUser.name}</h2>
                          <p className='mt-2 text-slate-600'>{selectedUser.email}</p>
                        </div>
                        <div className='grid gap-3 sm:grid-cols-2'>
                          <div className='rounded-[24px] bg-slate-50 px-4 py-3 text-sm text-slate-600'>
                            {tt('adminPage.userDetail.role', '角色')}：<span className='font-semibold text-slate-900'>{getUserRoleLabel(selectedUser.role)}</span>
                          </div>
                          <div className='rounded-[24px] bg-slate-50 px-4 py-3 text-sm text-slate-600'>
                            {tt('adminPage.userDetail.status', '状态')}：<span className='font-semibold text-slate-900'>{getUserStatusLabel(selectedUser.status)}</span>
                          </div>
                        </div>
                      </div>

                      <div className='mt-6 grid gap-4 sm:grid-cols-2'>
                        <button
                          type='button'
                          onClick={() => handleUserStatus(selectedUser.status === 'active' ? 'disabled' : 'active')}
                          className={`rounded-[22px] px-5 py-3 font-semibold ${
                            selectedUser.status === 'active'
                              ? 'border border-rose-200 text-rose-700'
                              : 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                          }`}
                        >
                          {selectedUser.status === 'active'
                            ? tt('adminPage.userDetail.disable', '停用账号')
                            : tt('adminPage.userDetail.enable', '重新启用')}
                        </button>
                        <div className='rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-500'>
                          {tt('adminPage.userDetail.createdAt', '创建时间')}：{new Date(selectedUser.createdAt).toLocaleString(locale)}
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handlePasswordReset} className='rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70'>
                      <div className='flex items-center gap-3'>
                        <div className='rounded-2xl bg-amber-100 p-3 text-amber-700'>
                          <KeyRound className='h-5 w-5' />
                        </div>
                        <div>
                          <div className='text-xl font-black text-slate-900'>{tt('adminPage.passwordReset.title', '重置密码')}</div>
                          <p className='mt-1 text-sm text-slate-500'>{tt('adminPage.passwordReset.description', '管理员直接设置新密码，不引入邮件链路。')}</p>
                        </div>
                      </div>
                      <div className='mt-5 flex flex-col gap-3 xl:flex-row'>
                        <input
                          type='password'
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder={tt('adminPage.passwordReset.placeholder', '输入新的临时密码（至少 8 位）')}
                          className='flex-1 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-300 focus:bg-white'
                        />
                        <button
                          type='submit'
                          className='rounded-[22px] bg-slate-900 px-5 py-3 font-semibold text-white shadow-lg shadow-slate-300'
                        >
                          {tt('adminPage.passwordReset.submit', '提交重置')}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  )
}

export default AdminPage
