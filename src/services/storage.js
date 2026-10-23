import { api } from './api'

const STORAGE_KEYS = {
  USERS: 'suratajuan_users_v2',
  CURRENT_USER: 'suratajuan_current_user_v2',
  BRANCHES: 'suratajuan_branches_v2',
  TEMPLATES: 'suratajuan_templates_v2',
  LETTERS: 'suratajuan_letters_v2',
  NOTIFICATIONS: 'suratajuan_notifications_v2',
  AUDIT_LOGS: 'suratajuan_audit_logs_v2',
  CATEGORIES: 'suratajuan_categories_v2',
  GLOBAL_DEFAULT_VIEWERS: 'suratajuan_global_default_viewers_v2',
  JABATAN: 'suratajuan_jabatan_v2',
}

// Convert month number to Roman numerals
export const getRomanMonth = (date = new Date()) => {
  const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
  return romanMonths[date.getMonth()]
}

export const formatRupiah = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '0'
  return new Intl.NumberFormat('id-ID').format(Number(val))
}

export const formatDateId = (dateString) => {
  if (!dateString) return '-'
  try {
    const d = new Date(dateString)
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}

export const formatDateTimeId = (dateString) => {
  if (!dateString) return '-'
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return dateString
    const datePart = d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    const timePart = d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).replace(/\./g, ':')
    return `${datePart} • ${timePart} WIB`
  } catch {
    return dateString
  }
}

// ==========================================
// IndexedDB Engine & Resilient Storage
// ==========================================
const IDB_NAME = 'suratajuan_db_v2'
const IDB_STORE = 'app_data'

let idbPromise = null
const getIDB = () => {
  if (idbPromise) return idbPromise
  if (typeof indexedDB === 'undefined') return Promise.resolve(null)
  idbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1)
      req.onupgradeneeded = (e) => {
        const db = e.target.result
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE)
        }
      }
      req.onsuccess = (e) => resolve(e.target.result)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
  return idbPromise
}

export const idbSet = async (key, val) => {
  try {
    const db = await getIDB()
    if (!db) return
    const tx = db.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).put(val, key)
  } catch (err) {
    console.warn('IDB write failed:', err)
  }
}

export const idbGet = async (key) => {
  try {
    const db = await getIDB()
    if (!db) return null
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly')
      const req = tx.objectStore(IDB_STORE).get(key)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

// In-memory cache for synchronous operations (e.g. getLetters)
let lettersMemoryCache = null

// Helper to sanitize duplicate base64 inside fieldValues & formData
// Helper to sanitize duplicate base64 inside fieldValues & formData while preserving URLs
const deduplicateLetterAttachments = (letter) => {
  if (!letter || typeof letter !== 'object') return letter
  const metaOnly = Array.isArray(letter.attachments)
    ? letter.attachments.map((a) => {
        const resolvedUrl = a.url || (typeof a.dataUrl === 'string' && (a.dataUrl.startsWith('/lampiran') || a.dataUrl.startsWith('http')) ? a.dataUrl : '')
        return {
          id: a.id,
          name: a.name,
          size: a.size,
          extension: a.extension,
          category: a.category,
          url: resolvedUrl,
          dataUrl: resolvedUrl,
          uploadedAt: a.uploadedAt,
        }
      })
    : []

  const clean = { ...letter }
  if (clean.fieldValues && clean.fieldValues.attachments) {
    clean.fieldValues = {
      ...clean.fieldValues,
      attachments: metaOnly,
    }
  }
  if (clean.formData && clean.formData.attachments) {
    clean.formData = {
      ...clean.formData,
      attachments: metaOnly,
    }
  }
  return clean
}

// Storage Helpers
const getStorageItem = (key, fallback) => {
  if (key === STORAGE_KEYS.LETTERS && lettersMemoryCache) {
    return lettersMemoryCache
  }
  try {
    const item = localStorage.getItem(key)
    const parsed = item ? JSON.parse(item) : fallback
    if (key === STORAGE_KEYS.LETTERS && Array.isArray(parsed)) {
      lettersMemoryCache = parsed
    }
    return parsed
  } catch (e) {
    console.error('Storage read error:', e)
    return fallback
  }
}

const setStorageItem = (key, value) => {
  if (key === STORAGE_KEYS.LETTERS) {
    lettersMemoryCache = value
  }

  // Backup data ke IndexedDB (kapasitas ratusan MB tanpa limit 5MB localStorage)
  idbSet(key, value)

  try {
    // Bersihkan duplikasi lampiran sebelum ke localStorage
    const cleanValue =
      key === STORAGE_KEYS.LETTERS && Array.isArray(value)
        ? value.map(deduplicateLetterAttachments)
        : value

    localStorage.setItem(key, JSON.stringify(cleanValue))
  } catch (e) {
    console.warn(`LocalStorage quota reached for key "${key}". Menggunakan IndexedDB persistent store & cache optimizer...`)

    if (key === STORAGE_KEYS.LETTERS && Array.isArray(value)) {
      try {
        // Optimasi untuk localStorage: simpan lampiran penuh hanya untuk surat terbaru,
        // surat lama disimpan metadata & URL-nya (data penuh tetap aman di IndexedDB & memory cache)
        const optimized = value.map((ltr, idx) => {
          const isRecent = idx < 3
          const base = deduplicateLetterAttachments(ltr)
          if (!isRecent && Array.isArray(base.attachments)) {
            return {
              ...base,
              attachments: base.attachments.map((a) => {
                const url = a.url || (typeof a.dataUrl === 'string' && (a.dataUrl.startsWith('/lampiran') || a.dataUrl.startsWith('http')) ? a.dataUrl : '')
                return {
                  ...a,
                  url,
                  dataUrl: url || (a.dataUrl && a.dataUrl.length > 150000 ? '' : a.dataUrl),
                }
              }),
            }
          }
          return base
        })

        localStorage.setItem(key, JSON.stringify(optimized))
        console.info('Penyimpanan lokal berhasil dioptimasi.')
      } catch (retryErr) {
        // Fallback terakhir: simpan 5 surat paling baru ke localStorage
        try {
          const minimal = value.slice(0, 5).map(deduplicateLetterAttachments)
          localStorage.setItem(key, JSON.stringify(minimal))
        } catch {
          // Tidak crash; data tetap ada di lettersMemoryCache dan IndexedDB
        }
      }
    }
  }
}

// Hydrate letters dari IndexedDB saat aplikasi pertama kali dimuat
if (typeof window !== 'undefined') {
  idbGet(STORAGE_KEYS.LETTERS)
    .then((idbLetters) => {
      if (Array.isArray(idbLetters) && idbLetters.length > 0) {
        lettersMemoryCache = idbLetters
        window.dispatchEvent(new Event('letters_change'))
      }
    })
    .catch(() => {})
}

// Initialize seed data and sync from MySQL API
export const syncWithDatabase = async () => {
  try {
    const [branchesData, usersData, templatesData, lettersData, globalViewersData, jabatanData] = await Promise.all([
      api.getCabang(),
      api.getUsers(),
      api.getTemplates(),
      api.getLetters(),
      api.getSetting('global_default_viewers'),
      api.getJabatan(),
    ])

    if (Array.isArray(globalViewersData)) {
      setStorageItem(STORAGE_KEYS.GLOBAL_DEFAULT_VIEWERS, globalViewersData)
      window.dispatchEvent(new Event('global_viewers_change'))
    }

    if (Array.isArray(branchesData) && branchesData.length > 0) {
      // Simpan cabang resmi langsung dari database MySQL
      const currentSavedBranches = getStorageItem(STORAGE_KEYS.BRANCHES, [])
      const mergedBranches = branchesData.map((remote) => {
        const existing = currentSavedBranches.find(
          (b) => b.id === remote.id || b.code === remote.code || b.id === remote.code
        )
        return {
          ...remote,
          madeBy: existing?.madeBy || '',
          madeByPosition: existing?.madeByPosition || '',
          knownBy: existing?.knownBy || '',
          knownByPosition: existing?.knownByPosition || '',
        }
      })
      setStorageItem(STORAGE_KEYS.BRANCHES, mergedBranches)
      window.dispatchEvent(new Event('branches_change'))
    }

    if (Array.isArray(usersData) && usersData.length > 0) {
      setStorageItem(STORAGE_KEYS.USERS, usersData)
      window.dispatchEvent(new Event('users_change'))
    }

    if (Array.isArray(jabatanData) && jabatanData.length > 0) {
      setStorageItem(STORAGE_KEYS.JABATAN, jabatanData)
      window.dispatchEvent(new Event('jabatan_change'))
    }

    if (Array.isArray(templatesData) && templatesData.length > 0) {
      setStorageItem(STORAGE_KEYS.TEMPLATES, templatesData)
      window.dispatchEvent(new Event('templates_change'))
    }

    // Single source of truth untuk surat: sinkronkan dengan database dan pertahankan lampiran fisik & komentar
    if (Array.isArray(lettersData)) {
      const currentLetters = getStorageItem(STORAGE_KEYS.LETTERS, [])
      const mergedLetters = lettersData.map((remote) => {
        const local = currentLetters.find((l) => l.id === remote.id)
        const remoteComments = Array.isArray(remote.comments) ? remote.comments : []
        const localComments = Array.isArray(local?.comments) ? local.comments : []

        const commentMap = new Map()
        localComments.forEach((c) => { if (c && c.id) commentMap.set(c.id, c) })
        remoteComments.forEach((c) => { if (c && c.id) commentMap.set(c.id, c) })

        const rawRemoteAtts = (Array.isArray(remote.attachments) && remote.attachments.length > 0)
          ? remote.attachments
          : ((remote.fieldValues && Array.isArray(remote.fieldValues.attachments) && remote.fieldValues.attachments.length > 0)
              ? remote.fieldValues.attachments
              : [])

        const localAtts = Array.isArray(local?.attachments)
          ? local.attachments
          : ((local?.fieldValues && Array.isArray(local.fieldValues.attachments)) ? local.fieldValues.attachments : [])

        // Penggabungan lampiran pintar: Jangan biarkan url / dataUrl lokal terhapus jika remote kosong
        const mergedAtts = rawRemoteAtts.length > 0
          ? rawRemoteAtts.map((ra) => {
              const la = localAtts.find((item) => item.id === ra.id || item.name === ra.name) || {}
              const resolvedUrl = ra.url || (typeof ra.dataUrl === 'string' && (ra.dataUrl.startsWith('/lampiran') || ra.dataUrl.startsWith('http')) ? ra.dataUrl : '') || la.url || (typeof la.dataUrl === 'string' && (la.dataUrl.startsWith('/lampiran') || la.dataUrl.startsWith('http')) ? la.dataUrl : '')
              const resolvedDataUrl = (typeof ra.dataUrl === 'string' && ra.dataUrl.length > 50)
                ? ra.dataUrl
                : (la.dataUrl || resolvedUrl || la.url || '')
              return {
                ...la,
                ...ra,
                url: resolvedUrl,
                dataUrl: resolvedDataUrl,
              }
            })
          : localAtts

        return {
          ...remote,
          attachments: mergedAtts,
          fieldValues: {
            ...(remote.fieldValues || {}),
            attachments: mergedAtts,
          },
          comments: Array.from(commentMap.values()),
        }
      })

      // Gunakan lettersData dari database MySQL sebagai satu-satunya kebenaran
      const fakeLetterIds = new Set(['ltr-001', 'ltr-002', 'ltr-003'])
      const cleanCurrentLetters = currentLetters.filter((l) => l && l.id && !fakeLetterIds.has(l.id))
      const remoteIds = new Set(lettersData.map((r) => r.id))
      const localOnlyLetters = cleanCurrentLetters.filter((l) => l && l.id && !remoteIds.has(l.id) && !fakeLetterIds.has(l.id))
      const finalLetters = [...mergedLetters, ...localOnlyLetters]

      setStorageItem(STORAGE_KEYS.LETTERS, finalLetters)
      window.dispatchEvent(new Event('letters_change'))
    }
  } catch (err) {
    console.warn('API sync in background skipped or offline:', err.message)
  }
}

export const initializeStorage = async () => {
  // 1. Bersihkan sisa data dummy / fake lama dari localStorage & IndexedDB jika ada
  try {
    const fakeIds = ['ltr-001', 'ltr-002', 'ltr-003']
    const rawLetters = localStorage.getItem(STORAGE_KEYS.LETTERS)
    if (rawLetters) {
      const parsed = JSON.parse(rawLetters)
      if (Array.isArray(parsed) && parsed.some((p) => fakeIds.includes(p?.id))) {
        const cleaned = parsed.filter((p) => !fakeIds.includes(p?.id))
        setStorageItem(STORAGE_KEYS.LETTERS, cleaned)
      }
    }
    const fakeTpls = ['tpl-perdin', 'tpl-service', 'tpl-diskon-crm', 'tpl-cuti']
    const rawTpls = localStorage.getItem(STORAGE_KEYS.TEMPLATES)
    if (rawTpls) {
      const parsedT = JSON.parse(rawTpls)
      if (Array.isArray(parsedT) && parsedT.some((p) => fakeTpls.includes(p?.id))) {
        const cleanedT = parsedT.filter((p) => !fakeTpls.includes(p?.id))
        setStorageItem(STORAGE_KEYS.TEMPLATES, cleanedT)
      }
    }
  } catch (cleanErr) {
    console.warn('Storage cleanup:', cleanErr.message)
  }

  // 2. Hydrate dari IndexedDB terlebih dahulu agar lampiran utuh terbaca sebelum sync API
  try {
    const idbLetters = await idbGet(STORAGE_KEYS.LETTERS)
    if (Array.isArray(idbLetters) && idbLetters.length > 0) {
      const fakeIds = new Set(['ltr-001', 'ltr-002', 'ltr-003'])
      lettersMemoryCache = idbLetters.filter((l) => l && !fakeIds.has(l.id))
      window.dispatchEvent(new Event('letters_change'))
    }
  } catch (e) {
    console.warn('IDB early hydration failed:', e)
  }

  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    setStorageItem(STORAGE_KEYS.USERS, [])
  }
  if (!localStorage.getItem(STORAGE_KEYS.BRANCHES)) {
    setStorageItem(STORAGE_KEYS.BRANCHES, [])
  }
  if (!localStorage.getItem(STORAGE_KEYS.TEMPLATES)) {
    setStorageItem(STORAGE_KEYS.TEMPLATES, [])
  }
  if (localStorage.getItem(STORAGE_KEYS.LETTERS) === null && !lettersMemoryCache) {
    setStorageItem(STORAGE_KEYS.LETTERS, [])
  }

  // Sinkronisasi data real-time dengan MySQL
  await syncWithDatabase()
}

// User & Auth Management
export const getUsers = () => getStorageItem(STORAGE_KEYS.USERS, [])
export const getJabatan = () => getStorageItem(STORAGE_KEYS.JABATAN, [])
export const getCurrentUser = () => {
  const user = getStorageItem(STORAGE_KEYS.CURRENT_USER, null)
  if (user) return user
  const users = getUsers()
  return users.length > 0 ? users[0] : null
}
export const setCurrentUser = (user) => {
  if (user) {
    setStorageItem(STORAGE_KEYS.CURRENT_USER, user)
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
  }
  window.dispatchEvent(new Event('auth_change'))
}

export const clearCurrentUser = () => {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
  window.dispatchEvent(new Event('auth_change'))
}

// Branches
export const getBranches = () => {
  const branches = getStorageItem(STORAGE_KEYS.BRANCHES, [])
  return branches.map((b) => ({
    ...b,
    madeBy: b.madeBy || '',
    madeByPosition: b.madeByPosition || '',
    knownBy: b.knownBy || '',
    knownByPosition: b.knownByPosition || '',
    rsmId: b.rsmId || '',
    rsmName: b.rsmName || '',
    regionalName: b.regionalName || '',
  }))
}

export const saveBranch = (branch) => {
  const branches = getBranches()
  const idx = branches.findIndex(
    (b) => b.id === branch.id || (branch.code && b.code === branch.code)
  )
  if (idx >= 0) {
    branches[idx] = { ...branches[idx], ...branch }
  } else {
    branches.push({ ...branch, id: branch.id || `CBG-${Date.now().toString(36).toUpperCase()}` })
  }
  setStorageItem(STORAGE_KEYS.BRANCHES, branches)
  window.dispatchEvent(new Event('branches_change'))
  return branches
}

// Templates
export const BLANK_TEMPLATE = {
  id: 'custom_blank',
  name: 'Surat Ajuan Mandiri (Tanpa Template)',
  code: 'MANDIRI',
  category: 'Mandiri',
  description: 'Tulis isi surat pengajuan secara bebas dan fleksibel menggunakan editor Word lengkap.',
  isCustom: true,
  isManualNumber: true,
  numberFormat: '{{year}}/{{branch_code}}/SP/{{roman_month}}/{{seq}}',
  allowedBranches: ['all'],
  isActive: true,
  approvalSteps: [
    {
      step: 1,
      title: 'Persetujuan Pejabat / Pimpinan',
      approverRole: 'Pimpinan',
      assignmentType: 'role',
    },
  ],
  fields: [
    {
      id: 'f_perihal',
      label: 'Perihal Surat',
      name: 'perihal',
      type: 'text',
      required: true,
      placeholder: 'Contoh: Permohonan Pengadaan Alat Kerja',
    },
  ],
  letterTemplate: '<p><br></p>',
}

export const getTemplates = () => {
  const templates = getStorageItem(STORAGE_KEYS.TEMPLATES, [])
  return templates.map((t) => {
    let fmt = t.numberFormat
    if (!fmt || fmt.startsWith('{{seq}}/') || (typeof fmt === 'string' && fmt.split('/').length > 5)) {
      fmt = '{{year}}/{{branch_code}}/SP/{{roman_month}}/{{seq}}'
    }
    const cleanCode = (t.code || '').replace(/_COPY/gi, '').replace(/^[-_\s]+|[-_\s]+$/g, '') || 'SP'
    return {
      ...t,
      code: cleanCode,
      numberFormat: fmt,
    }
  })
}

export const DEFAULT_CATEGORIES = [
  'Umum',
  'Operasional',
  'Kepegawaian / HRD',
  'Pemeliharaan',
  'Sales & CRM',
  'Keuangan & Anggaran',
  'Logistik & Distribusi',
  'Legal & Perizinan',
]

export const getCategories = () => {
  return getStorageItem(STORAGE_KEYS.CATEGORIES || 'suratajuan_categories_v2', DEFAULT_CATEGORIES)
}

export const saveCategories = (categoriesList) => {
  setStorageItem(STORAGE_KEYS.CATEGORIES || 'suratajuan_categories_v2', categoriesList)
  window.dispatchEvent(new Event('categories_change'))
  return categoriesList
}

export const addCategory = (categoryName) => {
  const cats = getCategories()
  const trimmed = (categoryName || '').trim()
  if (trimmed && !cats.includes(trimmed)) {
    cats.push(trimmed)
    saveCategories(cats)
  }
  return cats
}

export const updateCategory = (oldName, newName) => {
  const cats = getCategories()
  const trimmedNew = (newName || '').trim()
  const idx = cats.findIndex((c) => c === oldName)
  if (idx >= 0 && trimmedNew) {
    cats[idx] = trimmedNew
    saveCategories(cats)

    // Update templates using this category
    const templates = getTemplates()
    let changed = false
    templates.forEach((t) => {
      if (t.category === oldName) {
        t.category = trimmedNew
        changed = true
      }
    })
    if (changed) {
      setStorageItem(STORAGE_KEYS.TEMPLATES, templates)
      window.dispatchEvent(new Event('templates_change'))
    }
  }
  return cats
}

export const deleteCategory = (categoryName) => {
  let cats = getCategories()
  cats = cats.filter((c) => c !== categoryName)
  saveCategories(cats)
  return cats
}

export const getTemplateById = (id) => {
  if (id === 'custom_blank' || id === BLANK_TEMPLATE?.id) return BLANK_TEMPLATE
  return getTemplates().find((t) => t.id === id)
}

export const saveTemplate = (templateData) => {
  const templates = getTemplates()
  let saved
  if (templateData.id) {
    const idx = templates.findIndex((t) => t.id === templateData.id)
    if (idx >= 0) {
      templates[idx] = { ...templates[idx], ...templateData }
      saved = templates[idx]
    }
  } else {
    saved = {
      ...templateData,
      id: `tpl-${Date.now().toString(36)}`,
      isActive: true,
      allowedBranches: templateData.allowedBranches || ['all'],
    }
    templates.push(saved)
  }
  setStorageItem(STORAGE_KEYS.TEMPLATES, templates)
  window.dispatchEvent(new Event('templates_change'))
  // Sync to remote MySQL API
  api.saveTemplate(saved).catch((e) => console.warn('Sync template to API failed:', e.message))
  return saved
}

export const toggleTemplateStatus = (templateId) => {
  const templates = getTemplates()
  const idx = templates.findIndex((t) => t.id === templateId)
  if (idx >= 0) {
    templates[idx].isActive = !templates[idx].isActive
    setStorageItem(STORAGE_KEYS.TEMPLATES, templates)
    window.dispatchEvent(new Event('templates_change'))
    api.toggleTemplate(templateId).catch((e) => console.warn('Toggle template API failed:', e.message))
  }
  return templates
}

export const deleteTemplate = (templateId) => {
  const letters = getLetters()
  const isUsed = letters.some((l) => l.templateId === templateId)
  if (isUsed) {
    return {
      success: false,
      message: 'Template tidak dapat dihapus karena sudah pernah digunakan dalam pembuatan surat ajuan.',
    }
  }

  const templates = getTemplates().filter((t) => t.id !== templateId)
  setStorageItem(STORAGE_KEYS.TEMPLATES, templates)
  window.dispatchEvent(new Event('templates_change'))
  api.deleteTemplate(templateId).catch((e) => console.warn('Delete template API failed:', e.message))
  return { success: true, message: 'Template berhasil dihapus' }
}

// Global Default Viewers (Berlaku untuk SEMUA Surat Ajuan)
export const getGlobalDefaultViewers = () => {
  return getStorageItem(STORAGE_KEYS.GLOBAL_DEFAULT_VIEWERS, [])
}

export const saveGlobalDefaultViewers = async (viewersList) => {
  const cleanList = Array.isArray(viewersList) ? viewersList : []
  setStorageItem(STORAGE_KEYS.GLOBAL_DEFAULT_VIEWERS, cleanList)
  window.dispatchEvent(new Event('global_viewers_change'))
  try {
    await api.saveSetting('global_default_viewers', cleanList)
  } catch (e) {
    console.warn('Save global default viewers to MySQL failed:', e.message)
  }
  return cleanList
}

// Letters Management
export const getLetters = () => getStorageItem(STORAGE_KEYS.LETTERS, [])
export const getLetterById = (id) => getLetters().find((l) => l.id === id)

// Generate letter number per branch & per year
export const generateLetterNumber = (template, branchId, branchCode = null) => {
  const letters = getLetters()
  const currentYear = new Date().getFullYear()
  const romanMonth = getRomanMonth()

  // Ambil cabang dari branchId atau branchCode (resolving ke 3 huruf kode seperti BDG, TGR, PST)
  const branches = getBranches()
  const matchedBranch = branches.find(
    (b) => (branchId && (b.id === branchId || b.code === branchId)) ||
           (branchCode && (b.code === branchCode || b.id === branchCode))
  )
  const targetBranch = matchedBranch?.code || branchCode || branchId || 'BDG'

  // Hitung jumlah surat yang sudah pernah dibuat oleh cabang ini pada tahun berjalan
  const branchLettersThisYear = letters.filter((l) => {
    const isSameBranch = (l.branchId && branchId && String(l.branchId).toLowerCase() === String(branchId).toLowerCase()) ||
                         (l.branchName && targetBranch && l.branchName.toLowerCase().includes(String(targetBranch).toLowerCase())) ||
                         (l.letterNumber && String(l.letterNumber).includes(`/${targetBranch}/`))

    const letterYear = l.createdAt ? new Date(l.createdAt).getFullYear() : currentYear
    return isSameBranch && letterYear === currentYear
  })

  // Hitung nomor urut tertinggi yang pernah diajukan untuk cabang ini pada tahun berjalan
  let maxSeq = 0
  branchLettersThisYear.forEach((l) => {
    if (l.letterNumber) {
      const parts = String(l.letterNumber).trim().split('/')
      if (parts.length >= 4) {
        const lastPart = parts[parts.length - 1]
        const num = parseInt(lastPart, 10)
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num
        }
      }
    }
  })

  // No Urut Cabang Tersebut (mengikuti urutan yang diajukan, bertambah terus tanpa bentrok)
  const nextNumber = Math.max(maxSeq + 1, branchLettersThisYear.length + 1)
  const sequence = String(nextNumber).padStart(3, '0')

  // Format baku wajib: TAHUN/CABANG/SP/BULAN_ROMAWI/NO_URUT (e.g. 2026/BDG/SP/VII/001)
  let format = template?.numberFormat || '{{year}}/{{branch_code}}/SP/{{roman_month}}/{{seq}}'

  // Bila template di browser user masih membawa format lama / kepanjangan
  if (
    !format ||
    format.startsWith('{{seq}}/') ||
    format.includes('TGR/SP/VII') ||
    (typeof format === 'string' && format.split('/').length > 5)
  ) {
    format = '{{year}}/{{branch_code}}/SP/{{roman_month}}/{{seq}}'
  }

  return format
    .replace('{{year}}', String(currentYear))
    .replace('{{branch_code}}', targetBranch)
    .replace('{{code}}', 'SP')
    .replace('{{roman_month}}', romanMonth)
    .replace('{{seq}}', sequence)
}

// Kunci elemen nomor surat di HTML agar tidak dapat diedit / diubah di Word Editor (contenteditable="false")
export const lockLetterNumberInHtml = (html, letterNumber) => {
  if (!html) return html
  const lockedBadge = (num) =>
    `<span class="locked-letter-number" contenteditable="false" style="user-select: none; font-weight: bold; color: #1e3a8a; background-color: #f1f5f9; padding: 1px 6px; border-radius: 4px; border: 1px solid #cbd5e1; cursor: not-allowed; display: inline-block;" title="Nomor surat resmi otomatis dari sistem, tidak dapat diedit">${num}</span>`

  let result = html

  // 1. Sudah ada locked-letter-number span -> sinkronkan nomornya jika nomor diberikan
  if (result.includes('locked-letter-number')) {
    if (letterNumber) {
      result = result.replace(
        /<span[^>]*class="[^"]*locked-letter-number[^"]*"[^>]*>[\s\S]*?<\/span>/gi,
        lockedBadge(letterNumber)
      )
    }
    return result
  }

  // 2. Format baris tabel Nomor : [nomor]
  result = result.replace(
    /(<td[^>]*>\s*<strong>\s*Nomor\s*<\/strong>\s*<\/td>\s*<td[^>]*>\s*:\s*<\/td>\s*<td[^>]*>)([\s\S]*?)(<\/td>)/gi,
    (match, p1, p2, p3) => {
      const currentVal = letterNumber || p2.replace(/<[^>]*>/g, '').trim() || '[NOMOR SURAT]'
      return `${p1}${lockedBadge(currentVal)}${p3}`
    }
  )

  // 3. Format teks polos "Nomor : 2026/..."
  result = result.replace(
    /(Nomor\s*:\s*)([0-9]{4}\/[A-Z0-9_\-]+\/SP\/[IVXLCDM]+\/[0-9]+)/gi,
    (match, p1, p2) => {
      const currentVal = letterNumber || p2
      return `${p1}${lockedBadge(currentVal)}`
    }
  )

  return result
}

// Sinkronisasi teks perihal di dalam isi HTML surat
export const syncPerihalInHtml = (html, perihal) => {
  if (!html) return html
  let result = html
  const cleanPerihal = perihal ? String(perihal).trim() : ''

  if (cleanPerihal) {
    result = result.replace(/{{perihal}}/g, cleanPerihal)
    result = result.replace(
      /(<td[^>]*>\s*<strong>\s*Perihal\s*<\/strong>\s*<\/td>\s*<td[^>]*>\s*:\s*<\/td>\s*<td[^>]*>)([\s\S]*?)(<\/td>)/gi,
      `$1<strong>${cleanPerihal}</strong>$3`
    )
    result = result.replace(
      /(<td[^>]*>\s*Perihal\s*<\/td>\s*<td[^>]*>\s*:\s*<\/td>\s*<td[^>]*>)([\s\S]*?)(<\/td>)/gi,
      `$1<strong>${cleanPerihal}</strong>$3`
    )
  }

  // Bersihkan sisa tag {{tujuan}} atau {{ringkasan}} jika ada
  result = result.replace(/{{tujuan}}/g, '[Tulis Pejabat / Pihak Yang Dituju]')
  result = result.replace(/{{ringkasan}}/g, '[Tulis uraian dan rincian pengajuan Anda secara lengkap di sini...]')
  result = result.replace(/{{perihal}}/g, cleanPerihal || '[PERIHAL SURAT]')

  return result
}

// Template compiler with variables substitution
export const compileTemplateContent = (template, fieldValues = {}, extra = {}) => {
  let content = template.letterTemplate || ''

  // Replace default extra variables dengan badge terkunci agar nomor surat tidak dapat diedit
  const nomorSuratHtml = extra.nomor_surat
    ? `<span class="locked-letter-number" contenteditable="false" style="user-select: none; font-weight: bold; color: #1e3a8a; background-color: #f1f5f9; padding: 1px 6px; border-radius: 4px; border: 1px solid #cbd5e1; cursor: not-allowed; display: inline-block;" title="Nomor surat resmi otomatis dari sistem, tidak dapat diedit">${extra.nomor_surat}</span>`
    : '[NOMOR SURAT]'

  content = content.replace(/{{nomor_surat}}/g, nomorSuratHtml)
  content = content.replace(/{{nama_cabang}}/g, extra.nama_cabang || '[NAMA CABANG]')
  content = content.replace(/{{tanggal_surat}}/g, extra.tanggal_surat || formatDateId(new Date()))

  // Pastikan variabel khusus ter-replace meskipun tidak ada di fieldValues
  const perihalVal = fieldValues.perihal || fieldValues.f_perihal || ''
  if (perihalVal) {
    content = content.replace(/{{perihal}}/g, perihalVal)
  }
  content = content.replace(/{{tujuan}}/g, fieldValues.tujuan || '[Tulis Pejabat / Pihak Yang Dituju]')
  content = content.replace(/{{ringkasan}}/g, fieldValues.ringkasan || '[Tulis uraian dan rincian pengajuan Anda secara lengkap di sini...]')

  // Replace field variables
  Object.keys(fieldValues).forEach((key) => {
    let val = fieldValues[key]

    // Handle costs table for PERDIN
    if (key === 'rincian_biaya' && Array.isArray(val)) {
      let rows = ''
      let total = 0
      val.forEach((row, idx) => {
        const amt = Number(row.amount || 0)
        total += amt
        rows += `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 6px 10px; text-align: center;">${idx + 1}</td>
            <td style="padding: 6px 10px;">${row.item || '-'}</td>
            <td style="padding: 6px 10px; text-align: right;">Rp ${formatRupiah(amt)}</td>
          </tr>`
      })

      const tableHtml = `
        <table style="width: 100%; border-collapse: collapse; margin: 12px 0; font-family: Tahoma, Arial, sans-serif; font-size: 11px; border: 1px solid #cbd5e1;">
          <thead>
            <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1; font-weight: 600;">
              <th style="padding: 8px 10px; width: 40px; text-align: center;">No</th>
              <th style="padding: 8px 10px; text-align: left;">Uraian Pengeluaran</th>
              <th style="padding: 8px 10px; text-align: right; width: 180px;">Estimasi Biaya</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
          <tfoot>
            <tr style="background-color: #f8fafc; font-weight: bold; border-top: 2px solid #94a3b8;">
              <td colspan="2" style="padding: 8px 10px; text-align: right;">TOTAL ESTIMASI BIAYA:</td>
              <td style="padding: 8px 10px; text-align: right; color: #1e3a8a;">Rp ${formatRupiah(total)}</td>
            </tr>
          </tfoot>
        </table>`

      content = content.replace(/{{tabel_biaya_html}}/g, tableHtml)
      content = content.replace(/{{total_biaya}}/g, `Rp ${formatRupiah(total)}`)
    } else {
      if (typeof val === 'number' || (!isNaN(val) && val !== '' && key.includes('biaya'))) {
        content = content.replace(new RegExp(`{{${key}_format}}`, 'g'), formatRupiah(val))
      }
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), val !== undefined && val !== null ? String(val) : '')
    }
  })

  if (perihalVal) {
    content = syncPerihalInHtml(content, perihalVal)
  }

  return content
}

// Save Letter (Draft or Submit)
export const saveLetter = (letterData, isSubmit = false) => {
  const letters = getLetters()
  const currentUser = getCurrentUser()
  let saved
  const now = new Date().toISOString()

  if (letterData.id) {
    const idx = letters.findIndex((l) => l.id === letterData.id)
    if (idx >= 0) {
      const existing = letters[idx]
      const newStatus = isSubmit ? 'pending' : (existing.status === 'revision' ? 'pending' : existing.status)
      const actionName = isSubmit ? 'Mengedit & Mengajukan Surat' : 'Mengedit & Menyimpan Perubahan'
      const actionNotes = isSubmit ? 'Isi surat diperbarui lalu diajukan ke approver' : 'Perubahan isi draft/surat berhasil disimpan'

      const newEditRecord = {
        userId: currentUser.id,
        userName: currentUser.name,
        userPosition: currentUser.position || 'Pengguna',
        action: actionName,
        notes: actionNotes,
        timestamp: now,
      }

      const existingEdits = Array.isArray(existing.editHistory) ? existing.editHistory : []

      const letterAttachments = letterData.attachments || (letterData.fieldValues && letterData.fieldValues.attachments) || existing.attachments || []
      const persistentAttachments = Array.isArray(letterAttachments)
        ? letterAttachments.map((a) => {
            const url = a.url || (typeof a.dataUrl === 'string' && (a.dataUrl.startsWith('/lampiran') || a.dataUrl.startsWith('http')) ? a.dataUrl : '')
            return {
              id: a.id,
              name: a.name,
              size: a.size,
              extension: a.extension,
              category: a.category,
              url,
              dataUrl: a.dataUrl || url || '',
              uploadedAt: a.uploadedAt || now,
            }
          })
        : []

      // Jika draft baru pertama kali diajukan ke approver, berikan nomor surat resmi urutan terbaru (kecuali surat mandiri manual)
      const template = getTemplateById(existing.templateId || letterData.templateId)
      const isMandiri = (existing.templateId || letterData.templateId) === 'custom_blank' || template?.code === 'MANDIRI' || template?.isManualNumber || template?.isCustom
      let targetNumber = (letterData.letterNumber && letterData.letterNumber.trim()) || existing.letterNumber
      if (!targetNumber || targetNumber.includes('DRAFT')) {
        targetNumber = generateLetterNumber(template, existing.branchId || currentUser.branchId)
      }

      saved = {
        ...existing,
        ...letterData,
        letterNumber: targetNumber,
        attachments: persistentAttachments,
        fieldValues: {
          ...(letterData.fieldValues || existing.fieldValues || {}),
          attachments: persistentAttachments,
        },
        content: lockLetterNumberInHtml(letterData.content || existing.content || '', targetNumber),
        status: newStatus,
        updatedAt: now,
        lastEditedBy: currentUser.name,
        lastEditedPosition: currentUser.position || 'Pengguna',
        lastEditedAt: now,
        editHistory: [newEditRecord, ...existingEdits],
      }
      letters[idx] = saved

      addAuditLog(saved.id, currentUser.name, actionName, actionNotes)
    }
  } else {
    // New letter
    const template = getTemplateById(letterData.templateId)
    const letterNumber = (letterData.letterNumber && letterData.letterNumber.trim() && !letterData.letterNumber.includes('DRAFT'))
      ? letterData.letterNumber.trim()
      : generateLetterNumber(template, currentUser.branchId)
    const stepsCount = letterData.approvalHistory?.length || (template.approvalSteps ? template.approvalSteps.length : 1)

    const approvalHistory = (letterData.approvalHistory && letterData.approvalHistory.length > 0)
      ? letterData.approvalHistory
      : (template.approvalSteps || [{ step: 1, approverRole: '' }]).map((st) => ({
          step: st.step,
          approverRole: st.approverRole || st.title,
          kodeJabatan: st.kodeJabatan || null,
          specificUserId: st.specificUserId || null,
          specificUserName: st.specificUserName || null,
          assignmentType: st.assignmentType || (st.specificUserId ? 'user' : 'role'),
          approverName: null,
          status: 'pending',
          notes: '',
          date: null,
        }))

    const letterAttachments = letterData.attachments || (letterData.fieldValues && letterData.fieldValues.attachments) || []
    const persistentAttachments = Array.isArray(letterAttachments)
      ? letterAttachments.map((a) => {
          const url = a.url || (typeof a.dataUrl === 'string' && (a.dataUrl.startsWith('/lampiran') || a.dataUrl.startsWith('http')) ? a.dataUrl : '')
          return {
            id: a.id,
            name: a.name,
            size: a.size,
            extension: a.extension,
            category: a.category,
            url,
            dataUrl: a.dataUrl || url || '',
            uploadedAt: a.uploadedAt || now,
          }
        })
      : []

    saved = {
      id: `ltr-${Date.now().toString(36)}`,
      templateId: template.id,
      templateCode: template.code,
      templateName: template.name,
      letterNumber,
      userId: currentUser.id,
      userName: currentUser.name,
      userPosition: currentUser.position || 'Pemohon',
      branchId: currentUser.branchId,
      branchName: currentUser.branchName,
      status: isSubmit ? 'pending' : 'draft',
      currentStep: 1,
      totalSteps: stepsCount,
      title: letterData.title || `${template.name} - ${currentUser.name}`,
      includeKnownBy: letterData.includeKnownBy !== undefined ? letterData.includeKnownBy : (currentUser.branchId !== 'PST'),
      knownByName: letterData.knownByName || '',
      knownByPosition: letterData.knownByPosition || '',
      fieldValues: {
        ...(letterData.fieldValues || {}),
        attachments: persistentAttachments,
        includeKnownBy: letterData.includeKnownBy !== undefined ? letterData.includeKnownBy : (currentUser.branchId !== 'PST'),
        knownByName: letterData.knownByName || '',
        knownByPosition: letterData.knownByPosition || '',
      },
      attachments: persistentAttachments,
      content: lockLetterNumberInHtml(letterData.content || '', letterNumber),
      approvalHistory,
      createdBy: currentUser.name,
      createdByPosition: currentUser.position || 'Pemohon',
      createdAt: now,
      updatedAt: now,
      lastEditedBy: null,
      lastEditedPosition: null,
      lastEditedAt: null,
      editHistory: [],
    }

    letters.unshift(saved)

    addAuditLog(saved.id, currentUser.name, isSubmit ? 'Membuat & Mengajukan Surat Baru' : 'Membuat Draft Surat', isSubmit ? 'Surat diajukan ke approver' : 'Disimpan sebagai draft')

    if (isSubmit) {
      addNotification({
        userId: 'approver_role_1',
        title: 'Pengajuan Surat Baru',
        message: `${currentUser.name} mengajukan ${template.name} (${letterNumber})`,
        letterId: saved.id,
      })
    }
  }

  setStorageItem(STORAGE_KEYS.LETTERS, letters)
  window.dispatchEvent(new Event('letters_change'))
  // Sync to remote MySQL API
  api.saveLetter(saved).catch((e) => console.warn('Sync letter to API failed:', e.message))
  return saved
}

// Hapus Dokumen Surat (Khusus status draft)
export const deleteLetter = (letterId) => {
  const letters = getLetters()
  const idx = letters.findIndex((l) => l.id === letterId)
  if (idx === -1) return false

  const letter = letters[idx]
  if (letter.status !== 'draft') {
    return false
  }

  const updated = letters.filter((l) => l.id !== letterId)
  setStorageItem(STORAGE_KEYS.LETTERS, updated)
  window.dispatchEvent(new Event('letters_change'))

  // Sync delete to MySQL API
  api.deleteLetter(letterId).catch((e) => console.warn('Delete letter API failed:', e.message))
  return true
}

// Ambil nama dan jabatan Pihak Mengetahui yang valid untuk suatu surat
export const getEffectiveKnownBy = (letter) => {
  if (!letter) return { name: '', position: '', hasKnownBy: false }

  const isPST =
    letter.branchId === 'PST' ||
    (letter.branchName && letter.branchName.toLowerCase().includes('pusat'))

  let hasKnownBy = true
  if (letter.includeKnownBy !== undefined) {
    hasKnownBy = Boolean(letter.includeKnownBy)
  } else if (letter.fieldValues?.includeKnownBy !== undefined) {
    hasKnownBy = Boolean(letter.fieldValues.includeKnownBy)
  } else if (isPST && !letter.knownByName && !letter.fieldValues?.knownByName) {
    hasKnownBy = false
  }

  // Unit cabang (bukan kantor pusat) SELALU mewajibkan tanda tangan pihak Mengetahui
  if (!isPST) {
    hasKnownBy = true
  }

  if (!hasKnownBy) {
    return { name: '', position: '', hasKnownBy: false }
  }

  const creatorName = (letter.userName || letter.createdBy || '').trim()
  const creatorPos = (letter.userPosition || letter.fieldValues?.jabatan || '').trim()

  const branches = getBranches()
  const currentBranch = branches.find((b) => b.id === letter.branchId || b.code === letter.branchId) || {}

  let name = (letter.knownByName || letter.fieldValues?.knownByName || '').trim()
  let position = (letter.knownByPosition || letter.fieldValues?.knownByPosition || '').trim()

  // Prioritaskan nama yang valid di database users
  const users = getUsers()
  const candidateUser = users.find((u) => u.name && u.name.trim().toLowerCase() === name.toLowerCase())
  if (!candidateUser) {
    name = ''
  }

  const isSameAsCreator = Boolean(creatorName && name && name.toLowerCase() === creatorName.toLowerCase())

  // Jika nama Mengetahui kosong ATAU sama persis dengan pembuat surat, alihkan otomatis ke rekanan manager di cabang tsb
  if (!name || isSameAsCreator) {
    const branchUsers = users.filter(
      (u) =>
        u.name &&
        u.name.trim().toLowerCase() !== creatorName.toLowerCase() &&
        ((u.branchId && (u.branchId === letter.branchId || u.branchId === currentBranch.code || u.branchId === currentBranch.id)) ||
        (u.branchName && letter.branchName && u.branchName.toLowerCase().includes(letter.branchName.toLowerCase().replace('cabang ', ''))))
    )

    const isCreatorOM = /operation\s*manager|\bOM\b/i.test(creatorPos) || letter.kodeJabatan === 'J08'
    if (isCreatorOM) {
      const smmUser = branchUsers.find((u) => u.kodeJabatan === 'J07' || /sales\s*marketing|\bSMM\b/i.test(u.position || ''))
      if (smmUser) {
        name = smmUser.name
        position = smmUser.position || 'Sales Marketing Manager (SMM)'
      }
    } else {
      const omUser = branchUsers.find((u) => u.kodeJabatan === 'J08' || /operation\s*manager|\bOM\b/i.test(u.position || ''))
      if (omUser) {
        name = omUser.name
        position = omUser.position || 'Operation Manager (OM)'
      }
    }

    if (!name || (creatorName && name.toLowerCase() === creatorName.toLowerCase())) {
      const otherManager = branchUsers.find((u) => (u.position || '').toLowerCase().includes('manager') || ['J05', 'J07', 'J08'].includes(u.kodeJabatan))
      if (otherManager) {
        name = otherManager.name
        position = otherManager.position || 'Manager Cabang'
      } else {
        name = isPST ? 'Pimpinan Divisi Terkait' : ''
        position = isPST ? 'Manajer Terkait' : ''
      }
    }
  }

  return { name, position, hasKnownBy: Boolean(name) }
}

// Cek apakah surat sedang menunggu tanda tangan / persetujuan dari Pihak Mengetahui terlebih dahulu
export const isLetterAwaitingKnownBy = (letter) => {
  if (!letter || letter.status !== 'pending') return false

  const { name, hasKnownBy } = getEffectiveKnownBy(letter)
  if (!hasKnownBy || !name) return false

  const isApproved = Boolean(
    letter.knownByApproved ||
    letter.knownByStatus === 'approved' ||
    letter.fieldValues?.knownByApproved ||
    letter.fieldValues?.knownByStatus === 'approved'
  )
  return !isApproved
}

// Cek apakah seorang user adalah Pihak Mengetahui dari surat tsb
export const isUserLetterKnownBy = (letter, user) => {
  if (!letter || !user) return false
  const uName = (user.name || '').trim().toLowerCase()
  const creator = (letter.userName || letter.createdBy || '').trim().toLowerCase()
  // Pembuat surat tidak boleh menyetujui suratnya sendiri sebagai Mengetahui
  if (uName && creator && uName === creator) return false

  const { name: effectiveName, position: effectivePos } = getEffectiveKnownBy(letter)
  const kName = effectiveName.trim().toLowerCase()
  if (kName && (kName === uName || uName.includes(kName) || kName.includes(uName))) {
    return true
  }

  const kPos = effectivePos.trim().toLowerCase()
  const uPos = (user.position || user.roleLabel || '').trim().toLowerCase()
  const matchBranch = !user.branchId || !letter.branchId || user.branchId === letter.branchId
  if (kPos && uPos && matchBranch && (uPos.includes(kPos) || kPos.includes(uPos))) {
    return true
  }
  return false
}

// Approval Actions
export const approveLetter = (letterId, notes = '') => {
  const letters = getLetters()
  const currentUser = getCurrentUser()
  const idx = letters.findIndex((l) => l.id === letterId)
  if (idx === -1) return null

  const letter = letters[idx]
  const now = new Date().toISOString()

  // 1. JIKA SURAT MASIH MENUNGGU PERSETUJUAN DARI PIHAK MENGETAHUI:
  if (isLetterAwaitingKnownBy(letter)) {
    const updated = {
      ...letter,
      knownByApproved: true,
      knownByStatus: 'approved',
      knownByApprovedAt: now,
      knownByApprovedBy: currentUser.name,
      knownByNotes: notes || 'Disetujui pihak mengetahui.',
      fieldValues: {
        ...(letter.fieldValues || {}),
        knownByApproved: true,
        knownByStatus: 'approved',
        knownByApprovedAt: now,
        knownByApprovedBy: currentUser.name,
        knownByNotes: notes || 'Disetujui pihak mengetahui.',
      },
      updatedAt: now,
    }

    letters[idx] = updated
    setStorageItem(STORAGE_KEYS.LETTERS, letters)
    window.dispatchEvent(new Event('letters_change'))

    api.submitDecision(letter.id, 'approve', notes, currentUser.name, currentUser.kodeJabatan, true)
      .catch((e) => console.warn('Sync approve decision failed:', e.message))

    addAuditLog(letter.id, currentUser.name, 'Tanda Tangan Pihak Mengetahui', notes || 'Disetujui oleh Pihak Mengetahui')

    // Notifikasi ke pemohon bahwa Mengetahui sudah menyetujui
    addNotification({
      userId: letter.userId,
      title: 'Disetujui Pihak Mengetahui',
      message: `${currentUser.name} (Mengetahui) telah menyetujui surat ${letter.letterNumber}. Surat diteruskan ke pejabat penyetuju.`,
      letterId: letter.id,
    })

    // Notifikasi ke pejabat penyetuju tahap pertama
    const firstApproverStep = letter.approvalHistory?.[0]
    if (firstApproverStep?.specificUserId) {
      addNotification({
        userId: firstApproverStep.specificUserId,
        title: 'Menunggu Persetujuan Anda',
        message: `Surat ${letter.letterNumber} telah disetujui Pihak Mengetahui dan kini menunggu persetujuan Anda.`,
        letterId: letter.id,
      })
    }

    return updated
  }

  // 2. KASUS BIASA: PERSETUJUAN JALUR PEJABAT (approvalHistory)
  const stepIdx = letter.currentStep - 1
  const history = [...letter.approvalHistory]

  if (history[stepIdx]) {
    history[stepIdx] = {
      ...history[stepIdx],
      approverName: currentUser.name,
      status: 'approved',
      notes: notes || 'Disetujui tanpa catatan khusus.',
      date: now,
    }
  }

  let nextStep = letter.currentStep + 1
  let nextStatus = 'pending'

  if (nextStep > letter.totalSteps) {
    nextStatus = 'approved' // Fully approved!
  }

  letters[idx] = {
    ...letter,
    currentStep: nextStatus === 'approved' ? letter.totalSteps : nextStep,
    status: nextStatus,
    approvalHistory: history,
    updatedAt: now,
  }

  setStorageItem(STORAGE_KEYS.LETTERS, letters)
  window.dispatchEvent(new Event('letters_change'))

  // Sync decision to MySQL API
  api.submitDecision(letter.id, 'approve', notes, currentUser.name, currentUser.kodeJabatan)
    .catch((e) => console.warn('Sync approve decision failed:', e.message))

  addAuditLog(letter.id, currentUser.name, `Persetujuan Tahap ${letter.currentStep}`, notes || 'Disetujui')

  // Notify submitter
  addNotification({
    userId: letter.userId,
    title: nextStatus === 'approved' ? 'Surat Telah Disetujui Penuh!' : `Persetujuan Tahap ${letter.currentStep} Disetujui`,
    message: `${currentUser.name} menyetujui ${letter.letterNumber}. ${notes ? `Catatan: "${notes}"` : ''}`,
    letterId: letter.id,
  })

  return letters[idx]
}

export const updateLetterApprovalNotes = (letterId, stepIndex, notes) => {
  const letters = getLetters()
  const currentUser = getCurrentUser()
  const idx = letters.findIndex((l) => l.id === letterId)
  if (idx === -1) return null

  const letter = letters[idx]
  const history = [...(letter.approvalHistory || [])]
  if (history[stepIndex]) {
    history[stepIndex] = {
      ...history[stepIndex],
      notes: notes,
    }
  }

  const updated = {
    ...letter,
    approvalHistory: history,
    updatedAt: new Date().toISOString(),
  }

  letters[idx] = updated
  setStorageItem(STORAGE_KEYS.LETTERS, letters)
  window.dispatchEvent(new Event('letters_change'))

  api.saveLetter(updated).catch((e) => console.warn('Save letter notes to API failed:', e.message))
  addAuditLog(letter.id, currentUser?.name || 'Approver', `Memperbarui Catatan Tahap ${stepIndex + 1}`, notes || 'Menghapus catatan')

  return updated
}

export const rejectLetter = (letterId, notes = '') => {
  const letters = getLetters()
  const currentUser = getCurrentUser()
  const idx = letters.findIndex((l) => l.id === letterId)
  if (idx === -1) return null

  const letter = letters[idx]
  const now = new Date().toISOString()

  // 1. JIKA DITOLAK SAAT TAHAP MENGETAHUI
  if (isLetterAwaitingKnownBy(letter)) {
    const updated = {
      ...letter,
      status: 'rejected',
      knownByStatus: 'rejected',
      knownByApproved: false,
      knownByNotes: notes || 'Ditolak oleh Pihak Mengetahui.',
      knownByApprovedAt: now,
      knownByApprovedBy: currentUser.name,
      updatedAt: now,
    }

    letters[idx] = updated
    setStorageItem(STORAGE_KEYS.LETTERS, letters)
    window.dispatchEvent(new Event('letters_change'))

    api.submitDecision(letter.id, 'reject', notes, currentUser.name, currentUser.kodeJabatan, true)
      .catch((e) => console.warn('Sync reject decision failed:', e.message))

    addAuditLog(letter.id, currentUser.name, 'Menolak Surat (Pihak Mengetahui)', notes || 'Ditolak')

    addNotification({
      userId: letter.userId,
      title: 'Surat Ditolak Pihak Mengetahui',
      message: `${currentUser.name} (Mengetahui) menolak surat ${letter.letterNumber}. Alasan: ${notes || 'Tidak disetujui.'}`,
      letterId: letter.id,
    })

    return updated
  }

  // 2. KASUS BIASA: DITOLAK PEJABAT PENYETUJU
  const stepIdx = letter.currentStep - 1
  const history = [...letter.approvalHistory]

  if (history[stepIdx]) {
    history[stepIdx] = {
      ...history[stepIdx],
      approverName: currentUser.name,
      status: 'rejected',
      notes: notes || 'Ditolak.',
      date: now,
    }
  }

  letters[idx] = {
    ...letter,
    status: 'rejected',
    approvalHistory: history,
    updatedAt: now,
  }

  setStorageItem(STORAGE_KEYS.LETTERS, letters)
  window.dispatchEvent(new Event('letters_change'))

  // Sync decision to MySQL API
  api.submitDecision(letter.id, 'reject', notes, currentUser.name, currentUser.kodeJabatan)
    .catch((e) => console.warn('Sync reject decision failed:', e.message))

  addAuditLog(letter.id, currentUser.name, `Menolak Surat (Tahap ${letter.currentStep})`, notes || 'Ditolak')

  // Notify submitter
  addNotification({
    userId: letter.userId,
    title: 'Surat Ditolak',
    message: `${currentUser.name} menolak surat ${letter.letterNumber}. Alasan: ${notes || 'Tidak memenuhi kriteria.'}`,
    letterId: letter.id,
  })

  return letters[idx]
}

export const requestRevisionLetter = (letterId, notes = '') => {
  const letters = getLetters()
  const currentUser = getCurrentUser()
  const idx = letters.findIndex((l) => l.id === letterId)
  if (idx === -1) return null

  const letter = letters[idx]
  const now = new Date().toISOString()

  // 1. JIKA DIREVISI SAAT TAHAP MENGETAHUI
  if (isLetterAwaitingKnownBy(letter)) {
    const updated = {
      ...letter,
      status: 'revision',
      knownByStatus: 'revision',
      knownByApproved: false,
      knownByNotes: notes || 'Perlu revisi dari Pihak Mengetahui.',
      updatedAt: now,
    }

    letters[idx] = updated
    setStorageItem(STORAGE_KEYS.LETTERS, letters)
    window.dispatchEvent(new Event('letters_change'))

    api.submitDecision(letter.id, 'revision', notes, currentUser.name, currentUser.kodeJabatan, true)
      .catch((e) => console.warn('Sync revision decision failed:', e.message))

    addAuditLog(letter.id, currentUser.name, 'Meminta Revisi (Pihak Mengetahui)', notes || 'Perlu revisi')

    addNotification({
      userId: letter.userId,
      title: 'Permintaan Revisi (Pihak Mengetahui)',
      message: `${currentUser.name} (Mengetahui) meminta perbaikan surat ${letter.letterNumber}: "${notes}"`,
      letterId: letter.id,
    })

    return updated
  }

  // 2. KASUS BIASA: DIREVISI PEJABAT PENYETUJU
  const stepIdx = letter.currentStep - 1
  const history = [...letter.approvalHistory]

  if (history[stepIdx]) {
    history[stepIdx] = {
      ...history[stepIdx],
      approverName: currentUser.name,
      status: 'revision',
      notes: notes || 'Perlu perbaikan kelengkapan data.',
      date: now,
    }
  }

  letters[idx] = {
    ...letter,
    status: 'revision',
    approvalHistory: history,
    updatedAt: now,
  }

  setStorageItem(STORAGE_KEYS.LETTERS, letters)
  window.dispatchEvent(new Event('letters_change'))

  // Sync decision to MySQL API
  api.submitDecision(letter.id, 'revision', notes, currentUser.name, currentUser.kodeJabatan)
    .catch((e) => console.warn('Sync revision decision failed:', e.message))

  addAuditLog(letter.id, currentUser.name, `Mengembalikan Surat untuk Revisi`, notes || 'Perlu revisi')

  // Notify submitter
  addNotification({
    userId: letter.userId,
    title: 'Surat Dikembalikan (Perlu Revisi)',
    message: `${currentUser.name} meminta revisi untuk surat ${letter.letterNumber}. Catatan: ${notes}`,
    letterId: letter.id,
  })

  return letters[idx]
}

// Notifications
export const getNotifications = (userId) => {
  const notifs = getStorageItem(STORAGE_KEYS.NOTIFICATIONS, [])
  if (!userId) return notifs
  return notifs.filter((n) => n.userId === userId || n.userId === 'approver_role_1' || n.userId === 'all')
}

export const addNotification = (notif) => {
  const notifs = getStorageItem(STORAGE_KEYS.NOTIFICATIONS, [])
  notifs.unshift({
    id: `notif-${Date.now().toString(36)}`,
    isRead: false,
    createdAt: new Date().toISOString(),
    ...notif,
  })
  setStorageItem(STORAGE_KEYS.NOTIFICATIONS, notifs)
}

export const markNotificationRead = (notifId) => {
  const notifs = getStorageItem(STORAGE_KEYS.NOTIFICATIONS, [])
  const idx = notifs.findIndex((n) => n.id === notifId)
  if (idx >= 0) {
    notifs[idx].isRead = true
    setStorageItem(STORAGE_KEYS.NOTIFICATIONS, notifs)
  }
}

// Audit Logs
export const getAuditLogs = (letterId) => {
  const logs = getStorageItem(STORAGE_KEYS.AUDIT_LOGS, [])
  const filtered = letterId ? logs.filter((l) => l.letterId === letterId) : logs

  if (letterId && filtered.length === 0) {
    const letters = getLetters()
    const ltr = letters.find((l) => l.id === letterId)
    if (ltr) {
      const generatedLogs = []

      // 1. Initial creation
      generatedLogs.push({
        id: `aud-${ltr.id}-create`,
        letterId: ltr.id,
        userName: ltr.userName || ltr.createdBy || 'Pemohon',
        action: ltr.status === 'draft' ? 'Membuat Draf Surat' : 'Membuat & Mengajukan Surat',
        notes: `Surat diajukan untuk Cabang ${ltr.branchName || '-'}`,
        timestamp: ltr.createdAt || new Date().toISOString(),
      })

      // 2. Edit records
      if (Array.isArray(ltr.editHistory) && ltr.editHistory.length > 0) {
        ltr.editHistory.forEach((eh, idx) => {
          generatedLogs.push({
            id: `aud-${ltr.id}-edit-${idx}`,
            letterId: ltr.id,
            userName: eh.userName || eh.user || 'Pengguna',
            action: eh.action || 'Mengedit Isi Surat',
            notes: eh.notes || `Perubahan data surat (${eh.userPosition || 'Pengguna'})`,
            timestamp: eh.timestamp || eh.date || ltr.updatedAt,
          })
        })
      } else if (ltr.lastEditedAt || (ltr.updatedAt && ltr.updatedAt !== ltr.createdAt)) {
        generatedLogs.push({
          id: `aud-${ltr.id}-edit-latest`,
          letterId: ltr.id,
          userName: ltr.lastEditedBy || ltr.userName || 'Pengguna',
          action: 'Mengedit Isi Surat',
          notes: `Perubahan isi dan rincian surat (${ltr.lastEditedPosition || 'Pengguna'})`,
          timestamp: ltr.lastEditedAt || ltr.updatedAt,
        })
      }

      // 3. Approval history
      if (Array.isArray(ltr.approvalHistory)) {
        ltr.approvalHistory.forEach((step, sIdx) => {
          if (step.status === 'approved') {
            generatedLogs.push({
              id: `aud-${ltr.id}-app-${sIdx}`,
              letterId: ltr.id,
              userName: step.approverName || step.specificUserName || step.approverRole || 'Approver',
              action: `Persetujuan Tahap ${step.step} (${step.approverRole})`,
              notes: step.notes || 'Disetujui',
              timestamp: step.date || ltr.updatedAt || ltr.createdAt,
            })
          } else if (step.status === 'rejected') {
            generatedLogs.push({
              id: `aud-${ltr.id}-rej-${sIdx}`,
              letterId: ltr.id,
              userName: step.approverName || step.approverRole || 'Approver',
              action: `Penolakan Tahap ${step.step}`,
              notes: step.notes || 'Ditolak',
              timestamp: step.date || ltr.updatedAt || ltr.createdAt,
            })
          } else if (step.status === 'revision') {
            generatedLogs.push({
              id: `aud-${ltr.id}-rev-${sIdx}`,
              letterId: ltr.id,
              userName: step.approverName || step.approverRole || 'Approver',
              action: `Permintaan Revisi Tahap ${step.step}`,
              notes: step.notes || 'Perlu perbaikan oleh pemohon',
              timestamp: step.date || ltr.updatedAt || ltr.createdAt,
            })
          }
        })
      }

      generatedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      return generatedLogs
    }
  }

  return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}

export const addAuditLog = (letterId, userName, action, notes) => {
  const logs = getStorageItem(STORAGE_KEYS.AUDIT_LOGS, [])
  logs.unshift({
    id: `aud-${Date.now().toString(36)}`,
    letterId,
    userName,
    action,
    notes,
    timestamp: new Date().toISOString(),
  })
  setStorageItem(STORAGE_KEYS.AUDIT_LOGS, logs)
}

// ==========================================
// Pemeriksaan Hak Edit Surat (Hanya IT dan Pembuat Surat)
// ==========================================
export const canUserEditLetter = (letter, currentUser) => {
  if (!letter || !currentUser) return false
  if (letter.status === 'approved' || letter.status === 'rejected' || letter.knownByStatus === 'rejected') return false

  // 1. IT Pusat / Tim IT
  const isIT =
    currentUser.role === 'admin_pusat' ||
    currentUser.kodeJabatan === 'J27' ||
    (currentUser.position && currentUser.position.toUpperCase().includes('IT')) ||
    (currentUser.roleLabel && currentUser.roleLabel.toUpperCase().includes('IT'))

  if (isIT) return true

  // 2. Pembuat Surat
  const uid = String(currentUser.id || '')
  const uName = (currentUser.name || '').trim().toLowerCase()
  const isCreator =
    (uid && String(letter.userId) === uid) ||
    (uName && (
      (letter.userName && letter.userName.trim().toLowerCase() === uName) ||
      (letter.createdBy && letter.createdBy.trim().toLowerCase() === uName)
    ))

  return Boolean(isCreator)
}

// ==========================================
// Pemeriksaan Visibilitas Surat (Draf hanya untuk pembuat)
// ==========================================

export const isLetterVisibleToUser = (letter, currentUser) => {
  if (!letter || !currentUser) return false

  const uid = String(currentUser.id || '')
  const uName = (currentUser.name || '').trim().toLowerCase()
  const isCreator =
    (uid && String(letter.userId) === uid) ||
    (uName && (
      letter.userName?.trim().toLowerCase() === uName ||
      letter.createdBy?.trim().toLowerCase() === uName
    ))

  // 1. DRAF BELUM DIKIRIM: HANYA pembuat surat yang boleh melihat
  if (letter.status === 'draft') {
    return Boolean(isCreator)
  }

  // 2. Pembuat surat selalu bisa melihat surat yang telah diajukan
  if (isCreator) return true

  // 2b. JIKA SURAT BELUM DISETUJUI OLEH PIHAK MENGETAHUI:
  // Surat HANYA tampil untuk Pembuat, Pihak Mengetahui (untuk diverifikasi/ACC), dan IT Pusat (J27).
  // Jangan dulu tampil di Pejabat Penyetuju (Pak Jemmy / Direktur / Approver) sebelum disetujui Mengetahui.
  if (isLetterAwaitingKnownBy(letter)) {
    if (isUserLetterKnownBy(letter, currentUser)) return true
    if (currentUser.role === 'admin_pusat' && currentUser.kodeJabatan === 'J27') return true
    return false
  }

  // 3b. DIREKTUR / DIREKTUR UTAMA (J01 / Pak Jemmy Feldiana):
  // Menampilkan SEMUA data surat meskipun approval tidak sampai ke Pak Jemmy
  const isDirektur =
    currentUser.kodeJabatan === 'J01' ||
    (currentUser.position && currentUser.position.toUpperCase().includes('DIREKTUR')) ||
    (currentUser.roleLabel && currentUser.roleLabel.toUpperCase().includes('DIREKTUR')) ||
    (currentUser.name && currentUser.name.toLowerCase().includes('jemmy')) ||
    (currentUser.username && currentUser.username.toLowerCase().includes('jemmy'))

  if (isDirektur) {
    return true
  }

  // 4. Pejabat Mengetahui (Dapat memantau surat dalam semua status setelah diajukan)
  if (isUserLetterKnownBy(letter, currentUser)) {
    return true
  }

  // 5. Penyetuju yang Terlibat dalam Alur Persetujuan (Approval History)
  const isInApproval = (letter.approvalHistory || []).some((st) => {
    // 5a. Spesifik user
    if (st.specificUserId && String(st.specificUserId) === uid) return true
    if (st.specificUserName && st.specificUserName.trim().toLowerCase() === uName) return true
    if (st.approverName && st.approverName.trim().toLowerCase() === uName) return true

    if (st.assignmentType === 'user' || Boolean(st.specificUserId || st.specificUserName)) {
      return false
    }

    // 5b. Kode jabatan match
    if (st.kodeJabatan && currentUser.kodeJabatan && st.kodeJabatan === currentUser.kodeJabatan) {
      if (st.kodeJabatan === 'J08' && currentUser.branchId) {
        return letter.branchId === currentUser.branchId || !letter.branchId
      }
      if (st.kodeJabatan === 'J03') {
        if (st.specificUserId && String(st.specificUserId) !== uid) return false
        if (st.specificUserName && st.specificUserName.trim().toLowerCase() !== uName) return false
        return true
      }
      return true
    }

    // 5c. Approver role match
    const roleReq = (st.approverRole || '').toLowerCase()
    const userPos = (currentUser.position || currentUser.roleLabel || '').toLowerCase()
    if (roleReq && userPos && (userPos.includes(roleReq) || roleReq.includes(userPos))) {
      if (roleReq.includes('operation manager') || roleReq.includes('om')) {
        return letter.branchId === currentUser.branchId || !letter.branchId
      }
      if (roleReq.includes('rsm') || roleReq.includes('regional sales manager')) {
        if (st.specificUserId && String(st.specificUserId) !== uid) return false
        if (st.specificUserName && st.specificUserName.trim().toLowerCase() !== uName) return false
        return true
      }
      return true
    }

    // 5d. Fallback approvalLevel
    if (currentUser.role === 'approver' && st.step === currentUser.approvalLevel) {
      return true
    }

    return false
  })

  if (isInApproval) return true

  // 6. User yang diset di allowedViewers (Tembusan)
  const allowed = Array.isArray(letter.allowedViewers) ? letter.allowedViewers : []
  const isDirectViewer = allowed.some((v) => {
    if (typeof v === 'string' || typeof v === 'number') {
      return String(v) === uid || String(v).toLowerCase() === uName
    }
    if (typeof v === 'object' && v !== null) {
      if (v.userId && String(v.userId) === uid) return true
      if (v.userName && v.userName.trim().toLowerCase() === uName) return true
      if (v.kodeJabatan && currentUser.kodeJabatan && v.kodeJabatan === currentUser.kodeJabatan) return true
    }
    return false
  })
  if (isDirectViewer) return true

  // 6b. Pengguna yang dibagikan akses secara manual (Fitur Bagikan Surat)
  const isSharedWith = Array.isArray(letter.sharedWith) && letter.sharedWith.some((s) => {
    if (typeof s === 'string' || typeof s === 'number') {
      return String(s) === uid || String(s).toLowerCase() === uName
    }
    if (typeof s === 'object' && s !== null) {
      if (s.id && String(s.id) === uid) return true
      if (s.userId && String(s.userId) === uid) return true
      if (s.userName && s.userName.trim().toLowerCase() === uName) return true
    }
    return false
  })
  if (isSharedWith) return true

  // 7. Pengguna Cabang (Melihat surat resmi dari cabangnya sendiri)
  const isPusatExecutive =
    currentUser.kodeJabatan === 'J01' || // Direktur
    currentUser.kodeJabatan === 'J02' || // GM
    currentUser.kodeJabatan === 'J03'    // RSM

  if (!isPusatExecutive && currentUser.branchId) {
    const userBranch = currentUser.branchId
    const userBranchName = currentUser.branchName?.toLowerCase()?.replace('cabang ', '')?.trim()
    const isSameBranch =
      (userBranch && (letter.branchId === userBranch || String(letter.branchId).toLowerCase() === String(userBranch).toLowerCase())) ||
      (userBranchName && letter.branchName && letter.branchName.toLowerCase().includes(userBranchName))
    if (isSameBranch) return true
  }

  return false
}

// ==========================================
// Fitur Chat & Diskusi Surat (Hak Akses Terbatas)
// ==========================================

export const canUserAccessLetterChat = (letter, currentUser) => {
  if (!letter || !currentUser) return false

  // Semua pengguna yang berhak melihat surat (pembuat, penyetuju, tembusan, pejabat cabang & direksi/pusat) berhak mengakses dan berpartisipasi dalam chat / diskusi
  return isLetterVisibleToUser(letter, currentUser)
}

export const getLetterComments = (letterId) => {
  const letters = getLetters()
  const letter = letters.find((l) => l.id === letterId)
  return letter?.comments || []
}

export const addLetterComment = (letterId, messageText, currentUser = getCurrentUser()) => {
  if (!messageText || !messageText.trim()) return null
  const letters = getLetters()
  const idx = letters.findIndex((l) => l.id === letterId)
  if (idx === -1) return null

  const letter = letters[idx]
  if (!canUserAccessLetterChat(letter, currentUser)) {
    console.warn('Akses ditolak: Hanya pembuat, mengetahui, dan penyetuju yang dapat berdiskusi.')
    return null
  }

  const isCreator =
    letter.userId === currentUser.id ||
    letter.userName?.trim().toLowerCase() === currentUser.name?.trim().toLowerCase()

  const isKnownBy =
    letter.knownByName &&
    (letter.knownByName?.trim().toLowerCase() === currentUser.name?.trim().toLowerCase() ||
     currentUser.position?.trim().toLowerCase() === letter.knownByPosition?.trim().toLowerCase())

  const roleType = isCreator ? 'Pembuat' : isKnownBy ? 'Mengetahui' : 'Penyetuju'

  const newComment = {
    id: `cmt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    letterId,
    senderId: currentUser.id,
    senderName: currentUser.name,
    senderPosition: currentUser.position || currentUser.roleLabel || 'Pengguna',
    roleType,
    message: messageText.trim(),
    createdAt: new Date().toISOString(),
  }

  const updatedComments = [...(letter.comments || []), newComment]
  letters[idx] = {
    ...letter,
    comments: updatedComments,
    updatedAt: new Date().toISOString(),
  }

  setStorageItem(STORAGE_KEYS.LETTERS, letters)
  window.dispatchEvent(new Event('letters_change'))
  window.dispatchEvent(new CustomEvent('letter_chat_updated', { detail: { letterId, comment: newComment } }))

  // Simpan secara permanen ke database MySQL
  api.addComment(letter.id, newComment).catch((err) => {
    console.warn('Gagal sinkron komentar ke backend MySQL:', err.message)
  })

  // Audit log jejak pesan
  addAuditLog(letter.id, currentUser.name, `Pesan Diskusi (${roleType})`, messageText.trim().substring(0, 80))

  // Notifikasi otomatis ke pihak terkait selain pengirim
  if (!isCreator && letter.userId) {
    addNotification({
      userId: letter.userId,
      title: `Pesan Diskusi Baru: ${letter.letterNumber}`,
      message: `${currentUser.name} (${roleType}): "${messageText.trim().substring(0, 60)}..."`,
      letterId: letter.id,
    })
  }

  return newComment
}

// Bagikan akses surat ke pengguna lain
export const shareLetterWithUsers = async (letterId, targetUsers, currentUser) => {
  const letters = getLetters()
  const idx = letters.findIndex((l) => l.id === letterId)
  if (idx === -1) return false

  const formattedUsers = (Array.isArray(targetUsers) ? targetUsers : []).map((u) => ({
    userId: u.id || u.userId,
    userName: u.name || u.userName,
    branchName: u.branchName || u.branch || '',
    role: u.role || u.position || '',
    sharedAt: u.sharedAt || new Date().toISOString(),
    sharedBy: u.sharedBy || currentUser?.name || 'User',
    sharedById: u.sharedById || currentUser?.id,
    note: u.note || '',
  }))

  const updatedLetter = {
    ...letters[idx],
    sharedWith: formattedUsers,
    fieldValues: {
      ...(letters[idx].fieldValues || {}),
      sharedWith: formattedUsers,
    },
    updatedAt: new Date().toISOString(),
  }

  letters[idx] = updatedLetter
  setStorageItem(STORAGE_KEYS.LETTERS, letters)
  window.dispatchEvent(new Event('letters_change'))

  // Sync ke backend MySQL
  try {
    await api.shareLetter(letterId, formattedUsers)
  } catch (err) {
    console.warn('API shareLetter sync warning:', err)
  }

  // Tambahkan audit log
  addAuditLog(letterId, currentUser?.name || 'User', 'Bagikan Akses Surat', `Surat dibagikan kepada ${formattedUsers.length} user (${formattedUsers.map((u) => u.userName).join(', ')})`)

  return true
}

// Reset data to defaults
export const resetDemoData = () => {
  localStorage.removeItem(STORAGE_KEYS.USERS)
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
  localStorage.removeItem(STORAGE_KEYS.BRANCHES)
  localStorage.removeItem(STORAGE_KEYS.TEMPLATES)
  localStorage.removeItem(STORAGE_KEYS.LETTERS)
  localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS)
  localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS)
  initializeStorage()
}
