import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowUpRight,
  BadgeCheck,
  Clock3,
  Copy,
  Download,
  Eye,
  FileOutput,
  Globe2,
  Link2,
  LockKeyhole,
  NotebookPen,
  Radar,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import axiosInstance from '../utils/axiosInstance'
import { API_PATHS } from '../utils/apiPaths'
import { exportResumeAsPdf } from '../services/resumeExportService'
import {
  fetchResumeById,
  fetchResumeExportLogs,
  fetchResumeExportSummary,
  fetchResumes,
  fetchResumeShare,
} from '../services/queryService'
import { queryKeys } from '../lib/queryKeys'
import { translateWithFallback } from '../utils/i18n'

const RenderResume = lazy(() => import('../components/RenderResume'))

const getLocale = (language) => (language || '').startsWith('zh') ? 'zh-CN' : 'en-US'

const formatDateTime = (value, locale) => {
  if (!value) return '—'
  return new Date(value).toLocaleString(locale)
}

const buildShareUrl = (publicUrl) => {
  if (publicUrl) return publicUrl
  return ''
}

const PreviewFallback = ({ text = '正在准备输出预览...' }) => (
  <div className='rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-5'>
    <div className='mb-4 text-sm font-medium text-slate-500'>{text}</div>
    <div className='space-y-4 animate-pulse'>
      <div className='h-5 w-1/3 rounded-full bg-slate-200' />
      <div className='h-4 w-2/3 rounded-full bg-slate-200' />
      <div className='h-24 rounded-[20px] bg-slate-100' />
      <div className='h-24 rounded-[20px] bg-slate-100' />
      <div className='h-40 rounded-[20px] bg-slate-100' />
    </div>
  </div>
)

const ShareManagementPage = () => {
  const { t, i18n } = useTranslation()
  const tt = (key, fallback, options) => translateWithFallback(t, key, fallback, options)
  const locale = getLocale(i18n.language)
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedResumeId = searchParams.get('resumeId') || ''
  const [actionLoading, setActionLoading] = useState('')
  const [shareForm, setShareForm] = useState({
    visibility: 'public',
    accessCode: '',
    expiresAt: '',
    maxViewLimit: '',
    governanceNotes: '',
  })
  const exportElementRef = useRef(null)

  const resumesQuery = useQuery({
    queryKey: queryKeys.resumes,
    queryFn: fetchResumes,
    placeholderData: (previous) => previous,
  })

  const resumeQuery = useQuery({
    queryKey: queryKeys.resume(selectedResumeId),
    queryFn: () => fetchResumeById(selectedResumeId),
    enabled: Boolean(selectedResumeId),
    placeholderData: (previous) => previous,
  })

  const exportLogsQuery = useQuery({
    queryKey: queryKeys.resumeExportLogs(selectedResumeId),
    queryFn: () => fetchResumeExportLogs(selectedResumeId),
    enabled: Boolean(selectedResumeId),
    placeholderData: (previous) => previous,
  })

  const exportSummaryQuery = useQuery({
    queryKey: queryKeys.resumeExportSummary(selectedResumeId),
    queryFn: () => fetchResumeExportSummary(selectedResumeId),
    enabled: Boolean(selectedResumeId),
    placeholderData: (previous) => previous,
  })

  const shareInfoQuery = useQuery({
    queryKey: queryKeys.resumeShare(selectedResumeId),
    queryFn: () => fetchResumeShare(selectedResumeId),
    enabled: Boolean(selectedResumeId),
    placeholderData: (previous) => previous,
  })

  const resumes = resumesQuery.data || []
  const resume = resumeQuery.data || null
  const exportLogs = exportLogsQuery.data || []
  const exportSummary = exportSummaryQuery.data || null
  const shareInfo = shareInfoQuery.data || null
  const shareVisibilityCopy = useMemo(() => ({
    public: tt('shareManagementPage.share.visibilityOptions.public', '公开访问'),
    unlisted: tt('shareManagementPage.share.visibilityOptions.unlisted', '仅持链路可见'),
    password: tt('shareManagementPage.share.visibilityOptions.password', '访问码保护'),
    private: tt('shareManagementPage.share.visibilityOptions.private', '私有'),
  }), [t, i18n.language])
  const getHistoryStatusLabel = (status) => ({
    success: tt('shareManagementPage.history.status.success', '成功'),
    failed: tt('shareManagementPage.history.status.failed', '失败'),
    pending: tt('shareManagementPage.history.status.pending', '处理中'),
  }[status] || status || '—')
  const getTriggerSourceLabel = (source) => ({
    share_management: tt('shareManagementPage.history.triggerSource.shareManagement', '分享管理'),
    output_center: tt('shareManagementPage.history.triggerSource.outputCenter', '输出中心'),
  }[source] || source || '—')
  const getShareStatusLabel = () => {
    if (!shareInfo) return tt('shareManagementPage.status.notCreated', '未创建')
    return shareInfo.isEnabled
      ? tt('shareManagementPage.status.published', '已发布')
      : tt('shareManagementPage.status.closed', '已关闭')
  }
  const getSidebarLinkStatusLabel = () => {
    if (!shareInfo) return tt('shareManagementPage.preview.notGenerated', '未生成')
    return shareInfo.isEnabled
      ? tt('shareManagementPage.preview.online', '在线中')
      : tt('shareManagementPage.preview.closed', '已关闭')
  }

  useEffect(() => {
    if (resumesQuery.isError) {
      toast.error(tt('shareManagementPage.toasts.loadCenterFailed', '加载输出中心失败'))
    }
  }, [resumesQuery.isError, t, i18n.language])

  useEffect(() => {
    if (selectedResumeId && (resumeQuery.isError || exportLogsQuery.isError || exportSummaryQuery.isError || shareInfoQuery.isError)) {
      toast.error(tt('shareManagementPage.toasts.loadResumeBundleFailed', '加载简历输出信息失败'))
    }
  }, [selectedResumeId, resumeQuery.isError, exportLogsQuery.isError, exportSummaryQuery.isError, shareInfoQuery.isError, t, i18n.language])

  useEffect(() => {
    if (!shareInfo) {
      setShareForm({
        visibility: 'public',
        accessCode: '',
        expiresAt: '',
        maxViewLimit: '',
        governanceNotes: '',
      })
      return
    }

    setShareForm({
      visibility: shareInfo.visibility || 'public',
      accessCode: '',
      expiresAt: shareInfo.expiresAt ? new Date(shareInfo.expiresAt).toISOString().slice(0, 16) : '',
      maxViewLimit: shareInfo.maxViewLimit || '',
      governanceNotes: shareInfo.governanceNotes || '',
    })
  }, [shareInfo?._id, shareInfo?.visibility, shareInfo?.expiresAt, shareInfo?.maxViewLimit, shareInfo?.governanceNotes])

  const loading = resumesQuery.status === 'pending' && !resumesQuery.data
  const resumeBundleLoading = Boolean(
    selectedResumeId
    && (
      (resumeQuery.status === 'pending' && !resumeQuery.data)
      || (exportLogsQuery.status === 'pending' && !exportLogsQuery.data)
      || (exportSummaryQuery.status === 'pending' && !exportSummaryQuery.data)
      || (shareInfoQuery.status === 'pending' && shareInfoQuery.data === undefined)
    )
  )

  const selectedShareUrl = useMemo(() => buildShareUrl(shareInfo?.publicUrl), [shareInfo])
  const visibleHistoryLogs = useMemo(
    () => exportLogs.filter((log) => ['PDF', 'SHARE'].includes((log.format || '').toUpperCase())),
    [exportLogs]
  )
  const pdfHistoryCount = useMemo(
    () => visibleHistoryLogs.filter((log) => (log.format || '').toUpperCase() === 'PDF').length,
    [visibleHistoryLogs]
  )
  const visibleSuccessCount = useMemo(
    () => visibleHistoryLogs.filter((log) => log.status === 'success').length,
    [visibleHistoryLogs]
  )
  const visibleFailedCount = useMemo(
    () => visibleHistoryLogs.filter((log) => log.status === 'failed').length,
    [visibleHistoryLogs]
  )

  const refreshCurrentBundle = async () => {
    if (!selectedResumeId) return

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.resume(selectedResumeId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.resumeExportLogs(selectedResumeId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.resumeExportSummary(selectedResumeId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.resumeShare(selectedResumeId) }),
    ])
  }

  const createShareMutation = useMutation({
    mutationFn: () => axiosInstance.post(API_PATHS.RESUME.CREATE_SHARE(selectedResumeId), {
      title: resume.title,
      triggerSource: 'share_management',
      visibility: shareForm.visibility,
      accessCode: shareForm.visibility === 'password' ? shareForm.accessCode : '',
      expiresAt: shareForm.expiresAt || null,
      maxViewLimit: shareForm.maxViewLimit ? Number(shareForm.maxViewLimit) : null,
      governanceNotes: shareForm.governanceNotes,
    }),
    onSuccess: async (response) => {
      queryClient.setQueryData(queryKeys.resumeShare(selectedResumeId), response.data)
      toast.success(tt('shareManagementPage.toasts.shareCreated', '分享链接已创建'))
      await refreshCurrentBundle()
    },
    onError: () => {
      toast.error(tt('shareManagementPage.toasts.shareCreateFailed', '创建分享链接失败'))
    },
  })

  const republishMutation = useMutation({
    mutationFn: () => axiosInstance.put(API_PATHS.RESUME.UPDATE_SHARE(selectedResumeId), {
      title: resume.title,
      triggerSource: 'share_management',
      visibility: shareForm.visibility,
      accessCode: shareForm.visibility === 'password' ? shareForm.accessCode : '',
      expiresAt: shareForm.expiresAt || null,
      maxViewLimit: shareForm.maxViewLimit ? Number(shareForm.maxViewLimit) : null,
      governanceNotes: shareForm.governanceNotes,
    }),
    onSuccess: async (response) => {
      queryClient.setQueryData(queryKeys.resumeShare(selectedResumeId), response.data)
      toast.success(tt('shareManagementPage.toasts.shareRepublished', '分享页已重新发布'))
      await refreshCurrentBundle()
    },
    onError: () => {
      toast.error(tt('shareManagementPage.toasts.shareRepublishFailed', '重新发布失败'))
    },
  })

  const toggleShareMutation = useMutation({
    mutationFn: (nextEnabled) => axiosInstance.post(API_PATHS.RESUME.TOGGLE_SHARE(selectedResumeId), {
      isEnabled: nextEnabled,
      triggerSource: 'share_management',
    }),
    onSuccess: async (response, nextEnabled) => {
      queryClient.setQueryData(queryKeys.resumeShare(selectedResumeId), response.data)
      toast.success(nextEnabled
        ? tt('shareManagementPage.toasts.shareEnabled', '分享已开启')
        : tt('shareManagementPage.toasts.shareDisabled', '分享已关闭'))
      await refreshCurrentBundle()
    },
    onError: () => {
      toast.error(tt('shareManagementPage.toasts.shareToggleFailed', '切换分享状态失败'))
    },
  })

  const handleSelectResume = (resumeId) => {
    setSearchParams(resumeId ? { resumeId } : {})
  }

  const handleExportPdf = async () => {
    if (!resume || !exportElementRef.current) return

    try {
      setActionLoading('pdf')
      await exportResumeAsPdf({
        element: exportElementRef.current,
        fileName: `${resume.title.replace(/[^a-z0-9]/gi, '_')}.pdf`,
        resumeId: resume._id,
        templateId: resume.template?.theme || '01',
        triggerSource: 'output_center',
      })
      toast.success(tt('shareManagementPage.toasts.pdfExported', 'PDF 已导出'))
      await refreshCurrentBundle()
    } catch (error) {
      const detail = error?.message?.includes('clone')
        ? tt('shareManagementPage.toasts.pdfCloneFailed', '页面渲染节点准备失败，请刷新页面后重试')
        : error?.message?.includes('canvas')
          ? tt('shareManagementPage.toasts.pdfCanvasFailed', '截图渲染失败，请检查模板内容是否过长或样式是否异常')
          : tt('shareManagementPage.toasts.pdfExportFailed', '浏览器导出 PDF 失败，请稍后重试')
      toast.error(detail)
    } finally {
      setActionLoading('')
    }
  }

  const handleCreateShare = async () => {
    if (!resume) return

    try {
      setActionLoading('create-share')
      await createShareMutation.mutateAsync()
    } finally {
      setActionLoading('')
    }
  }

  const handleRepublish = async () => {
    if (!resume) return

    try {
      setActionLoading('publish')
      await republishMutation.mutateAsync()
    } finally {
      setActionLoading('')
    }
  }

  const handleToggleShare = async (nextEnabled) => {
    if (!resume) return

    try {
      setActionLoading('toggle-share')
      await toggleShareMutation.mutateAsync(nextEnabled)
    } finally {
      setActionLoading('')
    }
  }

  const handleCopyShareLink = async () => {
    if (!selectedShareUrl) return

    try {
      await navigator.clipboard.writeText(selectedShareUrl)
      toast.success(tt('shareManagementPage.toasts.shareCopied', '分享链接已复制'))
    } catch (error) {
      toast.error(tt('shareManagementPage.toasts.shareCopyFailed', '复制链接失败'))
    }
  }

  return (
    <DashboardLayout activeMenu='share'>
      <div className='space-y-6 px-4 pb-8'>
        <section className='overflow-hidden rounded-[36px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_28%),linear-gradient(135deg,#ffffff_0%,#faf5ff_42%,#f8fafc_100%)] p-8 shadow-[0_28px_80px_-52px_rgba(148,163,184,0.95)]'>
          <div className='flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between'>
            <div className='max-w-3xl'>
                <div className='inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-violet-700'>
                  <Sparkles className='h-4 w-4' />
                  {tt('shareManagementPage.hero.badge', 'Output Studio')}
                </div>
              <h1 className='mt-4 font-serif text-5xl font-black tracking-tight text-slate-900'>{tt('shareManagementPage.hero.title', '输出与分享中心')}</h1>
              <p className='mt-4 max-w-2xl text-lg leading-8 text-slate-600'>
                {tt('shareManagementPage.hero.description', '把 PDF 导出、分享发布和访问治理放进同一个控制台里。你可以在这里统一管理公开分享链接、访问统计和稳定的 PDF 输出链路。')}
              </p>
            </div>

            <div className='grid gap-3 sm:grid-cols-3'>
              <div className='rounded-[28px] border border-white/70 bg-white/80 px-5 py-4 shadow-lg shadow-violet-100/60 backdrop-blur'>
                <div className='text-xs font-semibold uppercase tracking-[0.2em] text-slate-400'>{tt('shareManagementPage.hero.stats.exports', '导出记录')}</div>
                <div className='mt-2 text-3xl font-black text-slate-900'>{exportSummary?.totalExports || 0}</div>
              </div>
              <div className='rounded-[28px] border border-white/70 bg-white/80 px-5 py-4 shadow-lg shadow-violet-100/60 backdrop-blur'>
                <div className='text-xs font-semibold uppercase tracking-[0.2em] text-slate-400'>{tt('shareManagementPage.hero.stats.views', '公开访问')}</div>
                <div className='mt-2 text-3xl font-black text-slate-900'>{shareInfo?.viewCount || 0}</div>
              </div>
              <div className='rounded-[28px] border border-white/70 bg-white/80 px-5 py-4 shadow-lg shadow-violet-100/60 backdrop-blur'>
                <div className='text-xs font-semibold uppercase tracking-[0.2em] text-slate-400'>{tt('shareManagementPage.hero.stats.governance', '治理状态')}</div>
                <div className='mt-2 text-base font-black text-slate-900'>{exportSummary?.shareGovernance?.statusReason || tt('shareManagementPage.status.notCreated', '未创建')}</div>
              </div>
            </div>
          </div>
        </section>

        <section className='rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60'>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
            <div>
              <h2 className='text-2xl font-black text-slate-900'>{tt('shareManagementPage.resumeSelector.title', '选择简历')}</h2>
              <p className='mt-2 text-sm text-slate-500'>{tt('shareManagementPage.resumeSelector.description', '先锁定一份简历，再处理导出、分享与访问治理。')}</p>
            </div>
            <Link to='/dashboard' className='inline-flex items-center gap-2 text-sm font-semibold text-violet-700'>
              {tt('shareManagementPage.resumeSelector.backLink', '返回简历中心')}
              <ArrowUpRight className='h-4 w-4' />
            </Link>
          </div>

          {loading && <div className='mt-5 text-sm text-slate-500'>{tt('shareManagementPage.resumeSelector.loading', '正在加载简历列表...')}</div>}

          {!loading && resumes.length === 0 && (
            <div className='mt-5 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500'>
              {tt('shareManagementPage.resumeSelector.empty', '还没有可输出的简历，先去创建一份简历。')}
            </div>
          )}

          {!loading && resumes.length > 0 && (
            <div className='mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3'>
              {resumes.map((item) => {
                const isActive = item._id === selectedResumeId

                return (
                  <button
                    key={item._id}
                    onClick={() => handleSelectResume(item._id)}
                    className={`group rounded-[28px] border p-5 text-left transition-all ${
                      isActive
                        ? 'border-violet-300 bg-[linear-gradient(135deg,#faf5ff_0%,#eef2ff_100%)] shadow-lg shadow-violet-100/70'
                        : 'border-slate-200 bg-slate-50/70 hover:-translate-y-0.5 hover:border-violet-200 hover:bg-white hover:shadow-lg hover:shadow-slate-200/60'
                    }`}
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <div>
                        <div className='text-lg font-bold text-slate-900'>{item.title}</div>
                        <div className='mt-2 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500'>
                          <Clock3 className='h-3.5 w-3.5' />
                          {tt('shareManagementPage.resumeSelector.updated', '最近更新')}
                        </div>
                      </div>
                      {isActive && (
                        <div className='rounded-2xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white'>
                          {tt('shareManagementPage.resumeSelector.selected', '当前选中')}
                        </div>
                      )}
                    </div>
                    <div className='mt-4 text-sm text-slate-600'>
                      {formatDateTime(item.updatedAt, locale)}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        {!selectedResumeId && (
          <div className='rounded-[32px] border border-slate-200 bg-white p-8 text-slate-500 shadow-xl shadow-slate-200/60'>
            {tt('shareManagementPage.resumeSelector.unselectedHint', '先在上方选择一份简历，分享控制台会显示导出动作、链接管理、访问统计和输出历史。')}
          </div>
        )}

        {selectedResumeId && resumeBundleLoading && (
          <div className='grid gap-6 2xl:grid-cols-[minmax(0,1.1fr)_420px]'>
            <div className='space-y-6'>
              <div className='h-48 animate-pulse rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/60' />
              <div className='h-48 animate-pulse rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/60' />
              <div className='h-96 animate-pulse rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/60' />
            </div>
            <aside className='space-y-6'>
              <div className='h-[32rem] animate-pulse rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/60' />
            </aside>
          </div>
        )}

        {selectedResumeId && resume && !resumeBundleLoading && (
          <div className='grid gap-6 2xl:grid-cols-[minmax(0,1.1fr)_420px]'>
            <div className='space-y-6'>
              <section className='grid gap-6 lg:grid-cols-3'>
                <div className='rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60'>
                  <div className='inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500'>
                    <NotebookPen className='h-4 w-4' />
                    {tt('shareManagementPage.summary.currentResume', '当前简历')}
                  </div>
                  <div className='mt-4 text-3xl font-black text-slate-900'>{resume.title}</div>
                  <div className='mt-4 space-y-2 text-sm text-slate-600'>
                    <div>{tt('shareManagementPage.summary.template', '模板')}：{resume.template?.theme || '01'}</div>
                    <div>{tt('shareManagementPage.summary.contentSource', '内容来源')}：{resume.contentSource || 'structured'}</div>
                  </div>
                  <Link to={`/resume/${resume._id}`} className='mt-5 inline-flex items-center gap-2 text-sm font-semibold text-violet-700'>
                    {tt('shareManagementPage.summary.goToEdit', '前往编辑')}
                    <ArrowUpRight className='h-4 w-4' />
                  </Link>
                </div>

                <div className='rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60'>
                  <div className='inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700'>
                    <BadgeCheck className='h-4 w-4' />
                    {tt('shareManagementPage.share.title', '分享状态')}
                  </div>
                  <div className='mt-4 text-3xl font-black text-slate-900'>
                    {getShareStatusLabel()}
                  </div>
                  <div className='mt-4 space-y-2 text-sm text-slate-600'>
                    <div>{tt('shareManagementPage.share.lastPublished', '最后发布')}：{formatDateTime(shareInfo?.lastPublishedAt, locale)}</div>
                    <div>{tt('shareManagementPage.share.lastViewed', '最后访问')}：{formatDateTime(shareInfo?.lastViewedAt, locale)}</div>
                    <div>{tt('shareManagementPage.share.governanceStatus', '治理状态')}：{exportSummary?.shareGovernance?.statusReason || '—'}</div>
                  </div>
                </div>

                <div className='rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60'>
                  <div className='inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700'>
                    <Radar className='h-4 w-4' />
                    {tt('shareManagementPage.summary.visitStats', '访问统计')}
                  </div>
                  <div className='mt-4 grid gap-4'>
                    <div>
                      <div className='text-3xl font-black text-slate-900'>{shareInfo?.viewCount || 0}</div>
                      <div className='mt-1 text-sm text-slate-500'>{tt('shareManagementPage.summary.viewCount', '累计浏览量')}</div>
                    </div>
                    <div>
                      <div className='text-2xl font-black text-slate-900'>{shareInfo?.uniqueVisitorCount || 0}</div>
                      <div className='mt-1 text-sm text-slate-500'>{tt('shareManagementPage.summary.uniqueVisitors', '唯一访客数')}</div>
                    </div>
                    <div>
                      <div className='text-2xl font-black text-slate-900'>{shareInfo?.deniedAccessCount || 0}</div>
                      <div className='mt-1 text-sm text-slate-500'>{tt('shareManagementPage.summary.deniedAccess', '拒绝访问次数')}</div>
                    </div>
                  </div>
                </div>
              </section>

              <section className='rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60'>
                <div className='flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between'>
                  <div>
                    <div className='inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-violet-700'>
                      <Download className='h-4 w-4' />
                      {tt('shareManagementPage.export.badge', '导出操作')}
                    </div>
                    <h2 className='mt-4 text-2xl font-black text-slate-900'>{tt('shareManagementPage.export.title', '一键输出当前简历')}</h2>
                    <p className='mt-2 text-sm text-slate-500'>{tt('shareManagementPage.export.description', '当前输出中心只保留 PDF 导出，保证最稳定、最直接的交付链路。')}</p>
                  </div>
                  <div className='rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600'>
                    {tt('shareManagementPage.export.currentTemplate', '当前模板')}：<span className='font-semibold text-slate-900'>{resume.template?.theme || '01'}</span>
                  </div>
                </div>

                <div className='mt-6 max-w-xl'>
                  <button
                    onClick={handleExportPdf}
                    disabled={actionLoading === 'pdf'}
                    className='inline-flex w-full items-center justify-center gap-2 rounded-[22px] bg-slate-900 px-5 py-4 font-semibold text-white shadow-lg shadow-slate-300 disabled:opacity-60'
                  >
                    <FileOutput className='h-4 w-4' />
                    {actionLoading === 'pdf'
                      ? tt('shareManagementPage.export.exporting', '导出中...')
                      : tt('shareManagementPage.export.exportPdf', '导出 PDF')}
                  </button>
                </div>
              </section>

              <section className='rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60'>
                <div className='flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between'>
                  <div>
                    <div className='inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700'>
                      <Link2 className='h-4 w-4' />
                      {tt('shareManagementPage.share.managementBadge', '分享管理')}
                    </div>
                    <h2 className='mt-4 text-2xl font-black text-slate-900'>{tt('shareManagementPage.share.managementTitle', '控制公开链接与访问规则')}</h2>
                    <p className='mt-2 text-sm text-slate-500'>{tt('shareManagementPage.share.managementDescription', '链接状态、访问限制和治理备注都在同一个发布面板里完成。')}</p>
                  </div>
                  <div className='rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600'>
                    {tt('shareManagementPage.share.currentVisibility', '当前可见性')}：<span className='font-semibold text-slate-900'>{shareVisibilityCopy[shareForm.visibility]}</span>
                  </div>
                </div>

                <div className='mt-6 rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#faf5ff_0%,#ffffff_100%)] p-5'>
                  <div className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-400'>{tt('shareManagementPage.share.publicLink', '公开链接')}</div>
                  <div className='mt-3 break-all text-base font-semibold text-slate-700'>
                    {selectedShareUrl || tt('shareManagementPage.share.publicLinkEmpty', '当前还没有分享链接，点击下方按钮创建。')}
                  </div>
                </div>

                <div className='mt-5 grid gap-3 md:grid-cols-2'>
                  <label className='text-sm font-semibold text-slate-700'>
                    {tt('shareManagementPage.share.fields.visibility', '可见性')}
                    <select
                      value={shareForm.visibility}
                      onChange={(e) => setShareForm((prev) => ({ ...prev, visibility: e.target.value }))}
                      className='mt-2 w-full rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-normal outline-none transition focus:border-violet-300 focus:bg-white'
                    >
                      <option value='public'>{tt('shareManagementPage.share.visibilityOptions.publicShort', '公开')}</option>
                      <option value='unlisted'>{tt('shareManagementPage.share.visibilityOptions.unlisted', '仅持链路可见')}</option>
                      <option value='password'>{tt('shareManagementPage.share.visibilityOptions.password', '访问码保护')}</option>
                      <option value='private'>{tt('shareManagementPage.share.visibilityOptions.private', '私有')}</option>
                    </select>
                  </label>
                  <label className='text-sm font-semibold text-slate-700'>
                    {tt('shareManagementPage.share.fields.expiresAt', '到期时间')}
                    <input
                      type='datetime-local'
                      value={shareForm.expiresAt}
                      onChange={(e) => setShareForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
                      className='mt-2 w-full rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-normal outline-none transition focus:border-violet-300 focus:bg-white'
                    />
                  </label>
                  <label className='text-sm font-semibold text-slate-700'>
                    {tt('shareManagementPage.share.fields.maxViewLimit', '最大访问次数')}
                    <input
                      value={shareForm.maxViewLimit}
                      onChange={(e) => setShareForm((prev) => ({ ...prev, maxViewLimit: e.target.value }))}
                      className='mt-2 w-full rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-normal outline-none transition focus:border-violet-300 focus:bg-white'
                      placeholder={tt('shareManagementPage.share.placeholders.maxViewLimit', '最大访问次数')}
                    />
                  </label>
                  {shareForm.visibility === 'password' && (
                    <label className='text-sm font-semibold text-slate-700'>
                      {tt('shareManagementPage.share.fields.accessCode', '访问码')}
                      <input
                        value={shareForm.accessCode}
                        onChange={(e) => setShareForm((prev) => ({ ...prev, accessCode: e.target.value }))}
                        className='mt-2 w-full rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-normal outline-none transition focus:border-violet-300 focus:bg-white'
                        placeholder={tt('shareManagementPage.share.placeholders.accessCode', '访问码')}
                      />
                    </label>
                  )}
                </div>

                <label className='mt-3 block text-sm font-semibold text-slate-700'>
                  {tt('shareManagementPage.share.fields.governanceNotes', '治理备注')}
                  <textarea
                    value={shareForm.governanceNotes}
                    onChange={(e) => setShareForm((prev) => ({ ...prev, governanceNotes: e.target.value }))}
                    rows={3}
                    placeholder={tt('shareManagementPage.share.placeholders.governanceNotes', '治理备注，例如：仅限本周投递使用')}
                    className='mt-2 w-full rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-normal outline-none transition focus:border-violet-300 focus:bg-white'
                  />
                </label>

                {shareInfo?.lastPublishedAt && (
                  <div className='mt-4 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800'>
                    {tt('shareManagementPage.share.governanceHint', '当前公开页展示的是最近一次“重新发布”时的快照。如果你刚修改了简历内容，需要再次点击“重新发布”才会更新公开页。')}
                  </div>
                )}

                <div className='mt-5 flex flex-wrap gap-3'>
                  {!shareInfo && (
                    <button
                      onClick={handleCreateShare}
                      disabled={actionLoading === 'create-share'}
                      className='inline-flex items-center justify-center gap-2 rounded-[22px] bg-sky-600 px-5 py-3 font-semibold text-white shadow-lg shadow-sky-200 disabled:opacity-60'
                    >
                      <Globe2 className='h-4 w-4' />
                      {actionLoading === 'create-share'
                        ? tt('shareManagementPage.share.actions.creating', '创建中...')
                        : tt('shareManagementPage.share.actions.createShare', '创建分享链接')}
                    </button>
                  )}

                  {shareInfo && (
                    <>
                      <button
                        onClick={handleCopyShareLink}
                        className='inline-flex items-center justify-center gap-2 rounded-[22px] border border-slate-200 px-5 py-3 font-semibold text-slate-700'
                      >
                        <Copy className='h-4 w-4' />
                        {tt('shareManagementPage.share.actions.copyShareLink', '复制分享链接')}
                      </button>
                      <button
                        onClick={handleRepublish}
                        disabled={actionLoading === 'publish'}
                        className='inline-flex items-center justify-center gap-2 rounded-[22px] border border-sky-200 px-5 py-3 font-semibold text-sky-700 disabled:opacity-60'
                      >
                        <Globe2 className='h-4 w-4' />
                        {actionLoading === 'publish'
                          ? tt('shareManagementPage.share.actions.publishing', '发布中...')
                          : tt('shareManagementPage.share.actions.republish', '重新发布')}
                      </button>
                      <button
                        onClick={() => handleToggleShare(!shareInfo.isEnabled)}
                        disabled={actionLoading === 'toggle-share'}
                        className={`inline-flex items-center justify-center gap-2 rounded-[22px] px-5 py-3 font-semibold disabled:opacity-60 ${
                          shareInfo.isEnabled
                            ? 'border border-red-200 text-red-700'
                            : 'border border-emerald-200 text-emerald-700'
                        }`}
                      >
                        {shareInfo.isEnabled ? <LockKeyhole className='h-4 w-4' /> : <ShieldCheck className='h-4 w-4' />}
                        {actionLoading === 'toggle-share'
                          ? tt('shareManagementPage.share.actions.processing', '处理中...')
                          : shareInfo.isEnabled
                            ? tt('shareManagementPage.share.actions.disableShare', '关闭分享')
                            : tt('shareManagementPage.share.actions.enableShare', '重新开启分享')}
                      </button>
                      {shareInfo.slug && (
                        <a
                          href={`/s/${shareInfo.slug}`}
                          target='_blank'
                          rel='noreferrer'
                          className='inline-flex items-center justify-center gap-2 rounded-[22px] border border-violet-200 px-5 py-3 font-semibold text-violet-700'
                        >
                          <ArrowUpRight className='h-4 w-4' />
                          {tt('shareManagementPage.share.actions.openPublicPage', '打开公开页')}
                        </a>
                      )}
                    </>
                  )}
                </div>
              </section>

              <section className='rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60'>
                <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
                  <div>
                    <h2 className='text-2xl font-black text-slate-900'>{tt('shareManagementPage.history.title', '导出历史')}</h2>
                    <p className='mt-2 text-sm text-slate-500'>{tt('shareManagementPage.history.description', '把文档导出和分享发布记录串起来，方便回看每一次输出动作。')}</p>
                  </div>
                  <span className='rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-500'>
                    {tt('shareManagementPage.history.recordCount', '{{count}} 条记录', { count: visibleHistoryLogs.length })}
                  </span>
                </div>

                {visibleHistoryLogs.length > 0 && (
                  <div className='mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
                    <div className='rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700'>
                      {tt('shareManagementPage.history.summary.total', '总记录')}：{visibleHistoryLogs.length}
                    </div>
                    <div className='rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700'>
                      {tt('shareManagementPage.history.summary.success', '成功')}：{visibleSuccessCount}
                    </div>
                    <div className='rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700'>
                      {tt('shareManagementPage.history.summary.failed', '失败')}：{visibleFailedCount}
                    </div>
                    <div className='rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700'>
                      PDF {pdfHistoryCount}
                    </div>
                  </div>
                )}

                {visibleHistoryLogs.length === 0 && (
                  <div className='mt-5 rounded-[24px] border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500'>
                    {tt('shareManagementPage.history.empty', '还没有 PDF 导出或分享发布记录。')}
                  </div>
                )}

                {visibleHistoryLogs.length > 0 && (
                  <div className='mt-5 overflow-x-auto rounded-[26px] border border-slate-200'>
                    <table className='w-full min-w-[720px] text-left text-sm'>
                      <thead className='bg-slate-50 text-slate-500'>
                        <tr>
                          <th className='px-4 py-4 font-semibold'>{tt('shareManagementPage.history.table.format', '格式')}</th>
                          <th className='px-4 py-4 font-semibold'>{tt('shareManagementPage.history.table.status', '状态')}</th>
                          <th className='px-4 py-4 font-semibold'>{tt('shareManagementPage.history.table.template', '模板')}</th>
                          <th className='px-4 py-4 font-semibold'>{tt('shareManagementPage.history.table.source', '来源')}</th>
                          <th className='px-4 py-4 font-semibold'>{tt('shareManagementPage.history.table.fileOrAction', '文件 / 动作')}</th>
                          <th className='px-4 py-4 font-semibold'>{tt('shareManagementPage.history.table.error', '错误信息')}</th>
                          <th className='px-4 py-4 font-semibold'>{tt('shareManagementPage.history.table.time', '时间')}</th>
                        </tr>
                      </thead>
                      <tbody className='text-slate-700'>
                        {visibleHistoryLogs.map((log) => (
                          <tr key={log._id} className='border-t border-slate-100 bg-white'>
                            <td className='px-4 py-4 uppercase'>{log.format}</td>
                            <td className='px-4 py-4'>
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                log.status === 'success'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : log.status === 'failed'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-slate-100 text-slate-700'
                              }`}>
                                {getHistoryStatusLabel(log.status)}
                              </span>
                            </td>
                            <td className='px-4 py-4'>{log.templateId || '—'}</td>
                            <td className='px-4 py-4'>{getTriggerSourceLabel(log.metadata?.triggerSource)}</td>
                            <td className='px-4 py-4'>
                              {log.metadata?.fileName || log.metadata?.action || log.metadata?.errorMessage || '—'}
                            </td>
                            <td className='px-4 py-4'>{log.metadata?.errorMessage || '—'}</td>
                            <td className='px-4 py-4'>{formatDateTime(log.createdAt, locale)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>

            <aside className='space-y-6'>
              <div className='sticky top-28 space-y-6'>
                <section className='rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <h2 className='text-2xl font-black text-slate-900'>{tt('shareManagementPage.preview.title', '输出预览')}</h2>
                      <p className='mt-2 text-sm text-slate-500'>{tt('shareManagementPage.preview.description', 'PDF 和公开分享页都会复用同一份渲染结果。')}</p>
                    </div>
                    <div className='rounded-2xl bg-slate-100 p-3 text-slate-600'>
                      <Eye className='h-5 w-5' />
                    </div>
                  </div>
                  <div className='mt-6 overflow-hidden rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)]'>
                    <div className='origin-top scale-[0.6] p-4'>
                      <Suspense fallback={<PreviewFallback text={tt('shareManagementPage.preview.loading', '正在准备输出预览...')} />}>
                        <RenderResume
                          templateId={resume.template?.theme || '01'}
                          resumeData={resume}
                          containerWidth={null}
                        />
                      </Suspense>
                    </div>
                  </div>
                </section>

                <section className='rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60'>
                  <div className='text-sm font-semibold uppercase tracking-[0.2em] text-slate-400'>{tt('shareManagementPage.preview.summary', '分享摘要')}</div>
                  <div className='mt-4 space-y-4'>
                    <div className='rounded-[24px] bg-slate-50 px-4 py-4 text-sm text-slate-600'>
                      <div className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-400'>{tt('shareManagementPage.preview.linkStatus', '链接状态')}</div>
                      <div className='mt-2 text-lg font-black text-slate-900'>
                        {getSidebarLinkStatusLabel()}
                      </div>
                    </div>
                    <div className='rounded-[24px] bg-slate-50 px-4 py-4 text-sm text-slate-600'>
                      <div className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-400'>{tt('shareManagementPage.preview.visibility', '可见性')}</div>
                      <div className='mt-2 text-lg font-black text-slate-900'>{shareVisibilityCopy[shareForm.visibility]}</div>
                    </div>
                    <div className='rounded-[24px] bg-slate-50 px-4 py-4 text-sm text-slate-600'>
                      <div className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-400'>{tt('shareManagementPage.preview.lastPublished', '最后发布')}</div>
                      <div className='mt-2 text-base font-semibold text-slate-900'>{formatDateTime(shareInfo?.lastPublishedAt, locale)}</div>
                    </div>
                  </div>
                </section>
              </div>
            </aside>
          </div>
        )}
        <div className='pointer-events-none absolute -left-[9999px] top-0 opacity-0'>
          {resume && (
            <div ref={exportElementRef}>
              <Suspense fallback={<PreviewFallback text={tt('shareManagementPage.preview.exportLoading', '正在准备导出画布...')} />}>
                <RenderResume
                  templateId={resume.template?.theme || '01'}
                  resumeData={resume}
                  containerWidth={null}
                />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ShareManagementPage
