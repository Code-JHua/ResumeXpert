import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import DashboardLayout from '../components/DashboardLayout'
import axiosInstance from '../utils/axiosInstance'
import { API_PATHS } from '../utils/apiPaths'
import { exportResumeAsMarkdown, exportResumeAsPdf } from '../services/resumeExportService'
import RenderResume from '../components/RenderResume'

const formatDateTime = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('zh-CN')
}

const buildShareUrl = (publicUrl) => {
  if (publicUrl) return publicUrl
  return ''
}

const ShareManagementPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedResumeId = searchParams.get('resumeId') || ''
  const [loading, setLoading] = useState(true)
  const [resumeLoading, setResumeLoading] = useState(false)
  const [resumes, setResumes] = useState([])
  const [resume, setResume] = useState(null)
  const [exportLogs, setExportLogs] = useState([])
  const [shareInfo, setShareInfo] = useState(null)
  const [actionLoading, setActionLoading] = useState('')
  const exportElementRef = useRef(null)

  const loadResumes = async () => {
    const response = await axiosInstance.get(API_PATHS.RESUME.GET_ALL)
    setResumes(response.data || [])
  }

  const loadResumeBundle = async (resumeId) => {
    if (!resumeId) {
      setResume(null)
      setExportLogs([])
      setShareInfo(null)
      return
    }

    setResumeLoading(true)
    try {
      const [resumeResponse, exportLogsResponse] = await Promise.all([
        axiosInstance.get(API_PATHS.RESUME.GET_BY_ID(resumeId)),
        axiosInstance.get(API_PATHS.RESUME.GET_EXPORT_LOGS(resumeId)),
      ])

      setResume(resumeResponse.data)
      setExportLogs(exportLogsResponse.data || [])

      try {
        const shareResponse = await axiosInstance.get(API_PATHS.RESUME.GET_SHARE(resumeId))
        setShareInfo(shareResponse.data)
      } catch (error) {
        if (error.response?.status === 404) {
          setShareInfo(null)
        } else {
          throw error
        }
      }
    } finally {
      setResumeLoading(false)
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        await loadResumes()
      } catch (error) {
        toast.error('加载输出中心失败')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  useEffect(() => {
    loadResumeBundle(selectedResumeId).catch(() => {
      toast.error('加载简历输出信息失败')
    })
  }, [selectedResumeId])

  const selectedShareUrl = useMemo(() => buildShareUrl(shareInfo?.publicUrl), [shareInfo])

  const handleSelectResume = (resumeId) => {
    setSearchParams(resumeId ? { resumeId } : {})
  }

  const refreshCurrentBundle = async () => {
    await loadResumeBundle(selectedResumeId)
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
      toast.success('PDF 已导出')
      await refreshCurrentBundle()
    } catch (error) {
      toast.error('导出 PDF 失败')
    } finally {
      setActionLoading('')
    }
  }

  const handleExportMarkdown = async () => {
    if (!resume) return

    try {
      setActionLoading('markdown')
      const response = await exportResumeAsMarkdown({
        resumeId: resume._id,
        fileName: `${resume.title.replace(/[^a-z0-9]/gi, '_')}.md`,
        triggerSource: 'output_center',
      })

      if (response.status === 'not_ready') {
        toast.error('Markdown 尚未准备好，请先进入 Markdown 页面同步')
        return
      }

      toast.success('Markdown 已导出')
      await refreshCurrentBundle()
    } catch (error) {
      toast.error('导出 Markdown 失败')
    } finally {
      setActionLoading('')
    }
  }

  const handleCreateShare = async () => {
    if (!resume) return

    try {
      setActionLoading('create-share')
      const response = await axiosInstance.post(API_PATHS.RESUME.CREATE_SHARE(resume._id), {
        title: resume.title,
        triggerSource: 'share_management',
      })
      setShareInfo(response.data)
      toast.success('分享链接已创建')
      await refreshCurrentBundle()
    } catch (error) {
      toast.error('创建分享链接失败')
    } finally {
      setActionLoading('')
    }
  }

  const handleRepublish = async () => {
    if (!resume) return

    try {
      setActionLoading('publish')
      const response = await axiosInstance.put(API_PATHS.RESUME.UPDATE_SHARE(resume._id), {
        title: resume.title,
        triggerSource: 'share_management',
      })
      setShareInfo(response.data)
      toast.success('分享页已重新发布')
      await refreshCurrentBundle()
    } catch (error) {
      toast.error('重新发布失败')
    } finally {
      setActionLoading('')
    }
  }

  const handleToggleShare = async (nextEnabled) => {
    if (!resume) return

    try {
      setActionLoading('toggle-share')
      const response = await axiosInstance.post(API_PATHS.RESUME.TOGGLE_SHARE(resume._id), {
        isEnabled: nextEnabled,
        triggerSource: 'share_management',
      })
      setShareInfo(response.data)
      toast.success(nextEnabled ? '分享已开启' : '分享已关闭')
      await refreshCurrentBundle()
    } catch (error) {
      toast.error('切换分享状态失败')
    } finally {
      setActionLoading('')
    }
  }

  const handleCopyShareLink = async () => {
    if (!selectedShareUrl) return

    try {
      await navigator.clipboard.writeText(selectedShareUrl)
      toast.success('分享链接已复制')
    } catch (error) {
      toast.error('复制链接失败')
    }
  }

  return (
    <DashboardLayout activeMenu='share'>
      <div className='space-y-6 px-4'>
        <div className='rounded-3xl bg-white p-8 border border-slate-200 shadow-sm'>
          <h1 className='text-3xl font-black text-slate-900'>输出与分享中心</h1>
          <p className='mt-3 text-slate-600'>
            统一管理 PDF、Markdown 导出，以及公开分享链接和访问统计。
          </p>
        </div>

        <div className='grid grid-cols-1 gap-6 xl:grid-cols-[300px_minmax(0,1fr)]'>
          <div className='rounded-3xl bg-white p-5 border border-slate-200 shadow-sm'>
            <div className='flex items-center justify-between'>
              <h2 className='text-xl font-bold text-slate-900'>选择简历</h2>
              <Link to='/dashboard' className='text-sm font-semibold text-violet-700'>返回简历中心</Link>
            </div>

            {loading && <div className='mt-4 text-sm text-slate-500'>正在加载简历列表...</div>}

            {!loading && resumes.length === 0 && (
              <div className='mt-4 rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500'>
                还没有可输出的简历，先去创建或导入一份简历。
              </div>
            )}

            {!loading && resumes.length > 0 && (
              <div className='mt-4 space-y-3'>
                {resumes.map((item) => {
                  const isActive = item._id === selectedResumeId

                  return (
                    <button
                      key={item._id}
                      onClick={() => handleSelectResume(item._id)}
                      className={`w-full rounded-2xl border px-4 py-4 text-left transition-colors ${
                        isActive
                          ? 'border-violet-300 bg-violet-50'
                          : 'border-slate-200 bg-white hover:border-violet-200'
                      }`}
                    >
                      <div className='font-semibold text-slate-900'>{item.title}</div>
                      <div className='mt-2 text-xs text-slate-500'>
                        最近更新：{formatDateTime(item.updatedAt)}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className='space-y-6'>
            {!selectedResumeId && (
              <div className='rounded-3xl bg-white p-8 border border-slate-200 shadow-sm text-slate-500'>
                先在左侧选择一份简历，输出中心会显示导出操作、分享状态和历史记录。
              </div>
            )}

            {selectedResumeId && resumeLoading && (
              <div className='rounded-3xl bg-white p-8 border border-slate-200 shadow-sm text-slate-500'>
                正在加载当前简历的输出信息...
              </div>
            )}

            {selectedResumeId && resume && !resumeLoading && (
              <>
                <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
                  <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
                    <div className='text-sm font-semibold text-slate-500'>当前简历</div>
                    <div className='mt-3 text-2xl font-black text-slate-900'>{resume.title}</div>
                    <div className='mt-3 text-sm text-slate-600'>模板：{resume.template?.theme || '01'}</div>
                    <div className='mt-2 text-sm text-slate-600'>内容来源：{resume.contentSource || 'structured'}</div>
                    <div className='mt-4'>
                      <Link to={`/resume/${resume._id}`} className='text-sm font-semibold text-violet-700'>
                        前往编辑
                      </Link>
                    </div>
                  </div>

                  <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
                    <div className='text-sm font-semibold text-slate-500'>分享状态</div>
                    <div className='mt-3 text-2xl font-black text-slate-900'>
                      {shareInfo ? (shareInfo.isEnabled ? '已发布' : '已关闭') : '未创建'}
                    </div>
                    <div className='mt-3 text-sm text-slate-600'>最后发布：{formatDateTime(shareInfo?.lastPublishedAt)}</div>
                    <div className='mt-2 text-sm text-slate-600'>最后访问：{formatDateTime(shareInfo?.lastViewedAt)}</div>
                  </div>

                  <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
                    <div className='text-sm font-semibold text-slate-500'>访问统计</div>
                    <div className='mt-3 text-2xl font-black text-slate-900'>{shareInfo?.viewCount || 0}</div>
                    <div className='mt-2 text-sm text-slate-600'>累计浏览量</div>
                    <div className='mt-4 text-xl font-black text-slate-900'>{shareInfo?.uniqueVisitorCount || 0}</div>
                    <div className='mt-2 text-sm text-slate-600'>唯一访客数</div>
                  </div>
                </div>

                <div className='grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_380px]'>
                  <div className='space-y-6'>
                    <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
                      <h2 className='text-xl font-bold text-slate-900'>导出操作</h2>
                      <div className='mt-5 flex flex-wrap gap-3'>
                        <button
                          onClick={handleExportPdf}
                          disabled={actionLoading === 'pdf'}
                          className='rounded-2xl bg-violet-600 px-5 py-3 font-semibold text-white disabled:opacity-60'
                        >
                          {actionLoading === 'pdf' ? '导出中...' : '导出 PDF'}
                        </button>
                        <button
                          onClick={handleExportMarkdown}
                          disabled={actionLoading === 'markdown'}
                          className='rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 disabled:opacity-60'
                        >
                          {actionLoading === 'markdown' ? '导出中...' : '导出 Markdown'}
                        </button>
                        <Link to={`/resume/${resume._id}/markdown`} className='rounded-2xl border border-emerald-200 px-5 py-3 font-semibold text-emerald-700'>
                          进入 Markdown 模式
                        </Link>
                      </div>
                    </div>

                    <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
                      <h2 className='text-xl font-bold text-slate-900'>分享管理</h2>
                      <div className='mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600 break-all'>
                        {selectedShareUrl || '当前还没有分享链接，点击下方按钮创建。'}
                      </div>
                      <div className='mt-5 flex flex-wrap gap-3'>
                        {!shareInfo && (
                          <button
                            onClick={handleCreateShare}
                            disabled={actionLoading === 'create-share'}
                            className='rounded-2xl bg-sky-600 px-5 py-3 font-semibold text-white disabled:opacity-60'
                          >
                            {actionLoading === 'create-share' ? '创建中...' : '创建分享链接'}
                          </button>
                        )}

                        {shareInfo && (
                          <>
                            <button
                              onClick={handleCopyShareLink}
                              className='rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700'
                            >
                              复制分享链接
                            </button>
                            <button
                              onClick={handleRepublish}
                              disabled={actionLoading === 'publish'}
                              className='rounded-2xl border border-sky-200 px-5 py-3 font-semibold text-sky-700 disabled:opacity-60'
                            >
                              {actionLoading === 'publish' ? '发布中...' : '重新发布'}
                            </button>
                            <button
                              onClick={() => handleToggleShare(!shareInfo.isEnabled)}
                              disabled={actionLoading === 'toggle-share'}
                              className={`rounded-2xl px-5 py-3 font-semibold disabled:opacity-60 ${
                                shareInfo.isEnabled
                                  ? 'border border-red-200 text-red-700'
                                  : 'border border-emerald-200 text-emerald-700'
                              }`}
                            >
                              {actionLoading === 'toggle-share'
                                ? '处理中...'
                                : shareInfo.isEnabled
                                  ? '关闭分享'
                                  : '重新开启分享'}
                            </button>
                            {shareInfo.slug && (
                              <a
                                href={`/s/${shareInfo.slug}`}
                                target='_blank'
                                rel='noreferrer'
                                className='rounded-2xl border border-violet-200 px-5 py-3 font-semibold text-violet-700'
                              >
                                打开公开页
                              </a>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
                      <div className='flex items-center justify-between'>
                        <h2 className='text-xl font-bold text-slate-900'>导出历史</h2>
                        <span className='text-sm text-slate-500'>{exportLogs.length} 条记录</span>
                      </div>

                      {exportLogs.length === 0 && (
                        <div className='mt-4 rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500'>
                          还没有输出记录，先执行一次导出或分享操作。
                        </div>
                      )}

                      {exportLogs.length > 0 && (
                        <div className='mt-4 overflow-x-auto'>
                          <table className='w-full min-w-[720px] text-left text-sm'>
                            <thead className='text-slate-500'>
                              <tr>
                                <th className='pb-3 font-semibold'>格式</th>
                                <th className='pb-3 font-semibold'>状态</th>
                                <th className='pb-3 font-semibold'>来源</th>
                                <th className='pb-3 font-semibold'>文件 / 动作</th>
                                <th className='pb-3 font-semibold'>时间</th>
                              </tr>
                            </thead>
                            <tbody className='text-slate-700'>
                              {exportLogs.map((log) => (
                                <tr key={log._id} className='border-t border-slate-100'>
                                  <td className='py-3 uppercase'>{log.format}</td>
                                  <td className='py-3'>
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                      log.status === 'success'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : log.status === 'failed'
                                          ? 'bg-red-100 text-red-700'
                                          : 'bg-slate-100 text-slate-700'
                                    }`}>
                                      {log.status}
                                    </span>
                                  </td>
                                  <td className='py-3'>{log.metadata?.triggerSource || '—'}</td>
                                  <td className='py-3'>
                                    {log.metadata?.fileName || log.metadata?.action || log.metadata?.errorMessage || '—'}
                                  </td>
                                  <td className='py-3'>{formatDateTime(log.createdAt)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
                    <h2 className='text-xl font-bold text-slate-900'>输出预览</h2>
                    <p className='mt-2 text-sm text-slate-500'>PDF 和公开分享页都会复用同一份渲染结果。</p>
                    <div className='mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50'>
                      <div className='origin-top scale-[0.6] p-4'>
                        <RenderResume
                          templateId={resume.template?.theme || '01'}
                          resumeData={resume}
                          containerWidth={null}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className='pointer-events-none absolute -left-[9999px] top-0 opacity-0'>
        {resume && (
          <div ref={exportElementRef}>
            <RenderResume
              templateId={resume.template?.theme || '01'}
              resumeData={resume}
              containerWidth={null}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default ShareManagementPage
