import React, { useState } from 'react'
import {
  Inbox,
  Clock,
  History,
  Search,
  MessageSquare,
  FileText,
  ShieldCheck,
  Pencil,
  CheckCircle,
  Building2,
  User,
  Calendar,
} from 'lucide-react'
import { canUserApproveLetter } from '../components/ApproverInbox'
import MobileApprovalModal from './MobileApprovalModal'
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
    <div className="space-y-3 pb-28 px-1">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
            <Inbox size={16} className="text-blue-600" />
            <span>Inbox Persetujuan</span>
          </h2>
          <p className="text-[11px] font-medium text-slate-400">
            {currentUser?.name} &bull; {currentUser?.position || currentUser?.kodeJabatan || 'Approver'}
          </p>
        </div>
      </div>

      {/* Segmented Control / Tabs */}
      <div className="bg-slate-200/70 p-1 rounded-xl flex items-center gap-1 text-xs">
        <button
          onClick={() => setActiveSubTab('pending')}
          className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 text-xs ${
            activeSubTab === 'pending'
              ? 'bg-white text-rose-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock size={13} className={activeSubTab === 'pending' ? 'text-rose-600' : 'text-slate-400'} />
          <span>Perlu ACC</span>
          {pendingLetters.length > 0 && (
            <span className="bg-rose-500 text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full font-black flex items-center justify-center">
              {pendingLetters.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 text-xs ${
            activeSubTab === 'history'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History size={13} className={activeSubTab === 'history' ? 'text-blue-600' : 'text-slate-400'} />
          <span>Riwayat</span>
          <span className="bg-slate-100 text-slate-600 text-[10px] min-w-[18px] h-[18px] px-1 rounded-full font-bold flex items-center justify-center">
            {historyLetters.length}
          </span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={15} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari surat di inbox..."
          className="w-full bg-white rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 border border-slate-200/80 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
      </div>

      {/* Cards List */}
      {filteredList.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/70 shadow-xs mt-2">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
            {activeSubTab === 'pending' ? <CheckCircle size={20} className="text-emerald-500" /> : <History size={20} />}
          </div>
          <p className="text-xs font-bold text-slate-700">
            {activeSubTab === 'pending'
              ? 'Tidak ada ajuan yang perlu persetujuan'
              : 'Belum ada riwayat persetujuan'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {activeSubTab === 'pending'
              ? 'Semua surat ajuan telah Anda proses dengan baik.'
              : 'Daftar surat yang sudah Anda setujui akan tampil di sini.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredList.map((letter) => {
            const commentsCount = (letter.comments || []).length
            const isPendingThisUser = canUserApproveLetter(letter, currentUser)
            const isApproved = letter.status === 'approved'

            return (
              <div
                key={letter.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-blue-300 transition-all duration-200"
              >
                {/* Header Card: Nomor & Current Step */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md inline-block truncate max-w-full border border-blue-100">
                      {letter.letterNumber || 'Draft'}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900 mt-1.5 leading-snug">
                      {letter.title || 'Surat Pengajuan'}
                    </h3>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 bg-blue-50 text-blue-700 border border-blue-200">
                    Step {letter.currentStep || 1}/{letter.totalSteps || 3}
                  </span>
                </div>

                {/* Metadata */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                  <div className="truncate flex items-center gap-1">
                    <User size={12} className="text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-700 truncate">
                      {letter.userName || letter.creatorName || letter.createdBy || '-'}
                    </span>
                  </div>
                  <div className="truncate text-right flex items-center justify-end gap-1">
                    <Building2 size={12} className="text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-700 truncate">
                      {letter.branchName || letter.branchId || letter.branchCode || '-'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={12} className="text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-600">
                      {letter.createdAt ? formatDateId(letter.createdAt) : '-'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold ${isApproved ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {isApproved ? 'Selesai (Sah)' : 'Menunggu ACC'}
                    </span>
                  </div>
                </div>

                {/* Approver Action Buttons */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
                  {/* Row 1: Chat Diskusi & Preview Dokumen */}
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => onOpenChat(letter)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition active:scale-95"
                    >
                      <MessageSquare size={13} className="text-slate-500" />
                      <span>Diskusi</span>
                      {commentsCount > 0 && (
                        <span className="bg-indigo-600 text-white text-[10px] px-1.5 rounded-full font-bold">
                          {commentsCount}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => onPreviewLetter(letter)}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition active:scale-95 border border-blue-200"
                    >
                      <FileText size={13} />
                      <span>Buka Dokumen</span>
                    </button>
                  </div>

                  {/* Row 2: Tombol Modal Approval Serasi dengan Desktop */}
                  {isPendingThisUser && (
                    <button
                      type="button"
                      onClick={() => setApprovingLetter(letter)}
                      className="w-full py-2.5 px-4 text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl text-xs font-bold transition shadow-xs active:scale-98 flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck size={15} />
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
                      className="w-full py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition active:scale-95 flex items-center justify-center gap-1.5 border border-blue-100"
                    >
                      <Pencil size={13} />
                      <span>Ubah Catatan Persetujuan</span>
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

