import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axiosInstance from '../utils/axiosInstance'
import { API_PATHS } from '../utils/apiPaths'
import RenderResume from '../components/RenderResume'

const PublicSharePage = () => {
  const { slug } = useParams()
  const [loading, setLoading] = useState(true)
  const [shareData, setShareData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadShare = async () => {
      try {
        setLoading(true)
        const response = await axiosInstance.get(API_PATHS.PUBLIC.GET_SHARE(slug))
        setShareData(response.data)
        setError('')
      } catch (loadError) {
        setError(loadError.response?.status === 404 ? '该分享页已关闭或不存在。' : '加载分享页失败，请稍后重试。')
      } finally {
        setLoading(false)
      }
    }

    loadShare()
  }, [slug])

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 px-4 py-10'>
      <div className='mx-auto max-w-6xl space-y-6'>
        <div className='rounded-3xl border border-slate-200 bg-white/90 px-6 py-5 shadow-sm backdrop-blur'>
          <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
            <div>
              <div className='text-sm font-semibold text-sky-700'>ResumeXpert 分享页</div>
              <h1 className='mt-2 text-3xl font-black text-slate-900'>
                {shareData?.title || '在线简历分享'}
              </h1>
              {shareData?.lastPublishedAt && (
                <p className='mt-2 text-sm text-slate-500'>
                  最近发布：{new Date(shareData.lastPublishedAt).toLocaleString('zh-CN')}
                </p>
              )}
            </div>
            <Link to='/' className='text-sm font-semibold text-violet-700'>
              返回首页
            </Link>
          </div>
        </div>

        {loading && (
          <div className='rounded-3xl border border-slate-200 bg-white p-10 text-slate-500 shadow-sm'>
            正在加载分享页...
          </div>
        )}

        {!loading && error && (
          <div className='rounded-3xl border border-red-200 bg-red-50 p-10 text-red-700 shadow-sm'>
            {error}
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
