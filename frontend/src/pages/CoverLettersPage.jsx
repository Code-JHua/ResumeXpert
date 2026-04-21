import React, { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import axiosInstance from '../utils/axiosInstance'
import { API_PATHS } from '../utils/apiPaths'
import toast from 'react-hot-toast'
import { formatDateTime } from '../utils/career'

const CoverLettersPage = () => {
  const [searchParams] = useSearchParams()
  const [coverLetters, setCoverLetters] = useState([])
  const [resumes, setResumes] = useState([])
  const [jobs, setJobs] = useState([])
  const [selectedResumeId, setSelectedResumeId] = useState(searchParams.get('resumeId') || '')
  const [selectedResumeVersionId, setSelectedResumeVersionId] = useState(searchParams.get('resumeVersionId') || '')
  const [selectedJobId, setSelectedJobId] = useState(searchParams.get('jobDescriptionId') || '')
  const [sourceAnalysisId, setSourceAnalysisId] = useState(searchParams.get('sourceAnalysisId') || '')
  const [activeLetter, setActiveLetter] = useState(null)
  const [loading, setLoading] = useState(false)

  const selectedResume = useMemo(() => resumes.find((item) => item._id === selectedResumeId), [resumes, selectedResumeId])
  const selectedJob = useMemo(() => jobs.find((item) => item._id === selectedJobId), [jobs, selectedJobId])

  const fetchData = async () => {
    try {
      const [lettersResponse, resumeResponse, jobsResponse] = await Promise.all([
        axiosInstance.get(API_PATHS.COVER_LETTERS.GET_ALL),
        axiosInstance.get(API_PATHS.RESUME.GET_ALL),
        axiosInstance.get(API_PATHS.JOBS.GET_ALL),
      ])
      setCoverLetters(lettersResponse.data)
      setResumes(resumeResponse.data)
      setJobs(jobsResponse.data)
      if (!selectedResumeId && resumeResponse.data[0]) setSelectedResumeId(resumeResponse.data[0]._id)
      const requestedLetterId = searchParams.get('coverLetterId')
      if (requestedLetterId) {
        const requestedLetter = lettersResponse.data.find((item) => item._id === requestedLetterId)
        if (requestedLetter) {
          setActiveLetter(requestedLetter)
          return
        }
      }
      if (!activeLetter && lettersResponse.data[0]) setActiveLetter(lettersResponse.data[0])
    } catch (error) {
      toast.error('加载求职信数据失败')
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleGenerate = async () => {
    if (!selectedResumeId) {
      toast.error('请先选择简历')
      return
    }

    try {
      setLoading(true)
      const response = await axiosInstance.post(API_PATHS.COVER_LETTERS.GENERATE, {
        resumeId: selectedResumeId,
        resumeVersionId: selectedResumeVersionId || null,
        jobDescriptionId: selectedJobId || null,
        sourceAnalysisId: sourceAnalysisId || null,
      })
      toast.success('求职信已生成')
      setActiveLetter(response.data)
      fetchData()
    } catch (error) {
      toast.error('生成求职信失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!activeLetter) return
    try {
      const response = await axiosInstance.put(API_PATHS.COVER_LETTERS.UPDATE(activeLetter._id), {
        title: activeLetter.title,
        content: activeLetter.content,
        resumeId: activeLetter.resumeId?._id || activeLetter.resumeId || null,
        resumeVersionId: activeLetter.resumeVersionId?._id || activeLetter.resumeVersionId || null,
        jobDescriptionId: activeLetter.jobDescriptionId?._id || activeLetter.jobDescriptionId || null,
        sourceAnalysisId: activeLetter.sourceAnalysisId?._id || activeLetter.sourceAnalysisId || null,
      })
      setActiveLetter(response.data)
      toast.success('求职信已保存')
      fetchData()
    } catch (error) {
      toast.error('保存求职信失败')
    }
  }

  const handleDelete = async (letterId) => {
    try {
      await axiosInstance.delete(API_PATHS.COVER_LETTERS.DELETE(letterId))
      toast.success('求职信已删除')
      if (activeLetter?._id === letterId) setActiveLetter(null)
      fetchData()
    } catch (error) {
      toast.error('删除求职信失败')
    }
  }

  const handleCopy = async () => {
    if (!activeLetter?.content) return
    try {
      await navigator.clipboard.writeText(activeLetter.content)
      toast.success('已复制到剪贴板')
    } catch (error) {
      toast.error('复制失败')
    }
  }

  return (
    <DashboardLayout activeMenu='cover-letters'>
      <div className='space-y-8 px-4'>
        <div>
          <h1 className='text-3xl font-black text-slate-900'>求职信管理</h1>
          <p className='mt-2 text-slate-600'>基于简历和岗位描述快速生成求职信，并支持继续手动润色。</p>
        </div>

        {(selectedResume || selectedJob || selectedResumeVersionId || sourceAnalysisId) && (
          <div className='rounded-3xl border border-sky-200 bg-sky-50 p-5 text-sm text-sky-900'>
            <div className='font-semibold'>当前闭环上下文</div>
            <div className='mt-2 space-y-1'>
              <div>简历：{selectedResume?.title || '—'}</div>
              <div>岗位：{selectedJob ? `${selectedJob.title}${selectedJob.company ? ` · ${selectedJob.company}` : ''}` : '—'}</div>
              <div>版本：{selectedResumeVersionId || '—'}</div>
              <div>分析记录：{sourceAnalysisId || '—'}</div>
            </div>
          </div>
        )}

        <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
          <div className='rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-4'>
            <h2 className='text-xl font-bold text-slate-800'>生成新求职信</h2>
            <select value={selectedResumeId} onChange={(e) => setSelectedResumeId(e.target.value)} className='w-full rounded-2xl border border-slate-200 px-4 py-3'>
              <option value=''>请选择简历</option>
              {resumes.map((resume) => <option key={resume._id} value={resume._id}>{resume.title}</option>)}
            </select>
            <select value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)} className='w-full rounded-2xl border border-slate-200 px-4 py-3'>
              <option value=''>通用求职信（不绑定岗位）</option>
              {jobs.map((job) => <option key={job._id} value={job._id}>{job.title} {job.company ? `- ${job.company}` : ''}</option>)}
            </select>
            <button onClick={handleGenerate} disabled={loading} className='w-full rounded-2xl bg-violet-600 px-4 py-3 font-semibold text-white'>
              {loading ? '生成中...' : '一键生成'}
            </button>

            <div className='pt-4 border-t border-slate-100'>
              <h3 className='font-semibold text-slate-700 mb-3'>历史求职信</h3>
              <div className='space-y-3 max-h-[55vh] overflow-auto'>
                {coverLetters.length === 0 && <div className='text-sm text-slate-500'>还没有求职信记录。</div>}
                {coverLetters.map((letter) => (
                  <div key={letter._id} className={`rounded-2xl border p-4 ${activeLetter?._id === letter._id ? 'border-violet-400 bg-violet-50' : 'border-slate-200 bg-slate-50'}`}>
                    <div className='font-semibold text-slate-800'>{letter.title}</div>
                    <div className='text-xs text-slate-500 mt-1'>{formatDateTime(letter.updatedAt)}</div>
                    <div className='mt-3 flex gap-2'>
                      <button onClick={() => setActiveLetter(letter)} className='text-sm text-violet-700 font-semibold'>打开</button>
                      <button onClick={() => handleDelete(letter._id)} className='text-sm text-rose-600 font-semibold'>删除</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className='xl:col-span-2 rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-4'>
            {!activeLetter && <div className='text-slate-500'>请选择一封求职信，或先生成新的求职信。</div>}
            {activeLetter && (
              <>
                <input
                  value={activeLetter.title || ''}
                  onChange={(e) => setActiveLetter((prev) => ({ ...prev, title: e.target.value }))}
                  className='w-full rounded-2xl border border-slate-200 px-4 py-3 text-lg font-semibold'
                />
                <div className='rounded-2xl bg-slate-50 p-4 border border-slate-100 text-sm text-slate-600 space-y-1'>
                  <div>关联简历：{activeLetter.resumeId?.title || selectedResume?.title || activeLetter.resumeId || '—'}</div>
                  <div>关联岗位：{activeLetter.jobDescriptionId?.title || selectedJob?.title || activeLetter.jobDescriptionId || '—'}</div>
                  <div>关联版本：{activeLetter.resumeVersionId?._id || activeLetter.resumeVersionId || selectedResumeVersionId || '—'}</div>
                  <div>分析记录：{activeLetter.sourceAnalysisId?._id || activeLetter.sourceAnalysisId || sourceAnalysisId || '—'}</div>
                </div>
                <textarea
                  value={activeLetter.content || ''}
                  onChange={(e) => setActiveLetter((prev) => ({ ...prev, content: e.target.value }))}
                  rows={22}
                  className='w-full rounded-2xl border border-slate-200 px-4 py-4 leading-7'
                />
                <div className='flex flex-wrap gap-3'>
                  <button onClick={handleSave} className='rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white'>保存修改</button>
                  <button onClick={handleCopy} className='rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700'>复制内容</button>
                  {activeLetter.resumeId && (
                    <Link to={`/resume/${activeLetter.resumeId?._id || activeLetter.resumeId}`} className='rounded-2xl border border-violet-200 px-5 py-3 font-semibold text-violet-700'>
                      查看关联简历
                    </Link>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default CoverLettersPage
