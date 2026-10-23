import React, { useState, useEffect, useRef } from 'react'
import {
  MessageSquare,
  Send,
  X,
  Clock,
  Lock,
  Sparkles,
  CheckCheck,
  Building,
} from 'lucide-react'
import {
  getLetters,
  getCurrentUser,
  addLetterComment,
  canUserAccessLetterChat,
  formatDateTimeId,
} from '../services/storage'
import { notify } from '../utils/alert'

export default function LetterChatModal({
  letterId,
  initialLetter,
  letter: letterProp,
  currentUser: propUser,
  onClose,
}) {
  const effectiveInitial = initialLetter || letterProp || null
  const effectiveId = letterId || effectiveInitial?.id
  const currentUser = propUser || getCurrentUser()
  const [letter, setLetter] = useState(effectiveInitial)
  const [comments, setComments] = useState(effectiveInitial?.comments || [])
  const [inputMessage, setInputMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  // Muat data surat dan pesan
  const loadData = () => {
    const letters = getLetters()
    const targetId = effectiveId || letter?.id
    const found = letters.find((l) => l.id === targetId)
    if (found) {
      setLetter(found)
      setComments(found.comments || [])
    } else if (effectiveInitial) {
      setLetter(effectiveInitial)
      setComments(effectiveInitial.comments || [])
    }
  }

  useEffect(() => {
    loadData()

    const targetId = effectiveId || effectiveInitial?.id
    const handleChatUpdate = (e) => {
      if (!e.detail || e.detail.letterId === targetId) {
        loadData()
      }
    }

    const handleLettersChange = () => {
      loadData()
    }

    window.addEventListener('letter_chat_updated', handleChatUpdate)
    window.addEventListener('letters_change', handleLettersChange)

    return () => {
      window.removeEventListener('letter_chat_updated', handleChatUpdate)
      window.removeEventListener('letters_change', handleLettersChange)
    }
  }, [effectiveId, effectiveInitial])

  // Scroll otomatis ke pesan terbawah saat komentar bertambah
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  // Cek otorisasi akses chat
  const hasAccess = letter && currentUser && canUserAccessLetterChat(letter, currentUser)

  const handleSendMessage = (e) => {
    if (e) e.preventDefault()
    if (!inputMessage.trim() || isSending) return

    if (!hasAccess) {
      notify.error('Akses ditolak: Hanya pihak terkait yang dapat mengirim pesan.')
      return
    }

    setIsSending(true)
    try {
      const result = addLetterComment(letter.id, inputMessage, currentUser)
      if (result) {
        setInputMessage('')
        loadData()
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'
        }
      } else {
        notify.error('Gagal mengirim pesan diskusi.')
      }
    } catch (err) {
      console.error('Error send comment:', err)
      notify.error('Terjadi kesalahan saat mengirim pesan.')
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Helper avatar warna & inisial
  const getAvatarGradient = (name = '') => {
    const gradients = [
      'from-blue-600 to-indigo-600',
      'from-teal-500 to-emerald-600',
      'from-purple-600 to-pink-600',
      'from-amber-500 to-orange-600',
      'from-cyan-600 to-blue-600',
      'from-rose-500 to-pink-600',
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return gradients[Math.abs(hash) % gradients.length]
  }

  const getInitials = (name = '') => {
    const parts = name.trim().split(/\s+/)
    if (parts.length === 0 || !parts[0]) return 'U'
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const quickChips = [
    'Siap diproses',
    'Mohon konfirmasi',
    'Dokumen sudah sesuai',
    'Catatan sudah diperbarui',
  ]

  if (!letter) return null

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-5 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl h-[88vh] max-h-[760px] flex flex-col shadow-2xl overflow-hidden border border-slate-200/80">
        
        {/* Header Modal Modern */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex justify-between items-center shrink-0 border-b border-slate-800 shadow-md">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/25 ring-2 ring-white/10">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg leading-tight truncate tracking-tight text-white">
                  Diskusi & Tanya Jawab Dokumen
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 shrink-0 shadow-xs">
                  {comments.length} Pesan
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-300 truncate">
                <span className="font-mono font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60 text-[11px]">
                  {letter.letterNumber || 'Nomor Surat'}
                </span>
                <span className="text-slate-400 hidden sm:inline">&bull;</span>
                <span className="truncate text-slate-300 font-medium text-[11px]">
                  {letter.title || letter.templateName}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition shrink-0 ml-2"
            title="Tutup Diskusi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subheader Banner Otorisasi & Identitas User */}
        <div className="bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 border-b border-slate-200/80 px-4 sm:px-5 py-2.5 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-700 text-[11px]">Ruang Diskusi Dokumen</span>
            <span className="text-slate-400 hidden sm:inline">&bull;</span>
            <span className="truncate text-slate-500 text-[11px] hidden sm:inline">
              Pihak pembuat, mengetahui, dan penyetuju
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-slate-500 hidden sm:inline">Login:</span>
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs">
              <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${getAvatarGradient(currentUser.name)} text-white flex items-center justify-center text-[9px] font-black`}>
                {getInitials(currentUser.name)}
              </div>
              <span className="font-bold text-slate-800 text-[11px] truncate max-w-[130px]">
                {currentUser.name}
              </span>
            </div>
          </div>
        </div>

        {/* Area Pesan Chat (Sleek Canvas) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-gradient-to-b from-slate-100/90 via-slate-50 to-slate-100">
          {!hasAccess ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-dashed border-red-200 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-800 mb-1">Akses Diskusi Terbatas</h4>
              <p className="text-xs text-slate-500 max-w-md">
                Anda tidak memiliki hak untuk melihat atau berpartisipasi dalam diskusi surat ini.
              </p>
            </div>
          ) : comments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-cyan-50 to-indigo-100 text-cyan-600 flex items-center justify-center shadow-inner border border-cyan-200/50">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">Belum Ada Pertanyaan / Diskusi</h4>
                <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                  Punya pertanyaan, butuh klarifikasi biaya, atau rincian tambahan tentang surat ini? Tulis pesan di bawah untuk berdiskusi langsung.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
                {quickChips.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setInputMessage(chip)}
                    className="text-[11px] px-3 py-1 rounded-full bg-white hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 border border-slate-200 shadow-2xs transition"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            comments.map((cmt) => {
              const isMe =
                cmt.senderId === currentUser.id ||
                cmt.senderName?.trim().toLowerCase() === currentUser.name?.trim().toLowerCase()
              const senderDisplayName = cmt.senderName || (isMe ? currentUser.name : 'Pengguna')
              const initials = getInitials(senderDisplayName)
              const gradient = getAvatarGradient(senderDisplayName)

              return (
                <div
                  key={cmt.id}
                  className={`flex items-start gap-2.5 sm:gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} max-w-[92%] sm:max-w-[80%] ${isMe ? 'ml-auto' : 'mr-auto'}`}
                >
                  {/* Avatar Lingkaran Modern */}
                  <div
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} text-white flex items-center justify-center text-[11px] font-black shrink-0 shadow-sm shadow-slate-300 ring-2 ring-white`}
                    title={senderDisplayName}
                  >
                    {initials}
                  </div>

                  {/* Konten Balon Obrolan */}
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} min-w-0`}>
                    {/* Header: Nama User Bersih Tanpa Jabatan */}
                    <span className="font-bold text-[11px] text-slate-700 mb-1 px-1 tracking-tight">
                      {senderDisplayName}
                    </span>

                    {/* Balon Pesan */}
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm break-words leading-relaxed transition-all ${
                        isMe
                          ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 text-white rounded-tr-xs shadow-md shadow-indigo-600/20'
                          : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs shadow-md shadow-slate-200/50'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{cmt.message}</p>
                    </div>

                    {/* Waktu Kirim */}
                    <div className={`flex items-center gap-1 mt-1 px-1 text-[10px] text-slate-400 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <Clock className="w-2.5 h-2.5 text-slate-400" />
                      <span>{formatDateTimeId(cmt.createdAt)}</span>
                      {isMe && <CheckCheck className="w-3 h-3 text-indigo-500 ml-0.5" />}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar Modern & Floating Chips */}
        {hasAccess && (
          <div className="p-3 sm:p-4 bg-white border-t border-slate-200/90 shrink-0 space-y-2">
            {/* Quick Response Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
              <span className="text-[10px] font-bold text-slate-400 shrink-0 flex items-center gap-1 pl-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Cepat:
              </span>
              {quickChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInputMessage((prev) => (prev ? `${prev} ${chip}` : chip))}
                  className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 border border-slate-200 whitespace-nowrap transition text-[11px] font-medium"
                >
                  {chip}
                </button>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ketik pertanyaan atau tanggapan... (Tekan Enter untuk kirim)"
                  rows={2}
                  className="w-full text-xs sm:text-sm p-3 bg-slate-50 border border-slate-300/90 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition shadow-inner font-sans text-slate-800 placeholder-slate-400"
                />
              </div>

              <button
                type="submit"
                disabled={!inputMessage.trim() || isSending}
                className="p-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-400 text-white rounded-2xl transition-all shadow-md shadow-indigo-600/25 flex items-center justify-center shrink-0 disabled:shadow-none disabled:cursor-not-allowed group active:scale-95"
                title="Kirim Pesan"
              >
                <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </form>

            <div className="flex justify-between items-center px-1 text-[10px] text-slate-400">
              <span>Tekan <strong>Enter</strong> untuk kirim &bull; <strong>Shift + Enter</strong> untuk baris baru</span>
              <span className="flex items-center gap-1 font-medium text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Tersimpan permanen di database
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
