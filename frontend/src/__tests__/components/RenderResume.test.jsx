import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import RenderResume from '../../components/RenderResume'
import { DUMMY_RESUME_DATA } from '../../utils/data'

describe('RenderResume', () => {
  it('renders a registered template by id', async () => {
    render(
      <RenderResume
        templateId='01'
        resumeData={DUMMY_RESUME_DATA}
        containerWidth={null}
      />
    )

    await waitFor(() => {
      expect(document.querySelector('a[href="mailto:alex.johnson.dev@gmail.com"]')).toBeInTheDocument()
    })
  })

  it('falls back to the default template for unknown ids', async () => {
    render(
      <RenderResume
        templateId='unknown-template'
        resumeData={DUMMY_RESUME_DATA}
        containerWidth={null}
      />
    )

    await waitFor(() => {
      expect(document.querySelector('a[href="mailto:alex.johnson.dev@gmail.com"]')).toBeInTheDocument()
    })
  })

  it('renders free blocks in registered templates', async () => {
    render(
      <RenderResume
        templateId='01'
        resumeData={{
          ...DUMMY_RESUME_DATA,
          freeBlocks: [
            {
              title: 'Awards',
              content: 'Global Hackathon Winner',
              source: 'markdown',
            },
          ],
        }}
        containerWidth={null}
      />
    )

    expect(await screen.findByText('Awards')).toBeInTheDocument()
    expect(await screen.findByText('Global Hackathon Winner')).toBeInTheDocument()
  })
})
