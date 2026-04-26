import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import CareerNav from '../../components/CareerNav'

describe('CareerNav', () => {
  it('renders resume, share, template, and settings links', () => {
    render(
      <MemoryRouter>
        <CareerNav />
      </MemoryRouter>
    )

    expect(screen.getByText('简历中心')).toBeInTheDocument()
    expect(screen.getByText('分享管理')).toBeInTheDocument()
    expect(screen.getByText('模板中心')).toBeInTheDocument()
    expect(screen.getByText('设置')).toBeInTheDocument()
    expect(screen.queryByText('导入中心')).not.toBeInTheDocument()
    expect(screen.queryByText('岗位 / ATS')).not.toBeInTheDocument()
    expect(screen.queryByText('求职信')).not.toBeInTheDocument()
    expect(screen.queryByText('投递管理')).not.toBeInTheDocument()
    expect(screen.queryByText('资产图谱')).not.toBeInTheDocument()
  })
})
