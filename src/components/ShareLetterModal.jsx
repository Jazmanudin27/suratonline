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
  Mail,
  MessageSquare,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { getUsers, shareLetterWithUsers, formatDateTimeId } from '../services/storage'
import { notify } from '../utils/alert'

export default function ShareLetterModal({ letter, currentUser, onClose, onUpdated }) {
  if (!letter) return null

  const allUsers = getUsers()
  const initialShared = Array.isArray(letter.sharedWith) ? [...letter.sharedWith] : []
  const [sharedUsers, setSharedUsers] = useState(initialShared)
  const [searchTerm, setSearchTerm] = useState('')
  const [shareMessage, setShareMessage] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(true)

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

  const mySharedUsers = useMemo(() => {
    const currentUid = String(currentUser?.id || '')
    const currentName = (currentUser?.name || currentUser?.username || '').trim().toLowerCase()
    return sharedUsers.filter((u) => {
      if (u.sharedById && String(u.sharedById) === currentUid) return true
      if (u.sharedBy && (u.sharedBy || '').trim().toLowerCase() === currentName) return true
      return false
    })
  }, [sharedUsers, currentUser])

  // Filter available users (exclude creator and users already shared BY CURRENT USER)
  const availableUsers = useMemo(() => {
    const mySharedIds = new Set(mySharedUsers.map((u) => String(u.userId || u.id)))
    const creatorId = String(letter.userId || '')
    const currentUid = String(currentUser?.id || '')

    return allUsers.filter((u) => {
      const uId = String(u.id)
      if (uId === creatorId) return false
      if (uId === currentUid) return false
      if (mySharedIds.has(uId)) return false

      if (!searchTerm) return true
      const term = searchTerm.toLowerCase()
      const matchName = (u.name || '').toLowerCase().includes(term)
      const matchBranch = (u.branchName || u.branchId || '').toLowerCase().includes(term)
      const matchPosition = (u.position || u.role || '').toLowerCase().includes(term)
      const matchUsername = (u.username || '').toLowerCase().includes(term)

      return matchName || matchBranch || matchPosition || matchUsername
    })
  }, [allUsers, mySharedUsers, letter.userId, currentUser?.id, searchTerm])

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
        note: shareMessage.trim() || undefined,
      },
    ])
  }

  const handleRemoveUser = (userId) => {
    const currentUid = String(currentUser?.id || '')
    const currentName = (currentUser?.name || currentUser?.username || '').trim().toLowerCase()
    setSharedUsers((prev) =>
      prev.filter((u) => {
        const isTarget = String(u.userId || u.id) === String(userId)
        if (!isTarget) return true
        const isMine =
          (u.sharedById && String(u.sharedById) === currentUid) ||
          (u.sharedBy && (u.sharedBy || '').trim().toLowerCase() === currentName)
        return !isMine
      })
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Jika ada pesan baru dan ada user yang baru ditambahkan tanpa note, update note-nya
      const usersToSave = sharedUsers.map((u) => {
        if (!u.note && shareMessage.trim() && (u.sharedById === currentUser?.id || !u.sharedById)) {
          return { ...u, note: shareMessage.trim() }
        }
        return u
      })

      const ok = await shareLetterWithUsers(letter.id, usersToSave, currentUser, shareMessage.trim())
      if (ok) {
        notify.success('Berhasil Dibagikan', 'Surat dan pesan berhasil dibagikan ke pengguna terpilih.')
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
    <div className={`fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-3 sm:p-5'} overflow-y-auto animate-fadeIn select-none`}>
      <div
        className={`bg-white flex flex-col shadow-2xl overflow-hidden border border-slate-300 transition-all duration-200 ${
          isFullscreen
            ? 'w-full h-full rounded-none max-w-none max-h-none'
            : 'rounded-2xl w-full max-w-2xl max-h-[92vh]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white flex justify-between items-center shrink-0 border-b border-indigo-900/60 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/50 flex items-center justify-center text-indigo-400 shadow-inner">
              <Share2 className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight flex items-center gap-2">
                Bagikan Surat (Distribusi Dokumen)
              </h3>
              <p className="text-xs text-indigo-200 mt-0.5 font-mono">
                {letter.letterNumber || letter.title || 'Dokumen Surat'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
              title={isFullscreen ? 'Kecilkan Modal' : 'Layar Penuh (Full Screen)'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body with Noticeable Slate-200 Background for High Card Contrast */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-slate-200/80">
          {/* Info Pemilik Dokumen Card */}
          <div className="bg-white border-2 border-indigo-200 rounded-2xl p-4 shadow-md shadow-slate-300/40 flex items-start gap-3 border-l-[6px] border-l-indigo-600">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-indigo-700" />
            </div>
            <div className="min-w-0 flex-1 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                  Dokumen Asli / Pemilik
                </span>
                <span className="text-xs font-black text-slate-900">
                  {letter.userName || letter.creatorName || '-'}
                </span>
                {letter.branchName && (
                  <span className="text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-md">
                    Cabang {letter.branchName}
                  </span>
                )}
              </div>
              <p className="text-slate-600 mt-1 font-medium">
                Pilih karyawan yang ingin Anda tambahkan ke daftar penerima surat di bawah ini.
              </p>
            </div>
          </div>

          {/* 1. BAGIAN ATAS: PENCARIAN & TAMBAH PENGGUNA */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-slate-300 shadow-md shadow-slate-300/50 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <label className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <UserPlus className="w-3.5 h-3.5" />
                </span>
                <span>Pilih Karyawan / User yang Mau Ditambahkan</span>
              </label>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                Tersedia {availableUsers.length} Karyawan
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama karyawan, cabang, atau jabatan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-indigo-600 rounded-xl pl-9 pr-3 py-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-100 focus:outline-hidden transition shadow-inner"
              />
            </div>

            {/* List hasil pencarian */}
            <div className="bg-slate-100/70 border-2 border-slate-200 rounded-xl max-h-56 overflow-y-auto p-2 space-y-1.5 shadow-inner">
              {availableUsers.length === 0 ? (
                <div className="p-6 text-center text-xs font-medium text-slate-500">
                  {searchTerm ? 'Tidak ada pengguna yang cocok dengan pencarian' : 'Semua pengguna telah ditambahkan'}
                </div>
              ) : (
                availableUsers.slice(0, 20).map((user) => (
                  <div
                    key={user.id}
                    className="p-2.5 bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 rounded-xl flex items-center justify-between transition gap-2 shadow-xs group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-full bg-slate-200 group-hover:bg-emerald-100 text-slate-700 group-hover:text-emerald-800 font-extrabold flex items-center justify-center text-xs shrink-0 transition">
                        {(user.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {user.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1.5">
                          <span className="font-semibold text-slate-700">{user.branchName || user.branchId || 'Pusat'}</span>
                          <span>&bull;</span>
                          <span>{user.position || user.role || '-'}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddUser(user)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition shrink-0 active:scale-95 shadow-xs shadow-emerald-600/20"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Tambah</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 2. BAGIAN TENGAH: KERANJANG PENGGUNA YANG SUDAH DITAMBAH */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-indigo-200 shadow-md shadow-slate-300/50 space-y-3.5 border-t-[5px] border-t-indigo-600">
            <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
              <label className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5" />
                </span>
                <span>Daftar Pengguna yang Anda Bagikan / Keranjang</span>
              </label>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                mySharedUsers.length > 0
                  ? 'text-indigo-800 bg-indigo-100 border-indigo-300'
                  : 'text-slate-500 bg-slate-100 border-slate-200'
              }`}>
                {mySharedUsers.length} Penerima Terpilih
              </span>
            </div>

            {mySharedUsers.length === 0 ? (
              <div className="p-8 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl text-center text-xs font-medium text-slate-500">
                Keranjang masih kosong. Klik tombol "+ Tambah" pada karyawan di atas untuk memasukkan ke daftar penerima.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {mySharedUsers.map((u) => {
                  const uid = u.userId || u.id
                  const shareTime = u.sharedAt ? formatDateTimeId(u.sharedAt) : null

                  return (
                    <div
                      key={uid}
                      className="flex items-center justify-between p-3 bg-indigo-50/70 border-2 border-indigo-200/80 rounded-xl shadow-xs gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-xs">
                          {(u.userName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {u.userName}
                          </p>
                          <p className="text-[10px] text-slate-600 font-medium flex items-center gap-1.5 truncate">
                            {u.branchName && (
                              <span className="inline-flex items-center gap-0.5 text-slate-700 font-semibold">
                                <Building2 className="w-2.5 h-2.5 text-slate-500" /> {u.branchName}
                              </span>
                            )}
                            {u.role && (
                              <span className="inline-flex items-center gap-0.5">
                                &bull; <Briefcase className="w-2.5 h-2.5 text-slate-500" /> {u.role}
                              </span>
                            )}
                            {shareTime && (
                              <span className="text-slate-400 text-[10px]">
                                &bull; {shareTime}
                              </span>
                            )}
                          </p>
                          {u.note && (
                            <div className="mt-1 p-1.5 bg-white border border-indigo-200 rounded-md text-[10.5px] text-slate-700 italic flex items-start gap-1">
                              <MessageSquare className="w-3 h-3 text-indigo-600 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">"{u.note}"</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveUser(uid)}
                        className="p-2 text-rose-600 hover:text-white hover:bg-rose-600 rounded-lg transition shrink-0 border border-rose-300 active:scale-95 bg-rose-50"
                        title="Hapus dari daftar penerima"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 3. BAGIAN BAWAH: KETERANGAN / DESKRIPSI PENGANTAR (SEPERTI EMAIL) */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-slate-300 shadow-md shadow-slate-300/50 space-y-2.5 border-t-[5px] border-t-purple-600">
            <label className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <Mail className="w-3.5 h-3.5" />
              </span>
              <span>Keterangan / Deskripsi Pengantar (Seperti Isi Pesan Email)</span>
            </label>
            <textarea
              rows={3}
              value={shareMessage}
              onChange={(e) => setShareMessage(e.target.value)}
              placeholder="Tulis pesan atau instruksi untuk penerima... Contoh: Mohon dicek dan bantu tanggapi dokumen penawaran ini sebelum akhir bulan."
              className="w-full bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-purple-600 rounded-xl p-3 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-100 transition resize-none shadow-inner"
            />
            <p className="text-[11px] font-medium text-slate-500">
              Deskripsi ini akan muncul di banner atas pembaca dokumen penerima saat mereka membuka surat.
            </p>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 bg-white border-t-2 border-slate-300 flex items-center justify-end gap-3 shrink-0 shadow-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
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

