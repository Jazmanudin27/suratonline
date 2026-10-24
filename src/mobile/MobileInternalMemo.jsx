import React, { useState, useEffect, useMemo } from 'react'
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  Eye,
  FileCheck,
  Download,
  ExternalLink,
  ChevronRight,
  X,
  AlertCircle,
  Tag,
  ThumbsUp,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  BookOpen,
  Info,
  ChevronLeft,
} from 'lucide-react'
import { api } from '../services/api'
import { formatDateId, formatDateTimeId } from '../services/storage'
import { renderPdfToPages } from '../utils/pdfRenderer'

export default function MobileInternalMemo({ currentUser }) {
  const [memos, setMemos] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all') // 'all' | 'MKT' | 'AKT' | 'HRD'
  const [ackFilter, setAckFilter] = useState('all') // 'all' | 'paham' | 'belum'
  const [selectedMemo, setSelectedMemo] = useState(null)
  const [readingMemo, setReadingMemo] = useState(null)
  const [submittingAck, setSubmittingAck] = useState(false)
  const [pdfPages, setPdfPages] = useState([])
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfScale, setPdfScale] = useState(1)

  // Muat data internal memo langsung dari backend MySQL
  const loadMemos = async () => {
    try {
      setLoading(true)
      const data = await api.getInternalMemo(currentUser?.id)
      setMemos(Array.isArray(data) ? data : [])
    } catch (e) {
      console.warn('Gagal memuat internal memo:', e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMemos()
  }, [currentUser?.id])

  // Departemen unik
  const departments = useMemo(() => {
    const set = new Set()
    memos.forEach((m) => {
      if (m.kode_dept) set.add(m.kode_dept)
    })
    return Array.from(set).sort()
  }, [memos])

  // Filter memo
  const filteredMemos = useMemo(() => {
    return memos.filter((m) => {
      // 1. Cabang Filter (Memo berlaku umum atau jika cabang terdaftar)
      // Tampilkan seluruh memo sosialisasi agar user cabang dapat membaca ketentuan


      // 2. Search
      const q = search.trim().toLowerCase()
      const matchSearch =
        !q ||
        (m.no_im && m.no_im.toLowerCase().includes(q)) ||
        (m.judul && m.judul.toLowerCase().includes(q)) ||
        (m.keterangan && m.keterangan.toLowerCase().includes(q)) ||
        (m.kode_dept && m.kode_dept.toLowerCase().includes(q))

      // 3. Dept
      const matchDept = deptFilter === 'all' || m.kode_dept === deptFilter

      // 4. Status Paham / Ack
      let matchAck = true
      if (ackFilter === 'paham') {
        matchAck = m.ack_status === 'paham'
      } else if (ackFilter === 'belum') {
        matchAck = m.ack_status !== 'paham'
      }

      return matchSearch && matchDept && matchAck
    })
  }, [memos, search, deptFilter, ackFilter, currentUser])

  // Aksi Klik Detail Memo (Informasi & Riwayat)
  const handleOpenMemo = (memo) => {
    setSelectedMemo(memo)
    // Otomatis catat log baca jika belum pernah dibaca
    if (currentUser?.id && !memo.read_at) {
      api.markInternalMemoRead(memo.id, currentUser.id).then(() => {
        setMemos((prev) =>
          prev.map((item) =>
            item.id === memo.id ? { ...item, read_at: new Date().toISOString() } : item
          )
        )
      })
    }
  }

  // Aksi Klik Baca / Pratinjau PDF (Full document reader)
  const handleReadPdf = async (memo) => {
    setReadingMemo(memo)
    setPdfScale(1)
    setPdfPages([])

    // Catat log baca
    if (currentUser?.id && !memo.read_at) {
      api.markInternalMemoRead(memo.id, currentUser.id).then(() => {
        setMemos((prev) =>
          prev.map((item) =>
            item.id === memo.id ? { ...item, read_at: new Date().toISOString() } : item
          )
        )
      })
    }

    // Render halaman PDF
    if (memo.file_im) {
      try {
        setPdfLoading(true)
        // Gunakan proxy backend /api/internal_memo/pdf/:file_im untuk menjamin bebas CORS
        const pdfUrl = `/api/internal_memo/pdf/${encodeURIComponent(memo.file_im)}`
        const pages = await renderPdfToPages(pdfUrl, 1.6)
        setPdfPages(Array.isArray(pages) ? pages : [])
      } catch (err) {
        console.warn('Gagal render halaman PDF:', err)
        // Coba langsung fallback direct link dari app.portalmp.com
        try {
          const directUrl = `https://app.portalmp.com/storage/internal_memo/${encodeURIComponent(memo.file_im)}`
          const pages = await renderPdfToPages(directUrl, 1.6)
          setPdfPages(Array.isArray(pages) ? pages : [])
        } catch (e2) {
          setPdfPages([])
        }
      } finally {
        setPdfLoading(false)
      }
    }
  }

  // Aksi Konfirmasi Paham
  const handleAck = async (memoId) => {
    if (!currentUser?.id || submittingAck) return
    try {
      setSubmittingAck(true)
      const res = await api.acknowledgeInternalMemo(memoId, currentUser.id, 'paham')
      if (res && res.success) {
        setMemos((prev) =>
          prev.map((item) =>
            item.id === memoId
              ? {
                  ...item,
                  ack_status: 'paham',
                  ack_at: new Date().toISOString(),
                  total_paham: (item.total_paham || 0) + 1,
                }
              : item
          )
        )
        if (selectedMemo && selectedMemo.id === memoId) {
          setSelectedMemo((prev) => ({
            ...prev,
            ack_status: 'paham',
            ack_at: new Date().toISOString(),
            total_paham: (prev.total_paham || 0) + 1,
          }))
        }
      }
    } catch (err) {
      console.warn('Gagal konfirmasi paham:', err.message)
    } finally {
      setSubmittingAck(false)
    }
  }

  const totalPaham = memos.filter((m) => m.ack_status === 'paham').length
  const totalBelumPaham = memos.length - totalPaham

  // Warna badge departemen
  const getDeptColor = (dept) => {
    switch (dept) {
      case 'MKT':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'AKT':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'HRD':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  return (
    <div className="space-y-3 pb-24">
      {/* Top Banner Khusus Mobile */}
      <div className="bg-gradient-to-r from-indigo-800 via-blue-800 to-slate-900 rounded-2xl p-4 text-white shadow-md shadow-indigo-950/20 border border-indigo-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-xs">
              <FileText size={22} className="text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-white leading-tight">
                Internal Memo (IM)
              </h2>
              <p className="text-[11px] text-blue-100/80 font-medium">
                Sosialisasi Kebijakan & Regulasi Resmi
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-white/15 backdrop-blur-md rounded-xl text-xs font-black border border-white/20">
            {memos.length} Memo
          </span>
        </div>

        {/* Counter Paham / Belum */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/15 text-xs">
          <div className="flex items-center justify-between bg-white/10 rounded-xl px-2.5 py-1.5 border border-white/10">
            <span className="text-[11px] text-emerald-200 font-semibold flex items-center gap-1">
              <CheckCircle2 size={13} /> Sudah Paham
            </span>
            <span className="font-extrabold text-white text-sm">{totalPaham}</span>
          </div>
          <div className="flex items-center justify-between bg-white/10 rounded-xl px-2.5 py-1.5 border border-white/10">
            <span className="text-[11px] text-amber-200 font-semibold flex items-center gap-1">
              <Clock size={13} /> Belum Konfirmasi
            </span>
            <span className="font-extrabold text-white text-sm">{totalBelumPaham}</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-3 shadow-xs border border-slate-200/80 space-y-2.5">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nomor memo, judul ketentuan..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status Paham Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs pb-0.5">
          <button
            type="button"
            onClick={() => setAckFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap shrink-0 ${
              ackFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({memos.length})
          </button>
          <button
            type="button"
            onClick={() => setAckFilter('paham')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap shrink-0 flex items-center gap-1 ${
              ackFilter === 'paham'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 size={13} />
            <span>Sudah Paham</span>
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {totalPaham}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setAckFilter('belum')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap shrink-0 flex items-center gap-1 ${
              ackFilter === 'belum'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Clock size={13} />
            <span>Belum Paham</span>
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {totalBelumPaham}
            </span>
          </button>
        </div>

        {/* Department Pills */}
        {departments.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1 border-t border-slate-100 text-[11px]">
            <span className="text-slate-400 font-semibold shrink-0 flex items-center gap-1 text-[10px]">
              <Tag size={12} /> Dept:
            </span>
            <button
              type="button"
              onClick={() => setDeptFilter('all')}
              className={`px-2 py-0.5 rounded-lg font-bold transition whitespace-nowrap shrink-0 ${
                deptFilter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua
            </button>
            {departments.map((dept) => (
              <button
                key={dept}
                type="button"
                onClick={() => setDeptFilter(dept)}
                className={`px-2 py-0.5 rounded-lg font-bold transition whitespace-nowrap shrink-0 ${
                  deptFilter === dept
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* List Kartu Internal Memo */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-200/80 shadow-xs space-y-2">
            <Clock size={36} className="mx-auto text-indigo-400 animate-spin" />
            <p className="text-xs font-semibold text-slate-600">Memuat data Internal Memo...</p>
          </div>
        ) : filteredMemos.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-200/80 shadow-xs space-y-2">
            <FileText size={40} className="mx-auto text-slate-300 stroke-[1.5]" />
            <h4 className="font-bold text-slate-700 text-sm">Tidak Ada Internal Memo</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Tidak ada memo yang cocok dengan kata kunci atau filter terpilih.
            </p>
          </div>
        ) : (
          filteredMemos.map((memo) => {
            const isPaham = memo.ack_status === 'paham'

            return (
              <div
                key={memo.id}
                onClick={() => handleOpenMemo(memo)}
                className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs hover:shadow-md transition active:scale-[0.99] cursor-pointer space-y-2.5 relative overflow-hidden"
              >
                {/* Border Indicator Paham */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 ${
                    isPaham ? 'bg-emerald-500' : 'bg-amber-400'
                  }`}
                />

                {/* Header: Nomor Memo, Dept & Status Paham */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="font-mono text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded-md">
                        {memo.no_im}
                      </span>
                      {memo.kode_dept && (
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.2 rounded-md border ${getDeptColor(
                            memo.kode_dept
                          )}`}
                        >
                          {memo.kode_dept}
                        </span>
                      )}
                      {memo.read_at && (
                        <span className="text-[9px] text-slate-400 font-medium flex items-center gap-0.5">
                          <Eye size={10} className="text-slate-400" /> Dibaca
                        </span>
                      )}
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug line-clamp-2">
                      {memo.judul}
                    </h3>
                  </div>

                  {/* Status Ack Pill */}
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isPaham
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {isPaham ? (
                      <>
                        <CheckCircle2 size={11} className="text-emerald-700" />
                        <span>Paham</span>
                      </>
                    ) : (
                      <>
                        <Clock size={11} className="text-amber-700" />
                        <span>Belum Paham</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Tanggal & Masa Berlaku */}
                <div className="grid grid-cols-2 gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-150 text-[11px]">
                  <div>
                    <span className="block text-[9px] text-slate-400 font-bold uppercase">
                      Tanggal Memo
                    </span>
                    <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      <Calendar size={11} className="text-indigo-600" />
                      {memo.tanggal_im ? formatDateId(memo.tanggal_im) : '-'}
                    </span>
                  </div>
                  <div className="border-l border-slate-200 pl-2">
                    <span className="block text-[9px] text-slate-400 font-bold uppercase">
                      Masa Berlaku
                    </span>
                    <span className="font-bold text-slate-700 mt-0.5 block truncate">
                      {memo.berlaku_dari ? formatDateId(memo.berlaku_dari) : 'Tanpa Batas'}
                      {memo.berlaku_sampai ? ` s.d ${formatDateId(memo.berlaku_sampai)}` : ''}
                    </span>
                  </div>
                </div>

                {/* Footer: Cabang Tujuan & Tombol Tindakan Terpisah (Detail vs Baca) */}
                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100 gap-2">
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 min-w-0 flex-1">
                    <Building2 size={11} className="text-indigo-600 shrink-0" />
                    <span className="truncate">
                      {Array.isArray(memo.tujuan_cabang) && memo.tujuan_cabang.length > 0
                        ? `${memo.tujuan_cabang.length} Cabang`
                        : 'Semua Cabang'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Tombol Detail */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenMemo(memo)
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1 transition active:scale-95"
                    >
                      <Info size={12} className="text-slate-500" />
                      <span>Detail</span>
                    </button>

                    {/* Tombol Baca Dokumen PDF */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleReadPdf(memo)
                      }}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-extrabold text-[11px] flex items-center gap-1 shadow-xs transition active:scale-95"
                    >
                      <BookOpen size={12} />
                      <span>Baca</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Detail Bottom Sheet Modal */}
      {selectedMemo && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-slideUp">
            
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
                  <FileText size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-sm text-white leading-tight truncate">
                    Detail Internal Memo
                  </h3>
                  <span className="font-mono text-[10px] text-indigo-300 block truncate">
                    {selectedMemo.no_im}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedMemo(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              
              {/* Judul & Status Konfirmasi */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Judul Ketentuan Memo
                  </span>
                  {selectedMemo.kode_dept && (
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${getDeptColor(
                        selectedMemo.kode_dept
                      )}`}
                    >
                      Departemen: {selectedMemo.kode_dept}
                    </span>
                  )}
                </div>

                <h4 className="font-black text-slate-900 text-sm sm:text-base leading-snug">
                  {selectedMemo.judul}
                </h4>

                {/* Banner Status Paham */}
                <div
                  className={`p-2.5 rounded-xl border flex items-center justify-between ${
                    selectedMemo.ack_status === 'paham'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {selectedMemo.ack_status === 'paham' ? (
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle size={16} className="text-amber-600 shrink-0" />
                    )}
                    <div>
                      <span className="font-extrabold block text-xs">
                        {selectedMemo.ack_status === 'paham'
                          ? 'Anda Telah Memahami Memo Ini'
                          : 'Wajib Dibaca & Dipahami'}
                      </span>
                      <span className="text-[10px] opacity-80 block">
                        {selectedMemo.ack_at
                          ? `Dikonfirmasi pada ${formatDateTimeId(selectedMemo.ack_at)}`
                          : 'Silakan konfirmasi jika ketentuan memo sudah Anda pahami'}
                      </span>
                    </div>
                  </div>

                  {selectedMemo.ack_status !== 'paham' && (
                    <button
                      type="button"
                      disabled={submittingAck}
                      onClick={() => handleAck(selectedMemo.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-xl shadow-xs transition active:scale-95 shrink-0 flex items-center gap-1"
                    >
                      <ThumbsUp size={12} />
                      <span>{submittingAck ? 'Menyimpan...' : 'Saya Paham'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* SECTION: Informasi Masa Berlaku & Tanggal */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wide block">
                  Informasi Tanggal & Waktu
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">
                      Tanggal Memo
                    </span>
                    <span className="font-extrabold text-slate-800 text-xs">
                      {selectedMemo.tanggal_im ? formatDateId(selectedMemo.tanggal_im) : '-'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">
                      Status Berlaku
                    </span>
                    <span className="font-extrabold text-indigo-700 text-xs">
                      {selectedMemo.berlaku_dari ? formatDateId(selectedMemo.berlaku_dari) : '-'}
                      {selectedMemo.berlaku_sampai ? ` s.d ${formatDateId(selectedMemo.berlaku_sampai)}` : ' (Seterusnya)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION: File Dokumen PDF Lampiran */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wide block">
                  Berkas Dokumen Resmi (PDF)
                </span>
                <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <FileCheck size={18} />
                    </div>
                    <div className="min-w-0">
                      <span className="font-extrabold text-slate-900 block truncate text-xs">
                        {selectedMemo.file_im || `${selectedMemo.no_im}.pdf`}
                      </span>
                      <span className="text-[10px] text-indigo-700 font-semibold">
                        Dokumen Asli Internal Memo
                      </span>
                    </div>
                  </div>

                  <a
                    href={`https://app.portalmp.com/storage/internal_memo/${encodeURIComponent(selectedMemo.file_im)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs shrink-0 transition"
                  >
                    <span>Buka PDF</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              {/* SECTION: Keterangan / Uraian Memo */}
              {selectedMemo.keterangan && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wide block">
                    Keterangan Tambahan
                  </span>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 text-xs leading-relaxed whitespace-pre-line">
                    {selectedMemo.keterangan}
                  </div>
                </div>
              )}

              {/* SECTION: Cabang Tujuan Sosialisasi */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wide block">
                  Cabang Tujuan ({selectedMemo.tujuan_cabang?.length || 0})
                </span>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {Array.isArray(selectedMemo.tujuan_cabang) && selectedMemo.tujuan_cabang.length > 0 ? (
                    selectedMemo.tujuan_cabang.map((b) => (
                      <span
                        key={b.kode_cabang}
                        className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-700"
                      >
                        {b.nama_cabang || b.kode_cabang}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 text-xs">Berlaku untuk Seluruh Cabang</span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const m = selectedMemo
                  setSelectedMemo(null)
                  handleReadPdf(m)
                }}
                className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 text-white font-extrabold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <BookOpen size={14} />
                <span>Baca Lembar Dokumen</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedMemo(null)}
                className="w-24 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN PDF DOCUMENT READER (PERSIS 100% SEPERTI MOBILE DOCUMENT READER SURAT AJUAN) */}
      {readingMemo && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between max-w-md mx-auto select-text animate-fadeIn">
          {/* 1. Header Bar Mobile (Dark Slate) */}
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 shrink-0 flex items-center justify-between text-white">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800/60 inline-block truncate max-w-[210px]">
                {readingMemo.no_im || 'INTERNAL MEMO'}
              </span>
              <h3 className="text-xs font-bold text-slate-100 truncate mt-0.5">
                {readingMemo.judul || 'Dokumen Ketentuan Memo'}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setReadingMemo(null)}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 flex items-center justify-center text-sm font-bold border border-slate-700 shrink-0 transition"
            >
              ✕
            </button>
          </div>

          {/* 2. Sub-Bar: Kontrol Zoom / Fit Layar HP (Persis seperti Surat Ajuan) */}
          <div className="bg-slate-900/95 px-3 py-2 border-b border-slate-800 flex items-center justify-between shrink-0 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400">Ukuran A4:</span>
              <button
                type="button"
                onClick={() => setPdfScale(1)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                  pdfScale === 1
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Fit Layar ({Math.round(pdfScale * 100)}%)
              </button>
              <button
                type="button"
                onClick={() => setPdfScale(1.4)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                  pdfScale === 1.4
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                100% Asli
              </button>
            </div>

            {/* Zoom Controls Buttons (− % +) */}
            <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setPdfScale((prev) => Math.max(0.4, Number((prev - 0.1).toFixed(1))))}
                className="w-6 h-6 flex items-center justify-center font-bold text-sm text-slate-300 hover:text-white"
                title="Perkecil"
              >
                −
              </button>
              <span className="text-[10px] font-mono font-bold px-1 text-slate-300 min-w-[36px] text-center">
                {Math.round(pdfScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setPdfScale((prev) => Math.min(2.5, Number((prev + 0.1).toFixed(1))))}
                className="w-6 h-6 flex items-center justify-center font-bold text-sm text-slate-300 hover:text-white"
                title="Perbesar"
              >
                +
              </button>
            </div>
          </div>

          {/* 3. Banner Status Konfirmasi Paham / Memo Resmi */}
          <div className="mx-3 mt-2 p-2.5 bg-gradient-to-r from-indigo-950/80 via-blue-950/80 to-slate-900 border border-indigo-700/50 rounded-xl flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
                <FileText size={14} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-white truncate">
                    Internal Memo Perusahaan
                  </span>
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ${
                      readingMemo.ack_status === 'paham'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {readingMemo.ack_status === 'paham' ? 'Sudah Dipahami' : 'Belum Konfirmasi'}
                  </span>
                </div>
                <span className="text-[9px] text-slate-400 block truncate">
                  {readingMemo.tanggal_im ? `Terbit: ${formatDateId(readingMemo.tanggal_im)}` : 'Dokumen Resmi'} &bull; {readingMemo.kode_dept || 'Semua Divisi'}
                </span>
              </div>
            </div>

            {readingMemo.ack_status !== 'paham' && (
              <button
                type="button"
                disabled={submittingAck}
                onClick={() => handleAck(readingMemo.id)}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] rounded-lg shadow-xs transition active:scale-95 flex items-center gap-1 shrink-0"
              >
                <ThumbsUp size={11} />
                <span>{submittingAck ? '...' : 'Saya Paham'}</span>
              </button>
            )}
          </div>

          {/* 4. Canvas Lembar PDF Utama (Scaled A4 Persis Surat Ajuan) */}
          <div className="flex-1 overflow-x-auto overflow-y-auto bg-slate-800 p-2.5 flex flex-col items-center">
            {pdfLoading ? (
              <div className="my-auto text-center text-slate-400 space-y-3 py-16">
                <Clock size={40} className="mx-auto text-indigo-400 animate-spin" />
                <p className="text-xs font-bold text-slate-200">Memuat Dokumen Lembar Memo...</p>
                <span className="text-[10px] text-slate-500 block">
                  {readingMemo.file_im}
                </span>
              </div>
            ) : pdfPages.length > 0 ? (
              <div
                className="space-y-3 w-full transition-transform duration-150 origin-top flex flex-col items-center"
                style={{ transform: `scale(${pdfScale})` }}
              >
                {pdfPages.map((page, idx) => (
                  <div
                    key={page.pageNumber || idx}
                    className="bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-700/60 w-full max-w-[794px]"
                  >
                    <div className="px-3 py-1 bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-500 flex justify-between items-center">
                      <span>Lembar Halaman {page.pageNumber} / {page.totalPages}</span>
                      <span className="font-mono text-indigo-700">{readingMemo.no_im}</span>
                    </div>
                    <img
                      src={page.dataUrl}
                      alt={`Halaman ${page.pageNumber}`}
                      className="w-full h-auto block select-none pointer-events-none"
                    />
                  </div>
                ))}
              </div>
            ) : (
              /* Fallback Direct PDF View jika file_im berukuran besar / URL */
              <div className="w-full h-full flex flex-col items-center justify-center my-auto p-4 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300 mx-auto">
                  <FileText size={28} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Dokumen Terbuka</h4>
                  <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                    {readingMemo.file_im}
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={`https://app.portalmp.com/storage/internal_memo/${encodeURIComponent(readingMemo.file_im)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition"
                  >
                    <ExternalLink size={13} />
                    <span>Buka via Browser</span>
                  </a>
                  <a
                    href={`/api/internal_memo/pdf/${encodeURIComponent(readingMemo.file_im)}`}
                    download={readingMemo.file_im}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition"
                  >
                    <Download size={13} />
                    <span>Unduh PDF</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* 5. Bottom Floating Action Bar Mobile (Persis seperti Surat Ajuan) */}
          <div className="bg-slate-900 border-t border-slate-800 p-3 shrink-0 flex items-center gap-2">
            {readingMemo.ack_status !== 'paham' && (
              <button
                type="button"
                disabled={submittingAck}
                onClick={() => handleAck(readingMemo.id)}
                className="flex-1 py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs"
              >
                <ThumbsUp size={14} />
                <span>{submittingAck ? 'Menyimpan...' : 'Saya Paham'}</span>
              </button>
            )}

            <a
              href={`https://app.portalmp.com/storage/internal_memo/${encodeURIComponent(readingMemo.file_im)}`}
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
              title="Buka Dokumen di Tab Baru"
            >
              <ExternalLink size={13} className="text-slate-400" />
              <span>Buka Asli</span>
            </a>

            <button
              type="button"
              onClick={() => setReadingMemo(null)}
              className={`${
                readingMemo.ack_status !== 'paham' ? 'w-24' : 'flex-1'
              } py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold rounded-xl text-xs transition text-center shadow-xs`}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
