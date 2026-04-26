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
