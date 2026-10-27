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
  FilePlus,
  FileCheck2,
  Package,
  HelpCircle,
  Monitor,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react'
import { formatDateId } from '../services/storage'

export default function MobileDashboard({
  currentUser,
  letters = [],
  pendingApprovalsCount = 0,
  onNavigateTab,
  onPreviewLetter,
  onOpenChat,
  onOpenGuide,
  onSwitchToDesktop,
}) {
  // Hitung status statistik surat
  const totalLetters = letters.length
  const approvedLetters = letters.filter((l) => l.status === 'approved').length
  const pendingLetters = letters.filter(
    (l) => l.status === 'pending' || l.status === 'pending_approval' || l.status === 'submitted'
  ).length
  const revisionLetters = letters.filter(
    (l) => l.status === 'revision' || l.status === 'revision_requested'
  ).length

  const stats = [
    {
      label: 'Disetujui',
      count: approvedLetters,
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      badgeBg: 'bg-emerald-600',
      icon: CheckCircle2,
      tab: 'archive',
      filter: 'approved',
    },
    {
      label: 'Perlu ACC',
      count: pendingApprovalsCount,
      bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
      badgeBg: 'bg-rose-600',
      icon: Clock,
      tab: 'inbox',
      filter: 'pending',
    },
    {
      label: 'Revisi',
      count: revisionLetters,
      bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
      badgeBg: 'bg-amber-500',
      icon: AlertCircle,
      tab: 'archive',
      filter: 'revision',
    },
    {
      label: 'Total Arsip',
      count: totalLetters,
      bg: 'bg-blue-50 text-blue-700 border-blue-200/80',
      badgeBg: 'bg-blue-600',
      icon: FolderArchive,
      tab: 'archive',
      filter: 'all',
    },
  ]

  // Surat terkini (ambil 6 teratas)
  const recentLetters = letters.slice(0, 6)

  // Tombol aksi pintas di beranda
  const quickActions = [
    {
      id: 'archive_create',
      label: 'Ajuan Surat',
      desc: 'Daftar & buat surat',
      icon: FileText,
      color: 'from-blue-600 to-indigo-600',
      action: () => onNavigateTab('archive'),
    },
    {
      id: 'inbox_act',
      label: 'Inbox Approval',
      desc: `${pendingApprovalsCount} butuh ACC`,
      icon: Inbox,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null,
      color: 'from-rose-500 to-pink-600',
      action: () => onNavigateTab('inbox'),
    },
    {
      id: 'memo_act',
      label: 'Internal Memo',
      desc: 'Instruksi resmi pusat',
      icon: FileCheck2,
      color: 'from-purple-600 to-indigo-600',
      action: () => onNavigateTab('memo'),
    },
    {
      id: 'product_act',
      label: 'Data Produk',
      desc: 'Katalog komoditas',
      icon: Package,
      color: 'from-amber-500 to-orange-600',
      action: () => onNavigateTab('products'),
    },
  ]

  return (
    <div className="space-y-3.5 pb-28">
      {/* 1. HERO GREETING BANNER */}
      <section className="-mt-1 px-1">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/60 p-4 text-white shadow-lg">
          <div className="absolute -right-8 -top-8 w-36 h-36 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-8 -bottom-8 w-36 h-36 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/25 border border-indigo-400/30 text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Beranda Surat Ajuan</span>
              </div>
              <h2 className="text-base font-extrabold text-white leading-tight">
                Selamat Datang, {currentUser?.name?.split(' ')[0] || 'User'}!
              </h2>
              <p className="text-[11px] text-slate-300 leading-snug">
                {currentUser?.position || currentUser?.roleLabel || 'Staff Operasional'} &bull; Cabang{' '}
                <span className="font-semibold text-white">
                  {currentUser?.branchName || currentUser?.branchId || 'Pusat'}
                </span>
              </p>
            </div>

            {onOpenGuide && (
              <button
                type="button"
                onClick={onOpenGuide}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition flex flex-col items-center justify-center border border-white/15 text-indigo-200 shrink-0 shadow-xs"
                title="Petunjuk Penggunaan"
              >
                <HelpCircle className="w-4 h-4 text-indigo-300" />
                <span className="text-[9px] font-bold mt-0.5">Petunjuk</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. ALERT PERLU APPROVAL JIKA ADA */}
      {pendingApprovalsCount > 0 && (
        <section className="px-1">
          <div
            onClick={() => onNavigateTab('inbox')}
            className="cursor-pointer bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-amber-500/10 border border-rose-300/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs hover:border-rose-400 transition active:scale-[0.99]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/30 animate-pulse">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-rose-900 leading-none">
                    {pendingApprovalsCount} Surat Menunggu ACC
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-rose-600 text-white">
                    Penting
                  </span>
                </div>
                <p className="text-[11px] text-rose-700 mt-1 truncate">
                  Ketuk untuk membuka kotak masuk dan verifikasi dokumen.
                </p>
              </div>
            </div>
            <div className="w-7 h-7 rounded-lg bg-rose-200/60 text-rose-800 flex items-center justify-center shrink-0">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </section>
      )}

      {/* 3. KARTU STATISTIK RINGKAS */}
      <section className="px-1">
        <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
              <span>Status Ajuan Anda</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Bulan Berjalan</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {stats.map((item, idx) => {
              const Icon = item.icon
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onNavigateTab(item.tab)}
                  className="flex flex-col items-center text-center p-1.5 rounded-xl hover:bg-slate-50 transition active:scale-95"
                >
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center relative ${item.bg}`}>
                    <Icon size={18} strokeWidth={2.2} />
                  </div>
                  <span className="text-sm font-black text-slate-800 mt-1 font-sans">
                    {item.count}
                  </span>
                  <span className="text-[9.5px] font-semibold text-slate-500 tracking-tight leading-none mt-0.5">
                    {item.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* 4. MENU PINTAS CEPAT (QUICK ACTIONS) */}
      <section className="px-1">
        <h3 className="text-xs font-bold text-slate-700 mb-2 px-1 flex items-center gap-1.5">
          <span>⚡ Menu Akses Cepat</span>
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.id}
                type="button"
                onClick={action.action}
                className="bg-white p-3 rounded-2xl border border-slate-200/80 hover:border-indigo-300 shadow-xs flex items-center gap-3 text-left transition active:scale-[0.98]"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} text-white flex items-center justify-center shrink-0 shadow-sm relative`}>
                  <Icon size={20} strokeWidth={2.2} />
                  {action.badge && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center border-2 border-white">
                      {action.badge}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-800 truncate leading-snug">
                    {action.label}
                  </h4>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {action.desc}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* 5. AJUAN TERKINI */}
      <section className="px-1">
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <History size={14} className="text-blue-600" />
            <span>Ajuan Terkini</span>
          </h3>
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
              const isPending =
                letter.status === 'pending' ||
                letter.status === 'pending_approval' ||
                letter.status === 'submitted'
              const isRevision =
                letter.status === 'revision' || letter.status === 'revision_requested'
              const isRejected = letter.status === 'rejected'
              const commentsCount = (letter.comments || []).length

              const creatorName =
                letter.userName || letter.creatorName || letter.createdBy || 'Staff'
              const branchDisplay =
                letter.branchName || letter.branchId || letter.branchCode || 'Pusat'

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
