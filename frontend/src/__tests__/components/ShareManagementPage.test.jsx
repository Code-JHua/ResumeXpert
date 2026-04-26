import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ShareManagementPage from '../../pages/ShareManagementPage'
import { UserContext } from '../../context/UserContext'
import { createTestQueryClient } from '../testQueryClient'

const getMock = vi.fn()
const postMock = vi.fn()
const putMock = vi.fn()

vi.mock('../../utils/axiosInstance', () => ({
  default: {
    get: (...args) => getMock(...args),
    post: (...args) => postMock(...args),
    put: (...args) => putMock(...args),
  },
}))

vi.mock('../../services/resumeExportService', () => ({
  exportResumeAsPdf: vi.fn(() => Promise.resolve()),
  exportResumeAsMarkdown: vi.fn(() => Promise.resolve({ status: 'ready', content: '# Resume' })),
  getResumeMarkdownExport: vi.fn(() => Promise.resolve({ status: 'ready', content: '# Resume' })),
}))

vi.mock('../../components/RenderResume', () => ({
  default: ({ resumeData }) => <div>Preview: {resumeData.title}</div>,
}))

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      language: 'zh',
      changeLanguage: vi.fn(),
    },
  }),
}))

const renderPage = () => render(
  <QueryClientProvider client={createTestQueryClient()}>
    <UserContext.Provider value={{ user: { name: 'Test User' }, loading: false, updateUser: vi.fn(), clearUser: vi.fn() }}>
      <MemoryRouter initialEntries={['/share?resumeId=resume-1']}>
        <Routes>
          <Route path='/share' element={<ShareManagementPage />} />
        </Routes>
      </MemoryRouter>
    </UserContext.Provider>
  </QueryClientProvider>
)

describe('ShareManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    let hasShare = false

    getMock.mockImplementation((url) => {
      if (url === '/api/resume') {
        return Promise.resolve({
          data: [
            { _id: 'resume-1', title: 'Frontend Resume', updatedAt: '2026-04-21T10:00:00.000Z' },
          ],
        })
      }

      if (url === '/api/resume/resume-1') {
        return Promise.resolve({
          data: {
            _id: 'resume-1',
            title: 'Frontend Resume',
            contentSource: 'markdown',
            template: { theme: '01', colorPalette: [] },
            profileInfo: { fullName: 'Jane Doe', designation: 'Frontend Engineer' },
            contactInfo: {},
            workExperience: [],
            education: [],
            skills: [],
            projects: [],
            certifications: [],
            languages: [],
            interests: [],
            freeBlocks: [],
          },
        })
      }

      if (url === '/api/resume/resume-1/exports') {
        return Promise.resolve({
          data: [
            {
              _id: 'log-1',
              format: 'pdf',
              status: 'success',
              metadata: {
                triggerSource: 'output_center',
                fileName: 'frontend_resume.pdf',
              },
              createdAt: '2026-04-21T10:30:00.000Z',
            },
          ],
        })
      }

      if (url === '/api/resume/resume-1/exports/summary') {
        return Promise.resolve({
          data: {
            totalExports: 2,
            successfulExports: 1,
            failedExports: 1,
            exportsByFormat: { pdf: 1, markdown: 0, docx: 1 },
            shareGovernance: {
              visibility: 'public',
              statusReason: 'active',
              deniedAccessCount: 0,
            },
          },
        })
      }

      if (url === '/api/resume/resume-1/share') {
        if (!hasShare) {
          return Promise.reject({ response: { status: 404 } })
        }

        return Promise.resolve({
          data: {
            id: 'share-1',
            resumeId: 'resume-1',
            slug: 'frontend-resume-abc123',
            publicUrl: 'http://localhost:4000/s/frontend-resume-abc123',
            status: 'published',
            isEnabled: true,
            viewCount: 0,
            uniqueVisitorCount: 0,
            lastPublishedAt: '2026-04-21T11:00:00.000Z',
          },
        })
      }

      return Promise.resolve({ data: {} })
    })

    postMock.mockImplementation(() => {
      hasShare = true

      return Promise.resolve({
        data: {
          id: 'share-1',
          resumeId: 'resume-1',
          slug: 'frontend-resume-abc123',
          publicUrl: 'http://localhost:4000/s/frontend-resume-abc123',
          status: 'published',
          isEnabled: true,
          viewCount: 0,
          uniqueVisitorCount: 0,
          lastPublishedAt: '2026-04-21T11:00:00.000Z',
        },
      })
    })
    putMock.mockResolvedValue({ data: {} })
  })

  it('loads selected resume output center data', async () => {
    renderPage()

    expect(await screen.findByText('输出与分享中心')).toBeInTheDocument()
    expect((await screen.findAllByText('Frontend Resume')).length).toBeGreaterThan(0)
    expect(await screen.findByText('输出预览')).toBeInTheDocument()
    expect(screen.getByText('frontend_resume.pdf')).toBeInTheDocument()
    expect(screen.getByText(/PDF 1/)).toBeInTheDocument()
  })

  it('creates a share link for the selected resume', async () => {
    renderPage()
    const user = userEvent.setup()

    expect((await screen.findAllByText('Frontend Resume')).length).toBeGreaterThan(0)
    await user.click(screen.getByText('创建分享链接'))

    await waitFor(() => expect(postMock).toHaveBeenCalledWith('/api/resume/resume-1/share', expect.any(Object)))
    expect(await screen.findByText('复制分享链接')).toBeInTheDocument()
    expect(screen.getByText('http://localhost:4000/s/frontend-resume-abc123')).toBeInTheDocument()
  })
})
