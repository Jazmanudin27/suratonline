import React, { useState, useEffect, useRef } from 'react'
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  HelpCircle,
  MousePointer,
  RotateCcw,
} from 'lucide-react'

export const TOUR_STORAGE_KEY = 'suratajuan_interactive_tour_completed'

export const isTourCompleted = () => {
  return localStorage.getItem(TOUR_STORAGE_KEY) === 'true'
}

export const setTourCompleted = (val = true) => {
  if (val) {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true')
  } else {
    localStorage.removeItem(TOUR_STORAGE_KEY)
  }
}

/**
 * Interactive Step-by-Step Walkthrough Tour
 * Menyorot tombol/elemen asli di layar dengan spotlight & tooltip pointer animasi
 */
export default function InteractiveTour({
  isActive,
  onComplete,
  onCancel,
  currentUser,
  activeMenu,
  onNavigate,
  templates = [],
  onSelectTemplate,
}) {
  const [stepIndex, setStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState(null)
  const rafRef = useRef(null)

  // Daftar langkah terarah yang interaktif
  const steps = [
    {
      id: 'step_menu_create',
      title: 'Langkah 1: Klik Menu "Buat Surat Ajuan"',
      selector: '#nav-item-templates, #mobile-quick-create_letter',
      fallbackMenu: null,
      desc: 'Klik tombol ini untuk memulai proses pengajuan surat baru. Sistem menyediakan berbagai template surat dinas siap pakai.',
      tips: 'Tersedia di bilah navigasi atas (Desktop) atau Menu Akses Cepat di Beranda (Mobile).',
      actionPrompt: 'Klik tombol di atas untuk membuka katalog template',
      placement: 'bottom',
    },
    {
      id: 'step_pick_template',
      title: 'Langkah 2: Pilih Template Surat yang Sesuai',
      selector: '#template-card-0, #template-catalog-first-card, #btn-use-template-first',
      autoNavigate: 'templates',
      desc: 'Pilih jenis surat sesuai kebutuhan Anda (misal: Perjalanan Dinas, Service Kendaraan, Diskon CRM, atau Surat Bebas). Setiap template sudah disiapkan format resmi & pejabat approver-nya.',
      tips: 'Anda juga bisa menggunakan fitur pencarian untuk mencari nama template dengan cepat.',
      actionPrompt: 'Pilih salah satu template resmi dengan klik "Gunakan Template Ini"',
      placement: 'top',
    },
    {
      id: 'step_fill_perihal',
      title: 'Langkah 3: Tuliskan Nama / Perihal Surat',
      selector: '#field-perihal-input, input[name="perihal"], input[placeholder*="Permohonan"]',
      desc: 'Isi perihal atau nama surat pengajuan dengan jelas dan spesifik (Contoh: "Permohonan Biaya Service Truk Operasional Cabang Surabaya").',
      tips: 'Perihal ini akan langsung sinkron ke judul dokumen resmi, riwayat persetujuan, dan pencarian arsip.',
      actionPrompt: 'Ketik nama / perihal pengajuan di kotak input yang disorot',
      placement: 'bottom',
    },
    {
      id: 'step_attachments',
      title: 'Langkah 4: Lampirkan Foto / Dokumen Pendukung',
      selector: '#btn-manage-attachments, #section-attachments',
      desc: 'Klik tombol "Kelola Lampiran & Foto" untuk mengunggah kuitansi, nota, invoice, atau foto kerusakan fisik sebagai bukti pendukung.',
      tips: 'Mendukung file JPG, PNG, dan PDF. Lampiran lengkap mempercepat proses verifikasi oleh atasan.',
      actionPrompt: 'Unggah file nota / kuitansi Anda di bagian ini',
      placement: 'top',
    },
    {
      id: 'step_submit_letter',
      title: 'Langkah 5: Simpan Draft atau Kirim Surat Ajuan',
      selector: '#btn-submit-letter, #btn-save-draft',
      desc: 'Periksa pratinjau surat di tab "Pratinjau". Jika sudah sesuai, klik "Kirim Ajuan" untuk meneruskan surat ke meja atasan / approver bertingkat secara realtime.',
      tips: 'Setelah dikirim, notifikasi otomatis masuk ke akun approver dan status surat dapat dipantau di menu Arsip.',
      actionPrompt: 'Klik "Kirim Ajuan" saat surat siap diverifikasi',
      placement: 'bottom',
    },
  ]

  const currentStep = steps[stepIndex]

  // Cari elemen target di DOM dan ukur posisinya
  const updateTargetRect = () => {
    if (!isActive || !currentStep) return
    const el = document.querySelector(currentStep.selector)
    if (el) {
      const rect = el.getBoundingClientRect()
      // Elemen ditemukan dan tampak
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right,
        })
        return
      }
    }
    // Jika elemen belum ada di layar (misal halaman berbeda), set targetRect null
    setTargetRect(null)
  }

  // Update rect saat step berubah / resize / scroll
  useEffect(() => {
    if (!isActive) return

    // Auto navigate jika step butuh pindah menu
    if (currentStep?.autoNavigate && activeMenu !== currentStep.autoNavigate && onNavigate) {
      onNavigate(currentStep.autoNavigate)
    }

    // Beri jeda sedikit agar render komponen selesai lalu scroll ke elemen
    const timer = setTimeout(() => {
      const el = document.querySelector(currentStep?.selector)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      updateTargetRect()
    }, 250)

    const handleScrollOrResize = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(updateTargetRect)
    }

    window.addEventListener('resize', handleScrollOrResize)
    window.addEventListener('scroll', handleScrollOrResize, true)

    // Polling ringan bila ada animasi transisi
    const interval = setInterval(updateTargetRect, 600)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
      window.removeEventListener('resize', handleScrollOrResize)
      window.removeEventListener('scroll', handleScrollOrResize, true)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isActive, stepIndex, activeMenu, currentStep?.selector])

  if (!isActive) return null

  const handleNext = () => {
    // Jalankan aksi tombol yang sedang diarahkan
    if (currentStep?.id === 'step_menu_create') {
      if (onNavigate) onNavigate('templates')
    } else if (currentStep?.id === 'step_pick_template') {
      // Otomatis pilih template pertama / klik tombol gunakan template
      const btn = document.querySelector('#btn-use-template-first, #template-card-0 button')
      if (btn) {
        btn.click()
      } else if (onSelectTemplate && templates.length > 0) {
        onSelectTemplate(templates[0])
      }
    } else if (currentStep?.id === 'step_fill_perihal') {
      // Fokuskan input perihal
      const input = document.querySelector('#field-perihal-input, input[name="perihal"]')
      if (input) {
        if (!input.value) {
          input.value = 'Permohonan Pengajuan Kebutuhan Operasional'
          input.dispatchEvent(new Event('input', { bubbles: true }))
          input.dispatchEvent(new Event('change', { bubbles: true }))
        }
        input.focus()
      }
    } else if (currentStep?.id === 'step_attachments') {
      // Buka popup kelola lampiran
      const btn = document.querySelector('#btn-manage-attachments')
      if (btn) btn.click()
    }

    if (stepIndex < steps.length - 1) {
      setStepIndex((prev) => prev + 1)
    } else {
      setTourCompleted(true)
      if (onComplete) onComplete()
    }
  }

  const handlePrev = () => {
    setStepIndex((prev) => Math.max(0, prev - 1))
  }

  const handleSkip = () => {
    setTourCompleted(true)
    if (onCancel) onCancel()
  }

  // Hitung posisi tooltip popover berdasarkan targetRect
  const getTooltipStyle = () => {
    if (!targetRect) {
      // Default center jika elemen target belum tampil di DOM
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        position: 'fixed',
      }
    }

    const margin = 16
    const tooltipWidth = Math.min(window.innerWidth - 32, 380)
    let left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2
    if (left < 16) left = 16
    if (left + tooltipWidth > window.innerWidth - 16) {
      left = window.innerWidth - tooltipWidth - 16
    }

    // Cek apakah muat di bawah atau di atas
    const spaceBelow = window.innerHeight - targetRect.bottom
    const placeAbove = spaceBelow < 260 && targetRect.top > 260

    if (placeAbove) {
      return {
        position: 'fixed',
        bottom: `${window.innerHeight - targetRect.top + margin}px`,
        left: `${left}px`,
        width: `${tooltipWidth}px`,
      }
    }

    return {
      position: 'fixed',
      top: `${Math.min(window.innerHeight - 280, targetRect.bottom + margin)}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
    }
  }

  return (
    <div className="no-print fixed inset-0 z-[9999] pointer-events-auto">
      {/* 1. Backdrop Gelap Transparan */}
      <div
        onClick={handleSkip}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] transition-opacity duration-300"
      />

      {/* 2. Spotlight Highlight Cutout di sekeliling target (Bisa diklik langsung oleh user) */}
      {targetRect && (
        <div
          onClick={(e) => {
            e.stopPropagation()
            handleNext()
          }}
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
          className="fixed rounded-2xl ring-4 ring-indigo-400 ring-offset-4 ring-offset-slate-950 shadow-[0_0_40px_rgba(99,102,241,0.6)] pointer-events-auto cursor-pointer transition-all duration-300 animate-pulse bg-white/5 hover:bg-white/15"
          title="Klik di sini untuk langsung mencoba"
        />
      )}

      {/* 3. Floating Tooltip Popover Terarah */}
      <div
        style={getTooltipStyle()}
        className="bg-white rounded-2xl shadow-2xl border-2 border-indigo-500/80 p-4 sm:p-5 text-slate-800 animate-fadeIn z-[10000] flex flex-col justify-between"
      >
        {/* Header Tooltip */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                {stepIndex + 1}
              </span>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/80">
                Langkah {stepIndex + 1} dari {steps.length}
              </span>
            </div>
            <button
              type="button"
              onClick={handleSkip}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              title="Lewati Panduan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
            {currentStep.title}
          </h3>

          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            {currentStep.desc}
          </p>

          {/* Action Prompt / Penunjuk Nyata */}
          <div className="mt-3 bg-gradient-to-r from-indigo-50 to-sky-50 border border-indigo-200/80 rounded-xl p-2.5 flex items-start gap-2 text-indigo-950">
            <MousePointer className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5 animate-bounce" />
            <div className="text-[11px] font-semibold leading-tight">
              <span className="font-extrabold text-indigo-700 block mb-0.5">Arah Tindakan:</span>
              <span>{currentStep.actionPrompt}</span>
            </div>
          </div>

          {currentStep.tips && (
            <p className="text-[10px] text-slate-400 mt-2 italic">
              💡 {currentStep.tips}
            </p>
          )}
        </div>

        {/* Footer Navigasi Langkah */}
        <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleSkip}
            className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition"
          >
            Lewati Tour
          </button>

          <div className="flex items-center gap-1.5">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs flex items-center gap-1 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition active:scale-95"
            >
              <span>{stepIndex === steps.length - 1 ? 'Selesai Panduan' : 'Lanjut'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
