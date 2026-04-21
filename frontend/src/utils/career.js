export const APPLICATION_STATUS_LABELS = {
  draft: '草稿',
  applied: '已投递',
  written_test: '笔试',
  first_interview: '一面',
  second_interview: '二面',
  hr_interview: 'HR 面',
  offer: 'Offer',
  rejected: '已淘汰',
  archived: '已归档',
}

export const APPLICATION_STATUS_OPTIONS = Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

export const formatDateTime = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatDate = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('zh-CN')
}
