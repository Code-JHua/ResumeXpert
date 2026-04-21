import React, { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import axiosInstance from '../utils/axiosInstance'
import { API_PATHS } from '../utils/apiPaths'
import toast from 'react-hot-toast'
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_OPTIONS, formatDateTime } from '../utils/career'

const emptyForm = {
  company: '',
  position: '',
  resumeId: '',
  resumeVersionId: '',
  jobDescriptionId: '',
  coverLetterId: '',
  sourceAnalysisId: '',
  status: 'draft',
  appliedAt: '',
  nextActionAt: '',
  notes: '',
}

const ApplicationsPage = () => {
  const [searchParams] = useSearchParams()
  const [applications, setApplications] = useState([])
  const [stats, setStats] = useState({ total: 0, offerCount: 0, activeCount: 0, rejectedCount: 0, conversionRate: 0, calendarItems: [] })
  const [resumes, setResumes] = useState([])
  const [jobs, setJobs] = useState([])
  const [letters, setLetters] = useState([])
  const [versions, setVersions] = useState([])
  const [filters, setFilters] = useState({ status: '', company: '', position: '' })
  const [form, setForm] = useState({
    ...emptyForm,
    company: searchParams.get('company') || '',
    position: searchParams.get('position') || '',
    resumeId: searchParams.get('resumeId') || '',
    resumeVersionId: searchParams.get('resumeVersionId') || '',
    jobDescriptionId: searchParams.get('jobDescriptionId') || '',
    coverLetterId: searchParams.get('coverLetterId') || '',
    sourceAnalysisId: searchParams.get('sourceAnalysisId') || '',
  })
  const [activeApplication, setActiveApplication] = useState(null)
  const [timelineForm, setTimelineForm] = useState({
    type: 'follow_up',
    title: '',
    time: '',
    description: '',
    status: '',
  })

  const selectedResumeId = activeApplication?.resumeId?._id || form.resumeId

  const fetchVersionsForResume = async (resumeId) => {
    if (!resumeId) {
      setVersions([])
      return
    }

    try {
      const response = await axiosInstance.get(API_PATHS.RESUME.GET_VERSIONS(resumeId))
      setVersions(response.data)
    } catch (error) {
      setVersions([])
    }
  }

  const fetchData = async () => {
    try {
      const query = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) query.set(key, value)
      })
      const suffix = query.toString() ? `?${query.toString()}` : ''

      const [appResponse, statsResponse, resumeResponse, jobResponse, letterResponse] = await Promise.all([
        axiosInstance.get(`${API_PATHS.APPLICATIONS.GET_ALL}${suffix}`),
        axiosInstance.get(API_PATHS.APPLICATIONS.STATS),
        axiosInstance.get(API_PATHS.RESUME.GET_ALL),
        axiosInstance.get(API_PATHS.JOBS.GET_ALL),
        axiosInstance.get(API_PATHS.COVER_LETTERS.GET_ALL),
      ])

      setApplications(appResponse.data)
      setStats(statsResponse.data)
      setResumes(resumeResponse.data)
      setJobs(jobResponse.data)
      setLetters(letterResponse.data)
      if (!activeApplication && appResponse.data[0]) setActiveApplication(appResponse.data[0])
    } catch (error) {
      toast.error('加载投递记录失败')
    }
  }

  useEffect(() => {
    fetchData()
  }, [filters.status, filters.company, filters.position])

  useEffect(() => {
    fetchVersionsForResume(selectedResumeId)
  }, [selectedResumeId])

  const activeApplicationDetail = useMemo(
    () => applications.find((item) => item._id === activeApplication?._id) || activeApplication,
    [applications, activeApplication]
  )

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.company.trim() || !form.position.trim()) {
      toast.error('请填写公司和岗位')
      return
    }

    try {
      const payload = {
        ...form,
        appliedAt: form.appliedAt || null,
        nextActionAt: form.nextActionAt || null,
      }
      const response = await axiosInstance.post(API_PATHS.APPLICATIONS.CREATE, payload)
      toast.success('投递记录已创建')
      setForm(emptyForm)
      setActiveApplication(response.data)
      fetchData()
    } catch (error) {
      toast.error('创建投递记录失败')
    }
  }

  const handleUpdateStatus = async (application, status) => {
    try {
      const response = await axiosInstance.put(API_PATHS.APPLICATIONS.UPDATE(application._id), {
        status,
      })
      setActiveApplication(response.data)
      toast.success('状态已更新')
      fetchData()
    } catch (error) {
      toast.error('更新状态失败')
    }
  }

  const handleAddTimeline = async () => {
    if (!activeApplicationDetail?._id || !timelineForm.title.trim() || !timelineForm.time) {
      toast.error('请填写时间线标题和时间')
      return
    }

    try {
      const response = await axiosInstance.post(API_PATHS.APPLICATIONS.ADD_TIMELINE(activeApplicationDetail._id), {
        ...timelineForm,
        status: timelineForm.status || undefined,
      })
      setActiveApplication(response.data)
      setTimelineForm({
        type: 'follow_up',
        title: '',
        time: '',
        description: '',
        status: '',
      })
      toast.success('已添加流程节点')
      fetchData()
    } catch (error) {
      toast.error('添加流程节点失败')
    }
  }

  const handleDelete = async (applicationId) => {
    try {
      await axiosInstance.delete(API_PATHS.APPLICATIONS.DELETE(applicationId))
      toast.success('投递记录已删除')
      if (activeApplication?._id === applicationId) setActiveApplication(null)
      fetchData()
    } catch (error) {
      toast.error('删除投递记录失败')
    }
  }

  return (
    <DashboardLayout activeMenu='applications'>
      <div className='space-y-8 px-4'>
        <div>
          <h1 className='text-3xl font-black text-slate-900'>投递记录与日历</h1>
          <p className='mt-2 text-slate-600'>管理投递流程、记录面试节点，并通过日历视图查看后续安排。</p>
        </div>

        <div className='grid grid-cols-2 lg:grid-cols-5 gap-4'>
          {[
            ['总投递数', stats.total],
            ['进行中', stats.activeCount],
            ['Offer', stats.offerCount],
            ['淘汰', stats.rejectedCount],
            ['转化率', `${stats.conversionRate}%`],
          ].map(([label, value]) => (
            <div key={label} className='rounded-3xl bg-white p-5 border border-slate-200 shadow-sm'>
              <div className='text-sm text-slate-500'>{label}</div>
              <div className='mt-2 text-3xl font-black text-slate-900'>{value}</div>
            </div>
          ))}
        </div>

        <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
          <form onSubmit={handleCreate} className='rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-4'>
            <h2 className='text-xl font-bold text-slate-800'>新增投递记录</h2>
            <input value={form.company} onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))} placeholder='公司名称' className='w-full rounded-2xl border border-slate-200 px-4 py-3' />
            <input value={form.position} onChange={(e) => setForm((prev) => ({ ...prev, position: e.target.value }))} placeholder='岗位名称' className='w-full rounded-2xl border border-slate-200 px-4 py-3' />
            <select value={form.resumeId} onChange={(e) => setForm((prev) => ({ ...prev, resumeId: e.target.value, resumeVersionId: '' }))} className='w-full rounded-2xl border border-slate-200 px-4 py-3'>
              <option value=''>关联简历（可选）</option>
              {resumes.map((resume) => <option key={resume._id} value={resume._id}>{resume.title}</option>)}
            </select>
            <select value={form.resumeVersionId} onChange={(e) => setForm((prev) => ({ ...prev, resumeVersionId: e.target.value }))} className='w-full rounded-2xl border border-slate-200 px-4 py-3'>
              <option value=''>关联简历版本（可选）</option>
              {versions.map((version) => <option key={version._id} value={version._id}>{version.versionName}</option>)}
            </select>
            <select value={form.jobDescriptionId} onChange={(e) => setForm((prev) => ({ ...prev, jobDescriptionId: e.target.value }))} className='w-full rounded-2xl border border-slate-200 px-4 py-3'>
              <option value=''>关联岗位（可选）</option>
              {jobs.map((job) => <option key={job._id} value={job._id}>{job.title} {job.company ? `- ${job.company}` : ''}</option>)}
            </select>
            <select value={form.coverLetterId} onChange={(e) => setForm((prev) => ({ ...prev, coverLetterId: e.target.value }))} className='w-full rounded-2xl border border-slate-200 px-4 py-3'>
              <option value=''>关联求职信（可选）</option>
              {letters.map((letter) => <option key={letter._id} value={letter._id}>{letter.title}</option>)}
            </select>
            <input value={form.sourceAnalysisId} onChange={(e) => setForm((prev) => ({ ...prev, sourceAnalysisId: e.target.value }))} placeholder='关联 ATS 分析记录（可选）' className='w-full rounded-2xl border border-slate-200 px-4 py-3' />
            <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))} className='w-full rounded-2xl border border-slate-200 px-4 py-3'>
              {APPLICATION_STATUS_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <input type='datetime-local' value={form.appliedAt} onChange={(e) => setForm((prev) => ({ ...prev, appliedAt: e.target.value }))} className='w-full rounded-2xl border border-slate-200 px-4 py-3' />
            <input type='datetime-local' value={form.nextActionAt} onChange={(e) => setForm((prev) => ({ ...prev, nextActionAt: e.target.value }))} className='w-full rounded-2xl border border-slate-200 px-4 py-3' />
            <textarea value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} rows={4} placeholder='备注信息' className='w-full rounded-2xl border border-slate-200 px-4 py-3' />
            <button type='submit' className='w-full rounded-2xl bg-violet-600 px-4 py-3 font-semibold text-white'>创建投递</button>
          </form>

          <div className='xl:col-span-2 space-y-6'>
            <div className='rounded-3xl bg-white p-6 border border-slate-200 shadow-sm'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <select value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))} className='rounded-2xl border border-slate-200 px-4 py-3'>
                  <option value=''>全部状态</option>
                  {APPLICATION_STATUS_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
                <input value={filters.company} onChange={(e) => setFilters((prev) => ({ ...prev, company: e.target.value }))} placeholder='按公司筛选' className='rounded-2xl border border-slate-200 px-4 py-3' />
                <input value={filters.position} onChange={(e) => setFilters((prev) => ({ ...prev, position: e.target.value }))} placeholder='按岗位筛选' className='rounded-2xl border border-slate-200 px-4 py-3' />
              </div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <div className='rounded-3xl bg-white p-6 border border-slate-200 shadow-sm'>
                <h2 className='text-xl font-bold text-slate-800 mb-4'>投递列表</h2>
                <div className='space-y-3 max-h-[58vh] overflow-auto'>
                  {applications.length === 0 && <div className='text-sm text-slate-500'>还没有投递记录。</div>}
                  {applications.map((application) => (
                    <div key={application._id} className={`rounded-2xl border p-4 ${activeApplicationDetail?._id === application._id ? 'border-violet-400 bg-violet-50' : 'border-slate-200 bg-slate-50'}`}>
                      <div className='flex items-start justify-between gap-3'>
                        <div>
                          <div className='font-semibold text-slate-800'>{application.company}</div>
                          <div className='text-sm text-slate-600'>{application.position}</div>
                          <div className='text-xs text-slate-500 mt-1'>{APPLICATION_STATUS_LABELS[application.status] || application.status}</div>
                        </div>
                        <div className='flex gap-2'>
                          <button onClick={() => setActiveApplication(application)} className='text-sm text-violet-700 font-semibold'>查看</button>
                          <button onClick={() => handleDelete(application._id)} className='text-sm text-rose-600 font-semibold'>删除</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className='rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-5'>
                <h2 className='text-xl font-bold text-slate-800'>详情 / 时间线</h2>
                {!activeApplicationDetail && <div className='text-sm text-slate-500'>请选择一条投递记录。</div>}
                {activeApplicationDetail && (
                  <>
                    <div className='rounded-2xl bg-slate-50 p-4 border border-slate-100'>
                      <div className='flex flex-wrap gap-2 items-center justify-between'>
                        <div>
                          <div className='text-xl font-bold text-slate-900'>{activeApplicationDetail.company}</div>
                          <div className='text-slate-600'>{activeApplicationDetail.position}</div>
                        </div>
                        <select
                          value={activeApplicationDetail.status}
                          onChange={(e) => handleUpdateStatus(activeApplicationDetail, e.target.value)}
                          className='rounded-2xl border border-slate-200 px-4 py-3'
                        >
                          {APPLICATION_STATUS_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                        </select>
                      </div>
                      <div className='mt-4 text-sm text-slate-600 space-y-1'>
                        <div>投递时间：{formatDateTime(activeApplicationDetail.appliedAt)}</div>
                        <div>下次行动：{formatDateTime(activeApplicationDetail.nextActionAt)}</div>
                        <div>关联简历：{activeApplicationDetail.resumeId?.title || '—'}</div>
                        <div>关联版本：{activeApplicationDetail.resumeVersionId?.versionName || '—'}</div>
                        <div>关联岗位：{activeApplicationDetail.jobDescriptionId?.title || '—'}</div>
                        <div>关联求职信：{activeApplicationDetail.coverLetterId?.title || '—'}</div>
                        <div>分析记录：{activeApplicationDetail.sourceAnalysisId?._id || activeApplicationDetail.sourceAnalysisId || '—'}</div>
                      </div>
                      {activeApplicationDetail.notes && <div className='mt-3 text-sm text-slate-700'>{activeApplicationDetail.notes}</div>}
                      <div className='mt-4 flex flex-wrap gap-3'>
                        {activeApplicationDetail.resumeId?._id && (
                          <Link to={`/resume/${activeApplicationDetail.resumeId._id}`} className='rounded-2xl border border-violet-200 px-4 py-2 text-sm font-semibold text-violet-700'>
                            查看简历
                          </Link>
                        )}
                        {activeApplicationDetail.resumeId?._id && activeApplicationDetail.resumeVersionId?._id && (
                          <Link to={`/resume/${activeApplicationDetail.resumeId._id}?openVersions=1&versionId=${activeApplicationDetail.resumeVersionId._id}`} className='rounded-2xl border border-sky-200 px-4 py-2 text-sm font-semibold text-sky-700'>
                            查看版本
                          </Link>
                        )}
                        {activeApplicationDetail.jobDescriptionId?._id && (
                          <Link to={`/jobs?resumeId=${activeApplicationDetail.resumeId?._id || ''}&jobId=${activeApplicationDetail.jobDescriptionId._id}`} className='rounded-2xl border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-700'>
                            查看岗位
                          </Link>
                        )}
                        {activeApplicationDetail.coverLetterId?._id && (
                          <Link to={`/cover-letters?coverLetterId=${activeApplicationDetail.coverLetterId._id}&resumeId=${activeApplicationDetail.resumeId?._id || ''}&jobDescriptionId=${activeApplicationDetail.jobDescriptionId?._id || ''}&resumeVersionId=${activeApplicationDetail.resumeVersionId?._id || ''}&sourceAnalysisId=${activeApplicationDetail.sourceAnalysisId?._id || ''}`} className='rounded-2xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700'>
                            查看求职信
                          </Link>
                        )}
                      </div>
                    </div>

                    <div className='rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-3'>
                      <div className='font-semibold text-slate-800'>添加流程节点</div>
                      <input value={timelineForm.title} onChange={(e) => setTimelineForm((prev) => ({ ...prev, title: e.target.value }))} placeholder='例如：一面 / 笔试 / 跟进' className='w-full rounded-2xl border border-slate-200 px-4 py-3' />
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                        <input value={timelineForm.type} onChange={(e) => setTimelineForm((prev) => ({ ...prev, type: e.target.value }))} placeholder='节点类型' className='rounded-2xl border border-slate-200 px-4 py-3' />
                        <input type='datetime-local' value={timelineForm.time} onChange={(e) => setTimelineForm((prev) => ({ ...prev, time: e.target.value }))} className='rounded-2xl border border-slate-200 px-4 py-3' />
                      </div>
                      <select value={timelineForm.status} onChange={(e) => setTimelineForm((prev) => ({ ...prev, status: e.target.value }))} className='w-full rounded-2xl border border-slate-200 px-4 py-3'>
                        <option value=''>不改变当前状态</option>
                        {APPLICATION_STATUS_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                      </select>
                      <textarea value={timelineForm.description} onChange={(e) => setTimelineForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} placeholder='补充说明' className='w-full rounded-2xl border border-slate-200 px-4 py-3' />
                      <button onClick={handleAddTimeline} className='rounded-2xl bg-emerald-600 px-5 py-3 text-white font-semibold'>添加节点</button>
                    </div>

                    <div className='space-y-3 max-h-[24vh] overflow-auto'>
                      {(activeApplicationDetail.timeline || []).length === 0 && <div className='text-sm text-slate-500'>暂无流程节点。</div>}
                      {(activeApplicationDetail.timeline || []).map((item) => (
                        <div key={item._id || `${item.title}-${item.time}`} className='rounded-2xl border border-slate-200 bg-white p-4'>
                          <div className='font-semibold text-slate-800'>{item.title}</div>
                          <div className='text-sm text-slate-500 mt-1'>{formatDateTime(item.time)}</div>
                          {item.description && <div className='mt-2 text-sm text-slate-600'>{item.description}</div>}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className='rounded-3xl bg-white p-6 border border-slate-200 shadow-sm'>
              <h2 className='text-xl font-bold text-slate-800 mb-4'>日历视图</h2>
              <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3'>
                {stats.calendarItems?.length === 0 && <div className='text-sm text-slate-500'>暂无日历事件。</div>}
                {stats.calendarItems?.map((item, index) => (
                  <div key={`${item.applicationId}-${item.time}-${index}`} className='rounded-2xl bg-slate-50 border border-slate-200 p-4'>
                    <div className='font-semibold text-slate-800'>{item.title}</div>
                    <div className='text-sm text-slate-500 mt-1'>{formatDateTime(item.time)}</div>
                    <div className='text-sm text-slate-600 mt-2'>{item.company} · {item.position}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ApplicationsPage
