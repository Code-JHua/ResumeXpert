import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import CareerNav from '../../components/CareerNav'

describe('CareerNav', () => {
  it('renders links for the new career modules', () => {
    render(
      <MemoryRouter>
        <CareerNav />
      </MemoryRouter>
    )

    expect(screen.getByText('简历中心')).toBeInTheDocument()
    expect(screen.getByText('导入中心')).toBeInTheDocument()
    expect(screen.getByText('岗位 / ATS')).toBeInTheDocument()
    expect(screen.getByText('求职信')).toBeInTheDocument()
    expect(screen.getByText('投递管理')).toBeInTheDocument()
    expect(screen.getByText('分享管理')).toBeInTheDocument()
  })
})
