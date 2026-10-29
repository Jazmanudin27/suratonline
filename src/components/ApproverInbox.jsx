import React, { useState } from 'react'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Clock,
  Building,
  User,
  Calendar,
  Search,
  Filter,
  Check,
  RotateCcw,
  Edit,
  History,
  MessageSquare,
} from 'lucide-react'
import LetterDocumentView from './LetterDocumentView'
import {
  getLetters,
  getCurrentUser,
  approveLetter,
  rejectLetter,
  requestRevisionLetter,
  getAuditLogs,
  formatDateId,
  formatDateTimeId,
  updateLetterApprovalNotes,
  canUserAccessLetterChat,
  isLetterAwaitingKnownBy,
  isUserLetterKnownBy,
  canUserEditLetter,
} from '../services/storage'
import { notify } from '../utils/alert'
import LetterChatModal from './LetterChatModal'

export const isLetterCreator = (letter, user) => {
  if (!letter || !user) return false
  const uid = String(user.id || '')
  const lUid = String(letter.userId || '')
  if (uid && lUid && uid === lUid) return true

  const uName = (user.name || '').trim().toLowerCase()
  const lCreator = (letter.createdBy || '').trim().toLowerCase()
  const lUser = (letter.userName || '').trim().toLowerCase()
  if (uName && (lCreator === uName || lUser === uName)) return true

  return false
}

export const isUserInApprovalChain = (letter, user) => {
  if (!letter || !user) return false
  if (user.role === 'admin_pusat') return true

  // DIREKTUR (J01 / Pak Jemmy Feldiana):
  // Menampilkan semua data surat di inbox persetujuan / monitoring meskipun approval tidak sampai ke Pak Jemmy
  const isDirektur =
    user.kodeJabatan === 'J01' ||
    (user.position && user.position.toUpperCase().includes('DIREKTUR')) ||
    (user.roleLabel && user.roleLabel.toUpperCase().includes('DIREKTUR')) ||
    (user.name && user.name.toLowerCase().includes('jemmy')) ||
    (user.username && user.username.toLowerCase().includes('jemmy'))

  if (isDirektur) return true

  return Boolean(
    letter.approvalHistory?.some((step) => {
      // 1. Specific user match
      if (step.specificUserId && String(step.specificUserId) === String(user.id)) return true
      if (step.specificUserName && step.specificUserName.trim().toLowerCase() === user.name?.trim().toLowerCase()) return true
      if (step.approverName && step.approverName.trim().toLowerCase() === user.name?.trim().toLowerCase()) return true

      // If step is assigned to a specific user, other users with same role/kode do NOT belong to this step
      if (step.assignmentType === 'user' || step.specificUserId || step.specificUserName) {
        return false
      }

      // 2. Kode jabatan match
      if (step.kodeJabatan && user.kodeJabatan && step.kodeJabatan === user.kodeJabatan) {
        if (step.kodeJabatan === 'J08' && user.branchId) {
          return letter.branchId === user.branchId || !letter.branchId
        }
        // Regional Sales Manager (RSM / J03) - pastikan hanya surat cabang di regional miliknya
        if (step.kodeJabatan === 'J03') {
          if (step.specificUserId && String(step.specificUserId) !== String(user.id)) return false
          if (step.specificUserName && step.specificUserName.toLowerCase() !== user.name?.toLowerCase()) return false
          return true
        }
        return true
      }

      // 3. Approver role match
      const roleReq = (step.approverRole || '').toLowerCase()
      const userPos = (user.position || user.roleLabel || '').toLowerCase()
      if (roleReq && userPos && (userPos.includes(roleReq) || roleReq.includes(userPos))) {
        if (roleReq.includes('operation manager') || roleReq.includes('om')) {
          return letter.branchId === user.branchId || !letter.branchId
        }
        if (roleReq.includes('rsm') || roleReq.includes('regional sales manager')) {
          if (step.specificUserId && String(step.specificUserId) !== String(user.id)) return false
          if (step.specificUserName && step.specificUserName.toLowerCase() !== user.name?.toLowerCase()) return false
          return true
        }
        return true
      }

      // 4. Fallback approvalLevel
      if (user.role === 'approver' && step.step === user.approvalLevel) {
        return true
      }

      return false
    })
  )
}

export const canUserApproveLetter = (letter, user) => {
  if (!letter || letter.status !== 'pending' || !user) return false
  if (isLetterCreator(letter, user)) return false

  // JIKA SURAT MASIH MENUNGGU PERSETUJUAN DARI PIHAK MENGETAHUI:
  if (isLetterAwaitingKnownBy(letter)) {
    return isUserLetterKnownBy(letter, user)
  }

  // JIKA SUDAH DISETUJUI MENGETAHUI, BARU GILIRAN PEJABAT PENYETUJU:
  const currentStepInfo = letter.approvalHistory?.[letter.currentStep - 1]
  if (!currentStepInfo) return false

  // JIKA TAHAP DITUJUKAN KE USER SPESIFIK (assignmentType === 'user' atau ada specificUserId / specificUserName):
  const isUserSpecific =
    currentStepInfo.assignmentType === 'user' ||
    Boolean(currentStepInfo.specificUserId || currentStepInfo.specificUserName)

  if (isUserSpecific) {
    const matchId = currentStepInfo.specificUserId && String(currentStepInfo.specificUserId) === String(user.id)
    const matchName = currentStepInfo.specificUserName && currentStepInfo.specificUserName.trim().toLowerCase() === user.name?.trim().toLowerCase()
    const matchApproverName = currentStepInfo.approverName && currentStepInfo.approverName.trim().toLowerCase() === user.name?.trim().toLowerCase()
    return Boolean(matchId || matchName || matchApproverName)
  }

  // JIKA TAHAP ROLE UMUM (bukan user spesifik):
  const expectedKode = currentStepInfo.kodeJabatan
  if (expectedKode && user.kodeJabatan === expectedKode) {
    if (expectedKode === 'J08' && user.branchId) {
      return letter.branchId === user.branchId || !letter.branchId
    }
    if (expectedKode === 'J03') {
      if (currentStepInfo.specificUserId && String(currentStepInfo.specificUserId) !== String(user.id)) return false
      if (currentStepInfo.specificUserName && currentStepInfo.specificUserName.toLowerCase() !== user.name?.toLowerCase()) return false
      return true
    }
    return true
  }

  const expectedRole = currentStepInfo.approverRole
  if (expectedRole && (
    user.position?.toLowerCase().includes(expectedRole.toLowerCase()) || 
    user.roleLabel?.toLowerCase().includes(expectedRole.toLowerCase())
  )) {
    if (expectedRole.toLowerCase().includes('operation manager') || expectedRole.toLowerCase().includes('om')) {
      return letter.branchId === user.branchId || !letter.branchId
    }
    if (expectedRole.toLowerCase().includes('rsm') || expectedRole.toLowerCase().includes('regional sales manager')) {
      if (currentStepInfo.specificUserId && String(currentStepInfo.specificUserId) !== String(user.id)) return false
      if (currentStepInfo.specificUserName && currentStepInfo.specificUserName.toLowerCase() !== user.name?.toLowerCase()) return false
      return true
    }
    return true
  }

  if (user.role === 'approver' && letter.currentStep === user.approvalLevel) {
    return true
  }

  return false
}

export default function ApproverInbox({ onLetterUpdated, onEditLetter }) {
  const currentUser = getCurrentUser()
  const [letters, setLetters] = useState(getLetters())
  const [selectedLetter, setSelectedLetter] = useState(null)
  const [historyLetter, setHistoryLetter] = useState(null)
  const [chatLetter, setChatLetter] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all') // 'all', 'pending', 'approved', 'rejected', 'revision'
  const [searchQuery, setSearchQuery] = useState('')
  const [actionType, setActionType] = useState(null) // 'approve', 'revision', 'reject'
  const [notes, setNotes] = useState('')
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [targetNoteStepIndex, setTargetNoteStepIndex] = useState(0)

  const findUserStepIndex = (letter, user) => {
    if (!letter || !user) return -1
    const history = letter.approvalHistory || []
    const uid = String(user.id || '')
    const uName = (user.name || '').trim().toLowerCase()

    const idxByName = history.findIndex(
      (s) =>
        (s.specificUserId && String(s.specificUserId) === uid) ||
        (s.specificUserName && s.specificUserName.trim().toLowerCase() === uName) ||
        (s.approverName && s.approverName.trim().toLowerCase() === uName)
    )
    if (idxByName !== -1) return idxByName

    if (user.kodeJabatan) {
      const idxByKode = history.findIndex((s) => s.kodeJabatan === user.kodeJabatan)
      if (idxByKode !== -1) return idxByKode
    }

    const userPos = (user.position || user.roleLabel || '').toLowerCase()
    if (userPos) {
      const idxByRole = history.findIndex(
        (s) => s.approverRole && userPos.includes(s.approverRole.toLowerCase())
      )
      if (idxByRole !== -1) return idxByRole
    }

    if (user.role === 'approver' && user.approvalLevel) {
      const idxByLevel = history.findIndex((s) => s.step === user.approvalLevel)
      if (idxByLevel !== -1) return idxByLevel
    }

    if (user.role === 'admin_pusat') {
      return Math.max(0, (letter.currentStep || 1) - 1)
    }

    return -1
  }

  const refreshLetters = () => {
    const data = getLetters()
    setLetters(data)
    if (selectedLetter) {
      const refreshed = data.find((l) => l.id === selectedLetter.id)
      setSelectedLetter(refreshed || null)
    }
  }

  const handleAction = () => {
    if (!selectedLetter || !actionType) return

    if ((actionType === 'revision' || actionType === 'reject') && !notes.trim()) {
      notify.warning('Catatan Wajib Diisi', 'Catatan wajib diisi untuk penolakan atau pengembalian revisi!')
      return
    }

    let updated
    if (actionType === 'approve') {
      updated = approveLetter(selectedLetter.id, notes)
      notify.success('Surat Disetujui!', `Surat ${selectedLetter.letterNumber} berhasil disetujui & diverifikasi sah.`)
    } else if (actionType === 'revision') {
      updated = requestRevisionLetter(selectedLetter.id, notes)
      notify.warning('Dikembalikan ke Pemohon', `Surat ${selectedLetter.letterNumber} dikembalikan ke pemohon untuk revisi.`)
    } else if (actionType === 'reject') {
      updated = rejectLetter(selectedLetter.id, notes)
      notify.error('Surat Ditolak', `Surat ${selectedLetter.letterNumber} telah ditolak.`)
    }

    setActionType(null)
    setNotes('')
    refreshLetters()
    if (onLetterUpdated) onLetterUpdated()
  }

  // Filter letters for Inbox:
  // Non-admin_pusat hanya melihat surat yang melibatkan mereka dalam approval chain
  const relevantLetters = letters.filter((l) => {
    if (l.status === 'draft') return false
    return isUserInApprovalChain(l, currentUser)
  })

  const filteredLetters = relevantLetters.filter((l) => {
    const matchesSearch =
      l.letterNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.branchName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.title?.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    if (filterStatus === 'all') return true
    if (filterStatus === 'pending') {
      // Tab "Menunggu" menyaring surat yang menunggu persetujuan giliran user saat ini
      return canUserApproveLetter(l, currentUser)
    }
    return l.status === filterStatus
  })

  const pendingCount = relevantLetters.filter((l) => canUserApproveLetter(l, currentUser)).length

  return (
    <div className="space-y-3">
      {/* Top Header & Search */}
      <div className="bg-white border border-slate-300 rounded-xl p-3.5 sm:p-4 shadow-md shadow-slate-400/20 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            Inbox Persetujuan Surat (Approver)
          </h2>
          <p className="text-xs text-slate-700 font-medium mt-1">
            Masuk sebagai: <strong className="text-slate-950 font-bold">{currentUser.name}</strong> ({currentUser.position || currentUser.roleLabel})
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-200/90 p-1 rounded-xl text-xs border border-slate-300">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg transition font-bold ${
              filterStatus === 'all'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg transition font-bold flex items-center gap-1.5 ${
              filterStatus === 'pending'
                ? 'bg-white text-amber-900 shadow-xs border border-slate-300'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <span>Menunggu</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-600 text-white text-[10px] font-black">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-3 py-1.5 rounded-lg transition font-bold ${
              filterStatus === 'approved'
                ? 'bg-white text-emerald-900 shadow-xs border border-slate-300'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Disetujui
          </button>
          <button
            onClick={() => setFilterStatus('revision')}
            className={`px-3 py-1.5 rounded-lg transition font-bold ${
              filterStatus === 'revision'
                ? 'bg-white text-orange-900 shadow-xs border border-slate-300'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Perlu Revisi
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-3 py-1.5 rounded-lg transition font-bold ${
              filterStatus === 'rejected'
                ? 'bg-white text-rose-900 shadow-xs border border-slate-300'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Ditolak
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nomor surat, nama pemohon, atau cabang..."
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm shadow-slate-400/10"
        />
      </div>

      {/* Letters List Table / Cards */}
      <div className="grid grid-cols-1 gap-2.5">
        {filteredLetters.length === 0 ? (
          <div className="bg-white border border-slate-300 rounded-xl p-8 text-center text-slate-400 shadow-sm">
            <Clock className="w-8 h-8 mx-auto mb-1.5 opacity-50" />
            <p className="text-xs">Tidak ada surat ajuan yang sesuai dengan filter.</p>
          </div>
        ) : (
          filteredLetters.map((letter) => {
            const isPendingThisUser = letter.status === 'pending'
            return (
              <div
                key={letter.id}
                className="bg-white border border-slate-300 rounded-xl p-3 sm:p-3.5 shadow-md shadow-slate-400/20 hover:border-indigo-400 transition flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black text-indigo-900 bg-indigo-100/90 px-2.5 py-1 rounded-md border border-indigo-300">
                      {letter.letterNumber}
                    </span>
                    <span className="text-xs text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                      {letter.templateName}
                    </span>
                    {letter.status === 'approved' && (
                      <span className="text-[11px] px-2.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full font-bold">
                        ✓ Disetujui
                      </span>
                    )}
                    {letter.status === 'pending' && (
                      <span className="text-[11px] px-2.5 py-0.5 bg-amber-100 text-amber-950 border border-amber-300 rounded-full font-bold animate-pulse">
                        Menunggu Persetujuan (Tahap {letter.currentStep}/{letter.totalSteps})
                      </span>
                    )}
                    {letter.status === 'revision' && (
                      <span className="text-[11px] px-2.5 py-0.5 bg-orange-100 text-orange-950 border border-orange-300 rounded-full font-bold">
                        Perlu Revisi
                      </span>
                    )}
                    {letter.status === 'rejected' && (
                      <span className="text-[11px] px-2.5 py-0.5 bg-rose-100 text-rose-950 border border-rose-300 rounded-full font-bold">
                        Ditolak
                      </span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug">{letter.title}</h3>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-semibold text-slate-700 pt-1">
                    <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                      <User className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                      <span>Pemohon: {letter.userName}</span>
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                      <Building className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                      <span>{letter.branchName}</span>
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                      <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>Dibuat: {formatDateTimeId(letter.createdAt)}</span>
                    </span>
                    {(letter.lastEditedAt || (letter.updatedAt && letter.updatedAt !== letter.createdAt)) && (
                      <span className="flex items-center gap-1.5 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-amber-900 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>Diedit: {formatDateTimeId(letter.lastEditedAt || letter.updatedAt)} {letter.lastEditedBy ? `(${letter.lastEditedBy})` : ''}</span>
                      </span>
                    )}
                  </div>
                </div>

                  {/* Right Action buttons */}
                  {(() => {
                    const currentStepInfo = letter.approvalHistory?.[letter.currentStep - 1]
                    const expectedRole = currentStepInfo?.approverRole
                    const isMyTurn = canUserApproveLetter(letter, currentUser)
                    const isCreator = isLetterCreator(letter, currentUser)
                    const isApproved = letter.status === 'approved'

                    return (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Tombol Lihat (Biru - Icon Only) */}
                        <button
                          onClick={() => setSelectedLetter(letter)}
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-xs flex items-center justify-center"
                          title="Lihat Dokumen Surat"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Tombol Edit (Kuning/Amber - Icon Only, HANYA untuk IT & Pembuat Surat) */}
                        {canUserEditLetter(letter, currentUser) && (
                          <button
                            onClick={() => onEditLetter && onEditLetter(letter)}
                            className="p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition shadow-xs flex items-center justify-center"
                            title="Edit Isi Dokumen Surat"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        {/* Tombol Histori (Ungu/Indigo - Icon Only) */}
                        <button
                          onClick={() => setHistoryLetter(letter)}
                          className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-xs flex items-center justify-center"
                          title="Histori & Jejak Audit Lengkap"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        {/* Tombol Diskusi / Chat (Cyan/Teal - Icon Only, HANYA untuk Pembuat, Mengetahui, dan Penyetuju) */}
                        {canUserAccessLetterChat(letter, currentUser) && (
                          <button
                            onClick={() => setChatLetter(letter)}
                            className="p-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition shadow-xs flex items-center justify-center relative group"
                            title={`Diskusi / Tanya Jawab Surat (${letter.comments?.length || 0} Pesan)`}
                          >
                            <MessageSquare className="w-4 h-4" />
                            {letter.comments && letter.comments.length > 0 && (
                              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-black rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center border-2 border-white shadow-xs">
                                {letter.comments.length}
                              </span>
                            )}
                          </button>
                        )}

                        {letter.status === 'pending' && (
                          isMyTurn ? (
                            <button
                              onClick={() => {
                                setSelectedLetter(letter)
                                setActionType('approve')
                              }}
                              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-xs flex items-center justify-center animate-pulse"
                              title="Setujui / Putuskan Surat (Buka Dokumen)"
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
                            </button>
                          ) : (
                            <span
                              className="p-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-300 flex items-center justify-center shadow-2xs"
                              title={isCreator ? 'Surat diajukan oleh Anda' : `Menunggu: ${expectedRole || 'Approver Lain'}`}
                            >
                              <Clock className="w-4 h-4 text-amber-600" />
                            </span>
                          )
                        )}
                      </div>
                    )
                  })()}
              </div>
            )
          })
        )}
      </div>

      {/* FULL PREVIEW & DECISION MODAL */}
      {selectedLetter && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded">
                  {selectedLetter.letterNumber}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {selectedLetter.templateName} &bull; {selectedLetter.branchName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {canUserAccessLetterChat(selectedLetter, currentUser) && (
                  <button
                    onClick={() => setChatLetter(selectedLetter)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-lg transition shadow-xs relative"
                    title="Buka Ruang Diskusi Surat"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Diskusi</span>
                    {selectedLetter.comments && selectedLetter.comments.length > 0 && (
                      <span className="bg-rose-500 text-white text-[9px] font-black rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                        {selectedLetter.comments.length}
                      </span>
                    )}
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedLetter(null)
                    setActionType(null)
                  }}
                  className="text-slate-500 hover:text-slate-800 text-sm font-bold px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 transition"
                >
                  ✕ Tutup
                </button>
              </div>
            </div>

            {/* Modal Body: Document View */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100">
              <LetterDocumentView
                letter={selectedLetter}
                auditLogs={getAuditLogs(selectedLetter.id)}
                onEdit={(ltr) => {
                  setSelectedLetter(null)
                  if (onEditLetter) onEditLetter(ltr)
                }}
              />
            </div>

            {/* Modal Footer: Action Bar di Bawah */}
            <div className="p-3.5 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Status:</span>
                <strong
                  className={`uppercase font-bold px-2.5 py-1 rounded-md text-xs border transition ${
                    selectedLetter.status === 'approved'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : selectedLetter.status === 'rejected'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : selectedLetter.status === 'revision'
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  }`}
                >
                  {selectedLetter.status === 'approved' ? 'APPROVED' : selectedLetter.status}
                </strong>
              </div>

              {/* Tombol Aksi di Bawah (Tolak, Revisi, Setujui, Edit Dokumen) */}
              <div className="flex items-center gap-2">
                {canUserApproveLetter(selectedLetter, currentUser) && (
                  <>
                    <button
                      onClick={() => {
                        const note = window.prompt(`Alasan penolakan surat ${selectedLetter.letterNumber}:`, '')
                        if (note === null) return
                        if (!note.trim()) {
                          notify.warning('Catatan Wajib Diisi', 'Alasan penolakan wajib diisi!')
                          return
                        }
                        const updated = rejectLetter(selectedLetter.id, note)
                        if (updated) {
                          setSelectedLetter({ ...updated })
                          notify.error('Surat Ditolak', `Surat ${selectedLetter.letterNumber} telah ditolak.`)
                          refreshLetters()
                          if (onLetterUpdated) onLetterUpdated()
                        }
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg flex items-center gap-1.5 transition shadow-xs"
                      title="Tolak Surat Ajuan"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Tolak</span>
                    </button>

                    <button
                      onClick={() => {
                        const note = window.prompt(`Poin revisi untuk ${selectedLetter.letterNumber}:`, '')
                        if (note === null) return
                        if (!note.trim()) {
                          notify.warning('Catatan Wajib Diisi', 'Poin revisi wajib diisi!')
                          return
                        }
                        const updated = requestRevisionLetter(selectedLetter.id, note)
                        if (updated) {
                          setSelectedLetter({ ...updated })
                          notify.warning('Minta Revisi', `Surat ${selectedLetter.letterNumber} dikembalikan untuk revisi.`)
                          refreshLetters()
                          if (onLetterUpdated) onLetterUpdated()
                        }
                      }}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg flex items-center gap-1.5 transition shadow-xs"
                      title="Minta Revisi Surat"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Revisi</span>
                    </button>

                    <button
                      onClick={() => {
                        const stepIdx = (selectedLetter.currentStep || 1) - 1
                        const existingNote = selectedLetter.approvalHistory?.[stepIdx]?.notes || ''

                        const isMengetahui =
                          selectedLetter.currentStep === 1 ||
                          currentUser?.kodeJabatan === 'J08' ||
                          /operation\s*manager|\bOM\b/i.test(currentUser?.position || '')

                        let note = existingNote
                        if (!note && !isMengetahui) {
                          note = window.prompt('Catatan persetujuan (opsional):', 'Disetujui.') || ''
                        }

                        const updated = approveLetter(selectedLetter.id, note)
                        if (updated) {
                          setSelectedLetter({ ...updated })
                          notify.success('Surat Disetujui!', `Surat ${selectedLetter.letterNumber} berhasil disetujui & tanda tangan sah.`)
                          refreshLetters()
                          if (onLetterUpdated) onLetterUpdated()
                        }
                      }}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1.5 transition shadow-xs"
                      title="Setujui Surat & Tanda Tangani Sah"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Setujui</span>
                    </button>

                  </>
                )}

                {/* Tombol Catatan: Tetap tampil untuk approver yang bersangkutan meskipun sudah disetujui */}
                {(() => {
                  const userStepIdx = findUserStepIndex(selectedLetter, currentUser)
                  const canEditNote = userStepIdx !== -1 || canUserApproveLetter(selectedLetter, currentUser) || currentUser.role === 'admin_pusat'
                  if (!canEditNote) return null

                  const targetIdx = userStepIdx !== -1 ? userStepIdx : Math.max(0, (selectedLetter.currentStep || 1) - 1)

                  return (
                    <button
                      onClick={() => {
                        const existing = selectedLetter.approvalHistory?.[targetIdx]?.notes || ''
                        setTargetNoteStepIndex(targetIdx)
                        setNoteText(existing)
                        setNoteModalOpen(true)
                      }}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-1.5 transition shadow-xs"
                      title="Tulis atau ubah catatan persetujuan Anda di lembar dokumen"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{selectedLetter.status === 'approved' ? 'Ubah Catatan' : 'Catatan'}</span>
                    </button>
                  )
                })()}

                {canUserEditLetter(selectedLetter, currentUser) && (
                  <button
                    onClick={() => {
                      const letterToEdit = selectedLetter
                      setSelectedLetter(null)
                      if (onEditLetter) onEditLetter(letterToEdit)
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg flex items-center gap-1.5 transition shadow-xs"
                    title="Edit isi dokumen surat"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Dokumen</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setSelectedLetter(null)
                    setActionType(null)
                  }}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CATATAN PERSETUJUAN */}
      {noteModalOpen && selectedLetter && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm">
                  Catatan Persetujuan (Tahap {selectedLetter.currentStep})
                </h3>
              </div>
              <button
                onClick={() => setNoteModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 rounded bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Catatan ini akan langsung tampil pada kolom <strong>CATATAN</strong> di Lembar Persetujuan Halaman 2 dokumen resmi.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Isi Catatan:
                </label>
                <textarea
                  rows={4}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Contoh: Disetujui sesuai rincian biaya operasional cabang..."
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-sans"
                />
              </div>

              {/* Quick Suggestions */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Pilihan Rekomendasi Cepat:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Disetujui tanpa catatan khusus.',
                    'Disetujui sesuai rincian anggaran operasional.',
                    'Mohon lampirkan kuitansi/nota asli setelah kegiatan selesai.',
                    'Disetujui dengan evaluasi berkala.',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNoteText(preset)}
                      className="text-[11px] bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-2.5 py-1 rounded-md border border-slate-200 transition text-left"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setNoteModalOpen(false)}
                className="px-4 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200 font-bold transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const stepIdx = targetNoteStepIndex !== undefined ? targetNoteStepIndex : Math.max(0, (selectedLetter.currentStep || 1) - 1)
                  const updated = updateLetterApprovalNotes(selectedLetter.id, stepIdx, noteText.trim())
                  if (updated) {
                    setSelectedLetter({ ...updated })
                    refreshLetters()
                    if (onLetterUpdated) onLetterUpdated()
                    notify.success('Catatan Disimpan', 'Catatan persetujuan berhasil diperbarui pada dokumen.')
                    setNoteModalOpen(false)
                  }
                }}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Simpan Catatan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RIWAYAT / HISTORI SURAT LENGKAP */}
      {historyLetter && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">
                    Histori & Jejak Audit Dokumen
                  </h3>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">
                    {historyLetter.letterNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHistoryLetter(null)}
                className="text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 text-xs font-semibold transition"
              >
                ✕ Tutup
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 bg-slate-50 flex-1">
              {/* Ringkasan Identitas Surat */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Perihal / Template
                    </span>
                    <strong className="text-sm text-slate-800 block">
                      {historyLetter.title}
                    </strong>
                    <span className="text-xs text-slate-500">
                      {historyLetter.templateName} &bull; {historyLetter.branchName}
                    </span>
                  </div>
                  <div>
                    {historyLetter.status === 'approved' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Disetujui Penuh
                      </span>
                    )}
                    {historyLetter.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        <Clock className="w-3.5 h-3.5 text-amber-700" /> Menunggu Persetujuan
                      </span>
                    )}
                    {historyLetter.status === 'revision' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-900 border border-orange-300">
                        <AlertTriangle className="w-3.5 h-3.5 text-orange-700" /> Perlu Revisi
                      </span>
                    )}
                    {historyLetter.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
                        <XCircle className="w-3.5 h-3.5 text-rose-700" /> Ditolak
                      </span>
                    )}
                    {historyLetter.status === 'draft' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-800 border border-slate-300">
                        Draf
                      </span>
                    )}
                  </div>
                </div>

                {/* 2-Box Summary Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                      DIBUAT OLEH (PEMOHON):
                    </span>
                    <strong className="text-slate-900 font-bold block text-sm mt-0.5">
                      {historyLetter.userName || historyLetter.createdBy}
                    </strong>
                    <span className="text-[11px] text-slate-600 block">
                      Cabang: {historyLetter.branchName}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-900 flex items-center gap-1 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                      {formatDateTimeId(historyLetter.createdAt)}
                    </span>
                  </div>

                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 block">
                      TERAKHIR DIEDIT OLEH:
                    </span>
                    <strong className="text-slate-900 font-bold block text-sm mt-0.5">
                      {historyLetter.lastEditedBy || (historyLetter.updatedAt && historyLetter.updatedAt !== historyLetter.createdAt ? historyLetter.userName : 'Belum pernah diedit')}
                    </strong>
                    <span className="text-[11px] text-slate-600 block">
                      {historyLetter.lastEditedPosition ? `Jabatan: ${historyLetter.lastEditedPosition}` : (historyLetter.lastEditedBy ? 'Pengguna Sistem' : 'Dokumen asli sesuai saat pembuatan')}
                    </span>
                    <span className="text-[11px] font-semibold text-amber-900 flex items-center gap-1 mt-1">
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                      {historyLetter.lastEditedAt
                        ? formatDateTimeId(historyLetter.lastEditedAt)
                        : (historyLetter.updatedAt && historyLetter.updatedAt !== historyLetter.createdAt
                            ? formatDateTimeId(historyLetter.updatedAt)
                            : '-')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detail Timeline Jejak Audit */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-indigo-600" />
                    <span>Kronologi Lengkap Aktivitas:</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Waktu Real-Time (WIB)
                  </span>
                </div>

                {(() => {
                  const logs = getAuditLogs(historyLetter.id)
                  if (!logs || logs.length === 0) {
                    return (
                      <div className="text-center py-6 text-slate-500 text-xs">
                        Belum ada aktivitas terekam untuk dokumen ini.
                      </div>
                    )
                  }

                  return (
                    <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                      {logs.map((log, idx) => {
                        const isApprove = log.action?.toLowerCase().includes('setuju') || log.action?.toLowerCase().includes('approved')
                        const isReject = log.action?.toLowerCase().includes('tolak') || log.action?.toLowerCase().includes('reject')
                        const isRevision = log.action?.toLowerCase().includes('revisi')
                        const isEdit = log.action?.toLowerCase().includes('edit') || log.action?.toLowerCase().includes('perubahan')
                        const isCreate = log.action?.toLowerCase().includes('buat') || log.action?.toLowerCase().includes('draf')

                        return (
                          <div key={idx} className="relative flex items-start gap-3.5 pl-8">
                            <div
                              className={`absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ring-2 ${
                                isApprove
                                  ? 'bg-emerald-600 ring-emerald-100'
                                  : isReject
                                  ? 'bg-rose-600 ring-rose-100'
                                  : isRevision
                                  ? 'bg-orange-600 ring-orange-100'
                                  : isEdit
                                  ? 'bg-amber-600 ring-amber-100'
                                  : 'bg-indigo-600 ring-indigo-100'
                              }`}
                            />
                            <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs shadow-2xs">
                              <div className="flex flex-wrap justify-between items-center gap-1 mb-1.5">
                                <span
                                  className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                                    isApprove
                                      ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                                      : isReject
                                      ? 'bg-rose-100 text-rose-950 border border-rose-300'
                                      : isRevision
                                      ? 'bg-orange-100 text-orange-950 border border-orange-300'
                                      : isEdit
                                      ? 'bg-amber-100 text-amber-950 border border-amber-300'
                                      : 'bg-indigo-100 text-indigo-950 border border-indigo-300'
                                  }`}
                                >
                                  {log.action}
                                </span>
                                <span className="text-[11px] font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                                  {formatDateTimeId(log.timestamp)}
                                </span>
                              </div>
                              <p className="text-slate-800 font-medium">
                                Oleh: <strong className="font-bold text-slate-950">{log.userName}</strong>
                              </p>
                              {log.notes && (
                                <p className="text-slate-600 text-[11px] mt-1 bg-white p-2 rounded border border-slate-200 italic">
                                  &ldquo;{log.notes}&rdquo;
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-white border-t border-slate-200 flex justify-between items-center text-xs">
              <button
                onClick={() => {
                  const target = historyLetter
                  setHistoryLetter(null)
                  setSelectedLetter(target)
                }}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg font-bold flex items-center gap-1.5 transition"
              >
                <Eye className="w-3.5 h-3.5 text-slate-600" />
                <span>Lihat Isi Dokumen Surat</span>
              </button>

              <button
                onClick={() => setHistoryLetter(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DISKUSI / CHAT SURAT */}
      {chatLetter && (
        <LetterChatModal
          letterId={chatLetter.id}
          initialLetter={chatLetter}
          currentUser={currentUser}
          onClose={() => {
            setChatLetter(null)
            refreshLetters()
          }}
        />
      )}
    </div>
  )
}
