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

  // Tombol aksi pintas di beranda (Format kotak icon di atas, text di bawah)
  const quickActions = [
    {
      id: 'create_letter',
      label: 'Surat Ajuan',
      icon: FilePlus,
      gradient: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/30',
      action: () => onNavigateTab('archive'),
    },
    {
      id: 'inbox_act',
      label: 'Inbox',
      icon: Inbox,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null,
      gradient: 'from-rose-500 to-red-600',
      shadow: 'shadow-rose-500/30',
      action: () => onNavigateTab('inbox'),
    },
    {
      id: 'memo_act',
      label: 'IM',
      icon: FileCheck2,
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/30',
      action: () => onNavigateTab('memo'),
    },
    {
      id: 'product_act',
      label: 'Produk',
      icon: Package,
      gradient: 'from-cyan-500 to-blue-600',
      shadow: 'shadow-cyan-500/30',
      action: () => onNavigateTab('products'),
    },
    {
      id: 'profile_act',
      label: 'Profile',
      icon: User,
      gradient: 'from-teal-500 to-emerald-600',
      shadow: 'shadow-teal-500/30',
      action: () => onNavigateTab('profile'),
    },
  ]

  return (
    <div className="space-y-3.5 pb-28 pt-1">
      {/* 1. ALERT PERLU APPROVAL JIKA ADA */}
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

      {/* 2. KARTU STATISTIK RINGKAS */}
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

      {/* 3. MENU AKSES CEPAT (GRID KOTAK ICON ATAS, TEXT BAWAH) */}
      <section className="px-1">
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3.5 px-0.5">
            <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <span>⚡ Menu Akses Cepat</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold">Pintas Navigasi</span>
          </div>

          <div className="grid grid-cols-4 gap-y-3.5 gap-x-2">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.id}
                  id={`mobile-quick-${action.id}`}
                  type="button"
                  onClick={action.action}
                  className="flex flex-col items-center text-center group active:scale-95 transition-transform"
                >
                  <div
                    className={`relative w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${action.gradient} text-white flex items-center justify-center shadow-md ${action.shadow}`}
                  >
                    <Icon size={24} strokeWidth={2.2} className="text-white drop-shadow-xs" />
                    {action.badge && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-md ring-2 ring-white animate-pulse">
                        {action.badge > 99 ? '99+' : action.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 group-hover:text-slate-900 mt-1.5 tracking-tight leading-tight text-center">
                    {action.label}
                  </span>
                </button>
              )
            })}
          </div>
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
