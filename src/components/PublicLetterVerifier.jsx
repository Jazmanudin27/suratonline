import React, { useState, useEffect } from 'react'
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Building,
  User,
  Calendar,
  Printer,
  ExternalLink,
  QrCode,
  FileText,
  Search,
} from 'lucide-react'
import { formatDateId, formatDateTimeId } from '../services/storage'

export default function PublicLetterVerifier({ onGoToApp }) {
  const [letterId, setLetterId] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search)
    let id = urlParams.get('id') || urlParams.get('verify')
    if (!id && window.location.hash.includes('id=')) {
      const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '')
      id = hashParams.get('id')
    }
    return id || ''
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [letter, setLetter] = useState(null)
  const [inputSearchId, setInputSearchId] = useState('')

  const fetchVerification = async (targetId) => {
    if (!targetId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    try {
      // 1. Try public API endpoint
      const res = await fetch(`/api/public/verify/${encodeURIComponent(targetId)}`)
      const json = await res.json()

      if (json && json.success && json.letter) {
        setLetter(json.letter)
        setLoading(false)
        return
      }

      // 2. Fallback to /api/letters if public endpoint 404
      const resLetters = await fetch(`/api/letters`)
      const jsonLetters = await resLetters.json()
      if (jsonLetters && jsonLetters.success && Array.isArray(jsonLetters.data)) {
        const found = jsonLetters.data.find(
          (l) =>
            l.id === targetId ||
            (l.letterNumber && l.letterNumber.toLowerCase() === targetId.toLowerCase())
        )
        if (found) {
          setLetter(found)
          setLoading(false)
          return
        }
      }

      throw new Error(json.message || 'Dokumen surat tidak ditemukan pada sistem database portal.')
    } catch (err) {
      console.warn('Verify fetch error:', err.message)
      setError(err.message || 'Gagal memverifikasi dokumen.')
      setLoading(false)
    }
  }

  useEffect(() => {
    if (letterId) {
      fetchVerification(letterId)
    } else {
      setLoading(false)
    }
  }, [letterId])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (!inputSearchId.trim()) return
    setLetterId(inputSearchId.trim())
    fetchVerification(inputSearchId.trim())
  }

  const isApproved = letter?.status === 'approved'
  const isRejected = letter?.status === 'rejected'
  const isRevision = letter?.status === 'revision'
  const isPending = letter?.status === 'pending' || letter?.status === 'draft'

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6 flex flex-col items-center justify-start text-slate-800">
      {/* Top Brand Header */}
      <div className="w-full max-w-2xl text-center mb-6">
        <div className="inline-flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-slate-200 mb-3">
          <img src="/Logo.jpeg" alt="Logo" className="w-9 h-9 object-contain" />
          <div className="text-left">
            <h1 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide leading-tight">
              CV. MAKMUR PERMATA
            </h1>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
              SISTEM VALIDASI RESMI E-LETTER MP
            </p>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Verification Status Header Banner */}
        {loading ? (
          <div className="bg-slate-800 text-white p-6 text-center space-y-2">
            <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-300">Memeriksa keaslian tanda tangan & dokumen...</p>
          </div>
        ) : error || !letter ? (
          <div className="bg-rose-700 text-white p-6 text-center space-y-2">
            <XCircle className="w-12 h-12 text-rose-200 mx-auto" />
            <h2 className="text-lg font-black uppercase">DOKUMEN TIDAK DITEMUKAN / TIDAK VALID</h2>
            <p className="text-xs text-rose-100 max-w-md mx-auto">
              {error || 'Nomor surat atau ID tidak terdaftar dalam catatan basis data resmi perusahaan.'}
            </p>
          </div>
        ) : isApproved ? (
          <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white p-6 sm:p-8 text-center space-y-2 shadow-inner">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center mx-auto border-2 border-white/40 shadow-md">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider">
              DOKUMEN RESMI & TERVERIFIKASI
            </h2>
            <p className="text-xs text-emerald-100 max-w-lg mx-auto leading-relaxed">
              Surat ini telah disetujui penuh oleh seluruh pejabat berwenang dan terdaftar sah di server CV. Makmur Permata.
            </p>
          </div>
        ) : isRejected ? (
          <div className="bg-rose-700 text-white p-6 text-center space-y-2">
            <XCircle className="w-12 h-12 text-rose-200 mx-auto" />
            <h2 className="text-lg font-black uppercase">STATUS: SURAT DITOLAK</h2>
            <p className="text-xs text-rose-100">Dokumen ini telah ditolak oleh pejabat berwenang dan tidak berlaku.</p>
          </div>
        ) : isRevision ? (
          <div className="bg-amber-600 text-white p-6 text-center space-y-2">
            <AlertTriangle className="w-12 h-12 text-amber-200 mx-auto" />
            <h2 className="text-lg font-black uppercase">STATUS: PERLU REVISI</h2>
            <p className="text-xs text-amber-100">Dokumen sedang dalam proses revisi dan belum berlaku sah.</p>
          </div>
        ) : (
          <div className="bg-amber-500 text-slate-950 p-6 text-center space-y-2">
            <Clock className="w-12 h-12 text-slate-900 mx-auto" />
            <h2 className="text-lg font-black uppercase">STATUS: DALAM PROSES (BELUM SAH)</h2>
            <p className="text-xs text-slate-900 font-medium">
              Surat sedang menunggu persetujuan pejabat terkait dan belum memiliki kekuatan hukum sah.
            </p>
          </div>
        )}

        {/* Search Bar fallback if not found or want to check other */}
        {(!letter || error) && (
          <form onSubmit={handleSearchSubmit} className="p-6 bg-slate-50 border-b border-slate-200">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Cari Berdasarkan ID Surat atau Nomor Surat:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputSearchId}
                onChange={(e) => setInputSearchId(e.target.value)}
                placeholder="Contoh: 001/OM/MLG/XI/2026 atau ltr-..."
                className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
              >
                <Search className="w-4 h-4" />
                <span>Verifikasi</span>
              </button>
            </div>
          </form>
        )}

        {/* Letter Details */}
        {letter && (
          <div className="p-5 sm:p-7 space-y-6 text-xs">
            {/* Meta Card */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                <span className="text-slate-500 font-semibold">Nomor Surat:</span>
                <span className="font-mono font-black text-slate-900 text-sm bg-white px-2.5 py-0.5 rounded border border-slate-300 shadow-2xs">
                  {letter.letterNumber || '-'}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                <span className="text-slate-500 font-semibold">Perihal / Judul:</span>
                <span className="font-extrabold text-slate-900 uppercase text-right max-w-sm">
                  {letter.title ? String(letter.title).toUpperCase() : '-'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <span className="text-slate-500 block text-[11px]">Jenis Template:</span>
                  <span className="font-bold text-slate-800">{letter.templateName || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Cabang Pengaju:</span>
                  <span className="font-bold text-slate-800">{letter.branchName || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Pemohon:</span>
                  <span className="font-bold text-slate-800">{letter.userName || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Tanggal Pengajuan:</span>
                  <span className="font-bold text-slate-800">{formatDateId(letter.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Audit Trail & Digital Signatures */}
            <div>
              <h3 className="font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Jejak Digital & Otorisasi Persetujuan</span>
              </h3>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
                {/* 1. Pemohon */}
                <div className="p-3 bg-white flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{letter.userName || 'Pemohon'}</p>
                      <p className="text-[11px] text-slate-500">Pembuat Dokumen (Diajukan)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md font-bold text-[10px] inline-block mb-0.5">
                      Diajukan
                    </span>
                    <p className="text-[10px] font-mono text-slate-500">{formatDateTimeId(letter.createdAt)}</p>
                  </div>
                </div>

                {/* 2. Mengetahui jika ada */}
                {(letter.knownByName || letter.fieldValues?.knownByName) && (
                  <div className="p-3 bg-white flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                        2
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">
                          {letter.knownByName || letter.fieldValues?.knownByName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {letter.knownByPosition || letter.fieldValues?.knownByPosition || 'Pihak Mengetahui'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {letter.knownByApproved || letter.fieldValues?.knownByApproved || letter.status === 'approved' ? (
                        <>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold text-[10px] inline-block mb-0.5">
                            ✓ Mengetahui
                          </span>
                          <p className="text-[10px] font-mono text-slate-500">
                            {formatDateTimeId(letter.knownByApprovedAt || letter.fieldValues?.knownByApprovedAt || letter.updatedAt)}
                          </p>
                        </>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md font-bold text-[10px]">
                          Menunggu
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. Approver Steps */}
                {Array.isArray(letter.approvalHistory) &&
                  letter.approvalHistory.map((step, idx) => {
                    const isStepApproved = step.status === 'approved'
                    const isStepRejected = step.status === 'rejected'
                    const isStepRevision = step.status === 'revision'

                    return (
                      <div key={idx} className="p-3 bg-white flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              isStepApproved
                                ? 'bg-emerald-100 text-emerald-700'
                                : isStepRejected
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {idx + 3}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">
                              {step.approverName || step.specificUserName || step.approverRole || `Penyetuju Tahap ${idx + 1}`}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {step.approverRole || step.title || `Tahap ${idx + 1}`}
                            </p>
                            {step.notes && (
                              <p className="text-[10px] text-slate-600 italic mt-0.5 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                "{step.notes}"
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {isStepApproved ? (
                            <>
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold text-[10px] inline-block mb-0.5">
                                ✓ Disetujui
                              </span>
                              <p className="text-[10px] font-mono text-slate-500 font-medium">
                                {formatDateTimeId(step.date || step.approvedAt || letter.updatedAt)}
                              </p>
                            </>
                          ) : isStepRejected ? (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md font-bold text-[10px]">
                              ✗ Ditolak
                            </span>
                          ) : isStepRevision ? (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded-md font-bold text-[10px]">
                              ⚠ Revisi
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-bold text-[10px]">
                              Menunggu
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Print & Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Sertifikat Validasi</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (typeof onGoToApp === 'function') {
                    onGoToApp()
                  } else {
                    window.location.href = '/'
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Masuk ke E-Letter Portal</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Disclaimer */}
      <div className="w-full max-w-2xl text-center mt-6 text-[11px] text-slate-500">
        <p>Sistem E-Letter MP &bull; CV. Makmur Permata &bull; Semua Hak Dilindungi</p>
        <p className="text-[10px] text-slate-400 mt-0.5">
          Verifikasi ini dihasilkan otomatis oleh server portal resmi berdasarkan tanda tangan digital kriptografis.
        </p>
      </div>
    </div>
  )
}

