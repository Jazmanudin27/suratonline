import React, { useState } from 'react'
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { notify } from '../utils/alert'

export default function MobileApprovalModal({
  letter,
  currentUser,
  onClose,
  onApprove,
  onReject,
  onRequestRevision,
}) {
  const [actionType, setActionType] = useState('approve') // 'approve' | 'revision' | 'reject'
  const [notes, setNotes] = useState('')

  if (!letter) return null

  const currentStep = letter.currentStep || 1
  const totalSteps = letter.totalSteps || 3
  const stepInfo = letter.approvalHistory?.[currentStep - 1] || {}
  const approverRole = stepInfo.approverRole || stepInfo.kodeJabatan || 'Approver'
  const specificName = stepInfo.specificUserName || stepInfo.approverName || currentUser?.name || ''

  const handleSubmit = () => {
    if (actionType === 'approve') {
      onApprove(letter.id, notes.trim())
      onClose()
    } else if (actionType === 'revision') {
      if (!notes.trim()) {
        notify.warning('Wajib Diisi', 'Poin catatan revisi wajib diisi!')
        return
      }
      onRequestRevision(letter.id, notes.trim())
      onClose()
    } else if (actionType === 'reject') {
      if (!notes.trim()) {
        notify.warning('Wajib Diisi', 'Alasan penolakan surat wajib diisi!')
        return
      }
      onReject(letter.id, notes.trim())
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn select-text">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200">
        {/* Header Modal - Hijau Zamrud Persis Screenshot User */}
        <div className="p-4 bg-emerald-950 text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight text-white">
                Persetujuan Surat (Approval)
              </h3>
              <p className="text-xs text-emerald-200 font-mono mt-0.5">
                {letter.letterNumber || 'Draft'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-emerald-300 hover:text-white w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-900/60 text-xs font-semibold transition"
          >
            ✕
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-4 sm:p-5 space-y-4 text-xs">
          {/* Card Info Surat */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-1.5">
            <p className="text-slate-400 font-medium text-[11px]">Judul / Perihal:</p>
            <p className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
              {letter.title || 'Surat Pengajuan'}
            </p>
            <div className="flex items-center justify-between text-slate-600 pt-2 border-t border-slate-200/80 mt-2 text-[11px]">
              <span>Pemohon: <strong className="text-slate-800">{letter.userName || letter.creatorName || letter.createdBy || '-'}</strong></span>
              <span>Cabang: <strong className="text-slate-800">{letter.branchName || letter.branchId || letter.branchCode || '-'}</strong></span>
            </div>
          </div>

          {/* 3 Tombol Pilihan Keputusan Persetujuan */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 text-xs">
              Pilih Keputusan Persetujuan:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setActionType('approve')}
                className={`py-2.5 px-3 rounded-xl font-bold border text-center transition flex items-center justify-center gap-1.5 ${
                  actionType === 'approve'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Setujui</span>
              </button>

              <button
                type="button"
                onClick={() => setActionType('revision')}
                className={`py-2.5 px-3 rounded-xl font-bold border text-center transition flex items-center justify-center gap-1.5 ${
                  actionType === 'revision'
                    ? 'bg-orange-600 text-white border-orange-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Revisi</span>
              </button>

              <button
                type="button"
                onClick={() => setActionType('reject')}
                className={`py-2.5 px-3 rounded-xl font-bold border text-center transition flex items-center justify-center gap-1.5 ${
                  actionType === 'reject'
                    ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>Tolak</span>
              </button>
            </div>
          </div>

          {/* Input Catatan */}
          <div>
            <label className="block text-slate-700 font-bold mb-1 text-xs">
              Catatan {actionType === 'approve' ? '(Opsional)' : '(Wajib Diisi)'}:
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                actionType === 'approve'
                  ? 'Catatan persetujuan (contoh: Disetujui sesuai rincian pengajuan)...'
                  : actionType === 'revision'
                  ? 'Tuliskan bagian rincian atau poin yang perlu direvisi oleh pemohon...'
                  : 'Tuliskan alasan penolakan surat ajuan ini...'
              }
              className="w-full p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-xs text-slate-800"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex justify-end items-center gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl font-semibold transition"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className={`px-5 py-2.5 text-white rounded-xl font-bold transition shadow-sm ${
              actionType === 'approve'
                ? 'bg-emerald-600 hover:bg-emerald-500'
                : actionType === 'revision'
                ? 'bg-orange-600 hover:bg-orange-500'
                : 'bg-rose-600 hover:bg-rose-500'
            }`}
          >
            {actionType === 'approve'
              ? 'Simpan Persetujuan'
              : actionType === 'revision'
              ? 'Kirim Permintaan Revisi'
              : 'Simpan Penolakan Surat'}
          </button>
        </div>
      </div>
    </div>
  )
}
