/**
 * Standard Data Formatters
 */

export const formatRupiah = (number) => {
  if (number === null || number === undefined || isNaN(number)) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number)
}

export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      ...options,
    }).format(date)
  } catch (e) {
    return dateString
  }
}

export const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch (e) {
    return dateString
  }
}

export const getStatusBadgeClass = (status) => {
  const normalized = String(status || '').toLowerCase()
  switch (normalized) {
    case 'approved':
    case 'disetujui':
    case 'selesai':
      return 'badge-success'
    case 'rejected':
    case 'ditolak':
      return 'badge-danger'
    case 'pending':
    case 'menunggu':
    case 'proses':
      return 'badge-warning'
    case 'revision':
    case 'revisi':
      return 'badge-info'
    default:
      return 'badge-secondary'
  }
}

export const truncate = (text, maxLength = 60) => {
  if (!text || typeof text !== 'string') return ''
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
}
