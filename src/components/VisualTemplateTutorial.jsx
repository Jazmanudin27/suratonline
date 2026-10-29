import React, { useState, useRef } from 'react'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Sparkles,
  Download,
  Printer,
  ChevronRight,
  ChevronLeft,
  MousePointer,
  HelpCircle,
  FilePlus,
  Layers,
  Send,
  Search,
  Smartphone,
  Eye,
  X,
} from 'lucide-react'

export default function VisualTemplateTutorial({ onStartCreate, onClose }) {
  const [activeCallout, setActiveCallout] = useState(null) // null = show all or specific
  const [viewMode, setViewMode] = useState('all') // 'all' (all arrows) or 'step' (step-by-step)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const containerRef = useRef(null)

  const callouts = [
    {
      id: 1,
      badge: 'JALUR 1 (UTAMA)',
      title: 'Tombol "Gunakan Template Ini"',
      target: 'template_btn',
      position: 'bottom',
      color: 'blue',
      glow: 'shadow-blue-500/40 ring-blue-500',
      badgeColor: 'bg-blue-600 text-white',
      borderCard: 'border-blue-400 bg-blue-50/90 text-blue-950',
      desc: 'Klik tombol biru ini untuk surat operasional standar (seperti Sample, Kemasan, Biaya Operasional, Perdin). Format narasi, nomor otomatis, dan daftar atasan approver-nya sudah otomatis disiapkan.',
      tips: 'Jalur tercepat dan paling direkomendasikan untuk operasional harian.',
    },
    {
      id: 2,
      badge: 'JALUR 2 (ALTERNATIF)',
      title: 'Tombol "Buat Surat Bebas"',
      target: 'custom_btn',
      position: 'top-right',
      color: 'purple',
      glow: 'shadow-purple-500/40 ring-purple-500',
      badgeColor: 'bg-slate-900 text-purple-200 border border-purple-400/40',
      borderCard: 'border-purple-400 bg-purple-50/90 text-purple-950',
      desc: 'Klik tombol hitam di kanan atas ini JIKA ingin membuat surat bebas / custom tanpa template baku. Anda bebas mengatur nomor surat sendiri dan menulis isi surat di editor Word kosong.',
      tips: 'Cocok untuk surat khusus, perjanjian kerjasama, atau memo yang formatnya belum ada di template.',
    },
    {
      id: 3,
      badge: 'INFORMASI APPROVAL',
      title: 'Kotak "Alur Persetujuan (Approval)"',
      target: 'approval_box',
      position: 'middle',
      color: 'amber',
      glow: 'shadow-amber-500/40 ring-amber-500',
      badgeColor: 'bg-amber-600 text-white',
      borderCard: 'border-amber-400 bg-amber-50/90 text-amber-950',
      desc: 'Menampilkan urutan nama pejabat atasan (1, 2, atau 3 tingkat) yang wajib memverifikasi dan menyetujui surat ini. Surat akan bergerak otomatis dari tingkat 1 ke tingkat berikutnya.',
      tips: 'Setelah semua approver menandatangani, QR Code keabsahan resmi otomatis terbit.',
    },
    {
      id: 4,
      badge: 'PENCARIAN CEPAT',
      title: 'Filter Kategori & Pencarian',
      target: 'filter_bar',
      position: 'top-left',
      color: 'sky',
      glow: 'shadow-sky-500/40 ring-sky-500',
      badgeColor: 'bg-sky-600 text-white',
      borderCard: 'border-sky-400 bg-sky-50/90 text-sky-950',
      desc: 'Gunakan tombol kategori (Marketing, Gudang Logistik, GA) atau ketik kata kunci di kolom "Cari template..." untuk menemukan jenis formulir surat yang Anda butuhkan tanpa perlu scroll panjang.',
      tips: 'Ketik misalnya "Sample", "BBM", atau "Kemasan" di kolom pencarian.',
    },
    {
      id: 5,
      badge: 'MENU NAVIGASI',
      title: 'Daftar Arsip & Mode Mobile',
      target: 'nav_bar',
      position: 'header',
      color: 'emerald',
      glow: 'shadow-emerald-500/40 ring-emerald-500',
      badgeColor: 'bg-emerald-600 text-white',
      borderCard: 'border-emerald-400 bg-emerald-50/90 text-emerald-950',
      desc: 'Klik "Daftar Arsip Surat" untuk melihat riwayat surat yang pernah diajukan, memantau proses approval, atau mencetak PDF. Klik "Mode Mobile" jika ingin tampilan praktis seperti layar smartphone.',
      tips: 'Ada juga tombol "Install App" untuk memasang aplikasi E-Letter MP di HP atau Laptop Anda.',
    },
  ]

  const handlePrintTutorial = () => {
    window.print()
  }

  return (
    <div className="w-full space-y-5 animate-fadeIn">
      {/* Header Controller Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-xl border border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[11px] font-bold uppercase tracking-wider mb-1">
            <Sparkles size={13} className="text-amber-300 animate-pulse" />
            <span>Tutorial Visual Bergambar</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Panduan Halaman Katalog Template Surat</span>
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Perhatikan tanda panah dan kotak penjelasan nomor 1 s/d 5 pada gambar antarmuka di bawah.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex rounded-xl p-1 bg-slate-800/90 border border-slate-700">
            <button
              onClick={() => {
                setViewMode('all')
                setActiveCallout(null)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye size={13} />
              <span>Semua Panah</span>
            </button>
            <button
              onClick={() => {
                setViewMode('step')
                setActiveCallout(callouts[currentStepIndex].id)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'step'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MousePointer size={13} />
              <span>Step-by-Step</span>
            </button>
          </div>

          <button
            onClick={handlePrintTutorial}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
            title="Cetak atau Simpan PDF Tutorial"
          >
            <Printer size={13} />
            <span>Cetak / PDF</span>
          </button>

          {onStartCreate && (
            <button
              onClick={onStartCreate}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/30 transition active:scale-95"
            >
              <span>Coba Buat Surat</span>
              <ArrowRight size={13} />
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Tutup"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Step Stepper Controller (Jika Mode Step-by-Step) */}
      {viewMode === 'step' && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs">
          <button
            disabled={currentStepIndex === 0}
            onClick={() => {
              const prev = Math.max(0, currentStepIndex - 1)
              setCurrentStepIndex(prev)
              setActiveCallout(callouts[prev].id)
            }}
            className="px-3 py-1.5 bg-white hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed border border-indigo-200 rounded-xl text-xs font-bold text-indigo-900 flex items-center gap-1 transition"
          >
            <ChevronLeft size={14} />
            <span>Sebelumnya</span>
          </button>

          <div className="text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
              Fokus Penjelasan {currentStepIndex + 1} dari {callouts.length}
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-slate-900">
              {callouts[currentStepIndex].title}
            </span>
          </div>

          <button
            disabled={currentStepIndex === callouts.length - 1}
            onClick={() => {
              const next = Math.min(callouts.length - 1, currentStepIndex + 1)
              setCurrentStepIndex(next)
              setActiveCallout(callouts[next].id)
            }}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition"
          >
            <span>Berikutnya</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* =========================================================================
          AREA MOCKUP UI LENGKAP DENGAN PANAH & ANOTASI (Persis Screenshot Asli)
          ========================================================================= */}
      <div
        ref={containerRef}
        className="relative bg-slate-100 border-2 border-indigo-200/80 rounded-3xl p-3 sm:p-5 shadow-2xl overflow-hidden font-sans"
      >
        {/* Mockup Top Navigation Bar */}
        <div
          className={`relative bg-slate-900 text-white rounded-2xl p-3 sm:p-4 mb-3 shadow-md border transition ${
            activeCallout === 5 ? 'ring-4 ring-emerald-400 border-emerald-400' : 'border-slate-800'
          }`}
        >
          {/* Tag Panah 5: Header Navigation */}
          {(viewMode === 'all' || activeCallout === 5) && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center animate-bounce-short">
              <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-black shadow-lg flex items-center gap-1 border-2 border-white ring-2 ring-emerald-500">
                <span>📍 NOMOR 5: Menu Navigasi & Mode</span>
              </span>
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-emerald-600 mt-[-1px]" />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
                MP
              </div>
              <div>
                <span className="font-extrabold text-sm text-white tracking-wide">E-LETTER MP</span>
                <span className="text-[10px] text-slate-400 block -mt-0.5">CV Makmur Permata</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[11px] font-bold flex items-center gap-1">
                <Smartphone size={11} /> Mode Mobile
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1">
                <Download size={11} /> Install App
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold flex items-center gap-1">
                <HelpCircle size={11} /> Petunjuk
              </span>
            </div>
          </div>
        </div>

        {/* Sub Navigation Bar (Buat Surat, Arsip, Petunjuk) */}
        <div className="bg-white rounded-xl p-2 px-3 mb-3 border border-slate-200 flex flex-wrap items-center gap-2 shadow-xs text-xs">
          <span className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold flex items-center gap-1 shadow-xs">
            <FilePlus size={13} />
            <span>Buat Surat Ajuan</span>
            <span className="text-[9px] bg-sky-400 text-slate-950 px-1 py-0.2 rounded font-black ml-1">
              BARU
            </span>
          </span>
          <span className="px-3 py-1.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-lg">
            Daftar Arsip Surat
          </span>
          <span className="px-3 py-1.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-lg">
            Petunjuk Penggunaan
          </span>
        </div>

        {/* Main Header Blue Banner */}
        <div
          className={`relative bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-2xl p-4 sm:p-5 mb-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
            activeCallout === 2 ? 'ring-4 ring-purple-400' : ''
          }`}
        >
          {/* Left Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/30">
              <Layers size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg tracking-tight">
                Katalog Template Surat Pengajuan
              </h3>
              <p className="text-xs text-blue-100 mt-0.5">
                Pilih template resmi di bawah ini untuk memulai pengisian form dan editor.
              </p>
            </div>
          </div>

          {/* Right Button: Buat Surat Bebas (Custom) */}
          <div className="relative shrink-0">
            {/* Tag Panah 2: Buat Surat Bebas */}
            {(viewMode === 'all' || activeCallout === 2) && (
              <div className="absolute -top-12 right-0 z-30 flex flex-col items-end animate-bounce-short">
                <span className="px-3 py-1 rounded-full bg-purple-700 text-white text-[11px] font-black shadow-xl flex items-center gap-1 border-2 border-white ring-2 ring-purple-400 whitespace-nowrap">
                  <span>📍 NOMOR 2: Jalur Surat Bebas (Custom)</span>
                  <ArrowDown size={13} className="stroke-[3]" />
                </span>
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-purple-700 mr-8 mt-[-1px]" />
              </div>
            )}

            <button
              type="button"
              className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs border border-slate-700 shadow-md flex items-center gap-2 ring-2 ring-white/20"
            >
              <FilePlus size={14} className="text-purple-400" />
              <span>Buat Surat Bebas</span>
            </button>
          </div>
        </div>

        {/* Filter Categories Bar & Search Bar */}
        <div
          className={`relative bg-white rounded-2xl p-3 border shadow-xs mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 transition ${
            activeCallout === 4 ? 'ring-4 ring-sky-400 border-sky-400' : 'border-slate-200'
          }`}
        >
          {/* Tag Panah 4: Filter Kategori & Search */}
          {(viewMode === 'all' || activeCallout === 4) && (
            <div className="absolute -top-7 left-4 z-30 flex items-center gap-1.5 animate-pulse">
              <span className="px-3 py-0.8 rounded-full bg-sky-600 text-white text-[10px] font-black shadow-md border-2 border-white ring-2 ring-sky-400">
                📍 NOMOR 4: Filter Divisi & Cari
              </span>
              <ArrowDown size={14} className="text-sky-600 stroke-[3]" />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold">
              Semua Kategori
            </span>
            <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200">
              Marketing
            </span>
            <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200">
              Gudang Logistik
            </span>
            <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200">
              GA
            </span>
          </div>

          <div className="relative w-full md:w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              readOnly
              placeholder="Cari template..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden"
            />
          </div>
        </div>

        {/* 3 Template Cards Grid (Mirip Persis Screenshot) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* KARTU 1: Ajuan Permohonan Pemakaian Sample */}
          <div
            className={`relative bg-white rounded-2xl p-4 border shadow-sm flex flex-col justify-between transition ${
              activeCallout === 1 || activeCallout === 3
                ? 'ring-2 ring-blue-500 border-blue-400 shadow-lg'
                : 'border-slate-200'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold">
                  🏷️ Marketing
                </span>
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Siap Digunakan
                </span>
              </div>

              <h4 className="font-extrabold text-sm text-slate-900 leading-snug mb-1">
                Ajuan Permohonan Pemakaian Sample
              </h4>
              <p className="text-[11px] text-slate-400 mb-3">
                Pilih template ini untuk memulai pengisian surat ajuan.
              </p>

              {/* Kotak Alur Persetujuan (Approval) */}
              <div
                className={`relative bg-slate-50/90 rounded-xl p-2.5 border mb-3 transition ${
                  activeCallout === 3
                    ? 'ring-4 ring-amber-400 border-amber-400 bg-amber-50/80'
                    : 'border-slate-200'
                }`}
              >
                {/* Tag Panah 3: Alur Approval */}
                {(viewMode === 'all' || activeCallout === 3) && (
                  <div className="absolute -top-7 left-2 z-30 flex items-center gap-1 animate-pulse">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-black shadow-md border-2 border-white ring-2 ring-amber-400">
                      📍 NOMOR 3: Alur Approval
                    </span>
                    <ArrowDown size={13} className="text-amber-600 stroke-[3]" />
                  </div>
                )}

                <span className="text-[10px] text-slate-500 block font-medium mb-1.5">
                  Alur Persetujuan (1 Tingkat):
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-800 flex items-center gap-1 shadow-2xs">
                    <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[8px] font-black">
                      1
                    </span>
                    <span>Jemmy Feldiana</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Tombol Gunakan Template Ini (Fokus Panah 1) */}
            <div className="relative pt-2">
              {/* Tag Panah 1: Gunakan Template Ini */}
              {(viewMode === 'all' || activeCallout === 1) && (
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center animate-bounce-short">
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-blue-600 mb-[-1px]" />
                  <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-black shadow-xl flex items-center gap-1 border-2 border-white ring-2 ring-blue-400 whitespace-nowrap">
                    <ArrowUp size={13} className="stroke-[3]" />
                    <span>📍 NOMOR 1: KLIK DI SINI (Jalur Baku)</span>
                  </span>
                </div>
              )}

              <button
                type="button"
                className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 transition active:scale-98"
              >
                <span>Gunakan Template Ini</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* KARTU 2: Ajuan Permohonan Kemasan */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-600 border border-purple-200 text-[10px] font-bold">
                  🏷️ Gudang Logistik
                </span>
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Siap Digunakan
                </span>
              </div>

              <h4 className="font-extrabold text-sm text-slate-900 leading-snug mb-1">
                Ajuan Permohonan Kemasan
              </h4>
              <p className="text-[11px] text-slate-400 mb-3">
                Pilih template ini untuk memulai pengisian surat ajuan.
              </p>

              <div className="bg-slate-50/90 rounded-xl p-2.5 border border-slate-200 mb-3">
                <span className="text-[10px] text-slate-500 block font-medium mb-1.5">
                  Alur Persetujuan (2 Tingkat):
                </span>
                <div className="flex flex-wrap items-center gap-1 text-[10px] font-bold text-slate-800">
                  <span className="px-2 py-0.8 bg-white border border-slate-200 rounded-lg flex items-center gap-1">
                    <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[8px]">
                      1
                    </span>
                    <span>REGIONAL SALES MAN...</span>
                  </span>
                  <span className="text-slate-400">&gt;</span>
                  <span className="px-2 py-0.8 bg-white border border-slate-200 rounded-lg flex items-center gap-1">
                    <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[8px]">
                      2
                    </span>
                    <span>Purnomo Raya</span>
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5"
            >
              <span>Gunakan Template Ini</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* KARTU 3: Permohonan Realisasi Biaya Operasional */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-200 text-[10px] font-bold">
                  🏷️ GA
                </span>
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Siap Digunakan
                </span>
              </div>

              <h4 className="font-extrabold text-sm text-slate-900 leading-snug mb-1">
                Permohonan Realisasi Biaya Operasional
              </h4>
              <p className="text-[11px] text-slate-400 mb-3">
                Pilih template ini untuk memulai pengisian surat ajuan.
              </p>

              <div className="bg-slate-50/90 rounded-xl p-2.5 border border-slate-200 mb-3">
                <span className="text-[10px] text-slate-500 block font-medium mb-1.5">
                  Alur Persetujuan (3 Tingkat):
                </span>
                <div className="flex flex-wrap items-center gap-1 text-[10px] font-bold text-slate-800">
                  <span className="px-1.5 py-0.8 bg-white border border-slate-200 rounded-lg flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-blue-600 text-white flex items-center justify-center text-[7px]">
                      1
                    </span>
                    <span>Antonius</span>
                  </span>
                  <span className="text-slate-400">&gt;</span>
                  <span className="px-1.5 py-0.8 bg-white border border-slate-200 rounded-lg flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-blue-600 text-white flex items-center justify-center text-[7px]">
                      2
                    </span>
                    <span>Herdy</span>
                  </span>
                  <span className="text-slate-400">&gt;</span>
                  <span className="px-1.5 py-0.8 bg-white border border-slate-200 rounded-lg flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-blue-600 text-white flex items-center justify-center text-[7px]">
                      3
                    </span>
                    <span>Indra</span>
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5"
            >
              <span>Gunakan Template Ini</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          DAFTAR KOTAK PENJELASAN NOMOR 1 S/D 5 (LENGKAP DENGAN POIN PENTING)
          ========================================================================= */}
      <div className="space-y-3 pt-2">
        <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
          <span>📋 Rincian Penjelasan Setiap Elemen Halaman:</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {callouts.map((item) => {
            const isHighlighted = activeCallout === item.id
            return (
              <div
                key={item.id}
                onClick={() => {
                  setActiveCallout(activeCallout === item.id ? null : item.id)
                }}
                className={`rounded-2xl p-4 border transition-all cursor-pointer ${
                  item.borderCard
                } ${
                  isHighlighted
                    ? 'ring-4 ring-indigo-500 shadow-xl scale-[1.01]'
                    : 'shadow-xs hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-lg ${item.badgeColor} font-black text-xs flex items-center justify-center shadow-xs shrink-0`}
                    >
                      {item.id}
                    </span>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                        {item.badge}
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                        {item.title}
                      </h4>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 border border-slate-300 text-slate-600 shrink-0">
                    {isHighlighted ? 'Sedang Disorot' : 'Klik Sorot'}
                  </span>
                </div>

                <p className="text-xs text-slate-800 leading-relaxed mb-2.5">
                  {item.desc}
                </p>

                <div className="p-2 rounded-xl bg-white/90 border border-slate-200/80 text-[11px] text-slate-700 flex items-start gap-1.5 shadow-2xs">
                  <span className="font-bold text-indigo-600 shrink-0">💡 Kunci:</span>
                  <span>{item.tips}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
