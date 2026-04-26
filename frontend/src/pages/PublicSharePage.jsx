import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import axiosInstance from '../utils/axiosInstance'
import { API_PATHS } from '../utils/apiPaths'
import RenderResume from '../components/RenderResume'
import { translateWithFallback } from '../utils/i18n'

const PublicSharePage = () => {
  const { t, i18n } = useTranslation()
  const tt = (key, fallback, options) => translateWithFallback(t, key, fallback, options)
  const { slug } = useParams()
  const [loading, setLoading] = useState(true)
  const [shareData, setShareData] = useState(null)
  const [error, setError] = useState('')
  const [accessCode, setAccessCode] = useState('')

  useEffect(() => {
    const loadShare = async () => {
      try {
        setLoading(true)
        const response = await axiosInstance.get(API_PATHS.PUBLIC.GET_SHARE(slug), {
          headers: accessCode ? { 'x-share-access-code': accessCode } : {},
        })
        setShareData(response.data)
        setError('')
      } catch (loadError) {
        const status = loadError.response?.status
        const reason = loadError.response?.data?.reason
        if (status === 401 || reason === 'password_required') {
          setError(tt('publicSharePage.errors.passwordRequired', '该分享页受访问码保护，请输入访问码。'))
        } else if (status === 403 || reason === 'private') {
          setError(tt('publicSharePage.errors.private', '该分享页当前为私有状态。'))
        } else if (status === 410 || reason === 'expired') {
          setError(tt('publicSharePage.errors.expired', '该分享页已过期。'))
        } else if (status === 410 || reason === 'view_limit_reached') {
          setError(tt('publicSharePage.errors.viewLimitReached', '该分享页已达到访问次数上限。'))
        } else {
          setError(loadError.response?.status === 404
            ? tt('publicSharePage.errors.notFound', '该分享页已关闭或不存在。')
            : tt('publicSharePage.errors.loadFailed', '加载分享页失败，请稍后重试。'))
        }
      } finally {
        setLoading(false)
      }
    }

    loadShare()
  }, [slug, accessCode])

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 px-4 py-10'>
      <div className='mx-auto max-w-6xl space-y-6'>
        <div className='rounded-3xl border border-slate-200 bg-white/90 px-6 py-5 shadow-sm backdrop-blur'>
          <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
            <div>
              <div className='text-sm font-semibold text-sky-700'>{tt('publicSharePage.badge', 'ResumeXpert 分享页')}</div>
              <h1 className='mt-2 text-3xl font-black text-slate-900'>
                {shareData?.title || tt('publicSharePage.title', '在线简历分享')}
              </h1>
              {shareData?.lastPublishedAt && (
                <p className='mt-2 text-sm text-slate-500'>
                  {tt('publicSharePage.lastPublished', '最近发布：')}
                  {new Date(shareData.lastPublishedAt).toLocaleString(i18n.language === 'zh' ? 'zh-CN' : 'en-US')}
                </p>
              )}
            </div>
            <Link to='/' className='text-sm font-semibold text-violet-700'>
              {tt('publicSharePage.backHome', '返回首页')}
            </Link>
          </div>
        </div>

        {loading && (
          <div className='rounded-3xl border border-slate-200 bg-white p-10 text-slate-500 shadow-sm'>
            {tt('publicSharePage.loading', '正在加载分享页...')}
          </div>
        )}

        {!loading && error && (
          <div className='rounded-3xl border border-red-200 bg-red-50 p-10 text-red-700 shadow-sm space-y-4'>
            <div>{error}</div>
            {error.includes('访问码') && (
              <div className='max-w-sm space-y-3'>
                <input
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder={tt('publicSharePage.accessCodePlaceholder', '请输入访问码')}
                  className='w-full rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm text-slate-700'
                />
              </div>
            )}
          </div>
        )}

        {!loading && shareData?.resume && (
          <div className='rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50'>
            <RenderResume
              templateId={shareData.themeSnapshot?.theme || shareData.resume.template?.theme || '01'}
              resumeData={shareData.resume}
              containerWidth={null}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default PublicSharePage
