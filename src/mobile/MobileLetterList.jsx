import React, { useState, useMemo } from 'react'
import {
  Search,
  X,
  FolderArchive,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileEdit,
  MessageSquare,
  FileText,
  Building2,
  User,
  Calendar,
  Layers,
  Check,
  Share2,
} from 'lucide-react'
import { canUserApproveLetter } from '../components/ApproverInbox'
import MobileApprovalModal from './MobileApprovalModal'
import ShareLetterModal from '../components/ShareLetterModal'
import { formatDateId } from '../services/storage'

export default function MobileLetterList({
  currentUser,
  letters = [],
  branches = [],
  onPreviewLetter,
  onOpenChat,
  onApproveLetter,
  onRejectLetter,
  onRequestRevision,
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all, pending, approved, revision
  const [branchFilter, setBranchFilter] = useState('all')
  const [approvingLetter, setApprovingLetter] = useState(null)
  const [sharingLetter, setSharingLetter] = useState(null)

  // Cek apakah user adalah PST (Pusat)
  const isPST =
    currentUser?.branchId === 'PST' ||
    currentUser?.branchCode === 'PST' ||
    (currentUser?.branchName && currentUser.branchName.toLowerCase().includes('pusat')) ||
    currentUser?.role === 'admin_pusat' ||
    currentUser?.kodeJabatan === 'J01' || // Direktur
    currentUser?.kodeJabatan === 'J02' || // GM
    currentUser?.kodeJabatan === 'J27'   // IT Pusat

  // Daftar cabang unik untuk filter PST
  const availableBranches = useMemo(() => {
    const map = new Map()
    ;(branches || []).forEach((b) => {
      const code = b.code || b.branchCode || b.id
      if (code) {
        map.set(String(code).toUpperCase(), {
          code: String(code).toUpperCase(),
          name: b.name || b.nama || `Cabang ${code}`,
        })
      }
    })
    letters.forEach((l) => {
      const code = l.branchId || l.branchCode
      if (code && !map.has(String(code).toUpperCase())) {
        map.set(String(code).toUpperCase(), {
          code: String(code).toUpperCase(),
          name: l.branchName || `Cabang ${code}`,
        })
      }
    })
    return Array.from(map.values()).sort((a, b) => {
      if (a.code === 'PST') return -1
      if (b.code === 'PST') return 1
      return a.name.localeCompare(b.name)
    })
  }, [branches, letters])

  const filteredLetters = letters.filter((letter) => {
    // Search
    const search = searchTerm.toLowerCase()
    const creator = (letter.userName || letter.creatorName || letter.createdBy || '').toLowerCase()
    const branch = (letter.branchName || letter.branchId || letter.branchCode || '').toLowerCase()
    const matchesSearch =
      !searchTerm ||
      (letter.letterNumber || '').toLowerCase().includes(search) ||
      (letter.title || '').toLowerCase().includes(search) ||
      creator.includes(search) ||
      branch.includes(search)

    // Status filter
    let matchesStatus = true
    if (statusFilter === 'pending') {
      matchesStatus = letter.status === 'pending' || letter.status === 'pending_approval' || letter.status === 'submitted'
    } else if (statusFilter === 'approved') {
      matchesStatus = letter.status === 'approved'
    } else if (statusFilter === 'revision') {
      matchesStatus = letter.status === 'revision' || letter.status === 'revision_requested'
    } else if (statusFilter === 'rejected') {
      matchesStatus = letter.status === 'rejected'
    } else if (statusFilter === 'draft') {
      matchesStatus = letter.status === 'draft'
    }

    // Branch filter (khusus PST)
    let matchesBranch = true
    if (isPST && branchFilter !== 'all') {
      const target = branchFilter.toUpperCase()
      const bCode = String(letter.branchId || letter.branchCode || '').toUpperCase()
      const bName = String(letter.branchName || '').toUpperCase()
      matchesBranch =
        bCode === target ||
        bName.includes(target) ||
        (target === 'PST' && (bCode === 'PST' || bName.includes('PUSAT')))
    }

    return matchesSearch && matchesStatus && matchesBranch
  })

  const filterTabs = [
    { id: 'all', label: 'Semua', icon: null },
    { id: 'pending', label: 'Menunggu', icon: Clock },
    { id: 'approved', label: 'Disetujui', icon: CheckCircle2 },
    { id: 'revision', label: 'Revisi', icon: AlertCircle },
    { id: 'rejected', label: 'Ditolak', icon: XCircle },
    { id: 'draft', label: 'Draf', icon: FileEdit },
  ]

  return (
    <div className="space-y-3 pb-28 px-1">
      {/* Header Title & Counter */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
            <FolderArchive size={16} className="text-blue-600" />
            <span>Daftar Arsip Surat</span>
          </h2>
          <p className="text-[11px] font-medium text-slate-400">
            Total {filteredLetters.length} dokumen
          </p>
        </div>
      </div>

      {/* Search Input Box */}
      <div className="relative">
        <Search size={15} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari nomor, perihal, atau cabang..."
          className="w-full bg-white rounded-xl pl-9 pr-8 py-2.5 text-xs text-slate-800 placeholder-slate-400 border border-slate-200/80 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
          >
            <X size={10} />
          </button>
        )}
      </div>

      {/* Filter Cabang Khusus PST */}
      {isPST && (
        <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-slate-200/80 shadow-xs">
          <Building2 size={15} className="text-blue-600 shrink-0" />
          <span className="text-[11px] font-bold text-slate-500 shrink-0">Cabang:</span>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="flex-1 bg-transparent text-xs font-bold text-slate-800 focus:outline-none truncate cursor-pointer"
          >
            <option value="all">Semua Cabang ({letters.length})</option>
            {availableBranches.map((b) => (
              <option key={b.code} value={b.code}>
                {b.code === 'PST' ? 'Kantor Pusat (PST)' : b.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Filter Tabs Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {filterTabs.map((tab) => {
          const isActive = statusFilter === tab.id
          const TabIcon = tab.icon

          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition active:scale-95 text-[11px] ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {TabIcon && <TabIcon size={12} strokeWidth={2.2} />}
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Letters List */}
      {filteredLetters.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/70 shadow-xs mt-2">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
            <Search size={18} />
          </div>
          <p className="text-xs font-bold text-slate-700">Tidak ada dokumen ditemukan</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Coba kata kunci pencarian atau ganti filter status di atas.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLetters.map((letter) => {
            const isApproved = letter.status === 'approved'
            const isPending = letter.status === 'pending' || letter.status === 'pending_approval' || letter.status === 'submitted'
            const isRevision = letter.status === 'revision' || letter.status === 'revision_requested'
            const isRejected = letter.status === 'rejected'
            const isDraft = letter.status === 'draft'
            const commentsCount = (letter.comments || []).length
            const isPendingThisUser = canUserApproveLetter(letter, currentUser)

            const creatorName = letter.userName || letter.creatorName || letter.createdBy || '-'
            const branchName = letter.branchName || letter.branchId || letter.branchCode || '-'

            return (
              <div
                key={letter.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-blue-300 transition-all duration-200"
              >
                {/* Header Card: Nomor Surat & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md inline-block truncate max-w-full border border-blue-100">
                      {letter.letterNumber || 'Draft Dokumen'}
                    </span>
                    {letter.sharedWith && letter.sharedWith.some((s) => String(s.userId || s.id) === String(currentUser?.id)) && (() => {
                      const shareEntry = letter.sharedWith.find((s) => String(s.userId || s.id) === String(currentUser?.id))
                      return (
                        <div className="mt-1 flex items-center gap-1">
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-700 border border-violet-200">
                            <Share2 size={9} /> Dibagikan oleh {shareEntry?.sharedBy || 'Pengguna'}
                          </span>
                        </div>
                      )
                    })()}
                    <h3 className="text-xs font-bold text-slate-900 mt-1.5 leading-snug">
                      {letter.title || 'Surat Pengajuan'}
                    </h3>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      isApproved
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : isRejected
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : isRevision
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : isDraft
                        ? 'bg-slate-100 text-slate-600 border border-slate-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {isApproved ? (
                      <>
                        <CheckCircle2 size={11} /> Disetujui
                      </>
                    ) : isRejected ? (
                      <>
                        <XCircle size={11} /> Ditolak
                      </>
                    ) : isRevision ? (
                      <>
                        <AlertCircle size={11} /> Revisi
                      </>
                    ) : isDraft ? (
                      <>
                        <FileEdit size={11} /> Draf
                      </>
                    ) : (
                      <>
                        <Clock size={11} /> Menunggu
                      </>
                    )}
                  </span>
                </div>

                {/* Info Metadata */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                  <div className="truncate flex items-center gap-1">
                    <User size={12} className="text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-700 truncate">{creatorName}</span>
                  </div>
                  <div className="truncate text-right flex items-center justify-end gap-1">
                    <Building2 size={12} className="text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-700 truncate">{branchName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={12} className="text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-600">
                      {letter.createdAt ? formatDateId(letter.createdAt) : '-'}
                    </span>
                  </div>
                  <div className="text-right flex items-center justify-end gap-1">
                    <Layers size={12} className="text-indigo-500 shrink-0" />
                    <span className="font-bold text-indigo-600">
                      Step {letter.currentStep || 1}/{letter.totalSteps || 3}
                    </span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Chat discussion trigger button */}
                    <button
                      onClick={() => onOpenChat(letter)}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition active:scale-95"
                    >
                      <MessageSquare size={13} className="text-slate-500" />
                      <span>Diskusi</span>
                      {commentsCount > 0 && (
                        <span className="bg-indigo-600 text-white text-[10px] px-1.5 rounded-full font-bold">
                          {commentsCount}
                        </span>
                      )}
                    </button>

                    {/* Share letter trigger button */}
                    <button
                      type="button"
                      onClick={() => setSharingLetter(letter)}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-semibold transition active:scale-95 border border-violet-200"
                      title="Bagikan Surat"
                    >
                      <Share2 size={13} className="text-violet-600" />
                      <span>Bagikan</span>
                      {letter.sharedWith && letter.sharedWith.length > 0 && (
                        <span className="bg-violet-600 text-white text-[10px] px-1.5 rounded-full font-bold">
                          {letter.sharedWith.length}
                        </span>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Tombol Quick Approve jika user approver surat ini */}
                    {isPendingThisUser && onApproveLetter && (
                      <button
                        type="button"
                        onClick={() => setApprovingLetter(letter)}
                        className="w-8 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-xs transition active:scale-95"
                        title="Proses Persetujuan"
                      >
                        <Check size={16} strokeWidth={2.5} />
                      </button>
                    )}

                    {/* Preview document button */}
                    <button
                      onClick={() => onPreviewLetter(letter)}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs transition active:scale-95"
                    >
                      <FileText size={13} />
                      <span>Buka</span>
                    </button>
                  </div>
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
            if (onApproveLetter) onApproveLetter(id, note)
            setApprovingLetter(null)
          }}
          onReject={(id, reason) => {
            if (onRejectLetter) onRejectLetter(id, reason)
            setApprovingLetter(null)
          }}
          onRequestRevision={(id, note) => {
            if (onRequestRevision) onRequestRevision(id, note)
            setApprovingLetter(null)
          }}
        />
      )}

      {/* MODAL BAGIKAN SURAT */}
      {sharingLetter && (
        <ShareLetterModal
          letter={sharingLetter}
          currentUser={currentUser}
          onClose={() => setSharingLetter(null)}
        />
      )}
    </div>
  )
}

