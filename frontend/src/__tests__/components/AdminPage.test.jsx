import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminPage from '../../pages/AdminPage'
import { UserContext } from '../../context/UserContext'

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

vi.mock('../../components/RenderResume', () => ({
  default: ({ templateId }) => <div>{`Admin Preview: ${templateId}`}</div>,
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

const renderPage = (user) => render(
  <UserContext.Provider value={{ user, loading: false, updateUser: vi.fn(), clearUser: vi.fn() }}>
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path='/admin' element={<AdminPage />} />
      </Routes>
    </MemoryRouter>
  </UserContext.Provider>
)

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    getMock.mockImplementation((url) => {
      if (url === '/api/templates/review-queue') {
        return Promise.resolve({
          data: [
            {
              id: 'community-template',
              rendererKey: 'flex',
              name: 'Community Candidate',
              description: '待审核模板',
              sourceType: 'community',
              authorName: 'Creator',
              communityMeta: { reviewStatus: 'pending', submitterNote: 'Please review' },
            },
          ],
        })
      }

      if (url === '/api/admin/users') {
        return Promise.resolve({
          data: [
            {
              _id: 'user-1',
              name: 'Normal User',
              email: 'user@example.com',
              role: 'user',
              status: 'active',
              createdAt: '2026-04-25T10:00:00.000Z',
            },
          ],
        })
      }

      if (url === '/api/admin/users/user-1') {
        return Promise.resolve({
          data: {
            _id: 'user-1',
            name: 'Normal User',
            email: 'user@example.com',
            role: 'user',
            status: 'active',
            createdAt: '2026-04-25T10:00:00.000Z',
          },
        })
      }

      return Promise.resolve({ data: {} })
    })

    postMock.mockResolvedValue({ data: { message: 'ok' } })
    putMock.mockResolvedValue({
      data: {
        _id: 'user-1',
        name: 'Normal User',
        email: 'user@example.com',
        role: 'user',
        status: 'disabled',
        createdAt: '2026-04-25T10:00:00.000Z',
      },
    })
  })

  it('blocks non-admin users', async () => {
    renderPage({ name: 'User', role: 'user', status: 'active' })

    expect(await screen.findByText('当前账号没有管理员权限')).toBeInTheDocument()
  })

  it('renders review and user management tools for admins', async () => {
    renderPage({ name: 'Admin', role: 'admin', status: 'active' })
    const user = userEvent.setup()

    expect(await screen.findByText('管理员后台')).toBeInTheDocument()
    expect((await screen.findAllByText('Community Candidate')).length).toBeGreaterThan(0)

    await user.click(screen.getByText('用户管理'))

    expect((await screen.findAllByText('Normal User')).length).toBeGreaterThan(0)
    await user.click(screen.getByText('停用账号'))

    await waitFor(() => {
      expect(putMock).toHaveBeenCalledWith('/api/admin/users/user-1/status', { status: 'disabled' })
    })
  })
})
