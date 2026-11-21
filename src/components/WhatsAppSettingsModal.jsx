import React, { useState, useEffect } from 'react'
import { MessageSquare, Save, Send, X, Shield, Check, AlertCircle, Phone, Database, CheckCircle2 } from 'lucide-react'
import { notify } from '../utils/alert'

export default function WhatsAppSettingsModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testPhone, setTestPhone] = useState('')

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('suratajuan_wa_settings')
      if (saved) {
        return { ...JSON.parse(saved), provider: 'custom' }
      }
    } catch {}
    return {
      enabled: false,
      provider: 'custom',
      apiKey: '',
      endpoint: '',
      adminPhone: '',
    }
  })

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    fetch('/api/settings/whatsapp')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const merged = {
            ...json.data,
            provider: 'custom',
          }
          setSettings(merged)
          try {
            localStorage.setItem('suratajuan_wa_settings', JSON.stringify(merged))
          } catch {}
          if (json.data.adminPhone) {
            setTestPhone(json.data.adminPhone)
          }
        }
      })
      .catch((err) => console.warn('Load WA settings error:', err.message))
      .finally(() => setLoading(false))
  }, [isOpen])

  if (!isOpen) return null

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...settings,
        provider: 'custom',
      }

      // 1. Simpan ke database MySQL via API backend
      const res = await fetch('/api/settings/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!json.success) {
        throw new Error(json.message || 'Gagal menyimpan pengaturan ke database')
      }

      // 2. Simpan cache lokal
      try {
        localStorage.setItem('suratajuan_wa_settings', JSON.stringify(payload))
      } catch {}

      notify.success('Pengaturan Disimpan', 'Konfigurasi WhatsApp berhasil disimpan secara permanen ke Database MySQL (tabel system_settings).')
      onClose()
    } catch (err) {
      notify.error('Gagal Menyimpan', err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleTestSend = async () => {
    const cleanDigits = (testPhone || '').replace(/[^0-9]/g, '')
    if (!testPhone || cleanDigits.length < 9) {
      notify.warning('Nomor HP Belum Benar', 'Masukkan nomor WhatsApp tujuan (contoh: 089523888200), bukan tulisan teks.')
      return
    }
    setTesting(true)
    try {
      const res = await fetch('/api/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanDigits }),
      })
      const json = await res.json()
      if (json.success) {
        notify.success('Pesan Tes Berhasil!', `Notifikasi terkirim ke WhatsApp ${testPhone}. Silakan buka chat WA Anda.`)
      } else {
        throw new Error(json.message || 'Gagal mengirim pesan')
      }
    } catch (err) {
      notify.error('Gagal Uji Coba', err.message)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20 text-white shrink-0">
              <MessageSquare className="w-4.5 h-4.5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold leading-tight">Pengaturan WhatsApp Gateway</h3>
              <p className="text-[11px] text-emerald-100/80 leading-snug">
                Notifikasi otomatis persetujuan surat ke HP approver &amp; pemohon
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Memuat pengaturan WhatsApp...</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4 text-xs">
            {/* Toggle Status */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <span className="font-bold text-slate-800 block text-xs">Aktifkan Notifikasi WhatsApp</span>
                <span className="text-[11px] text-slate-500">
                  Kirim pesan otomatis saat ada ajuan baru / surat di-ACC / revisi / tolak
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:after:w-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Gateway Endpoint */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Endpoint URL API Gateway: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={settings.endpoint || ''}
                onChange={(e) => setSettings({ ...settings, endpoint: e.target.value })}
                placeholder="https://api.domain-gateway-anda.com/send-message"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">
                URL tujuan pengiriman pesan WhatsApp (POST JSON) dari server gateway kustom Anda
              </span>
            </div>

            {/* API Key / Token */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                API Key / Bearer Token:
              </label>
              <input
                type="password"
                value={settings.apiKey || ''}
                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                placeholder="Masukkan API Key / Secret Token..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Token otorisasi untuk header request ke API gateway Anda
              </span>
            </div>

            {/* Admin Phone (Fallback) */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nomor WhatsApp Admin / Fallback:
              </label>
              <input
                type="text"
                value={settings.adminPhone || ''}
                onChange={(e) => setSettings({ ...settings, adminPhone: e.target.value })}
                placeholder="Contoh: 08123456789 atau 628123456789"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Menerima tembusan pesan jika akun approver belum memiliki nomor HP di profil
              </span>
            </div>

            {/* Uji Coba Kirim Pesan */}
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-700">
                  Kirim Pesan Tes ke Nomor WhatsApp:
                </label>
                {settings.adminPhone && (
                  <button
                    type="button"
                    onClick={() => setTestPhone(settings.adminPhone)}
                    className="text-[10px] text-emerald-600 hover:text-emerald-700 font-semibold underline"
                  >
                    Salin No Admin ({settings.adminPhone})
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="Masukkan Nomor HP Anda (contoh: 089523888200)"
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
                <button
                  type="button"
                  onClick={handleTestSend}
                  disabled={testing || !settings.apiKey}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{testing ? 'Mengirim...' : 'Kirim Tes'}</span>
                </button>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                Ketik nomor HP penerima (bukan kata "Tes") untuk uji kirim pesan WhatsApp
              </span>
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200">
              <span className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span>Penyimpanan: <strong>Database MySQL</strong></span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

