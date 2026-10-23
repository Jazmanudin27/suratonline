/**
 * General Purpose Application Helpers
 */

export const debounce = (func, wait = 300) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export const throttle = (func, limit = 300) => {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export const generateId = (prefix = 'id') => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.style.display = 'none'
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

export const isCrmOrIt = (user) => {
  if (!user) return false
  const kode = String(user.kodeJabatan || '').toUpperCase().trim()
  const pos = String(user.position || '').toUpperCase()
  const roleLabel = String(user.roleLabel || '').toUpperCase()
  const role = String(user.role || '').toUpperCase()
  const username = String(user.username || '').toLowerCase()

  // J26 = CRM, J27 = IT
  if (kode === 'J26' || kode === 'J27') return true
  if (pos.includes('CRM') || /\bIT\b/.test(pos) || pos.includes('INFORMATION TECHNOLOGY')) return true
  if (roleLabel.includes('CRM') || /\bIT\b/.test(roleLabel)) return true
  if (role === 'ADMIN_PUSAT') return true
  if (username.includes('crm') || username === 'jazmanudin') return true
  return false
}

export const isDirekturUser = (user) => {
  if (!user) return false
  const kode = String(user.kodeJabatan || '').toUpperCase().trim()
  const pos = String(user.position || '').toUpperCase()
  const roleLabel = String(user.roleLabel || '').toUpperCase()
  const name = String(user.name || '').toLowerCase()
  const username = String(user.username || '').toLowerCase()

  if (kode === 'J01') return true
  if (pos.includes('DIREKTUR')) return true
  if (roleLabel.includes('DIREKTUR')) return true
  if (name.includes('jemmy') || username.includes('jemmy')) return true
  return false
}
