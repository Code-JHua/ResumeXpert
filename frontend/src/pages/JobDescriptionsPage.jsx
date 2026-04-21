import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import axiosInstance from '../utils/axiosInstance'
import { API_PATHS } from '../utils/apiPaths'
import toast from 'react-hot-toast'

const defaultForm = {
  title: '',
  company: '',
  sourceText: '',
}

const JobDescriptionsPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialResumeId = searchParams.get('resumeId') || ''

  const [jobForm, setJobForm] = useState(defaultForm)
  const [jobs, setJobs] = useState([])
  const [resumes, setResumes] = useState([])
  const [selectedResumeId, setSelectedResumeId] = useState(initialResumeId)
  const [selectedJobId, setSelectedJobId] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)

  const selectedJob = useMemo(
    () => jobs.find((item) => item._id === selectedJobId),
    [jobs, selectedJobId]
  )

  const fetchData = async () => {
    try {
      const [jobResponse, resumeResponse] = await Promise.all([
        axiosInstance.get(API_PATHS.JOBS.GET_ALL),
        axiosInstance.get(API_PATHS.RESUME.GET_ALL),
      ])
      setJobs(jobResponse.data)
      setResumes(resumeResponse.data)
      if (!selectedJobId && jobResponse.data[0]) setSelectedJobId(jobResponse.data[0]._id)
      if (!selectedResumeId && resumeResponse.data[0]) setSelectedResumeId(resumeResponse.data[0]._id)
    } catch (error) {
      toast.error('加载岗位或简历数据失败')
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateJob = async (e) => {
    e.preventDefault()
    if (!jobForm.title.trim() || !jobForm.sourceText.trim()) {
      toast.error('请填写岗位名称和 JD 内容')
      return
    }

    try {
      setLoading(true)
      await axiosInstance.post(API_PATHS.JOBS.CREATE, jobForm)
      setJobForm(defaultForm)
      toast.success('岗位描述已保存')
      fetchData()
    } catch (error) {
      toast.error('保存岗位描述失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRunAnalysis = async () => {
    if (!selectedResumeId || !selectedJobId) {
      toast.error('请选择简历和岗位')
      return
    }

    try {
      setLoading(true)
      const response = await axiosInstance.post(API_PATHS.ATS.ANALYZE, {
        resumeId: selectedResumeId,
        jobDescriptionId: selectedJobId,
      })
      setAnalysis(response.data)
      toast.success('ATS 分析完成')
    } catch (error) {
      toast.error('ATS 分析失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteJob = async (jobId) => {
    try {
      await axiosInstance.delete(API_PATHS.JOBS.DELETE(jobId))
      toast.success('岗位描述已删除')
      if (selectedJobId === jobId) {
        setSelectedJobId('')
        setAnalysis(null)
      }
      fetchData()
    } catch (error) {
      toast.error('删除岗位失败')
    }
  }

  const handleCreateApplication = () => {
    if (!analysis) {
      toast.error('请先完成 ATS 分析')
      return
    }
    navigate(`/applications?resumeId=${selectedResumeId}&jobDescriptionId=${selectedJobId}`)
  }

  return (
    <DashboardLayout activeMenu='jobs'>
      <div className='space-y-8 px-4'>
        <div>
          <h1 className='text-3xl font-black text-slate-900'>岗位管理 / ATS 分析</h1>
          <p className='mt-2 text-slate-600'>录入岗位 JD，选择简历后生成匹配度、缺失关键词和优化建议。</p>
        </div>

        <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
          <form onSubmit={handleCreateJob} className='xl:col-span-1 rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-4'>
            <h2 className='text-xl font-bold text-slate-800'>新增岗位描述</h2>
            <input
              value={jobForm.title}
              onChange={(e) => setJobForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder='岗位名称'
              className='w-full rounded-2xl border border-slate-200 px-4 py-3'
            />
            <input
              value={jobForm.company}
              onChange={(e) => setJobForm((prev) => ({ ...prev, company: e.target.value }))}
              placeholder='公司名称'
              className='w-full rounded-2xl border border-slate-200 px-4 py-3'
            />
            <textarea
              value={jobForm.sourceText}
              onChange={(e) => setJobForm((prev) => ({ ...prev, sourceText: e.target.value }))}
              placeholder='粘贴岗位描述全文'
              rows={10}
              className='w-full rounded-2xl border border-slate-200 px-4 py-3'
            />
            <button type='submit' disabled={loading} className='w-full rounded-2xl bg-violet-600 px-4 py-3 font-semibold text-white'>
              {loading ? '处理中...' : '保存岗位'}
            </button>
          </form>

          <div className='xl:col-span-2 rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>选择简历</label>
                <select value={selectedResumeId} onChange={(e) => setSelectedResumeId(e.target.value)} className='w-full rounded-2xl border border-slate-200 px-4 py-3'>
                  <option value=''>请选择</option>
                  {resumes.map((resume) => <option key={resume._id} value={resume._id}>{resume.title}</option>)}
                </select>
              </div>
              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>选择岗位</label>
                <select value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)} className='w-full rounded-2xl border border-slate-200 px-4 py-3'>
                  <option value=''>请选择</option>
                  {jobs.map((job) => <option key={job._id} value={job._id}>{job.title} {job.company ? `- ${job.company}` : ''}</option>)}
                </select>
              </div>
            </div>

            <div className='flex flex-wrap gap-3'>
              <button onClick={handleRunAnalysis} disabled={loading} className='rounded-2xl bg-slate-900 px-5 py-3 text-white font-semibold'>
                {loading ? '分析中...' : '运行 ATS 分析'}
              </button>
              <button onClick={handleCreateApplication} className='rounded-2xl bg-emerald-600 px-5 py-3 text-white font-semibold'>
                一键创建投递记录
              </button>
              {selectedResumeId && (
                <button onClick={() => navigate(`/resume/${selectedResumeId}`)} className='rounded-2xl border border-violet-200 px-5 py-3 text-violet-700 font-semibold'>
                  去优化简历
                </button>
              )}
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <div className='rounded-2xl bg-slate-50 p-4 border border-slate-100'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='font-bold text-slate-800'>岗位列表</h3>
                </div>
                <div className='space-y-3 max-h-[48vh] overflow-auto'>
                  {jobs.length === 0 && <div className='text-sm text-slate-500'>还没有岗位描述。</div>}
                  {jobs.map((job) => (
                    <div key={job._id} className={`rounded-2xl border p-4 ${selectedJobId === job._id ? 'border-violet-400 bg-violet-50' : 'border-slate-200 bg-white'}`}>
                      <div className='flex items-start justify-between gap-4'>
                        <div>
                          <div className='font-semibold text-slate-800'>{job.title}</div>
                          <div className='text-sm text-slate-500'>{job.company || '未填写公司'}</div>
                        </div>
                        <div className='flex gap-2'>
                          <button onClick={() => setSelectedJobId(job._id)} className='text-sm text-violet-700 font-semibold'>选择</button>
                          <button onClick={() => handleDeleteJob(job._id)} className='text-sm text-rose-600 font-semibold'>删除</button>
                        </div>
                      </div>
                      <div className='mt-3 flex flex-wrap gap-2'>
                        {(job.keywords || []).slice(0, 6).map((keyword) => (
                          <span key={keyword} className='rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600'>{keyword}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className='rounded-2xl bg-slate-50 p-4 border border-slate-100'>
                <h3 className='font-bold text-slate-800 mb-4'>分析结果</h3>
                {!analysis && (
                  <div className='text-sm text-slate-500'>选择岗位和简历后点击“运行 ATS 分析”。</div>
                )}
                {analysis && (
                  <div className='space-y-4'>
                    <div className='rounded-2xl bg-white p-4 border border-slate-200'>
                      <div className='text-sm text-slate-500'>总匹配度</div>
                      <div className='text-4xl font-black text-violet-700'>{analysis.overallScore}%</div>
                      {selectedJob && <div className='mt-2 text-sm text-slate-500'>{selectedJob.title} {selectedJob.company ? `· ${selectedJob.company}` : ''}</div>}
                    </div>
                    <div>
                      <div className='text-sm font-semibold text-slate-700 mb-2'>命中关键词</div>
                      <div className='flex flex-wrap gap-2'>
                        {analysis.matchedKeywords.map((keyword) => <span key={keyword} className='rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700'>{keyword}</span>)}
                      </div>
                    </div>
                    <div>
                      <div className='text-sm font-semibold text-slate-700 mb-2'>缺失关键词</div>
                      <div className='flex flex-wrap gap-2'>
                        {analysis.missingKeywords.map((keyword) => <span key={keyword} className='rounded-full bg-rose-100 px-3 py-1 text-xs text-rose-700'>{keyword}</span>)}
                      </div>
                    </div>
                    <div>
                      <div className='text-sm font-semibold text-slate-700 mb-2'>建议优化模块</div>
                      <div className='flex flex-wrap gap-2'>
                        {analysis.recommendedSections.map((item) => <span key={item} className='rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700'>{item}</span>)}
                      </div>
                    </div>
                    <div className='rounded-2xl bg-white p-4 border border-slate-200'>
                      <div className='text-sm font-semibold text-slate-700 mb-2'>优化建议</div>
                      <ul className='space-y-2 text-sm text-slate-600 list-disc pl-5'>
                        {analysis.recommendations.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default JobDescriptionsPage
