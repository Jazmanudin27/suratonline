import React from 'react'
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FolderArchive,
  History,
  Inbox,
  User,
  Building2,
  Calendar,
  MessageSquare,
  FileText,
  ChevronRight,
} from 'lucide-react'
import { formatDateId } from '../services/storage'

export default function MobileDashboard({
  currentUser,
  letters = [],
  pendingApprovalsCount = 0,
  onNavigateTab,
  onPreviewLetter,
  onOpenChat,
}) {
  // Hitung status statistik
  const totalLetters = letters.length
  const approvedLetters = letters.filter((l) => l.status === 'approved').length
  const pendingLetters = letters.filter(
    (l) => l.status === 'pending' || l.status === 'pending_approval' || l.status === 'submitted'
  ).length
  const revisionLetters = letters.filter(
    (l) => l.status === 'revision' || l.status === 'revision_requested' || l.status === 'rejected'
  ).length

  const stats = [
    {
      label: 'Disetujui',
      count: approvedLetters,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
    },
    {
      label: 'Perlu ACC',
      count: pendingLetters,
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: Clock,
    },
    {
      label: 'Revisi',
      count: revisionLetters,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: AlertCircle,
    },
    {
      label: 'Total Arsip',
      count: totalLetters,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: FolderArchive,
    },
  ]

  // Surat terkini (ambil 6 teratas)
  const recentLetters = letters.slice(0, 6)

  return (
    <div className="space-y-3 pb-28">
      {/* 1. KARTU STATUS UTAMA */}
      <section className="-mt-2 px-1">
        <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs">
          <div className="grid grid-cols-4 gap-2">
            {stats.map((item, idx) => {
              const Icon = item.icon
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onNavigateTab(item.label === 'Perlu ACC' ? 'inbox' : 'archive')}
                  className="flex flex-col items-center text-center p-2 rounded-xl hover:bg-slate-50 transition active:scale-95"
                >
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${item.color}`}>
                    <Icon size={18} strokeWidth={2.2} />
                  </div>
                  <span className="text-sm font-black text-slate-800 mt-1.5 font-sans">
                    {item.count}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 tracking-tight">
                    {item.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* 2. AJUAN TERKINI */}
      <section className="px-1">
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <History size={14} className="text-blue-600" />
            <span>Ajuan Terkini</span>
          </h2>
          <button
            type="button"
            onClick={() => onNavigateTab('archive')}
            className="text-[11px] text-blue-600 font-bold hover:underline inline-flex items-center gap-0.5"
          >
            <span>Semua ({totalLetters})</span>
            <ChevronRight size={12} />
          </button>
        </div>

        {recentLetters.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/70 shadow-xs">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
              <Inbox size={20} />
            </div>
            <p className="text-xs font-bold text-slate-700">Belum ada surat ajuan</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Surat yang diajukan akan otomatis tampil di sini.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentLetters.map((letter) => {
              const isApproved = letter.status === 'approved'
              const isPending = letter.status === 'pending' || letter.status === 'pending_approval' || letter.status === 'submitted'
              const isRevision = letter.status === 'revision' || letter.status === 'revision_requested'
              const isRejected = letter.status === 'rejected'
              const commentsCount = (letter.comments || []).length

              const creatorName = letter.userName || letter.creatorName || letter.createdBy || 'Staff'
              const branchDisplay = letter.branchName || letter.branchId || letter.branchCode || 'Pusat'

              return (
                <div
                  key={letter.id}
                  className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs hover:border-blue-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          {letter.letterNumber || 'Draft'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isApproved
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isRejected
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isRevision
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {isApproved
                            ? 'Disetujui'
                            : isRejected
                            ? 'Ditolak'
                            : isRevision
                            ? 'Revisi'
                            : 'Menunggu ACC'}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 mt-1 truncate leading-snug">
                        {letter.title || 'Surat Pengajuan'}
                      </h4>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <User size={11} className="text-slate-400" />
                          <span className="truncate max-w-[100px]">{creatorName}</span>
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <Building2 size={11} className="text-slate-400" />
                          <span>{branchDisplay}</span>
                        </span>
                      </div>
                    </div>

                    {/* Chat indicator shortcut */}
                    {commentsCount > 0 && (
                      <button
                        type="button"
                        onClick={() => onOpenChat(letter)}
                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold border border-indigo-100 hover:bg-indigo-100 transition shrink-0"
                      >
                        <MessageSquare size={11} />
                        <span>{commentsCount}</span>
                      </button>
                    )}
                  </div>

                  {/* Bottom Action inside card */}
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                      <Calendar size={11} className="text-slate-400" />
                      <span>{letter.createdAt ? formatDateId(letter.createdAt) : '-'}</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenChat(letter)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-lg transition"
                      >
                        Diskusi
                      </button>
                      <button
                        type="button"
                        onClick={() => onPreviewLetter(letter)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 rounded-lg shadow-xs transition"
                      >
                        <FileText size={12} />
                        <span>Buka</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

