import React, { useState } from 'react'
import { canUserApproveLetter } from '../components/ApproverInbox'
import MobileApprovalModal from './MobileApprovalModal'
import { notify } from '../utils/alert'
import { formatDateId } from '../services/storage'

export default function MobileApproverInbox({
  currentUser,
  letters = [],
  onPreviewLetter,
  onOpenChat,
  onApproveLetter,
  onRejectLetter,
  onRequestRevision,
  onUpdateNotes,
}) {
  const [activeSubTab, setActiveSubTab] = useState('pending') // 'pending' | 'history'
  const [searchTerm, setSearchTerm] = useState('')
  const [approvingLetter, setApprovingLetter] = useState(null)

  // Filter letters yang butuh approval user ini
  const pendingLetters = letters.filter((l) => canUserApproveLetter(l, currentUser))

  const isDirektur =
    currentUser?.kodeJabatan === 'J01' ||
    (currentUser?.position && currentUser.position.toUpperCase().includes('DIREKTUR')) ||
    (currentUser?.roleLabel && currentUser.roleLabel.toUpperCase().includes('DIREKTUR')) ||
    (currentUser?.name && currentUser.name.toLowerCase().includes('jemmy')) ||
    (currentUser?.username && currentUser.username.toLowerCase().includes('jemmy'))

  // Filter riwayat surat yang pernah disetujui / ditinjau oleh user ini
  const historyLetters = letters.filter((l) => {
    if (canUserApproveLetter(l, currentUser)) return false
    if (isDirektur) {
      return l.status !== 'draft'
    }
    const history = l.approvalHistory || []
    const uid = String(currentUser?.id || '')
    const uName = (currentUser?.name || '').trim().toLowerCase()
    return history.some(
      (s) =>
        (s.status === 'approved' || s.status === 'rejected' || s.status === 'revision_requested') &&
        ((s.specificUserId && String(s.specificUserId) === uid) ||
          (s.specificUserName && s.specificUserName.trim().toLowerCase() === uName) ||
          (s.approverName && s.approverName.trim().toLowerCase() === uName) ||
          (s.kodeJabatan && currentUser?.kodeJabatan && s.kodeJabatan === currentUser.kodeJabatan))
    )
  })

  const currentList = activeSubTab === 'pending' ? pendingLetters : historyLetters

  const filteredList = currentList.filter((l) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    const creator = (l.userName || l.creatorName || l.createdBy || '').toLowerCase()
    const branch = (l.branchName || l.branchId || l.branchCode || '').toLowerCase()
    return (
      (l.letterNumber || '').toLowerCase().includes(term) ||
      (l.title || '').toLowerCase().includes(term) ||
      creator.includes(term) ||
      branch.includes(term)
    )
  })

  return (
    <div className="space-y-4 pb-28 px-1">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <span>📥</span> Inbox Persetujuan
          </h2>
          <p className="text-[11px] font-medium text-slate-500">
            Masuk sebagai: <strong>{currentUser?.name}</strong> ({currentUser?.position || currentUser?.kodeJabatan || 'Approver'})
          </p>
        </div>
      </div>

      {/* Segmented Control / Tabs */}
      <div className="bg-slate-200/60 p-1 rounded-2xl flex items-center gap-1 text-xs">
        <button
          onClick={() => setActiveSubTab('pending')}
          className={`flex-1 py-2 rounded-xl font-extrabold transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'pending'
              ? 'bg-white text-rose-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>⏳ Perlu ACC</span>
          {pendingLetters.length > 0 && (
            <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black animate-pulse">
              {pendingLetters.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`flex-1 py-2 rounded-xl font-extrabold transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'history'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>📁 Riwayat Saya</span>
          <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
            {historyLetters.length}
          </span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari surat di inbox..."
          className="w-full bg-white rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-800 placeholder-slate-400 shadow-[0_4px_20px_rgba(15,23,42,0.06)] border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
        <svg
          className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Cards List */}
      {filteredList.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center shadow-[0_4px_20px_rgba(15,23,42,0.06)] mt-2">
          <span className="text-4xl block mb-2">
            {activeSubTab === 'pending' ? '🎉' : '📂'}
          </span>
          <p className="text-xs font-bold text-slate-700">
            {activeSubTab === 'pending'
              ? 'Tidak ada ajuan yang perlu persetujuan!'
              : 'Belum ada riwayat persetujuan'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {activeSubTab === 'pending'
              ? 'Semua surat ajuan telah Anda proses dengan baik.'
              : 'Daftar surat yang sudah Anda setujui akan tampil di sini.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredList.map((letter) => {
            const commentsCount = (letter.comments || []).length
            const isPendingThisUser = canUserApproveLetter(letter, currentUser)
            const isApproved = letter.status === 'approved'

            return (
              <div
                key={letter.id}
                className="bg-white rounded-3xl p-4.5 shadow-[0_8px_30px_rgba(15,23,42,0.07)] hover:shadow-[0_12px_36px_rgba(15,23,42,0.11)] transition-all duration-200"
              >
                {/* Header Card: Nomor & Current Step */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg inline-block truncate max-w-full">
                      {letter.letterNumber || 'Draft'}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900 mt-2 leading-snug">
                      {letter.title || 'Surat Pengajuan'}
                    </h3>
                  </div>

                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 bg-blue-50 text-blue-700 border border-blue-200">
                    Step {letter.currentStep || 1} / {letter.totalSteps || 3}
                  </span>
                </div>

                {/* Metadata */}
                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                  <div className="truncate">
                    <span className="text-slate-400">Pemohon:</span>{' '}
                    <span className="font-semibold text-slate-700">
                      {letter.userName || letter.creatorName || letter.createdBy || '-'}
                    </span>
                  </div>
                  <div className="truncate text-right">
                    <span className="text-slate-400">Cabang:</span>{' '}
                    <span className="font-semibold text-slate-700">
                      {letter.branchName || letter.branchId || letter.branchCode || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Tanggal:</span>{' '}
                    <span className="font-semibold text-slate-700">
                      {letter.createdAt ? formatDateId(letter.createdAt) : '-'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400">Status:</span>{' '}
                    <span className="font-bold text-amber-600">
                      {isApproved ? 'Selesai (Sah)' : 'Menunggu ACC'}
                    </span>
                  </div>
                </div>

                {/* Approver Action Buttons */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2">
                  {/* Row 1: Chat Diskusi & Preview Dokumen */}
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => onOpenChat(letter)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-bold transition active:scale-95"
                    >
                      <span>💬 Diskusi</span>
                      {commentsCount > 0 && (
                        <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                          {commentsCount}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => onPreviewLetter(letter)}
                      className="px-4 py-1.5 text-xs font-extrabold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition active:scale-95 border border-blue-200"
                    >
                      Buka Dokumen
                    </button>
                  </div>

                  {/* Row 2: Tombol Modal Approval Serasi dengan Desktop */}
                  {isPendingThisUser && (
                    <button
                      type="button"
                      onClick={() => setApprovingLetter(letter)}
                      className="w-full py-2.5 px-4 text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl text-xs font-extrabold transition shadow-md shadow-emerald-500/25 active:scale-98 flex items-center justify-center gap-2"
                    >
                      <span>🛡️</span>
                      <span>Proses Persetujuan (Approval)</span>
                    </button>
                  )}

                  {/* Row 3: Jika sudah disetujui, approver masih bisa ubah catatan */}
                  {!isPendingThisUser && isApproved && (
                    <button
                      onClick={() => {
                        const history = letter.approvalHistory || []
                        const uid = String(currentUser?.id || '')
                        const uName = (currentUser?.name || '').trim().toLowerCase()
                        const targetIdx = history.findIndex(
                          (s) =>
                            (s.specificUserId && String(s.specificUserId) === uid) ||
                            (s.specificUserName && s.specificUserName.trim().toLowerCase() === uName) ||
                            (s.approverName && s.approverName.trim().toLowerCase() === uName)
                        )
                        const existingNote = targetIdx !== -1 ? history[targetIdx].notes || '' : ''
                        const newNote = window.prompt('Ubah / tambah catatan persetujuan:', existingNote)
                        if (newNote === null) return
                        onUpdateNotes(letter.id, targetIdx !== -1 ? targetIdx : 0, newNote.trim())
                      }}
                      className="w-full py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition active:scale-95 text-center"
                    >
                      ✎ Ubah Catatan Persetujuan
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* POPUP MODAL APPROVAL RESMI PERSIS DESKTOP */}
      {approvingLetter && (
        <MobileApprovalModal
          letter={approvingLetter}
          currentUser={currentUser}
          onClose={() => setApprovingLetter(null)}
          onApprove={(id, note) => {
            onApproveLetter(id, note)
            setApprovingLetter(null)
          }}
          onReject={(id, reason) => {
            onRejectLetter(id, reason)
            setApprovingLetter(null)
          }}
          onRequestRevision={(id, note) => {
            onRequestRevision(id, note)
            setApprovingLetter(null)
          }}
        />
      )}
    </div>
  )
}
