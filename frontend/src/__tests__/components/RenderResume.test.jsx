import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RenderResume from '../../components/RenderResume'
import { DUMMY_RESUME_DATA } from '../../utils/data'

describe('RenderResume', () => {
  it('renders a registered template by id', () => {
    render(
      <RenderResume
        templateId='01'
        resumeData={DUMMY_RESUME_DATA}
        containerWidth={null}
      />
    )

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Alex Johnson')
  })

  it('falls back to the default template for unknown ids', () => {
    render(
      <RenderResume
        templateId='unknown-template'
        resumeData={DUMMY_RESUME_DATA}
        containerWidth={null}
      />
    )

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Alex Johnson')
  })

  it('renders free blocks in registered templates', () => {
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

    expect(screen.getByText('Awards')).toBeInTheDocument()
    expect(screen.getByText('Global Hackathon Winner')).toBeInTheDocument()
  })
})
