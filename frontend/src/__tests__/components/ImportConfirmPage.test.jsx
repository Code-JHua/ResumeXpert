import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ImportConfirmPage from '../../pages/ImportConfirmPage'
import { UserContext } from '../../context/UserContext'

const navigateMock = vi.fn()
const getMock = vi.fn()
const putMock = vi.fn()

vi.mock('../../utils/axiosInstance', () => ({
  default: {
    get: (...args) => getMock(...args),
    put: (...args) => putMock(...args),
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
      <MemoryRouter initialEntries={['/imports/import-1/confirm']}>
        <Routes>
          <Route path='/imports/:id/confirm' element={<ImportConfirmPage />} />
        </Routes>
      </MemoryRouter>
    </UserContext.Provider>
  )
}

describe('ImportConfirmPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getMock.mockResolvedValue({
      data: {
        _id: 'import-1',
        sourceType: 'markdown',
        originalFileName: 'resume.md',
        status: 'needs_confirmation',
        rawText: '# Jane Doe',
        confidenceSummary: {
          high: 3,
          medium: 2,
          low: 1,
          fields: {
            fullName: 0.95,
            designation: 0.8,
            email: 0.95,
          },
        },
        unresolvedFields: ['contactInfo.phone'],
        mappedResumeDraft: {
          title: 'Frontend Resume',
          profileInfo: {
            fullName: 'Jane Doe',
            designation: 'Frontend Engineer',
            summary: 'Builds polished interfaces.',
          },
          contactInfo: {
            email: 'jane@example.com',
            phone: '',
          },
          workExperience: [
            {
              role: 'Frontend Engineer',
              company: 'ResumeXpert',
              description: 'Built import workflow.',
            },
          ],
          education: [
            {
              degree: 'BSc Computer Science',
              institution: 'Example University',
            },
          ],
          skills: [
            { name: 'React' },
            { name: 'Node.js' },
          ],
          freeBlocks: [
            {
              title: 'Awards',
              content: 'Hackathon Winner',
            },
          ],
        },
      },
    })
    putMock.mockResolvedValue({
      data: {
        resumeId: 'resume-123',
      },
    })
  })

  it('renders editable import draft details', async () => {
    renderPage()

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('导入确认')
    expect(await screen.findByDisplayValue('Frontend Resume')).toBeInTheDocument()
    expect((await screen.findAllByDisplayValue('Frontend Engineer')).length).toBeGreaterThan(0)
    expect(screen.getByText('高置信 3')).toBeInTheDocument()
    expect(screen.getByText('Awards')).toBeInTheDocument()
    expect(screen.getByText('contactInfo.phone')).toBeInTheDocument()
    expect(screen.getByText('fullName')).toBeInTheDocument()
    expect(screen.getAllByText('95%').length).toBeGreaterThan(0)
  })

  it('submits edited draft with manual corrections', async () => {
    renderPage()

    const user = userEvent.setup()

    await screen.findByDisplayValue('Frontend Resume')

    const designationInput = screen.getAllByPlaceholderText('职位')[0]
    await user.clear(designationInput)
    await user.type(designationInput, 'Senior Frontend Engineer')

    const workDescription = screen.getByDisplayValue('Built import workflow.')
    await user.clear(workDescription)
    await user.type(workDescription, 'Built import workflow and markdown editing.')

    await user.click(screen.getByText('确认并生成 Resume'))

    await waitFor(() => expect(putMock).toHaveBeenCalled())
    expect(putMock.mock.calls[0][0]).toBe('/api/imports/import-1/confirm')
    expect(putMock.mock.calls[0][1].mappedResumeDraft.profileInfo.designation).toBe('Senior Frontend Engineer')
    expect(putMock.mock.calls[0][1].manualCorrections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'profileInfo.designation', value: 'Senior Frontend Engineer' }),
        expect.objectContaining({ field: 'workExperience', value: expect.any(Array) }),
      ])
    )
    expect(navigateMock).toHaveBeenCalledWith('/resume/resume-123')
  })

  it('renders failed import state and lets user go back to imports', async () => {
    getMock.mockResolvedValueOnce({
      data: {
        _id: 'import-failed',
        sourceType: 'pdf',
        originalFileName: 'broken.pdf',
        status: 'failed',
        failureReason: '无法解析 PDF 文本',
        rawText: '',
        confidenceSummary: {},
        unresolvedFields: [],
        mappedResumeDraft: {},
      },
    })

    renderPage()
    const user = userEvent.setup()

    expect(await screen.findByText('导入失败')).toBeInTheDocument()
    expect(screen.getByText('无法解析 PDF 文本')).toBeInTheDocument()
    await user.click(screen.getByText('返回导入中心重试'))
    expect(navigateMock).toHaveBeenCalledWith('/imports')
  })
})
