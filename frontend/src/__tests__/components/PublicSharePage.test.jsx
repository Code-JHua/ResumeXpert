import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import PublicSharePage from '../../pages/PublicSharePage'

const getMock = vi.fn()

vi.mock('../../utils/axiosInstance', () => ({
  default: {
    get: (...args) => getMock(...args),
  },
}))

vi.mock('../../components/RenderResume', () => ({
  default: ({ resumeData }) => <div>{resumeData.title}</div>,
}))

describe('PublicSharePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a published shared resume', async () => {
    getMock.mockResolvedValue({
      data: {
        title: 'Frontend Resume Share',
        lastPublishedAt: '2026-04-21T11:00:00.000Z',
        resume: {
          title: 'Frontend Resume',
          template: { theme: '01', colorPalette: [] },
        },
        themeSnapshot: {
          theme: '01',
        },
      },
    })

    render(
      <MemoryRouter initialEntries={['/s/frontend-resume-abc123']}>
        <Routes>
          <Route path='/s/:slug' element={<PublicSharePage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('Frontend Resume Share')).toBeInTheDocument()
    expect(await screen.findByText('Frontend Resume')).toBeInTheDocument()
  })

  it('shows an error when the share page is unavailable', async () => {
    getMock.mockRejectedValue({ response: { status: 404 } })

    render(
      <MemoryRouter initialEntries={['/s/missing-share']}>
        <Routes>
          <Route path='/s/:slug' element={<PublicSharePage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('该分享页已关闭或不存在。')).toBeInTheDocument()
  })

  it('shows access code prompt when the share page is password protected', async () => {
    getMock.mockRejectedValue({ response: { status: 401, data: { reason: 'password_required' } } })

    render(
      <MemoryRouter initialEntries={['/s/protected-share']} >
        <Routes>
          <Route path='/s/:slug' element={<PublicSharePage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('该分享页受访问码保护，请输入访问码。')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请输入访问码')).toBeInTheDocument()
  })
})
