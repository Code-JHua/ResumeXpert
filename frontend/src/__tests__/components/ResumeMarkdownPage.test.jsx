import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ResumeMarkdownPage from '../../pages/ResumeMarkdownPage'
import { UserContext } from '../../context/UserContext'

const navigateMock = vi.fn()
const getMock = vi.fn()
const putMock = vi.fn()
const postMock = vi.fn()

vi.mock('../../utils/axiosInstance', () => ({
  default: {
    get: (...args) => getMock(...args),
    put: (...args) => putMock(...args),
    post: (...args) => postMock(...args),
  },
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const renderPage = () => {
  return render(
    <UserContext.Provider value={{ user: { name: 'Test User' }, loading: false, updateUser: vi.fn(), clearUser: vi.fn() }}>
      <MemoryRouter initialEntries={['/resume/resume-1/markdown']}>
        <Routes>
          <Route path='/resume/:id/markdown' element={<ResumeMarkdownPage />} />
        </Routes>
      </MemoryRouter>
    </UserContext.Provider>
  )
}

describe('ResumeMarkdownPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getMock.mockImplementation((url) => {
      if (url === '/api/resume/resume-1') {
        return Promise.resolve({
          data: {
            _id: 'resume-1',
            title: 'Frontend Resume',
            contentSource: 'markdown',
            profileInfo: {
              fullName: 'Jane Doe',
              designation: 'Frontend Engineer',
            },
            workExperience: [],
            education: [],
            skills: [],
          },
        })
      }

      return Promise.resolve({
        data: {
          title: 'Frontend Resume Markdown',
          content: '# Jane Doe',
          syncStatus: 'outdated',
          lastSyncedAt: '2026-04-21T10:00:00.000Z',
          parsedStructuredSnapshot: {
            title: 'Old Frontend Resume',
            profileInfo: {
              fullName: 'Jane Doe',
              designation: 'Frontend Developer',
            },
            contactInfo: {
              email: 'old@example.com',
            },
            workExperience: [],
            education: [],
            skills: [],
            freeBlocks: [],
          },
        },
      })
    })
    putMock.mockResolvedValue({ data: {} })
  })

  it('loads markdown document and renders editor', async () => {
    renderPage()

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Markdown 编辑模式')
    expect(await screen.findByDisplayValue('Frontend Resume Markdown')).toBeInTheDocument()
    expect(await screen.findByDisplayValue('# Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('职位已变化')).toBeInTheDocument()
    expect(screen.getByText('邮箱已变化')).toBeInTheDocument()
  })

  it('saves markdown content', async () => {
    renderPage()

    const user = userEvent.setup()
    const textarea = await screen.findByDisplayValue('# Jane Doe')
    await user.clear(textarea)
    await user.type(textarea, '# Jane Doe Updated')
    await user.click(screen.getByText('保存 Markdown'))

    await waitFor(() => expect(putMock).toHaveBeenCalled())
  })

  it('syncs markdown from resume and applies markdown back to resume', async () => {
    postMock.mockImplementation((url) => {
      if (url === '/api/resume/resume-1/markdown/sync-from-resume') {
        return Promise.resolve({
          data: {
            content: '# Jane Doe\nFrontend Engineer',
            document: {
              title: 'Frontend Resume Markdown',
              content: '# Jane Doe\nFrontend Engineer',
              syncStatus: 'synced',
              lastSyncedAt: '2026-04-21T11:00:00.000Z',
              parsedStructuredSnapshot: {
                title: 'Frontend Resume',
                profileInfo: {
                  fullName: 'Jane Doe',
                  designation: 'Frontend Engineer',
                },
                contactInfo: {},
                workExperience: [],
                education: [],
                skills: [],
                freeBlocks: [],
              },
            },
          },
        })
      }

      if (url === '/api/resume/resume-1/markdown/apply-to-resume') {
        return Promise.resolve({
          data: {
            resume: {
              _id: 'resume-1',
              title: 'Frontend Resume',
              contentSource: 'markdown',
              profileInfo: {
                fullName: 'Jane Doe',
                designation: 'Staff Frontend Engineer',
              },
              workExperience: [],
              education: [],
              skills: [{ name: 'React' }],
              freeBlocks: [{ title: 'awards', content: 'Hackathon Winner' }],
            },
            document: {
              title: 'Frontend Resume Markdown',
              content: '# Jane Doe\nStaff Frontend Engineer',
              syncStatus: 'synced',
              lastSyncedAt: '2026-04-21T12:00:00.000Z',
              parsedStructuredSnapshot: {
                title: 'Frontend Resume',
                profileInfo: {
                  fullName: 'Jane Doe',
                  designation: 'Staff Frontend Engineer',
                },
                contactInfo: {},
                workExperience: [],
                education: [],
                skills: [{ name: 'React' }],
                freeBlocks: [{ title: 'awards', content: 'Hackathon Winner' }],
              },
            },
            unresolvedFields: ['contactInfo.phone'],
            confidenceSummary: {
              high: 2,
              medium: 1,
              low: 1,
            },
            parsedSections: {
              headings: ['summary', 'skills', 'awards'],
            },
          },
        })
      }

      if (url === '/api/resume/resume-1/markdown/preview-apply') {
        return Promise.resolve({
          data: {
            overwriteSummary: [
              {
                field: 'profileInfo.designation',
                currentValue: 'Frontend Engineer',
                nextValue: 'Staff Frontend Engineer',
              },
              {
                field: 'contactInfo.email',
                currentValue: '',
                nextValue: 'jane@example.com',
              },
            ],
            unresolvedFields: ['contactInfo.phone'],
            confidenceSummary: {
              high: 2,
              medium: 1,
              low: 0,
            },
            parsedSections: {
              headings: ['summary'],
            },
          },
        })
      }

      return Promise.resolve({ data: {} })
    })

    renderPage()
    const user = userEvent.setup()

    await screen.findByDisplayValue('Frontend Resume Markdown')
    await user.click(screen.getByText('从表单重新生成'))
    await waitFor(() => expect(postMock).toHaveBeenCalledWith('/api/resume/resume-1/markdown/sync-from-resume', expect.any(Object)))

    await user.click(screen.getByText('预览应用影响'))
    await waitFor(() => expect(postMock).toHaveBeenCalledWith('/api/resume/resume-1/markdown/preview-apply', expect.any(Object)))
    expect(screen.getByText('profileInfo.designation')).toBeInTheDocument()
    expect(screen.getByText('新值：Staff Frontend Engineer')).toBeInTheDocument()

    const textarea = screen.getAllByRole('textbox')[1]
    await user.clear(textarea)
    await user.type(textarea, '# Jane Doe{enter}Staff Frontend Engineer')
    await user.click(screen.getByText('应用到简历'))

    await waitFor(() => expect(postMock).toHaveBeenCalledWith('/api/resume/resume-1/markdown/apply-to-resume', expect.any(Object)))
    expect(screen.getByText('职位：Staff Frontend Engineer')).toBeInTheDocument()
    expect(screen.getByText('自由块：1 个')).toBeInTheDocument()
    expect(screen.getByText('contactInfo.phone')).toBeInTheDocument()
    expect(screen.getByText('当前结构化简历与 Markdown 快照没有检测到明显漂移。')).toBeInTheDocument()
  })
})
