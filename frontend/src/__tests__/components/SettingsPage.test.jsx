import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsPage from '../../pages/SettingsPage'
import { UserContext } from '../../context/UserContext'
import { createTestQueryClient } from '../testQueryClient'

const putMock = vi.fn()
const changeLanguageMock = vi.fn()

vi.mock('../../utils/axiosInstance', () => ({
  default: {
    put: (...args) => putMock(...args),
  },
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
      changeLanguage: changeLanguageMock,
    },
  }),
}))

const renderPage = (contextValue) => render(
  <QueryClientProvider client={createTestQueryClient()}>
    <UserContext.Provider value={contextValue}>
      <MemoryRouter initialEntries={['/settings']}>
        <Routes>
          <Route path='/settings' element={<SettingsPage />} />
          <Route path='/' element={<div>landing</div>} />
        </Routes>
      </MemoryRouter>
    </UserContext.Provider>
  </QueryClientProvider>
)

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    putMock.mockImplementation((url, body) => {
      if (url === '/api/auth/profile') {
        return Promise.resolve({
          data: {
            _id: 'user-1',
            name: body.name,
            email: 'hua@example.com',
            role: 'user',
            status: 'active',
          },
        })
      }

      if (url === '/api/auth/password') {
        return Promise.resolve({
          data: { message: 'Password updated successfully' },
        })
      }

      return Promise.resolve({ data: {} })
    })
  })

  it('renders account data and saves profile and password changes', async () => {
    const updateUser = vi.fn()
    renderPage({
      user: { _id: 'user-1', name: 'Hua', email: 'hua@example.com', role: 'user', status: 'active' },
      loading: false,
      updateUser,
      clearUser: vi.fn(),
    })
    const user = userEvent.setup()

    expect(await screen.findByText('账户与偏好设置')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Hua')).toBeInTheDocument()
    expect(screen.getByDisplayValue('hua@example.com')).toBeInTheDocument()

    const nameInput = screen.getByDisplayValue('Hua')
    await user.clear(nameInput)
    await user.type(nameInput, 'New Hua')
    await user.click(screen.getByText('保存资料'))

    await waitFor(() => {
      expect(putMock).toHaveBeenCalledWith('/api/auth/profile', { name: 'New Hua' })
      expect(updateUser).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Hua' }))
    })

    await user.type(screen.getByPlaceholderText('请输入新的登录密码（至少 8 位）'), 'newpassword123')
    await user.click(screen.getByText('更新密码'))

    await waitFor(() => {
      expect(putMock).toHaveBeenCalledWith('/api/auth/password', { newPassword: 'newpassword123' })
    })
  })

  it('toggles language and persists the new language locally', async () => {
    renderPage({
      user: { _id: 'user-1', name: 'Hua', email: 'hua@example.com', role: 'user', status: 'active' },
      loading: false,
      updateUser: vi.fn(),
      clearUser: vi.fn(),
    })

    const languageButtons = await screen.findAllByLabelText('common.language')
    fireEvent.click(languageButtons[languageButtons.length - 1])

    expect(changeLanguageMock).toHaveBeenCalledWith('en')
    expect(localStorage.getItem('resumexpert-language')).toBe('en')
  })

  it('redirects unauthenticated users to landing page', () => {
    renderPage({
      user: null,
      loading: false,
      updateUser: vi.fn(),
      clearUser: vi.fn(),
    })

    expect(screen.getByText('landing')).toBeInTheDocument()
  })
})
