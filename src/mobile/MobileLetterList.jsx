import React, { useState } from 'react'
import { canUserApproveLetter } from '../components/ApproverInbox'
import MobileApprovalModal from './MobileApprovalModal'
import { formatDateId } from '../services/storage'

export default function MobileLetterList({
  currentUser,
  letters = [],
  onPreviewLetter,
  onOpenChat,
  onApproveLetter,
  onRejectLetter,
  onRequestRevision,
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all, pending, approved, revision
  const [approvingLetter, setApprovingLetter] = useState(null)

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

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-4 pb-28 px-1">
      {/* Header Title & Counter */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <span>📁</span> Daftar Arsip Surat
          </h2>
          <p className="text-[11px] font-medium text-slate-500">
            Total {filteredLetters.length} dokumen arsip
          </p>
        </div>
      </div>

      {/* Search Input Box */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari nomor, perihal, atau cabang..."
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
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full w-5 h-5 flex items-center justify-center"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter Tabs Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        {[
          { id: 'all', label: 'Semua' },
          { id: 'pending', label: '⏳ Pending' },
          { id: 'approved', label: '✓ Disetujui' },
          { id: 'revision', label: '⚠ Revisi' },
          { id: 'rejected', label: '✕ Ditolak' },
          { id: 'draft', label: '📝 Draf' },
        ].map((tab) => {
          const isActive = statusFilter === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition active:scale-95 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'bg-white text-slate-600 shadow-[0_2px_10px_rgba(15,23,42,0.05)] hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Letters List */}
      {filteredLetters.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center shadow-[0_4px_20px_rgba(15,23,42,0.06)] mt-2">
          <span className="text-4xl block mb-2">🔍</span>
          <p className="text-xs font-bold text-slate-700">Tidak ada dokumen ditemukan</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Coba kata kunci pencarian atau ganti filter status di atas.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
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
                className="bg-white rounded-3xl p-4.5 shadow-[0_8px_30px_rgba(15,23,42,0.07)] hover:shadow-[0_12px_36px_rgba(15,23,42,0.11)] transition-all duration-200"
              >
                {/* Header Card: Nomor Surat & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg inline-block truncate max-w-full">
                      {letter.letterNumber || 'Draft Dokumen'}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900 mt-2 leading-snug">
                      {letter.title || 'Surat Pengajuan'}
                    </h3>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0 ${
                      isApproved
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : isRejected
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : isRevision
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : isDraft
                        ? 'bg-slate-100 text-slate-700 border border-slate-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {isApproved
                      ? '✓ Disetujui'
                      : isRejected
                      ? '✕ Ditolak'
                      : isRevision
                      ? '⚠ Revisi'
                      : isDraft
                      ? '📝 Draf'
                      : '⏳ Menunggu ACC'}
                  </span>
                </div>

                {/* Info Metadata */}
                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                  <div className="truncate">
                    <span className="text-slate-400">Pemohon:</span>{' '}
                    <span className="font-semibold text-slate-700">
                      {creatorName}
                    </span>
                  </div>
                  <div className="truncate text-right">
                    <span className="text-slate-400">Cabang:</span>{' '}
                    <span className="font-semibold text-slate-700">
                      {branchName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Tanggal:</span>{' '}
                    <span className="font-semibold text-slate-700">
                      {letter.createdAt ? formatDateId(letter.createdAt) : '-'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400">Tahap:</span>{' '}
                    <span className="font-bold text-indigo-600">
                      Step {letter.currentStep || 1} / {letter.totalSteps || 3}
                    </span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* Chat discussion trigger button */}
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

                  <div className="flex items-center gap-2">
                    {/* Tombol Checklist Approval jika perlu ACC */}
                    {isPendingThisUser && onApproveLetter && (
                      <button
                        type="button"
                        onClick={() => setApprovingLetter(letter)}
                        className="w-8 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center text-sm font-bold shadow-sm shadow-emerald-500/30 transition active:scale-95"
                        title="Proses Persetujuan"
                      >
                        ✓
                      </button>
                    )}

                    {/* Preview document button */}
                    <button
                      onClick={() => onPreviewLetter(letter)}
                      className="px-4 py-1.5 text-xs font-extrabold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-md shadow-blue-500/25 transition active:scale-95"
                    >
                      Buka Dokumen
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
    </div>
  )
}
