import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import axiosInstance from '../utils/axiosInstance'
import { API_PATHS } from '../utils/apiPaths'
import { formatDateTime } from '../utils/career'
import { translateWithFallback } from '../utils/i18n'

const ResumeVersionManager = ({ resumeId, onRestore, highlightVersionId = '' }) => {
  const { t } = useTranslation()
  const tt = (key, fallback, options) => translateWithFallback(t, key, fallback, options)
  const [versions, setVersions] = useState([])
  const [versionName, setVersionName] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchVersions = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.RESUME.GET_VERSIONS(resumeId))
      setVersions(response.data)
    } catch (error) {
      toast.error(tt('resumeVersionManager.toasts.loadFailed', '加载版本列表失败'))
    }
  }

  useEffect(() => {
    if (resumeId) {
      fetchVersions()
    }
  }, [resumeId])

  const handleCreateVersion = async () => {
    if (!versionName.trim()) {
      toast.error(tt('resumeVersionManager.toasts.nameRequired', '请输入版本名称'))
      return
    }

    try {
      setLoading(true)
      await axiosInstance.post(API_PATHS.RESUME.CREATE_VERSION(resumeId), {
        versionName,
        note,
      })
      setVersionName('')
      setNote('')
      toast.success(tt('resumeVersionManager.toasts.created', '已保存为新版本'))
      fetchVersions()
    } catch (error) {
      toast.error(tt('resumeVersionManager.toasts.createFailed', '创建版本失败'))
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (versionId) => {
    try {
      const response = await axiosInstance.post(API_PATHS.RESUME.RESTORE_VERSION(resumeId, versionId))
      toast.success(tt('resumeVersionManager.toasts.restored', '已恢复历史版本'))
      fetchVersions()
      onRestore?.(response.data)
    } catch (error) {
      toast.error(tt('resumeVersionManager.toasts.restoreFailed', '恢复版本失败'))
    }
  }

  const handleDelete = async (versionId) => {
    try {
      await axiosInstance.delete(API_PATHS.RESUME.DELETE_VERSION(resumeId, versionId))
      toast.success(tt('resumeVersionManager.toasts.deleted', '历史版本已删除'))
      fetchVersions()
    } catch (error) {
      toast.error(tt('resumeVersionManager.toasts.deleteFailed', '删除版本失败'))
    }
  }

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <input
          value={versionName}
          onChange={(e) => setVersionName(e.target.value)}
          placeholder={tt('resumeVersionManager.placeholders.versionName', '例如：后端投递版 V1')}
          className='w-full rounded-2xl border border-slate-200 px-4 py-3'
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={tt('resumeVersionManager.placeholders.note', '版本备注（可选）')}
          className='w-full rounded-2xl border border-slate-200 px-4 py-3'
        />
      </div>

      <button
        onClick={handleCreateVersion}
        disabled={loading}
        className='px-5 py-3 rounded-2xl bg-violet-600 text-white font-semibold disabled:opacity-60'
      >
        {loading ? tt('resumeVersionManager.buttons.saving', '保存中...') : tt('resumeVersionManager.buttons.saveVersion', '保存为版本')}
      </button>

      <div className='space-y-3 max-h-[50vh] overflow-auto'>
        {versions.length === 0 && (
          <div className='rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500'>
            {tt('resumeVersionManager.empty', '还没有历史版本，先保存一个版本吧。')}
          </div>
        )}

        {versions.map((version) => (
          <div key={version._id} className={`rounded-2xl border bg-white p-4 ${
            highlightVersionId && highlightVersionId === version._id
              ? 'border-sky-300 ring-2 ring-sky-100'
              : 'border-slate-200'
          }`}>
            <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
              <div>
                <div className='font-semibold text-slate-800'>
                  {version.versionName}
                  {highlightVersionId && highlightVersionId === version._id && (
                    <span className='ml-2 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700'>
                      {tt('resumeVersionManager.currentVersion', '当前关联版本')}
                    </span>
                  )}
                </div>
                <div className='text-sm text-slate-500'>{formatDateTime(version.createdAt)}</div>
                {version.note && <div className='mt-1 text-sm text-slate-600'>{version.note}</div>}
                <div className='mt-2 flex flex-wrap gap-2 text-xs'>
                  {version.sourceType && <span className='rounded-full bg-slate-100 px-3 py-1 text-slate-700'>{tt('resumeVersionManager.source', '来源：')}{version.sourceType}</span>}
                </div>
              </div>
              <div className='flex gap-2'>
                <button onClick={() => handleRestore(version._id)} className='px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm'>
                  {tt('resumeVersionManager.buttons.restore', '恢复')}
                </button>
                <button onClick={() => handleDelete(version._id)} className='px-4 py-2 rounded-xl bg-rose-600 text-white text-sm'>
                  {tt('resumeVersionManager.buttons.delete', '删除')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ResumeVersionManager
