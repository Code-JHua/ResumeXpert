import React, { useState } from 'react'
import { Input } from './Inputs'
import { API_PATHS } from '../utils/apiPaths'
import axiosInstance from '../utils/axiosInstance'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

const CreateResumeForm = ({ onSuccess }) => {
  const [title, setTitle] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const { t } = useTranslation()

  const handleCreateResume = async (e) => {
    e.preventDefault()

    if (!title) {
      setError(t('createResumeForm.errors.titleRequired'))
      return
    }
    setError('')

    try {
      const response = await axiosInstance.post(API_PATHS.RESUME.CREATE, {
        title
      })
      if(response.data._id) {
        navigate(`/resume/${response.data?._id}`)
      }
    } catch (error) {
      if (error.response && error.response.data.message) {
        setError(error.response.data.message)
      }
      else {
        setError(t('createResumeForm.failed'))
      }
    }
  }

  return (
    <div className='w-full max-w-md p-8 bg-white rounded-2xl border border-gray-100 shadow-lg'>
      <h3 className='text-2xl font-bold text-gray-900 mb-2'>{t('createResumeForm.title')}</h3>
      <p className=' text-gray-600 mb-8'>{t('createResumeForm.description')}</p>

      <form action="" onSubmit={handleCreateResume}>
        <Input label={t('createResumeForm.resumeTitle')} value={title} onChange={({ target }) => setTitle(target.value)} placeholder={t('createResumeForm.resumeTitlePlaceholder')} type='text' />
        {error && <p className='text-red-500 text-sm mb-4'>{error}</p>}

        <button className='w-full py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-black rounded-2xl hover:scale-105 hover:shadow-xl hover:shadow-rose-200 transition-all'>
          {t('createResumeForm.createButton')}
        </button>
      </form>
    </div>
  )
}

export default CreateResumeForm