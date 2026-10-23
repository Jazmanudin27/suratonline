import React from 'react'
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

  // 4 Kartu Status Utama (Sesuai Referensi Gambar User)
  const stats = [
    {
      label: 'Disetujui',
      count: approvedLetters,
      color: 'from-emerald-500 to-green-600',
      shadow: 'shadow-emerald-500/25',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    {
      label: 'Perlu ACC',
      count: pendingLetters,
      color: 'from-rose-500 to-red-600',
      shadow: 'shadow-rose-500/25',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Revisi',
      count: revisionLetters,
      color: 'from-amber-400 to-orange-500',
      shadow: 'shadow-amber-500/25',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      label: 'Total Arsip',
      count: totalLetters,
      color: 'from-blue-600 to-indigo-600',
      shadow: 'shadow-blue-500/25',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
  ]

  // Surat terkini (ambil 6 teratas)
  const recentLetters = letters.slice(0, 6)

  return (
    <div className="space-y-4 pb-28">
      {/* 1. KARTU STATUS UTAMA (Menyatu Lembut dengan Header) */}
      <section className="-mt-3 px-1">
        <div className="bg-white rounded-3xl p-4 shadow-[0_4px_20px_rgba(15,23,42,0.05)] border border-slate-100">
          <div className="grid grid-cols-4 gap-2">
            {stats.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onNavigateTab(item.label === 'Perlu ACC' ? 'inbox' : 'archive')}
                className="flex flex-col items-center text-center group active:scale-95 transition-all"
              >
                <div
                  className={`w-13 h-13 rounded-2xl bg-gradient-to-tr ${item.color} flex items-center justify-center shadow-md ${item.shadow} group-hover:scale-105 transition-all duration-300`}
                >
                  {item.icon}
                </div>
                <span className="text-sm font-extrabold text-slate-800 mt-2 font-sans">
                  {item.count}
                </span>
                <span className="text-[10px] font-bold text-slate-500 tracking-tight">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. AJUAN TERKINI (List Kartu Bersih & Elegan) */}
      <section className="px-1">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <span>🕒</span> Ajuan Terkini
          </h2>
          <button
            type="button"
            onClick={() => onNavigateTab('archive')}
            className="text-[11px] text-blue-600 font-bold hover:underline"
          >
            Lihat Semua ({totalLetters}) →
          </button>
        </div>

        {recentLetters.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
            <span className="text-4xl block mb-2">📭</span>
            <p className="text-xs font-bold text-slate-700">Belum ada surat ajuan</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Surat yang diajukan di PC akan otomatis tampil di sini.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentLetters.map((letter) => {
              const isApproved = letter.status === 'approved'
              const isPending = letter.status === 'pending' || letter.status === 'pending_approval' || letter.status === 'submitted'
              const isRevision = letter.status === 'revision' || letter.status === 'revision_requested'
              const isRejected = letter.status === 'rejected'
              const isDraft = letter.status === 'draft'
              const commentsCount = (letter.comments || []).length

              const creatorName = letter.userName || letter.creatorName || letter.createdBy || 'Staff'
              const branchDisplay = letter.branchName || letter.branchId || letter.branchCode || 'Pusat'

              return (
                <div
                  key={letter.id}
                  className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_2px_12px_rgba(15,23,42,0.04)] hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-100">
                          {letter.letterNumber || 'Draft'}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
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

                      <h4 className="text-xs font-bold text-slate-900 mt-1.5 truncate leading-snug">
                        {letter.title || 'Surat Pengajuan'}
                      </h4>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span>👤 {creatorName}</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-700">🏢 {branchDisplay}</span>
                      </div>
                    </div>

                    {/* Chat indicator shortcut */}
                    {commentsCount > 0 && (
                      <button
                        type="button"
                        onClick={() => onOpenChat(letter)}
                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold border border-indigo-100 hover:bg-indigo-100 transition shrink-0"
                      >
                        💬 {commentsCount}
                      </button>
                    )}
                  </div>

                  {/* Bottom Action inside card */}
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
                    <span className="text-[10px] font-medium text-slate-400">
                      📅 {letter.createdAt ? formatDateId(letter.createdAt) : '-'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenChat(letter)}
                        className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100/80 hover:bg-slate-200 active:scale-95 rounded-xl transition"
                      >
                        Diskusi
                      </button>
                      <button
                        type="button"
                        onClick={() => onPreviewLetter(letter)}
                        className="px-4 py-1.5 text-xs font-extrabold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 rounded-xl shadow-xs shadow-blue-500/20 transition"
                      >
                        Lihat Dokumen
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
