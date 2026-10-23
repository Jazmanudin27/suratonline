import React, { useState, useMemo } from 'react'
import {
  X,
  Share2,
  Copy,
  Check,
  UserPlus,
  Trash2,
  Search,
  Building2,
  Briefcase,
  Users,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react'
import { getUsers, shareLetterWithUsers, formatDateTimeId } from '../services/storage'
import { notify } from '../utils/alert'

export default function ShareLetterModal({ letter, currentUser, onClose, onUpdated }) {
  if (!letter) return null

  const allUsers = getUsers()
  const initialShared = Array.isArray(letter.sharedWith) ? [...letter.sharedWith] : []
  const [sharedUsers, setSharedUsers] = useState(initialShared)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Direct share link
  const shareUrl = `${window.location.origin}/#letters?view=${letter.id}`

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl)
      } else {
        const input = document.createElement('input')
        input.value = shareUrl
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
      }
      setIsCopied(true)
      notify.success('Tautan Disalin', 'Tautan surat berhasil disalin ke clipboard!')
      setTimeout(() => setIsCopied(false), 2500)
    } catch {
      notify.error('Gagal', 'Tidak dapat menyalin tautan secara otomatis.')
    }
  }

  // Filter available users (exclude creator and already shared)
  const availableUsers = useMemo(() => {
    const sharedIds = new Set(sharedUsers.map((u) => String(u.userId || u.id)))
    const creatorId = String(letter.userId || '')
    const currentUid = String(currentUser?.id || '')

    return allUsers.filter((u) => {
      const uId = String(u.id)
      if (uId === creatorId) return false
      if (sharedIds.has(uId)) return false

      if (!searchTerm) return true
      const term = searchTerm.toLowerCase()
      const matchName = (u.name || '').toLowerCase().includes(term)
      const matchBranch = (u.branchName || u.branchId || '').toLowerCase().includes(term)
      const matchPosition = (u.position || u.role || '').toLowerCase().includes(term)
      const matchUsername = (u.username || '').toLowerCase().includes(term)

      return matchName || matchBranch || matchPosition || matchUsername
    })
  }, [allUsers, sharedUsers, letter.userId, currentUser?.id, searchTerm])

  const handleAddUser = (user) => {
    setSharedUsers((prev) => [
      ...prev,
      {
        userId: user.id,
        userName: user.name,
        branchName: user.branchName || user.branchId || '',
        role: user.position || user.role || '',
        sharedAt: new Date().toISOString(),
        sharedBy: currentUser?.name || 'User',
        sharedById: currentUser?.id,
      },
    ])
  }

  const handleRemoveUser = (userId) => {
    setSharedUsers((prev) => prev.filter((u) => String(u.userId || u.id) !== String(userId)))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const ok = await shareLetterWithUsers(letter.id, sharedUsers, currentUser)
      if (ok) {
        notify.success('Berhasil', 'Daftar pengguna dibagikan berhasil diperbarui.')
        if (onUpdated) onUpdated()
        onClose()
      } else {
        notify.error('Gagal', 'Gagal memperbarui akses berbagi surat.')
      }
    } catch (e) {
      notify.error('Gagal', e.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn select-none">
      <div
        className="bg-white rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex justify-between items-center shrink-0 border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-400 shadow-inner">
              <Share2 className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight flex items-center gap-2">
                Bagikan Surat
              </h3>
              <p className="text-xs text-indigo-200 mt-0.5 font-mono">
                {letter.letterNumber || letter.title || 'Dokumen Surat'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-5 bg-slate-50/50">
          {/* Section: Info Pemilik & Pengirim Dokumen */}
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 min-w-0">
              <p className="font-semibold text-slate-900">
                Dokumen Asli / Pemilik: <span className="font-bold text-indigo-900">{letter.userName || letter.creatorName || '-'}</span>
                {letter.branchName && (
                  <span className="text-slate-500 font-normal"> ({letter.branchName})</span>
                )}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Pengguna yang ditambahkan ke daftar di bawah akan mendapatkan akses melihat isi surat, lampiran, dan berpartisipasi dalam diskusi.
              </p>
            </div>
          </div>

          {/* Section 1: Salin Tautan Langsung */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
              Tautan Langsung Dokumen (URL)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 truncate select-all focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shrink-0 ${
                  isCopied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95 shadow-xs'
                }`}
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Pengguna yang menerima tautan ini dapat langsung membuka pratinjau surat jika memiliki hak akses / dibagikan.
            </p>
          </div>

          {/* Section 2: Daftar Pengguna yang Memiliki Akses Dibagikan */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                Pengguna yang Diberi Akses ({sharedUsers.length})
              </label>
            </div>

            {sharedUsers.length === 0 ? (
              <div className="p-4 bg-white border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-500">
                Surat ini belum dibagikan ke pengguna lain. Cari dan tambahkan karyawan di bawah ini.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {sharedUsers.map((u) => {
                  const uid = u.userId || u.id
                  const senderName = u.sharedBy || currentUser?.name || 'Sistem'
                  const shareTime = u.sharedAt ? formatDateTimeId(u.sharedAt) : null
                  const isSender =
                    (u.sharedById && String(u.sharedById) === String(currentUser?.id)) ||
                    (u.sharedBy && currentUser?.name && u.sharedBy.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
                  const isLetterOwner = letter.userId && String(letter.userId) === String(currentUser?.id)
                  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin' || currentUser?.role === 'SUPERADMIN'
                  const canDelete = isSender || isLetterOwner || isAdmin

                  return (
                    <div
                      key={uid}
                      className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl shadow-xs gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {(u.userName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {u.userName}
                          </p>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1.5 truncate">
                            {u.branchName && (
                              <span className="inline-flex items-center gap-0.5">
                                <Building2 className="w-2.5 h-2.5" /> {u.branchName}
                              </span>
                            )}
                            {u.role && (
                              <span className="inline-flex items-center gap-0.5">
                                &bull; <Briefcase className="w-2.5 h-2.5" /> {u.role}
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-indigo-600 mt-0.5 font-medium truncate">
                            Dibagikan oleh: <span className="font-bold">{senderName}</span>
                            {shareTime && <span className="text-slate-400"> &bull; {shareTime}</span>}
                          </p>
                        </div>
                      </div>

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleRemoveUser(uid)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0"
                          title="Hapus akses dibagikan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Section 3: Pencarian dan Tambah Pengguna Baru */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-emerald-600" />
              Pilih Karyawan / User untuk Diberi Akses
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ketik nama, cabang, atau jabatan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* List hasil pencarian */}
            <div className="bg-white border border-slate-200 rounded-xl max-h-44 overflow-y-auto divide-y divide-slate-100 shadow-inner">
              {availableUsers.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">
                  {searchTerm ? 'Tidak ada pengguna yang cocok' : 'Semua pengguna telah ditambahkan'}
                </div>
              ) : (
                availableUsers.slice(0, 15).map((user) => (
                  <div
                    key={user.id}
                    className="p-2.5 flex items-center justify-between hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[11px] shrink-0">
                        {(user.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {user.name}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {user.branchName || user.branchId || 'Pusat'} &bull; {user.position || user.role || '-'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddUser(user)}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shrink-0 active:scale-95 border border-indigo-200 hover:border-transparent"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>Tambah</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
