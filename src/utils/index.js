import { $, $$, addClass, removeClass, toggleClass, scrollToElement, copyToClipboard } from './dom'
import { formatRupiah, formatDate, formatDateTime, getStatusBadgeClass, truncate } from './formatters'
import { debounce, throttle, generateId, downloadBlob, isCrmOrIt, isDirekturUser } from './helpers'
import { notify } from './alert'

// Export all utilities for modular imports: import { $, formatRupiah } from '../utils'
export {
  $,
  $$,
  addClass,
  removeClass,
  toggleClass,
  scrollToElement,
  copyToClipboard,
  formatRupiah,
  formatDate,
  formatDateTime,
  getStatusBadgeClass,
  truncate,
  debounce,
  throttle,
  generateId,
  downloadBlob,
  isCrmOrIt,
  isDirekturUser,
  notify,
}

// Global scope attachment for jQuery/Bootstrap style developer experience
if (typeof window !== 'undefined') {
  window.$ = window.$ || $
  window.$$ = window.$$ || $$
  window.$app = {
    $,
    $$,
    addClass,
    removeClass,
    toggleClass,
    scrollToElement,
    copyToClipboard,
    formatRupiah,
    formatDate,
    formatDateTime,
    getStatusBadgeClass,
    truncate,
    debounce,
    throttle,
    generateId,
    downloadBlob,
    notify,
  }
}
