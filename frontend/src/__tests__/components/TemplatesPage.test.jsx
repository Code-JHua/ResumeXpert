import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TemplatesPage from '../../pages/TemplatesPage'
import { UserContext } from '../../context/UserContext'
import { createTestQueryClient } from '../testQueryClient'

const getMock = vi.fn()
const postMock = vi.fn()
const putMock = vi.fn()
const deleteMock = vi.fn()

vi.mock('../../utils/axiosInstance', () => ({
  default: {
    get: (...args) => getMock(...args),
    post: (...args) => postMock(...args),
    put: (...args) => putMock(...args),
    delete: (...args) => deleteMock(...args),
  },
}))

vi.mock('../../components/RenderResume', () => ({
  default: ({ resumeData, templateId }) => <div>{`Preview ${templateId}: ${resumeData.title}`}</div>,
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
    <UserContext.Provider value={{ user: { name: 'Test User', role: 'user', status: 'active' }, loading: false, updateUser: vi.fn(), clearUser: vi.fn() }}>
      <MemoryRouter initialEntries={['/templates']}>
        <Routes>
          <Route path='/templates' element={<TemplatesPage />} />
        </Routes>
      </MemoryRouter>
    </UserContext.Provider>
  </QueryClientProvider>
)

describe('TemplatesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    getMock.mockImplementation((url) => {
      if (url === '/api/templates') {
        return Promise.resolve({
          data: [
            {
              id: 'official-classic-professional',
              templateId: 'official-classic-professional',
              rendererKey: 'flex',
              name: 'Classic Professional',
              description: '稳健清晰的官方模板',
              sourceType: 'official',
              authorName: 'ResumeXpert',
              tags: ['official'],
              communityMeta: { reviewStatus: 'official' },
              themeSchema: { defaultConfig: {}, presets: [], supportedOptions: [] },
              blockSchema: { layoutMode: 'two-column', availableLayouts: ['single', 'two-column'], blocks: [] },
              allowDuplicate: true,
              isOwned: false,
              isFavorite: false,
            },
            {
              id: 'custom-template-1',
              templateId: 'custom-template-1',
              rendererKey: '01',
              name: 'My Custom Template',
              description: '我的个人模板',
              sourceType: 'custom',
              authorName: 'Test User',
              tags: ['personal'],
              category: 'general',
              communityMeta: { reviewStatus: 'reserved', submitterNote: '' },
              themeSchema: { defaultConfig: {}, presets: [], supportedOptions: [] },
              blockSchema: { layoutMode: 'two-column', availableLayouts: ['single', 'two-column'], blocks: [] },
              allowDuplicate: true,
              isOwned: true,
              isFavorite: false,
            },
          ],
        })
      }

      if (url === '/api/templates/official-classic-professional') {
        return Promise.resolve({
          data: {
            id: 'official-classic-professional',
            templateId: 'official-classic-professional',
            rendererKey: 'flex',
            name: 'Classic Professional',
            description: '稳健清晰的官方模板',
            sourceType: 'official',
            authorName: 'ResumeXpert',
            tags: ['official'],
            communityMeta: { reviewStatus: 'official' },
            themeSchema: { defaultConfig: {}, presets: [], supportedOptions: [] },
            blockSchema: { layoutMode: 'two-column', availableLayouts: ['single', 'two-column'], blocks: [] },
            allowDuplicate: true,
            isOwned: false,
            isFavorite: false,
          },
        })
      }

      if (url === '/api/templates/custom-template-1') {
        return Promise.resolve({
          data: {
            id: 'custom-template-1',
            templateId: 'custom-template-1',
            rendererKey: '01',
            name: 'My Custom Template',
            description: '我的个人模板',
            sourceType: 'custom',
            authorName: 'Test User',
            tags: ['personal'],
            category: 'general',
            communityMeta: { reviewStatus: 'reserved', submitterNote: '' },
            themeSchema: { defaultConfig: {}, presets: [], supportedOptions: [] },
            blockSchema: { layoutMode: 'two-column', availableLayouts: ['single', 'two-column'], blocks: [] },
            allowDuplicate: true,
            isOwned: true,
            isFavorite: false,
          },
        })
      }

      return Promise.resolve({ data: {} })
    })

    postMock.mockImplementation((url) => {
      if (url === '/api/templates/official-classic-professional/duplicate') {
        return Promise.resolve({
          data: {
            id: 'custom-template-2',
            templateId: 'custom-template-2',
            rendererKey: 'flex',
            name: 'Classic Professional 副本 1',
            description: '基于 Classic Professional 复制的个人模板',
            sourceType: 'custom',
            authorName: 'Test User',
            tags: ['official', 'custom-copy'],
            category: 'general',
            communityMeta: { reviewStatus: 'reserved', submitterNote: '' },
            themeSchema: { defaultConfig: { accentColor: '#4f46e5' }, presets: [], supportedOptions: ['accentColor'] },
            blockSchema: { layoutMode: 'two-column', availableLayouts: ['single', 'two-column'], blocks: [] },
            allowDuplicate: true,
            isOwned: true,
            isFavorite: false,
          },
        })
      }

      return Promise.resolve({ data: {} })
    })
    putMock.mockResolvedValue({ data: { id: 'custom-template-1' } })
    deleteMock.mockResolvedValue({ data: { message: 'Template deleted successfully', id: 'custom-template-1' } })
  })

  it('focuses on template management, shows author, and supports owned layout editing', async () => {
    renderPage()
    const user = userEvent.setup()

    expect(await screen.findByText('模板管理中心')).toBeInTheDocument()
    expect(screen.queryByText('立即套用模板')).not.toBeInTheDocument()
    expect(screen.queryByText('选择要套用的简历')).not.toBeInTheDocument()
    expect(screen.queryByText('套用前微调')).not.toBeInTheDocument()
    expect(await screen.findByText('新建模板')).toBeInTheDocument()
    expect((await screen.findAllByText('作者：ResumeXpert')).length).toBeGreaterThan(0)
    expect(await screen.findByText('复制为我的模板')).toBeInTheDocument()

    await user.click(screen.getByText('复制为我的模板'))

    await waitFor(() => {
      expect(postMock).toHaveBeenCalledWith('/api/templates/official-classic-professional/duplicate')
    })

    await user.click(await screen.findByText('My Custom Template'))
    expect((await screen.findAllByText('排版编辑')).length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: '模板详情' }))
    expect(screen.getByText('作者：Test User')).toBeInTheDocument()

    const nameInput = screen.getByDisplayValue('My Custom Template')
    await user.clear(nameInput)
    await user.type(nameInput, 'My Custom Template Updated')
    expect(screen.getByRole('button', { name: /模板详情/i }).querySelector('span.h-2\\.5.w-2\\.5')).not.toBeNull()
    expect(screen.getByRole('button', { name: /排版编辑/i }).querySelector('span.h-2\\.5.w-2\\.5')).toBeNull()
    await user.click(screen.getByText('保存模板'))

    await waitFor(() => {
      expect(putMock).toHaveBeenCalledWith(
        '/api/templates/custom-template-1',
        expect.objectContaining({
          name: 'My Custom Template Updated',
          themeSchema: expect.any(Object),
          blockSchema: expect.any(Object),
        })
      )
    })

    await waitFor(() => {
      expect(getMock).not.toHaveBeenCalledWith('/api/resume')
    })
  })
})
