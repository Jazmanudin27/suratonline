import React, { useState, useRef, useEffect } from 'react'
import { ShieldCheck, MessageSquare, Share2 } from 'lucide-react'
import LetterDocumentView from '../components/LetterDocumentView'
import MobileApprovalModal from './MobileApprovalModal'
import ShareLetterModal from '../components/ShareLetterModal'
import { canUserApproveLetter } from '../components/ApproverInbox'
import { notify } from '../utils/alert'

export default function MobileDocumentReader({
  letter,
  currentUser,
  branches = [],
  onClose,
  onOpenChat,
  onApprove,
  onReject,
  onRequestRevision,
  onUpdateNotes,
}) {
  const containerRef = useRef(null)
  const contentRef = useRef(null)
  const [scaleMode, setScaleMode] = useState('fit') // 'fit' | 'actual' | 'custom'
  const [customScale, setCustomScale] = useState(1)
  const [fitScale, setFitScale] = useState(0.45)
  const [contentHeight, setContentHeight] = useState(2400)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [currentLetter, setCurrentLetter] = useState(letter)

  useEffect(() => {
    setCurrentLetter(letter)
  }, [letter])

  if (!letter) return null

  const isPendingThisUser = canUserApproveLetter(letter, currentUser)
  const commentsCount = (letter.comments || []).length

  // Hitung skala pas layar HP & Pantau perubahan tinggi konten secara dinamis
  useEffect(() => {
    const calculateFit = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth || window.innerWidth
        // Standar A4 max-w di LetterDocumentView adalah 794px
        const a4Width = 794
        const padding = 16
        const calculated = Math.min(1, Math.max(0.3, (containerWidth - padding) / a4Width))
        setFitScale(calculated)
      }

      if (contentRef.current) {
        setContentHeight(contentRef.current.scrollHeight || 2400)
      }
    }

    calculateFit()
    const timer = setTimeout(calculateFit, 300)
    const timer2 = setTimeout(calculateFit, 1000)
    window.addEventListener('resize', calculateFit)

    let observer = null
    if (typeof ResizeObserver !== 'undefined' && contentRef.current) {
      observer = new ResizeObserver(() => {
        if (contentRef.current) {
          setContentHeight(contentRef.current.scrollHeight || 2400)
        }
      })
      observer.observe(contentRef.current)
    }

    return () => {
      clearTimeout(timer)
      clearTimeout(timer2)
      window.removeEventListener('resize', calculateFit)
      if (observer) observer.disconnect()
    }
  }, [letter])

  // Efektif skala yang dipakai
  const currentScale =
    scaleMode === 'fit' ? fitScale : scaleMode === 'actual' ? 1 : customScale

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between max-w-md mx-auto select-text animate-fadeIn">
      {/* 1. Header Bar Mobile */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 shrink-0 flex items-center justify-between text-white">
        <div className="min-w-0 pr-2">
          <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800/60 inline-block truncate max-w-[210px]">
            {letter.letterNumber || 'Draft Dokumen'}
          </span>
          <h3 className="text-xs font-bold text-slate-100 truncate mt-0.5">
            {letter.title || 'Surat Pengajuan'}
          </h3>
        </div>

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 flex items-center justify-center text-sm font-bold border border-slate-700 shrink-0"
        >
          ✕
        </button>
      </div>

      {/* 2. Sub-Bar: Kontrol Zoom / Fit Layar HP */}
      <div className="bg-slate-900/95 px-3 py-2 border-b border-slate-800 flex items-center justify-between shrink-0 text-xs text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-400">Ukuran A4:</span>
          <button
            onClick={() => setScaleMode('fit')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
              scaleMode === 'fit'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Fit Layar ({Math.round(fitScale * 100)}%)
          </button>
          <button
            onClick={() => setScaleMode('actual')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
              scaleMode === 'actual'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            100% Asli
          </button>
        </div>

        {/* Zoom Controls Buttons */}
        <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
          <button
            onClick={() => {
              setScaleMode('custom')
              setCustomScale((prev) => Math.max(0.35, Number((prev - 0.1).toFixed(1))))
            }}
            className="w-6 h-6 flex items-center justify-center font-bold text-sm text-slate-300 hover:text-white"
            title="Perkecil"
          >
            −
          </button>
          <span className="text-[10px] font-mono font-bold px-1 text-slate-300 min-w-[36px] text-center">
            {Math.round(currentScale * 100)}%
          </span>
          <button
            onClick={() => {
              setScaleMode('custom')
              setCustomScale((prev) => Math.min(3.0, Number((prev + 0.1).toFixed(1))))
            }}
            className="w-6 h-6 flex items-center justify-center font-bold text-sm text-slate-300 hover:text-white"
            title="Perbesar"
          >
            +
          </button>
        </div>
      </div>

      {/* 3. Main Scaled A4 Document View (100% SAMA PERSIS DENGAN PC/LAPTOP) */}
      <div
        ref={containerRef}
        className="flex-1 overflow-x-auto overflow-y-auto bg-slate-800 p-2 select-text"
      >
        <div
          style={{
            width: `${Math.max(794 * currentScale, 10)}px`,
            minHeight: `${Math.max((contentHeight || 2400) * currentScale, 10)}px`,
            position: 'relative',
            overflow: 'visible',
            margin: '0 auto',
          }}
        >
          <div
            ref={contentRef}
            style={{
              width: '794px',
              transform: `scale(${currentScale})`,
              transformOrigin: 'top left',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
            className="bg-transparent"
          >
            {/* MEMANGGIL KOMPONEN DOKUMEN RESMI ASLI */}
            <LetterDocumentView
              letter={letter}
              isBuilderPreview={false}
              hideTopBar={true}
              onClose={onClose}
              branches={branches}
              currentUser={currentUser}
              onUpdateNotes={(targetIdx, newNote) => {
                if (onUpdateNotes) onUpdateNotes(targetIdx, newNote)
              }}
            />
          </div>
        </div>
      </div>

      {/* 4. Bottom Floating Action Bar Mobile */}
      <div className="bg-slate-900 border-t border-slate-800 p-3 shrink-0 flex flex-col gap-2">
        {/* Tombol Approval Cepat jika surat butuh persetujuan user ini */}
        {isPendingThisUser && (
          <button
            type="button"
            onClick={() => setShowApprovalModal(true)}
            className="w-full py-2.5 px-4 text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl text-xs font-bold transition shadow-xs active:scale-98 flex items-center justify-center gap-1.5"
          >
            <ShieldCheck size={15} />
            <span>Proses Persetujuan (Approval)</span>
          </button>
        )}

        {/* Row Tombol Bagikan, Diskusi & Tutup */}
        <div className="flex items-center gap-2">
          {(() => {
            const currentUid = String(currentUser?.id || '')
            const currentName = (currentUser?.name || currentUser?.username || '').trim().toLowerCase()
            const mySharedCount = (currentLetter.sharedWith || []).filter((s) => {
              if (s.sharedById && String(s.sharedById) === currentUid) return true
              if (s.sharedBy && (s.sharedBy || '').trim().toLowerCase() === currentName) return true
              return false
            }).length

            return (
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="py-2.5 px-3 bg-violet-900/60 hover:bg-violet-800 text-violet-200 border border-violet-700/60 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                title="Bagikan Surat"
              >
                <Share2 size={13} className="text-violet-300" />
                <span>Bagikan</span>
                {mySharedCount > 0 && (
                  <span className="bg-violet-600 text-white text-[10px] px-1.5 rounded-full font-bold">
                    {mySharedCount}
                  </span>
                )}
              </button>
            )
          })()}

          <button
            onClick={() => onOpenChat(currentLetter)}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <MessageSquare size={13} className="text-slate-400" />
            <span>Diskusi</span>
            {commentsCount > 0 && (
              <span className="bg-indigo-600 text-white text-[10px] px-1.5 rounded-full font-bold">
                {commentsCount}
              </span>
            )}
          </button>

          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition active:scale-95 text-center shadow-xs"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* POPUP MODAL BAGIKAN SURAT */}
      {showShareModal && (
        <ShareLetterModal
          letter={currentLetter}
          currentUser={currentUser}
          onClose={() => setShowShareModal(false)}
          onUpdated={(updatedLetter) => {
            setCurrentLetter(updatedLetter)
            if (typeof onUpdateNotes === 'function') {
              onUpdateNotes(updatedLetter.id, updatedLetter.notes || '')
            }
          }}
        />
      )}

      {/* POPUP MODAL APPROVAL RESMI PERSIS DESKTOP */}
      {showApprovalModal && (
        <MobileApprovalModal
          letter={currentLetter}
          currentUser={currentUser}
          onClose={() => setShowApprovalModal(false)}
          onApprove={(id, note) => {
            onApprove(id, note)
            setShowApprovalModal(false)
            onClose()
          }}
          onReject={(id, reason) => {
            onReject(id, reason)
            setShowApprovalModal(false)
            onClose()
          }}
          onRequestRevision={(id, note) => {
            onRequestRevision(id, note)
            setShowApprovalModal(false)
            onClose()
          }}
        />
      )}
    </div>
  )
}
