// API Client for Surat Ajuan Online connected via proxy /api to Node.js / Express Backend (MySQL 'portal')
const API_BASE = '/api'

export const api = {
  // 0. Authentication
  async login(username, password) {
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      return await res.json()
    } catch (e) {
      return { success: false, message: e.message }
    }
  },

  // 1. Cabang (17 Cabang Resmi)
  async getCabang() {
    try {
      const res = await fetch(`${API_BASE}/cabang`)
      const json = await res.json()
      return json.success ? json.data : []
    } catch (e) {
      console.warn('API getCabang fallback:', e.message)
      return null
    }
  },

  // 2. HRD Jabatan (J01 s.d J32)
  async getJabatan() {
    try {
      const res = await fetch(`${API_BASE}/jabatan`)
      const json = await res.json()
      return json.success ? json.data : []
    } catch (e) {
      console.warn('API getJabatan fallback:', e.message)
      return null
    }
  },

  // 2b. Master Produk
  async getProduk() {
    try {
      const res = await fetch(`${API_BASE}/produk`)
      const json = await res.json()
      return json.success && Array.isArray(json.data) ? json.data : null
    } catch (e) {
      console.warn('API getProduk fallback:', e.message)
      return null
    }
  },

  // 2c. Internal Memo (Mobile Only)
  async getInternalMemo(userId = null) {
    try {
      const url = userId ? `${API_BASE}/internal_memo?userId=${userId}` : `${API_BASE}/internal_memo`
      const res = await fetch(url)
      const json = await res.json()
      return json.success && Array.isArray(json.data) ? json.data : []
    } catch (e) {
      console.warn('API getInternalMemo error:', e.message)
      return []
    }
  },

  async markInternalMemoRead(memoId, userId) {
    try {
      const res = await fetch(`${API_BASE}/internal_memo/${memoId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      return await res.json()
    } catch (e) {
      return { success: false, message: e.message }
    }
  },

  async acknowledgeInternalMemo(memoId, userId, status = 'paham') {
    try {
      const res = await fetch(`${API_BASE}/internal_memo/${memoId}/ack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status }),
      })
      return await res.json()
    } catch (e) {
      return { success: false, message: e.message }
    }
  },

  // 3. Pengguna / Users
  async getUsers() {
    try {
      const res = await fetch(`${API_BASE}/users`)
      const json = await res.json()
      return json.success ? json.data : []
    } catch (e) {
      console.warn('API getUsers fallback:', e.message)
      return null
    }
  },

  // 4. Templates
  async getTemplates() {
    try {
      const res = await fetch(`${API_BASE}/templates`)
      const json = await res.json()
      return json.success ? json.data : []
    } catch (e) {
      console.warn('API getTemplates fallback:', e.message)
      return null
    }
  },

  async saveTemplate(tpl) {
    try {
      const res = await fetch(`${API_BASE}/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tpl),
      })
      return await res.json()
    } catch (e) {
      console.warn('API saveTemplate error:', e.message)
      return { success: false, message: e.message }
    }
  },

  async toggleTemplate(id) {
    try {
      const res = await fetch(`${API_BASE}/templates/${id}/toggle`, { method: 'PATCH' })
      return await res.json()
    } catch (e) {
      return { success: false, message: e.message }
    }
  },

  async deleteTemplate(id) {
    try {
      const res = await fetch(`${API_BASE}/templates/${id}`, { method: 'DELETE' })
      return await res.json()
    } catch (e) {
      return { success: false, message: e.message }
    }
  },

  // Settings (Global Settings in MySQL)
  async getSetting(key) {
    try {
      const res = await fetch(`${API_BASE}/settings/${key}`)
      const json = await res.json()
      return json.success ? json.data : null
    } catch (e) {
      console.warn(`API getSetting(${key}) fallback:`, e.message)
      return null
    }
  },

  async saveSetting(key, value) {
    try {
      const res = await fetch(`${API_BASE}/settings/${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      })
      return await res.json()
    } catch (e) {
      console.warn(`API saveSetting(${key}) error:`, e.message)
      return { success: false, message: e.message }
    }
  },

  // 5. Letters (Surat Ajuan)
  async getLetters() {
    try {
      const res = await fetch(`${API_BASE}/letters`)
      const json = await res.json()
      return json.success ? json.data : []
    } catch (e) {
      console.warn('API getLetters fallback:', e.message)
      return null
    }
  },

  async saveLetter(letter) {
    try {
      const res = await fetch(`${API_BASE}/letters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(letter),
      })
      return await res.json()
    } catch (e) {
      console.warn('API saveLetter error:', e.message)
      return { success: false, message: e.message }
    }
  },

  async submitDecision(letterId, action, notes, userName, kodeJabatan, isKnownBy = false) {
    try {
      const res = await fetch(`${API_BASE}/letters/${letterId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes, userName, kodeJabatan, isKnownBy }),
      })
      return await res.json()
    } catch (e) {
      return { success: false, message: e.message }
    }
  },

  async deleteLetter(letterId) {
    try {
      const res = await fetch(`${API_BASE}/letters/${letterId}`, {
        method: 'DELETE',
      })
      return await res.json()
    } catch (e) {
      return { success: false, message: e.message }
    }
  },

  // Upload Lampiran ke public/lampiran di server
  async uploadLampiran(fileData) {
    try {
      const res = await fetch(`${API_BASE}/upload-lampiran`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fileData),
      })
      return await res.json()
    } catch (e) {
      console.warn('API uploadLampiran error:', e.message)
      return { success: false, message: e.message }
    }
  },

  // 6. Comments / Chat Surat
  async getComments(letterId) {
    try {
      const res = await fetch(`${API_BASE}/letters/${letterId}/comments`)
      const json = await res.json()
      return json.success ? json.data : []
    } catch (e) {
      console.warn('API getComments error:', e.message)
      return []
    }
  },

  async addComment(letterId, comment) {
    try {
      const res = await fetch(`${API_BASE}/letters/${letterId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comment),
      })
      return await res.json()
    } catch (e) {
      console.warn('API addComment error:', e.message)
      return { success: false, message: e.message }
    }
  },

  // 7. Audit Logs
  async getAuditLogs(letterId) {
    try {
      const res = await fetch(`${API_BASE}/audit_logs/${letterId}`)
      const json = await res.json()
      return json.success ? json.data : []
    } catch (e) {
      return []
    }
  },

  // 8. Share Letter (Bagikan Akses Surat ke User Lain)
  async shareLetter(letterId, sharedWith) {
    try {
      const res = await fetch(`${API_BASE}/letters/${letterId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sharedWith }),
      })
      return await res.json()
    } catch (e) {
      console.warn('API shareLetter error:', e.message)
      return { success: false, message: e.message }
    }
  },
}
