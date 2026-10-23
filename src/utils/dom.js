/**
 * jQuery-like DOM helper utilities
 * Dapat di-import di komponen mana saja atau diakses via window.$
 */

export const $ = (selector, context = document) => {
  if (typeof selector !== 'string') return selector
  return context.querySelector(selector)
}

export const $$ = (selector, context = document) => {
  if (typeof selector !== 'string') return []
  return Array.from(context.querySelectorAll(selector))
}

export const addClass = (el, ...classNames) => {
  const target = typeof el === 'string' ? $(el) : el
  if (target && target.classList) {
    target.classList.add(...classNames)
  }
}

export const removeClass = (el, ...classNames) => {
  const target = typeof el === 'string' ? $(el) : el
  if (target && target.classList) {
    target.classList.remove(...classNames)
  }
}

export const toggleClass = (el, className) => {
  const target = typeof el === 'string' ? $(el) : el
  if (target && target.classList) {
    return target.classList.toggle(className)
  }
}

export const scrollToElement = (selector, options = { behavior: 'smooth', block: 'start' }) => {
  const el = typeof selector === 'string' ? $(selector) : selector
  if (el) el.scrollIntoView(options)
}

export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      const successful = document.execCommand('copy')
      document.body.removeChild(textarea)
      return successful
    }
  } catch (err) {
    console.error('Gagal menyalin:', err)
    return false
  }
}
