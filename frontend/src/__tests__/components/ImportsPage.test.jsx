import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ImportsPage from '../../pages/ImportsPage'
import { UserContext } from '../../context/UserContext'

const navigateMock = vi.fn()
const getMock = vi.fn()
const postMock = vi.fn()

vi.mock('../../utils/axiosInstance', () => ({
  default: {
    get: (...args) => getMock(...args),
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
      <MemoryRouter>
        <ImportsPage />
      </MemoryRouter>
    </UserContext.Provider>
  )
}

describe('ImportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getMock.mockResolvedValue({ data: [] })
  })

  it('renders markdown import entry and import history', async () => {
    renderPage()

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('导入中心')
    await waitFor(() => expect(getMock).toHaveBeenCalled())
    expect(screen.getByText('Markdown 导入')).toBeInTheDocument()
    expect(screen.getByText('最近导入记录')).toBeInTheDocument()
  })

  it('submits markdown import and navigates to confirm page', async () => {
    postMock.mockResolvedValue({ data: { _id: 'import-123' } })
    renderPage()

    const user = userEvent.setup()
    const textarea = await screen.findByPlaceholderText(/张三/i)
    await user.type(textarea, '# Jane Import')
    await user.click(screen.getByText('开始导入 Markdown'))

    await waitFor(() => expect(postMock).toHaveBeenCalled())
    expect(navigateMock).toHaveBeenCalledWith('/imports/import-123/confirm')
  })

  it('shows status-aware actions for import history', async () => {
    getMock.mockResolvedValue({
      data: [
        {
          _id: 'import-confirmed',
          originalFileName: 'confirmed.md',
          sourceType: 'markdown',
          status: 'confirmed',
          confirmedResumeId: 'resume-888',
          createdAt: '2026-04-21T10:00:00.000Z',
        },
        {
          _id: 'import-failed',
          originalFileName: 'broken.pdf',
          sourceType: 'pdf',
          status: 'failed',
          failureReason: '无法解析 PDF 文本',
          createdAt: '2026-04-21T10:00:00.000Z',
        },
      ],
    })

    renderPage()
    const user = userEvent.setup()

    expect(await screen.findByText('打开简历')).toBeInTheDocument()
    expect(screen.getByText('查看失败详情')).toBeInTheDocument()
    expect(screen.getByText('无法解析 PDF 文本')).toBeInTheDocument()

    await user.click(screen.getByText('打开简历'))
    expect(navigateMock).toHaveBeenCalledWith('/resume/resume-888')
  })
})
