import React, { useState } from 'react'
import {
  HelpCircle,
  FilePlus,
  CheckCircle2,
  FileText,
  Clock,
  Printer,
  QrCode,
  Smartphone,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  ArrowRight,
  Send,
  AlertCircle,
  Layers,
  Paperclip,
  BookOpen,
} from 'lucide-react'

export const GUIDE_STORAGE_KEY = 'suratajuan_guide_seen'

export const markGuideAsSeen = (neverShowAgain = true) => {
  if (neverShowAgain) {
    localStorage.setItem(GUIDE_STORAGE_KEY, 'true')
  } else {
    localStorage.removeItem(GUIDE_STORAGE_KEY)
  }
}

export const isGuideSeen = () => {
  return localStorage.getItem(GUIDE_STORAGE_KEY) === 'true'
}

export default function UserGuide({
  isModal = false,
  onClose,
  onStartNewLetter,
  onNavigate,
  onStartInteractiveTour,
}) {
  const [activeCategory, setActiveCategory] = useState('pengajuan')
  const [currentStep, setCurrentStep] = useState(0)
  const [dontShowAgain, setDontShowAgain] = useState(true)

  // Steps untuk panduan interaktif step-by-step
  const walkthroughSteps = [
    {
      title: '1. Pilih Jalur: Gunakan Template ATAU Buat Surat Bebas (Custom)',
      icon: FilePlus,
      color: 'from-blue-600 to-indigo-600',
      badge: 'Langkah Awal',
      desc: 'Ada 2 cara membuat surat: (A) TEMPLATE BAKU (klik "Gunakan Template Ini" untuk surat operasional standar seperti Perdin, Service, Diskon yang formatnya sudah siap pakai dan tinggal diedit), ATAU (B) SURAT BEBAS / CUSTOM (klik tombol hitam "Buat Surat Bebas" di kanan atas jika ingin menulis surat bebas dengan format nomor sendiri & editor Word kosong).',
      tips: 'Template Baku lebih cepat karena format resmi dan daftar pejabat approver-nya sudah otomatis terisi.',
    },
    {
      title: '2. Isi Formulir (Template) vs Tulis Isi Bebas (Custom)',
      icon: Layers,
      color: 'from-indigo-600 to-purple-600',
      badge: 'Pengisian Data',
      desc: 'Untuk Template: Cukup isi kolom nama/perihal, tanggal, dan rincian biaya jika ada. Teks surat langsung terkompilasi otomatis. Untuk Surat Bebas (Custom): Anda dapat mengetik nomor surat sendiri, menyusun teks narasi secara mandiri di editor layar penuh (Word), dan mengatur pihak mengetahui cabang.',
      tips: 'Pada Template Baku, Anda tetap dapat menyempurnakan kalimat melalui tombol "Edit Isi Surat (Word)" di tab Pratinjau.',
    },
    {
      title: '3. Lampirkan Bukti / Dokumen Pendukung',
      icon: Paperclip,
      color: 'from-purple-600 to-pink-600',
      badge: 'Kelengkapan',
      desc: 'Unggah file pendukung seperti foto kuitansi, estimasi bengkel, nota pembelian, atau proposal penawaran pada bagian Lampiran (Mendukung format JPG, PNG, PDF).',
      tips: 'Lampiran yang jelas mempercepat proses persetujuan oleh Branch Manager maupun Manajemen Pusat.',
    },
    {
      title: '4. Ajukan & Pantau Status Realtime',
      icon: Send,
      color: 'from-emerald-600 to-teal-600',
      badge: 'Pengiriman & Tracking',
      desc: 'Klik tombol "Kirim Ajuan". Surat otomatis terkirim ke kotak masuk atasan/approver tahap pertama. Notifikasi dan riwayat status surat dapat dipantau di menu "Daftar Arsip Surat".',
      tips: 'Setelah disetujui penuh oleh Direktur/Manajemen, surat resmi langsung memuat QR Code keabsahan dan siap dicetak/diunduh.',
    },
  ]

  const categories = [
    { id: 'pengajuan', label: 'Cara Mengajukan Surat', icon: FilePlus },
    { id: 'approval', label: 'Alur & Persetujuan (Approval)', icon: CheckCircle2 },
    { id: 'tracking', label: 'Status & Notifikasi', icon: Clock },
    { id: 'cetak', label: 'Cetak Dokumen & QR Code', icon: Printer },
    { id: 'mobile', label: 'Panduan Mode HP (Mobile)', icon: Smartphone },
    { id: 'faq', label: 'Tanya Jawab (FAQ)', icon: AlertCircle },
  ]

  const handleFinishOnboarding = () => {
    markGuideAsSeen(dontShowAgain)
    if (onClose) onClose()
  }

  const handleGoCreate = () => {
    markGuideAsSeen(dontShowAgain)
    if (onClose) onClose()
    if (onStartNewLetter) {
      onStartNewLetter()
    } else if (onNavigate) {
      onNavigate('templates')
    }
  }

  return (
    <div className={`w-full ${isModal ? 'max-w-4xl mx-auto' : 'max-w-6xl mx-auto'}`}>
      {/* Banner Utama */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/60 p-6 sm:p-8 text-white shadow-xl mb-6">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Panduan Resmi Aplikasi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Petunjuk & Cara Penggunaan Surat Ajuan Online
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Pelajari alur pembuatan pengajuan, proses persetujuan bertingkat, verifikasi tanda tangan digital QR Code, hingga pengelolaan arsip cabang dengan mudah dan cepat.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
            {onStartInteractiveTour && (
              <button
                type="button"
                onClick={() => {
                  if (onClose) onClose()
                  onStartInteractiveTour()
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition active:scale-95 border border-emerald-400/40"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                <span>Mulai Panduan Langsung (Arahkan Step-by-Step)</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleGoCreate}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition active:scale-95"
            >
              <FilePlus className="w-4 h-4" />
              <span>Mulai Buat Surat Sekarang</span>
            </button>
            {isModal && (
              <button
                type="button"
                onClick={handleFinishOnboarding}
                className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs border border-slate-700 transition flex items-center justify-center gap-1.5"
              >
                <span>Saya Sudah Paham &amp; Tutup</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Quick Walkthrough (Step Carousel) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 mb-6">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-black">
              <span>🚀</span>
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800">
                Alur 4 Langkah Cepat Pengajuan Surat
              </h2>
              <p className="text-xs text-slate-500">
                Langkah standar dari awal pengisian hingga disetujui
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentStep === 0}
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Langkah Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-600 px-2">
              {currentStep + 1} / {walkthroughSteps.length}
            </span>
            <button
              type="button"
              disabled={currentStep === walkthroughSteps.length - 1}
              onClick={() => setCurrentStep((prev) => Math.min(walkthroughSteps.length - 1, prev + 1))}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Langkah Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card Langkah Terpilih */}
        {(() => {
          const step = walkthroughSteps[currentStep]
          const StepIcon = step.icon
          return (
            <div className="bg-gradient-to-br from-slate-50 to-indigo-50/40 rounded-xl p-5 border border-indigo-100/80 transition-all">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} text-white flex items-center justify-center shrink-0 shadow-md`}>
                  <StepIcon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-700">
                      {step.badge}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-3">
                    {step.desc}
                  </p>
                  <div className="bg-white/80 backdrop-blur-xs p-3 rounded-lg border border-indigo-100/60 flex items-start gap-2 text-xs text-indigo-900">
                    <span className="font-bold text-indigo-600 shrink-0">💡 Tips:</span>
                    <span>{step.tips}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Step Indicators */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {walkthroughSteps.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentStep(idx)}
              className={`p-2 rounded-lg text-left transition border ${
                currentStep === idx
                  ? 'bg-indigo-50/80 border-indigo-400 text-indigo-950 font-bold'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-slate-400">Tahap {idx + 1}</div>
              <div className="text-xs truncate font-semibold">{s.title.replace(/^\d+\.\s*/, '')}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigasi Kategori & Konten Detail Panduan */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Tab Kategori */}
        <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 overflow-x-auto scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon
            const isActive = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>

        {/* Area Isi Kategori */}
        <div className="p-5 sm:p-7">
          {/* Kategori 1: Cara Pengajuan Surat */}
          {activeCategory === 'pengajuan' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-1 flex items-center gap-2">
                  <FilePlus className="w-5 h-5 text-indigo-600" />
                  <span>Panduan Lengkap Membuat Surat Ajuan</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Berikut penjelasan mendalam mengenai hal-hal yang perlu diperhatikan saat membuat surat ajuan baru.
                </p>
              </div>

              {/* Perbandingan Template Baku vs Surat Custom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border-2 border-indigo-200 bg-indigo-50/40 hover:bg-white transition shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-600 text-white tracking-wider">
                      Opsi A: Template Baku
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700">Langsung Pakai &amp; Cepat</span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm mb-1.5">
                    Surat Operasional Baku (Tinggal Edit Form)
                  </h4>
                  <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
                    <li>• <strong>Format Baku:</strong> Format surat, tata letak, dan bahasa resmi sudah disiapkan oleh manajemen.</li>
                    <li>• <strong>Nomor Otomatis:</strong> Nomor surat digenerate otomatis sesuai kode cabang &amp; template.</li>
                    <li>• <strong>Approver Otomatis:</strong> Pejabat yang berhak menyetujui sudah dipasangkan sesuai hierarki divisi.</li>
                    <li>• <strong>Cukup Edit:</strong> Cukup isi perihal, tanggal, dan rincian biaya (jika ada). Jika butuh penyesuaian kalimat, klik tombol <em>"Edit Isi Surat (Word)"</em>.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl border-2 border-slate-300 bg-slate-900 text-white hover:border-slate-400 transition shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-400 text-slate-950 tracking-wider">
                      Opsi B: Surat Bebas (Custom)
                    </span>
                    <span className="text-[11px] font-bold text-slate-300">Fleksibel Penuh</span>
                  </div>
                  <h4 className="font-extrabold text-white text-sm mb-1.5">
                    Surat Mandiri / Kustom Bebas (Editor Kosong)
                  </h4>
                  <ul className="text-xs text-slate-300 space-y-1.5 leading-relaxed">
                    <li>• <strong>Editor Kosong:</strong> Klik tombol hitam <em>"Buat Surat Bebas"</em>. Halaman dimulai dari lembar Word kosong.</li>
                    <li>• <strong>Nomor Fleksibel:</strong> Nomor surat dapat diedit manual sesuai kebutuhan penomoran cabang.</li>
                    <li>• <strong>Tulis Bebas:</strong> Susun tabel, paragraf, dan isi permohonan secara mandiri di editor layar penuh.</li>
                    <li>• <strong>Approver Mandiri:</strong> Pihak "Mengetahui" (misal Manager Cabang / OM / SMM) dan pejabat penerima dapat disesuaikan per surat.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Kategori 2: Alur & Persetujuan (Approval) */}
          {activeCategory === 'approval' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-1 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Alur Persetujuan Bertingkat (Multi-tier Approval)</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Surat ajuan diproses secara berurutan sesuai rantai komando cabang dan pusat.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">Hirarki Penyetuju Standar:</span>
                  <span className="text-[11px] text-indigo-600 font-semibold">Berjenjang Otomatis</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-blue-600 uppercase">Tahap 1</span>
                    <h4 className="font-bold text-xs text-slate-800 mt-0.5">Operation / Sales Manager (OM/SMM)</h4>
                    <p className="text-[11px] text-slate-500 mt-1">Verifikasi kelayakan operasional cabang tingkat pertama.</p>
                  </div>
                  <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase">Tahap 2</span>
                    <h4 className="font-bold text-xs text-slate-800 mt-0.5">Regional Manager (RSM/ROM)</h4>
                    <p className="text-[11px] text-slate-500 mt-1">Pemeriksaan anggaran dan izin per wilayah regional.</p>
                  </div>
                  <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Tahap 3 (Final)</span>
                    <h4 className="font-bold text-xs text-slate-800 mt-0.5">Direktur Utama / General Manager</h4>
                    <p className="text-[11px] text-slate-500 mt-1">Pengesahan mutlak persetujuan pencairan dan penerbitan dokumen.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60">
                  <div className="font-bold text-emerald-900 text-sm flex items-center gap-1.5 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <span>Setujui (Approve)</span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Surat disetujui untuk lanjut ke tahap berikutnya, atau status menjadi <strong>APPROVED</strong> jika ini tahap terakhir. QR Code resmi otomatis aktif.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60">
                  <div className="font-bold text-amber-900 text-sm flex items-center gap-1.5 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                    <span>Minta Revisi (Revision)</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Approver menyertakan catatan perbaikan. Surat dikembalikan ke pemohon untuk diperbaiki dan diajukan ulang tanpa perlu membuat nomor baru.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60">
                  <div className="font-bold text-rose-900 text-sm flex items-center gap-1.5 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                    <span>Tolak (Reject)</span>
                  </div>
                  <p className="text-xs text-rose-800 leading-relaxed">
                    Surat ditolak dengan alasan penolakan yang dicatat permanen dalam riwayat audit log. Pengajuan tidak dapat diproses lebih lanjut.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Kategori 3: Status & Notifikasi */}
          {activeCategory === 'tracking' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-1 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  <span>Pelacakan Status & Kotak Masuk Surat</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Ketahui posisi surat Anda dan gunakan fitur kolaborasi secara efisien.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <span className="p-1 rounded bg-indigo-50 text-indigo-600 font-bold">🔔</span>
                    <span>Notifikasi Realtime</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Setiap kali surat Anda disetujui, diminta revisi, atau ditolak, lonceng notifikasi di pojok kanan atas akan menampilkan tanda merah. Klik notifikasi untuk langsung membuka surat tersebut.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <span className="p-1 rounded bg-indigo-50 text-indigo-600 font-bold">📬</span>
                    <span>Kotak Masuk Surat Dibagikan</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Ikon amplop surat di samping lonceng notifikasi adalah <strong>Kotak Masuk Surat</strong> yang dibagikan atau ditujukan kepada Anda sebagai penerima / pihak yang mengetahui.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <span className="p-1 rounded bg-indigo-50 text-indigo-600 font-bold">💬</span>
                    <span>Komentar & Diskusi Surat</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Di dalam tampilan dokumen surat, terdapat panel <strong>Komentar</strong> untuk bertukar pesan, klarifikasi nota/biaya antara pemohon dan approver tanpa harus lewat WhatsApp terpisah.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <span className="p-1 rounded bg-indigo-50 text-indigo-600 font-bold">📜</span>
                    <span>Riwayat Audit Log</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Setiap aksi approval, revisi, perubahan data, dan waktu submit tercatat detail beserta nama pejabat, tanggal, jam, dan IP untuk integritas audit legal.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Kategori 4: Cetak & QR Code */}
          {activeCategory === 'cetak' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-1 flex items-center gap-2">
                  <Printer className="w-5 h-5 text-indigo-600" />
                  <span>Pencetakan PDF Resmi & Verifikasi QR Code</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Standar dokumen sah resmi perusahaan dengan barcode keaslian digital.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row items-center gap-6">
                <div className="w-24 h-24 bg-white p-2 rounded-xl shrink-0 flex items-center justify-center shadow-lg">
                  <QrCode className="w-20 h-20 text-slate-900" />
                </div>
                <div className="space-y-1.5 text-center sm:text-left">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white">
                    VERIFIKASI KEABSAHAN
                  </span>
                  <h4 className="font-bold text-sm sm:text-base">QR Code Tanda Tangan Digital</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Setiap surat yang telah disetujui (Approved) secara otomatis memiliki QR Code unik. Siapapun yang memindai QR Code ini menggunakan kamera ponsel akan diarahkan ke laman verifikasi resmi untuk membuktikan dokumen tidak dimanipulasi.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <h5 className="font-bold text-xs text-slate-800 mb-1">Cetak Lewat Menu Arsip</h5>
                  <p className="text-xs text-slate-600">
                    Klik tombol ikon <strong>🖨 Cetak</strong> pada baris surat di tabel arsip untuk langsung membuka dialog print sistem atau simpan sebagai PDF.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <h5 className="font-bold text-xs text-slate-800 mb-1">Format A4 Standar Perusahaan</h5>
                  <p className="text-xs text-slate-600">
                    Dokumen telah disesuaikan dengan standar kertas A4, margin rapi, kop surat PT resmi, dan kolom tanda tangan lengkap dengan tanggal approval.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Kategori 5: Mode HP / Mobile */}
          {activeCategory === 'mobile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-1 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-indigo-600" />
                  <span>Panduan Penggunaan di Smartphone / HP</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Aplikasi didesain khusus agar nyaman dan cepat diakses melalui browser ponsel.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-black flex items-center justify-center text-xs mb-2">
                    📱
                  </div>
                  <h4 className="font-bold text-xs text-slate-800 mb-1">Beralih ke Tampilan Mobile</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Klik tombol <strong>"Mode Mobile"</strong> di bar navigasi atas kapan saja untuk beralih ke antarmuka aplikasi khusus HP.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-black flex items-center justify-center text-xs mb-2">
                    ⚡
                  </div>
                  <h4 className="font-bold text-xs text-slate-800 mb-1">Approval 1-Klik dari HP</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Manager atau Direktur yang sedang di perjalanan dapat langsung menyetujui ajuan dengan satu ketukan tombol di HP.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 font-black flex items-center justify-center text-xs mb-2">
                    📸
                  </div>
                  <h4 className="font-bold text-xs text-slate-800 mb-1">Foto Bukti Langsung</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Saat upload lampiran di HP, Anda bisa langsung memilih kamera untuk memfoto struk bensin, kuitansi hotel, atau nota service.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Kategori 6: FAQ */}
          {activeCategory === 'faq' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-1 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-indigo-600" />
                  <span>Pertanyaan yang Sering Diajukan (FAQ)</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Jawaban cepat seputar kendala dan operasional pengajuan surat.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 mb-1">
                    Q: Bisakah saya mengubah surat yang sudah diajukan?
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>A:</strong> Jika surat masih berstatus <strong>Pending</strong> atau <strong>Revision</strong>, pemohon masih dapat mengedit data dan melengkapi lampiran. Namun jika sudah disetujui penuh (Approved) atau Ditolak (Rejected), surat terkunci permanen demi kepatuhan audit.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 mb-1">
                    Q: Mengapa saya tidak melihat tombol "Setujui" / "Tolak"?
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>A:</strong> Tombol aksi approval hanya muncul jika akun Anda adalah approver yang ditunjuk pada tahap berjalan surat tersebut. Jika giliran approval masih di tahap sebelumnya, surat berstatus menunggu tahap tersebut selesai.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 mb-1">
                    Q: Bagaimana cara melihat kembali petunjuk ini nanti?
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>A:</strong> Cukup klik menu <strong>"Petunjuk"</strong> di bar navigasi atas atau klik tombol <strong>(?) Panduan</strong> di samping profil Anda kapan saja!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Dialog (Jika Mode Modal) */}
        {isModal && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span className="font-medium">
                Jangan tampilkan petunjuk otomatis lagi saat membuka aplikasi
              </span>
            </label>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleFinishOnboarding}
                className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition"
              >
                Tutup Panduan
              </button>
              <button
                type="button"
                onClick={handleGoCreate}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-xs flex items-center gap-1.5"
              >
                <span>Mulai Ajukan Surat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function UserGuideModal({ isOpen, onClose, onStartNewLetter, onNavigate, onStartInteractiveTour }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-100 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-300/60">
        {/* Modal Top Bar */}
        <div className="p-3.5 bg-slate-950 text-white flex justify-between items-center text-xs border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span className="font-bold tracking-wide">Pusat Petunjuk & Panduan Pengguna</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title="Tutup Petunjuk"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1">
          <UserGuide
            isModal={true}
            onClose={onClose}
            onStartNewLetter={onStartNewLetter}
            onNavigate={onNavigate}
            onStartInteractiveTour={onStartInteractiveTour}
          />
        </div>
      </div>
    </div>
  )
}
