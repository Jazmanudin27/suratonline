import React, { useRef, useState, useEffect, useCallback } from 'react'
import { PenTool, RotateCcw, Check, X, Shield, Sparkles } from 'lucide-react'

export default function SignaturePadModal({
  isOpen,
  onClose,
  onSave,
  title = 'Goresan Tanda Tangan / Paraf Digital',
  subtitle = 'Goreskan paraf atau tanda tangan Anda pada bidang di bawah ini',
  userName = '',
  userPosition = '',
  userId = null,
}) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [saveAsDefault, setSaveAsDefault] = useState(true)
  const [savedDefaultSig, setSavedDefaultSig] = useState(null)

  const defaultStorageKey = userId ? `suratajuan_saved_signature_${userId}` : null

  // Check saved default signature from localStorage
  useEffect(() => {
    if (defaultStorageKey) {
      const saved = localStorage.getItem(defaultStorageKey)
      if (saved) setSavedDefaultSig(saved)
    }
  }, [defaultStorageKey, isOpen])

  // Canvas setup with high-DPI scaling
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#0f172a' // Dark navy / slate 900
    ctx.lineWidth = 2.5
    setHasDrawn(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      // Short delay for modal DOM layout
      const t = setTimeout(setupCanvas, 100)
      return () => clearTimeout(t)
    }
  }, [isOpen, setupCanvas])

  if (!isOpen) return null

  const getCoordinates = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()

    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const startDrawing = (e) => {
    if (e.type === 'touchstart') {
      e.preventDefault()
    }
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const { x, y } = getCoordinates(e)

    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
    setHasDrawn(true)
  }

  const draw = (e) => {
    if (!isDrawing) return
    if (e.type === 'touchmove') {
      e.preventDefault()
    }
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const { x, y } = getCoordinates(e)

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = (e) => {
    if (!isDrawing) return
    if (e.type === 'touchend') {
      e.preventDefault()
    }
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
    setHasDrawn(false)
  }

  const handleUseSavedDefault = () => {
    if (!savedDefaultSig) return
    if (onSave) {
      onSave(savedDefaultSig)
    }
    onClose()
  }

  const handleConfirmSave = () => {
    const canvas = canvasRef.current
    if (!canvas || !hasDrawn) {
      alert('Silakan goreskan tanda tangan terlebih dahulu.')
      return
    }

    const dataUrl = canvas.toDataURL('image/png')

    if (saveAsDefault && defaultStorageKey) {
      try {
        localStorage.setItem(defaultStorageKey, dataUrl)
      } catch (err) {
        console.warn('Gagal menyimpan tanda tangan default:', err)
      }
    }

    if (onSave) {
      onSave(dataUrl)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20 text-white shrink-0">
              <PenTool className="w-4.5 h-4.5 text-sky-300" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold leading-tight">{title}</h3>
              <p className="text-[11px] text-blue-100/80 leading-snug">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Penandatangan */}
        {(userName || userPosition) && (
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Penandatangan:</span>
            <div className="text-right">
              <span className="font-bold text-slate-800">{userName}</span>
              {userPosition && <span className="text-slate-500 text-[10px] block">({userPosition})</span>}
            </div>
          </div>
        )}

        {/* Body Canvas Area */}
        <div className="p-4 space-y-3">
          {savedDefaultSig && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs text-emerald-900 font-medium">Tersedia goresan paraf profil tersimpan</span>
              </div>
              <button
                type="button"
                onClick={handleUseSavedDefault}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shrink-0 shadow-xs"
              >
                Gunakan Profil
              </button>
            </div>
          )}

          <div className="relative border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-slate-50/60 touch-none">
            {/* Guide Lines */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-end pb-8 px-6">
              <div className="border-b border-slate-300/80 w-full flex justify-between text-[10px] text-slate-400 select-none pb-0.5">
                <span>Garis batas paraf</span>
                <span>Tanda tangan di sini</span>
              </div>
            </div>

            <canvas
              ref={canvasRef}
              className="w-full h-44 sm:h-52 cursor-crosshair relative z-10 touch-none block"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />

            {!hasDrawn && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs italic select-none">
                Sentuh atau klik & geser mouse untuk menggambar...
              </div>
            )}
          </div>

          {/* Action options */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
            <button
              type="button"
              onClick={clearCanvas}
              className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Bersihkan</span>
            </button>

            {defaultStorageKey && (
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={saveAsDefault}
                  onChange={(e) => setSaveAsDefault(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span className="text-[11px]">Simpan sebagai paraf default profil</span>
              </label>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirmSave}
            disabled={!hasDrawn}
            className={`px-5 py-2 font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs ${
              hasDrawn
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Terapkan Paraf</span>
          </button>
        </div>
      </div>
    </div>
  )
}

