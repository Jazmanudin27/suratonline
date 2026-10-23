import React from 'react'
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building,
  RefreshCw,
  Users,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  Fingerprint,
  FileCheck,
  Send,
  DoorOpen,
  PlusCircle,
  TrendingUp,
  FileClock,
} from 'lucide-react'
import { formatDateId, formatRupiah, isLetterVisibleToUser } from '../services/storage'

export default function Dashboard({
  user,
  letters = [],
  templates = [],
  branches = [],
  onNavigate,
  onOpenLetter,
}) {
  const visibleLetters = letters.filter((l) => isLetterVisibleToUser(l, user))

  const totalLetters = visibleLetters.length
  const pendingLetters = visibleLetters.filter((l) => l.status === 'pending').length
  const approvedLetters = visibleLetters.filter((l) => l.status === 'approved').length
  const revisionLetters = visibleLetters.filter((l) => l.status === 'revision').length
  const rejectedLetters = visibleLetters.filter((l) => l.status === 'rejected').length

  const pendingList = visibleLetters.filter((l) => l.status === 'pending')

  return (
    <div className="space-y-3">
      {/* =========================================================
          1. HERO BANNER (Compact & Contrast)
          ========================================================= */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 border border-slate-800 shadow-md shadow-slate-950/20">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-6 w-52 h-52 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-arabic text-lg sm:text-xl font-bold tracking-wider text-emerald-300 drop-shadow-xs">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-emerald-200 border border-emerald-400/30">
                1448 H &bull; Portal Terpadu
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-tight">
              Dashboard Terpadu Surat Ajuan Multi-Cabang
            </h1>
            <p className="text-xs text-slate-300 font-normal leading-normal">
              Pantau seluruh alur disposisi, verifikasi pengajuan, dan otorisasi dokumen resmi CV Makmur Permata.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate('templates')}
              className="px-3.5 py-2 bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition active:scale-98"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Buat Surat Ajuan</span>
            </button>

            <button
              onClick={() => window.location.reload()}
              className="px-3 py-2 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              title="Perbarui Data"
            >
              <RefreshCw className="w-3 h-3 text-slate-400" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================
          2. STAT CARDS (High Contrast, Bold Shadows, Compact Spacing)
          ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        
        {/* Card 1: Total Surat */}
        <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-300 shadow-md shadow-slate-400/20 hover:shadow-lg transition flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Total Surat Masuk
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 ring-1 ring-sky-200 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {totalLetters}
            </div>
            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Semua Cabang
            </span>
          </div>
        </div>

        {/* Card 2: Disetujui */}
        <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-300 shadow-md shadow-slate-400/20 hover:shadow-lg transition flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Surat Disetujui
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <div className="text-2xl font-extrabold text-emerald-600 tracking-tight">
              {approvedLetters}
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {totalLetters > 0 ? `${Math.round((approvedLetters / totalLetters) * 100)}% Rasio` : '0%'}
            </span>
          </div>
        </div>

        {/* Card 3: Menunggu Approval */}
        <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-300 shadow-md shadow-slate-400/20 hover:shadow-lg transition flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Menunggu Approval
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 ring-1 ring-amber-200 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <div className="text-2xl font-extrabold text-amber-600 tracking-tight">
              {pendingLetters}
            </div>
            {pendingLetters > 0 ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                Perlu Tindakan
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Nihil
              </span>
            )}
          </div>
        </div>

        {/* Card 4: Otorisasi Digital */}
        <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-300 shadow-md shadow-slate-400/20 hover:shadow-lg transition flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Otorisasi Digital
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 ring-1 ring-purple-200 flex items-center justify-center shrink-0">
              <Fingerprint className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <div className="text-xl font-extrabold text-slate-900 tracking-tight">
              Aktif
            </div>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              QR Code Valid
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================
          3. 2-COLUMN SECTION (Compact Table & Queue)
          ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        
        {/* LEFT COLUMN: Table Data (~65% width) */}
        <div className="lg:col-span-8 bg-white border border-slate-300 rounded-xl shadow-md shadow-slate-400/20 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-3 sm:px-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FileCheck className="w-3.5 h-3.5" />
                </div>
                <h2 className="font-bold text-xs sm:text-sm text-slate-900">
                  Daftar Ajuan Surat Masuk Terbaru
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Live Data
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">PEMOHON & CABANG</th>
                    <th className="py-2.5 px-3">JENIS & NOMOR SURAT</th>
                    <th className="py-2.5 px-3 text-center">STATUS</th>
                    <th className="py-2.5 px-3">APPROVER</th>
                    <th className="py-2.5 px-3 text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {letters.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Belum ada dokumen surat diajukan.
                      </td>
                    </tr>
                  ) : (
                    letters.slice(0, 6).map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-4">
                          <strong className="font-bold text-slate-900 block text-xs">
                            {l.userName}
                          </strong>
                          <span className="text-[10px] text-slate-500 block font-normal">
                            {l.branchName}
                          </span>
                        </td>

                        <td className="py-2.5 px-3">
                          <span className="inline-block px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-800 font-mono text-[10px] font-semibold">
                            {l.letterNumber}
                          </span>
                          <span className="block text-[10px] text-slate-600 mt-0.5 font-medium">
                            {l.templateName}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          {l.status === 'approved' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1 h-1 rounded-full bg-emerald-500" />
                              Disetujui
                            </span>
                          )}
                          {l.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                              Menunggu
                            </span>
                          )}
                          {l.status === 'revision' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                              Revisi
                            </span>
                          )}
                          {l.status === 'rejected' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              Ditolak
                            </span>
                          )}
                          {l.status === 'draft' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              Draf
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3">
                          <strong className="font-semibold text-slate-800 block text-[10px]">
                            {l.approvalHistory?.[l.currentStep - 1]?.approverRole || 'Pimpinan'}
                          </strong>
                          <span className="text-[10px] text-slate-400 block">
                            {formatDateId(l.createdAt)}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => onOpenLetter(l)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-indigo-600 rounded-md font-bold text-[10px] border border-slate-300 transition shadow-2xs"
                          >
                            Buka
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-2.5 px-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium text-[11px]">
              Menampilkan {Math.min(6, letters.length)} dari {letters.length} arsip
            </span>
            <button
              onClick={() => onNavigate('letters')}
              className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-[11px] transition"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Pos Approval (~35% width) */}
        <div className="lg:col-span-4 bg-white border border-slate-300 rounded-xl shadow-md shadow-slate-400/20 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-3 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
                  <FileClock className="w-3.5 h-3.5" />
                </div>
                <h2 className="font-bold text-xs sm:text-sm text-slate-900">
                  Antrean Butuh Persetujuan
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                Pos Approval
              </span>
            </div>

            <div className="p-3 space-y-2">
              {pendingList.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                  <p className="font-semibold text-slate-700">Semua surat telah diproses</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Tidak ada antrean approval tertunda</p>
                </div>
              ) : (
                pendingList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onOpenLetter(item)}
                    className="p-2.5 rounded-lg border border-slate-200 hover:border-indigo-400 bg-white hover:bg-slate-50 transition cursor-pointer shadow-2xs space-y-1"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <strong className="font-bold text-slate-900 text-xs truncate">
                        {item.userName}
                      </strong>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 uppercase shrink-0">
                        Tahap {item.currentStep}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-tight">
                      <span className="font-semibold text-slate-800">Keperluan:</span> {item.title}
                    </p>

                    <div className="pt-1.5 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-500">
                      <span>Cabang: <strong className="text-slate-700">{item.branchName}</strong></span>
                      <span className="text-slate-400">{formatDateId(item.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
            <button
              onClick={() => onNavigate('letters')}
              className="w-full py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold rounded-lg text-xs transition shadow-sm flex items-center justify-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Lihat Semua Surat di Arsip</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
