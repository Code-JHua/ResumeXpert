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
          syncStatus: 'synced',
          lastSyncedAt: '2026-04-21T10:00:00.000Z',
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
})
