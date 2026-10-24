import React, { useRef, useState, useEffect } from 'react'
import QRCode from 'qrcode'
import {
  Download,
  Printer,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Building2,
  ShieldCheck,
  Calendar,
  User,
  History,
  QrCode as QrIcon,
  CheckSquare,
  Square,
  Edit,
  Paperclip,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  X,
  Move,
  MessageSquare,
  Trash2,
  RotateCcw,
  FileText,
  Share2,
  Mail,
} from 'lucide-react'
import AttachmentUploader from './AttachmentUploader'
import { renderPdfToPages } from '../utils/pdfRenderer'
import {
  getBranches,
  getUsers,
  getCurrentUser,
  formatDateId,
  formatDateTimeId,
  formatRupiah,
  canUserAccessLetterChat,
  deleteLetter,
  updateLetterApprovalNotes,
  isSharedLetterRead,
  markSharedLetterRead,
  getSharedLetterInfo,
} from '../services/storage'
import { notify } from '../utils/alert'
import LetterChatModal from './LetterChatModal'
import ShareLetterModal from './ShareLetterModal'

export default function LetterDocumentView({
  letter,
  auditLogs = [],
  onPrint,
  onClose,
  onEdit,
  isBuilderPreview = false,
  hideTopBar = false,
  onUpdateImageLayout,
  onReadyToPrint,
}) {
  const currentUser = getCurrentUser()
  const documentRef = useRef(null)
  const [qrCodes, setQrCodes] = useState({})
  const [isExporting, setIsExporting] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)

  const branches = getBranches()
  const users = getUsers()
  const matchedUser = users.find(
    (u) => (letter?.userId && u.id === letter.userId) ||
           (letter?.userName && u.name.toLowerCase() === letter.userName.toLowerCase())
  )

  useEffect(() => {
    if (!isBuilderPreview && letter?.id && currentUser) {
      const shareInfo = getSharedLetterInfo(letter, currentUser)
      if (shareInfo && !isSharedLetterRead(letter, currentUser)) {
        markSharedLetterRead(letter.id, currentUser, true)
      }
    }
  }, [letter?.id, currentUser, isBuilderPreview])

  const currentBranch = branches.find(
    (b) => b.id === letter?.branchId || b.name === letter?.branchName || b.code === letter?.branchId
  ) || {}

  const attachments = letter?.attachments || letter?.fieldValues?.attachments || []
  const imageAttachments = attachments.filter((file) => {
    const isImgType = file.type?.startsWith('image/')
    const isImgExt = /\.(jpg|jpeg|png|webp|gif|svg|bmp)$/i.test(file.name || '')
    const isImgCat = file.category === 'image'
    const isImgData = typeof file.dataUrl === 'string' && file.dataUrl.startsWith('data:image/')
    const isImgUrl = typeof file.url === 'string' && /\.(jpg|jpeg|png|webp|gif|svg)/i.test(file.url)
    return isImgType || isImgExt || isImgCat || isImgData || isImgUrl
  })
  const pdfAttachments = attachments.filter((file) => {
    const isPdfType = file.type === 'application/pdf'
    const isPdfExt = /\.pdf$/i.test(file.name || '')
    const isPdfCat = file.category === 'pdf'
    const isPdfData = typeof file.dataUrl === 'string' && (file.dataUrl.startsWith('data:application/pdf') || file.dataUrl.includes('.pdf'))
    const isPdfUrl = typeof file.url === 'string' && file.url.toLowerCase().includes('.pdf')
    return isPdfType || isPdfExt || isPdfCat || isPdfData || isPdfUrl
  })

  // State untuk menyimpan hasil ekstraksi per-halaman setiap PDF attachment
  const [renderedPdfMap, setRenderedPdfMap] = useState({})
  const [isLoadingPdfs, setIsLoadingPdfs] = useState(false)

  useEffect(() => {
    if (pdfAttachments.length === 0) {
      setRenderedPdfMap({})
      setIsLoadingPdfs(false)
      if (typeof onReadyToPrint === 'function') {
        setTimeout(() => onReadyToPrint(), 150)
      }
      return
    }

    let isMounted = true
    setIsLoadingPdfs(true)

    const processPdfs = async () => {
      const newMap = {}
      for (let i = 0; i < pdfAttachments.length; i++) {
        const file = pdfAttachments[i]
        const key = file.id || file.name || `pdf-${i}`
        const primarySrc = file.url || file.dataUrl || file.data
        const secondarySrc = file.dataUrl && file.dataUrl !== primarySrc ? file.dataUrl : (file.url && file.url !== primarySrc ? file.url : null)

        let pages = []
        let lastError = null

        if (primarySrc) {
          try {
            pages = await renderPdfToPages(primarySrc, 1.6)
          } catch (err) {
            console.warn('Failed primary PDF render attempt:', file.name, err.message)
            lastError = err
          }
        }

        // Jika primary gagal, coba fallback secondary source (misal base64 di dataUrl jika server offline)
        if ((!pages || pages.length === 0) && secondarySrc) {
          try {
            pages = await renderPdfToPages(secondarySrc, 1.6)
          } catch (err) {
            console.warn('Failed secondary PDF render attempt:', file.name, err.message)
            lastError = err
          }
        }

        if (pages && pages.length > 0) {
          newMap[key] = pages
        } else {
          newMap[key] = [{ pageNumber: 1, totalPages: 1, error: true, errorMsg: lastError?.message || 'Dokumen PDF kosong atau tidak dapat diakses' }]
        }
      }
      if (isMounted) {
        setRenderedPdfMap(newMap)
        setIsLoadingPdfs(false)
        if (typeof onReadyToPrint === 'function') {
          setTimeout(() => onReadyToPrint(), 200)
        }
      }
    }

    processPdfs()
    return () => {
      isMounted = false
    }
  }, [letter?.attachments, letter?.fieldValues?.attachments])

  // Flat list semua lembar halaman PDF untuk dirender sebagai lembar A4 individu tanpa scroll
  const allPdfPagesList = []
  pdfAttachments.forEach((file, fileIdx) => {
    const key = file.id || file.name || `pdf-${fileIdx}`
    const pages = renderedPdfMap[key]
    if (pages && pages.length > 0) {
      pages.forEach((p) => {
        allPdfPagesList.push({
          file,
          fileIdx,
          key: `${key}-p${p.pageNumber}`,
          pageNumber: p.pageNumber,
          pdfTotalPages: p.totalPages,
          dataUrl: p.dataUrl,
          aspectRatio: p.aspectRatio,
          error: p.error,
          errorMsg: p.errorMsg,
        })
      })
    } else {
      allPdfPagesList.push({
        file,
        fileIdx,
        key: `${key}-single`,
        pageNumber: 1,
        pdfTotalPages: 1,
        fallbackSrc: file.dataUrl || file.data || file.url || '',
      })
    }
  })

  const hasImagePage = imageAttachments.length > 0
  const totalPages = 2 + (hasImagePage ? 1 : 0) + allPdfPagesList.length

  // Ambil konfigurasi layout gambar yang diatur dari Step 2 (Editor Surat)
  const savedLayout = letter?.imageLayout || letter?.fieldValues?.imageLayout || {}
  const imgCols = Number(savedLayout.columns) || (imageAttachments.length === 1 ? 1 : 2)
  const imgMaxHeight = Number(savedLayout.maxHeight) || 500

  // State Posisi Gambar Bebas (In Front of Text) & Ukuran Manual
  const [positions, setPositions] = useState(() => savedLayout.positions || {})
  const [sizes, setSizes] = useState(() => savedLayout.sizes || {})
  const [activeDragIdx, setActiveDragIdx] = useState(null)
  const [activeResizeIdx, setActiveResizeIdx] = useState(null)
  const cardRefs = useRef({})

  useEffect(() => {
    if (savedLayout.positions) {
      setPositions(savedLayout.positions)
    }
    if (savedLayout.sizes) {
      setSizes(savedLayout.sizes)
    }
  }, [savedLayout.positions, savedLayout.sizes])

  const lastClickRef = useRef({ time: 0, idx: null })

  // Handle Drag / Geser Posisi Gambar
  const handleStartDrag = (e, idx) => {
    if (e.target.closest('button') || e.target.closest('.resize-handle') || activeResizeIdx !== null) return
    e.preventDefault()

    const startX = e.clientX
    const startY = e.clientY
    const initialPos = positions[idx] || { x: 0, y: 0 }
    setActiveDragIdx(idx)

    let currentPos = initialPos
    let isDragged = false

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX
      const dy = moveEvent.clientY - startY
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        isDragged = true
      }
      currentPos = {
        x: Math.round(initialPos.x + dx),
        y: Math.round(initialPos.y + dy),
      }
      setPositions((prev) => ({
        ...prev,
        [idx]: currentPos,
      }))
    }

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      setActiveDragIdx(null)

      if (isDragged) {
        // Sedang digeser: simpan posisi dan jangan zoom
        lastClickRef.current = { time: 0, idx: null }
        if (onUpdateImageLayout) {
          onUpdateImageLayout({
            ...savedLayout,
            positions: {
              ...(savedLayout.positions || {}),
              [idx]: currentPos,
            },
            sizes: {
              ...(savedLayout.sizes || {}),
              ...sizes,
            },
          })
        }
      } else {
        // Tidak digeser: hanya perbesar saat double-klik, klik sekali tidak memperbesar
        const now = Date.now()
        if (
          lastClickRef.current.idx === idx &&
          now - lastClickRef.current.time < 350
        ) {
          handleOpenModal(idx)
          lastClickRef.current = { time: 0, idx: null }
        } else {
          lastClickRef.current = { time: now, idx }
        }
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  // Handle Resize Manual (Tarik sudut / tepi untuk mengecilkan atau memperbesar gambar)
  const handleStartResize = (e, idx, direction) => {
    e.stopPropagation()
    e.preventDefault()

    const cardEl = cardRefs.current[idx]
    if (!cardEl) return

    const startX = e.clientX
    const startY = e.clientY
    const rect = cardEl.getBoundingClientRect()
    const startWidth = rect.width
    const startHeight = rect.height
    const aspectRatio = startWidth / (startHeight || 1)

    setActiveResizeIdx(idx)
    let currentSize = sizes[idx] || { width: Math.round(startWidth), height: Math.round(startHeight) }

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX
      const dy = moveEvent.clientY - startY

      let newWidth = startWidth
      let newHeight = startHeight

      if (direction === 'se') {
        const scaleDelta = Math.max(dx, dy * aspectRatio)
        newWidth = Math.max(80, Math.min(720, Math.round(startWidth + scaleDelta)))
        newHeight = Math.max(50, Math.min(850, Math.round(newWidth / aspectRatio)))
      } else if (direction === 'sw') {
        const scaleDelta = Math.max(-dx, dy * aspectRatio)
        newWidth = Math.max(80, Math.min(720, Math.round(startWidth + scaleDelta)))
        newHeight = Math.max(50, Math.min(850, Math.round(newWidth / aspectRatio)))
      } else if (direction === 'ne') {
        const scaleDelta = Math.max(dx, -dy * aspectRatio)
        newWidth = Math.max(80, Math.min(720, Math.round(startWidth + scaleDelta)))
        newHeight = Math.max(50, Math.min(850, Math.round(newWidth / aspectRatio)))
      } else if (direction === 'nw') {
        const scaleDelta = Math.max(-dx, -dy * aspectRatio)
        newWidth = Math.max(80, Math.min(720, Math.round(startWidth + scaleDelta)))
        newHeight = Math.max(50, Math.min(850, Math.round(newWidth / aspectRatio)))
      } else if (direction === 'e') {
        newWidth = Math.max(80, Math.min(720, Math.round(startWidth + dx)))
        newHeight = Math.round(newWidth / aspectRatio)
      } else if (direction === 's') {
        newHeight = Math.max(50, Math.min(850, Math.round(startHeight + dy)))
        newWidth = Math.round(newHeight * aspectRatio)
      }

      currentSize = { width: newWidth, height: newHeight }
      setSizes((prev) => ({
        ...prev,
        [idx]: currentSize,
      }))
    }

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      setActiveResizeIdx(null)

      if (onUpdateImageLayout) {
        onUpdateImageLayout({
          ...savedLayout,
          sizes: {
            ...(savedLayout.sizes || {}),
            [idx]: currentSize,
          },
          positions: {
            ...(savedLayout.positions || {}),
            ...positions,
          },
        })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const handleResetPositions = () => {
    setPositions({})
    if (onUpdateImageLayout) {
      onUpdateImageLayout({
        ...savedLayout,
        positions: {},
      })
    }
  }

  const hasCustomPositions = Object.keys(positions).length > 0 && Object.values(positions).some((p) => p && (p.x !== 0 || p.y !== 0))

  const [activeModalIndex, setActiveModalIndex] = useState(null)
  const [modalZoom, setModalZoom] = useState(1)

  const handleOpenModal = (index) => {
    setActiveModalIndex(index)
    setModalZoom(1)
  }

  const handleCloseModal = () => {
    setActiveModalIndex(null)
    setModalZoom(1)
  }

  const handlePrevImage = (e) => {
    e?.stopPropagation()
    if (activeModalIndex > 0) {
      setActiveModalIndex(activeModalIndex - 1)
      setModalZoom(1)
    }
  }

  const handleNextImage = (e) => {
    e?.stopPropagation()
    if (activeModalIndex < imageAttachments.length - 1) {
      setActiveModalIndex(activeModalIndex + 1)
      setModalZoom(1)
    }
  }

  // Keyboard navigation untuk lightbox slidebar
  useEffect(() => {
    if (activeModalIndex === null) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleCloseModal()
      if (e.key === 'ArrowLeft') handlePrevImage()
      if (e.key === 'ArrowRight') handleNextImage()
      if (e.key === '+' || e.key === '=') setModalZoom((z) => Math.min(z + 0.25, 3))
      if (e.key === '-') setModalZoom((z) => Math.max(z - 0.25, 0.5))
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeModalIndex, imageAttachments.length])

  const decodeHtmlEntities = (str) => {
    if (!str) return ''
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
  }

  // Prioritas utama: Ambil teks perihal aktual dari konten surat Halaman 1 (agar persis sama)
  const extractPerihalFromContent = (content) => {
    if (!content) return ''
    // Cocokkan baris Perihal di dalam tabel surat
    const match = content.match(/Perihal\s*<\/strong>\s*<\/td>\s*<td[^>]*>\s*:\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/i) ||
                  content.match(/Perihal\s*<\/td>\s*<td[^>]*>\s*:\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/i) ||
                  content.match(/Perihal\s*:\s*([^<\n\r]+)/i)
    if (match && match[1]) {
      const clean = match[1].replace(/<[^>]*>/g, '').trim()
      if (clean) return clean
    }
    return ''
  }

  const contentHal = extractPerihalFromContent(letter?.content)
  const displayHal = decodeHtmlEntities(
    contentHal ||
    letter?.title?.replace(/\s*-\s*[^-]+$/, '').trim() ||
    letter?.templateName ||
    'Permohonan'
  )

  const getApproverDisplayName = (step) => {
    // 1. If already approved/rejected with recorded approver name
    if (step.approverName && !['RSM', 'RSM1', 'GM MARKETING', 'GM', 'Kepala Cabang'].includes(step.approverName.trim())) {
      return step.approverName
    }
    // 2. If specific user name is assigned in template step
    if (step.specificUserName) {
      return step.specificUserName
    }
    // 3. Match from specific user ID
    if (step.specificUserId) {
      const u = users.find((usr) => String(usr.id) === String(step.specificUserId))
      if (u) return u.name
    }
    // 4. Match based on role / kodeJabatan
    const roleUpper = (step.approverRole || step.title || '').toUpperCase()
    if (step.kodeJabatan === 'J03' || roleUpper.includes('RSM') || roleUpper.includes('REGIONAL SALES')) {
      const rsmUser = users.find((usr) => usr.kodeJabatan === 'J03' || usr.position?.toUpperCase().includes('REGIONAL SALES MANAGER'))
      if (rsmUser) return rsmUser.name
    }
    if (step.kodeJabatan === 'J02' || roleUpper.includes('GM') || roleUpper.includes('GENERAL MANAGER')) {
      const gmUser = users.find((usr) => (usr.kodeJabatan === 'J02' || usr.position?.toUpperCase().includes('GENERAL MANAGER')) && usr.name?.toLowerCase().includes('herdy')) ||
                     users.find((usr) => usr.kodeJabatan === 'J02' || usr.position?.toUpperCase().includes('GENERAL MANAGER'))
      if (gmUser) return gmUser.name
    }
    if (step.kodeJabatan === 'J01' || roleUpper.includes('DIREKTUR')) {
      const dirUser = users.find((usr) => usr.kodeJabatan === 'J01' || usr.position?.toUpperCase().includes('DIREKTUR'))
      if (dirUser) return dirUser.name
    }
    // Fallback to existing name or role title
    return step.approverRole || step.title || 'Pejabat Terkait'
  }

  const canUserEditStepNote = (step) => {
    if (!step || !currentUser) return false
    if (currentUser.role === 'admin_pusat') return true
    const uid = String(currentUser.id || '')
    const uName = (currentUser.name || '').trim().toLowerCase()
    if (step.specificUserId && String(step.specificUserId) === uid) return true
    if (step.specificUserName && step.specificUserName.trim().toLowerCase() === uName) return true
    if (step.approverName && step.approverName.trim().toLowerCase() === uName) return true
    if (step.kodeJabatan && currentUser.kodeJabatan && step.kodeJabatan === currentUser.kodeJabatan) return true
    if (step.approverRole && currentUser.position && currentUser.position.toLowerCase().includes(step.approverRole.toLowerCase())) return true
    if (currentUser.role === 'approver' && step.step === currentUser.approvalLevel) return true
    return false
  }

  const handleEditStepNote = (stepIdx, existingNotes) => {
    const newNote = window.prompt('Tulis / perbarui catatan persetujuan Anda:', existingNotes || '')
    if (newNote === null) return
    const updated = updateLetterApprovalNotes(letter.id, stepIdx, newNote.trim())
    if (updated) {
      notify.success('Catatan Diperbarui', 'Catatan persetujuan berhasil diperbarui pada dokumen.')
    }
  }

  // Tentukan Pejabat Pembuat (Kiri) dan Mengetahui (Kanan):
  // 1. Tentukan pembuat (Dibuat oleh - Kiri)
  const submitterName =
    letter?.userName ||
    currentBranch.madeBy ||
    'Anif Ardiana'

  const submitterPosition =
    letter?.userPosition ||
    letter?.fieldValues?.jabatan ||
    (matchedUser?.position ? matchedUser.position : currentBranch.madeByPosition) ||
    'Operation Manager (OM)'

  // 2. Tentukan apakah surat menyertakan pihak Mengetahui & siapa pejabatnya
  const isPSTBranch =
    letter?.branchId === 'PST' ||
    (letter?.branchName && letter.branchName.toLowerCase().includes('pusat'))

  let hasKnownBy = true
  if (letter?.includeKnownBy !== undefined) {
    hasKnownBy = Boolean(letter.includeKnownBy)
  } else if (letter?.fieldValues?.includeKnownBy !== undefined) {
    hasKnownBy = Boolean(letter.fieldValues.includeKnownBy)
  } else if (isPSTBranch && !letter?.knownByName && !letter?.fieldValues?.knownByName) {
    // Pengajuan kantor pusat lama tanpa settingan kustom
    hasKnownBy = false
  }

  // PRIORITAS UTAMA: Nilai kustom surat -> Rekanan Manager di Cabang (dari tabel users database)
  const branchUsersList = users.filter(
    (u) =>
      u.name &&
      u.name.trim().toLowerCase() !== submitterName.trim().toLowerCase() &&
      ((u.branchId && (u.branchId === letter?.branchId || u.branchId === currentBranch.code || u.branchId === currentBranch.id)) ||
      (u.branchName && letter?.branchName && u.branchName.toLowerCase().includes(letter.branchName.toLowerCase().replace('cabang ', ''))))
  )

  // Cek apakah nama dari letter/currentBranch ada di database users
  const rawCandidateName = (letter?.knownByName || letter?.fieldValues?.knownByName || '').trim()
  const candidateUser = users.find((u) => u.name && u.name.trim().toLowerCase() === rawCandidateName.toLowerCase())

  let effectiveKnownByName = candidateUser ? candidateUser.name : ''
  let effectiveKnownByPosition = candidateUser ? (candidateUser.position || candidateUser.roleLabel || 'Manager Cabang') : (letter?.knownByPosition || letter?.fieldValues?.knownByPosition || '')

  // Jika settingan knownBy sama dengan submitter atau belum disetting, gunakan rekanan manager cabang yang bukan pemohon
  if (!effectiveKnownByName || effectiveKnownByName.trim().toLowerCase() === submitterName.trim().toLowerCase()) {
    const isSubmitterOM =
      /operation\s*manager|\bOM\b/i.test(submitterPosition) ||
      matchedUser?.kodeJabatan === 'J08'

    const branchUsers = users.filter(
      (u) =>
        (u.name && u.name.trim().toLowerCase() !== submitterName.trim().toLowerCase()) &&
        ((u.branchId && (u.branchId === letter?.branchId || u.branchId === currentBranch.code || u.branchId === currentBranch.id)) ||
        (u.branchName && letter?.branchName && u.branchName.toLowerCase().includes(letter.branchName.toLowerCase().replace('cabang ', ''))))
    )

    if (isSubmitterOM) {
      const branchSMMUser = branchUsersList.find((u) => u.kodeJabatan === 'J07' || /sales\s*marketing|\bSMM\b/i.test(u.position || ''))
      if (branchSMMUser) {
        effectiveKnownByName = branchSMMUser.name
        effectiveKnownByPosition = branchSMMUser.position || 'Sales Marketing Manager (SMM)'
      }
    } else {
      const branchOMUser = branchUsersList.find((u) => u.kodeJabatan === 'J08' || /operation\s*manager|\bOM\b/i.test(u.position || ''))
      if (branchOMUser) {
        effectiveKnownByName = branchOMUser.name
        effectiveKnownByPosition = branchOMUser.position || 'Operation Manager (OM)'
      }
    }
  }

  // Jika tetap sama dengan pemohon atau kosong, cari manager lain di cabang tersebut dari database
  if (!effectiveKnownByName || effectiveKnownByName.trim().toLowerCase() === submitterName.trim().toLowerCase()) {
    const otherManager = branchUsersList.find(
      (u) =>
        (u.position?.toLowerCase().includes('manager') || ['J05', 'J07', 'J08'].includes(u.kodeJabatan))
    )
    if (otherManager) {
      effectiveKnownByName = otherManager.name
      effectiveKnownByPosition = otherManager.position || 'Manager Cabang'
    } else {
      effectiveKnownByName = isPSTBranch ? 'Pimpinan Divisi Terkait' : ''
      effectiveKnownByPosition = isPSTBranch ? 'Manajer Terkait' : ''
    }
  }

  // Status & waktu persetujuan untuk Mengetahui (Kanan)
  const matchedKnownByStep = letter?.approvalHistory?.find(
    (st) =>
      st.status === 'approved' &&
      (
        (st.approverName && st.approverName.toLowerCase().includes(effectiveKnownByName.toLowerCase())) ||
        (effectiveKnownByPosition && st.approverRole && (
          st.approverRole.toLowerCase().includes(effectiveKnownByPosition.toLowerCase()) ||
          effectiveKnownByPosition.toLowerCase().includes(st.approverRole.toLowerCase())
        ))
      )
  )

  const isKnownByApproved = Boolean(
    letter?.knownByApproved ||
    letter?.knownByStatus === 'approved' ||
    letter?.status === 'approved' ||
    matchedKnownByStep
  )
  const knownByTime = letter?.knownByApprovedAt || matchedKnownByStep?.date || letter?.updatedAt || new Date()

  // Helper: Embed logo in center of QR Code using HTML5 Canvas & ErrorCorrectionLevel 'H'
  const generateQrWithLogo = (text) => {
    return new Promise((resolve) => {
      // Buat canvas QR Code dengan resolusi tajam 480px, margin 1, dan error correction 'H' (30% recovery)
      const canvas = document.createElement('canvas')
      QRCode.toCanvas(
        canvas,
        text,
        {
          errorCorrectionLevel: 'H',
          margin: 1,
          width: 480,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) {
            console.warn('QR Canvas error:', error)
            resolve('')
            return
          }

          const ctx = canvas.getContext('2d')
          const size = canvas.width // 480
          // Ukuran logo 15% dari lebar QR (~72px). Sangat aman untuk Level H (toleransi rusak 30%)
          // dan tidak memotong modul timing/pola deteksi QR sehingga scanner HP sangat cepat membaca
          const logoSize = Math.floor(size * 0.15) // ~72px
          const logoX = (size - logoSize) / 2
          const logoY = (size - logoSize) / 2

          // Load image Logo.jpeg from /Logo.jpeg (public)
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => {
            // 1. Gambar latar belakang putih bersih di sekitar logo (quiet zone)
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(logoX - 3, logoY - 3, logoSize + 6, logoSize + 6)

            // 2. Gambar rounded rectangle / border lembut
            ctx.save()
            const radius = 5
            const x = logoX
            const y = logoY
            const w = logoSize
            const h = logoSize
            ctx.beginPath()
            ctx.moveTo(x + radius, y)
            ctx.lineTo(x + w - radius, y)
            ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
            ctx.lineTo(x + w, y + h - radius)
            ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
            ctx.lineTo(x + radius, y + h)
            ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
            ctx.lineTo(x, y + radius)
            ctx.quadraticCurveTo(x, y, x + radius, y)
            ctx.closePath()
            ctx.clip()

            // 3. Render gambar Logo.jpeg
            ctx.drawImage(img, logoX, logoY, logoSize, logoSize)
            ctx.restore()

            resolve(canvas.toDataURL('image/png'))
          }

          img.onerror = () => {
            // Fallback jika logo gagal dimuat (tetap buat QR murni agar bisa discan 100%)
            resolve(canvas.toDataURL('image/png'))
          }

          img.src = '/Logo.jpeg'
        }
      )
    })
  }

  // Generate QR Codes for verified steps with high readability & embedded logo
  useEffect(() => {
    if (!letter) return

    const generateQrs = async () => {
      const qrs = {}
      if (letter.approvalHistory) {
        for (let i = 0; i < letter.approvalHistory.length; i++) {
          const step = letter.approvalHistory[i]
          if (step.status === 'approved') {
            const verificationPayload = [
              `Nomor Surat: ${letter.letterNumber || '-'}`,
              `Waktu Persetujuan: ${formatDateTimeId(step.date || new Date())}`,
              `Orang: ${step.approverName || 'Pejabat Berwenang'}`,
            ].join('\n')

            try {
              const url = await generateQrWithLogo(verificationPayload)
              qrs[`step_${i}`] = url
            } catch (err) {
              console.warn('QR Code generation error:', err)
            }
          }
        }
      }

      // Generate submitter verification QR (Dibuat Oleh)
      try {
        const submitterPayload = [
          `Nomor Surat: ${letter.letterNumber || '-'}`,
          `Waktu Persetujuan: ${formatDateTimeId(letter.createdAt || new Date())}`,
          `Orang: ${submitterName}`,
        ].join('\n')

        const submitterUrl = await generateQrWithLogo(submitterPayload)
        qrs['submitter'] = submitterUrl
      } catch (err) {
        console.warn('Submitter QR error:', err)
      }

      // Mengetahui QR (Kanan) HANYA dibuat dan tampil jika hasKnownBy aktif dan setelah surat disetujui
      if (hasKnownBy && isKnownByApproved) {
        try {
          const knownByPayload = [
            `Nomor Surat: ${letter.letterNumber || '-'}`,
            `Waktu Persetujuan: ${formatDateTimeId(knownByTime)}`,
            `Orang: ${effectiveKnownByName}`,
          ].join('\n')

          const knownByUrl = await generateQrWithLogo(knownByPayload)
          qrs['knownBy'] = knownByUrl
        } catch (err) {
          console.warn('KnownBy QR error:', err)
        }
      }

      setQrCodes(qrs)
    }

    generateQrs()
  }, [letter, effectiveKnownByName, effectiveKnownByPosition, submitterName, submitterPosition, isKnownByApproved, knownByTime, hasKnownBy])

  const handleExportPdf = async () => {
    if (!documentRef.current) return
    setIsExporting(true)
    try {
      // Dynamic import html2pdf
      const html2pdf = (await import('html2pdf.js')).default
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `${(letter.letterNumber || 'Surat_Ajuan').replace(/\//g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
      }
      await html2pdf().from(documentRef.current).set(opt).save()
    } catch (err) {
      console.error('PDF export error, falling back to window.print():', err)
      window.print()
    } finally {
      setIsExporting(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> Disetujui Penuh
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5" /> Menunggu Persetujuan
          </span>
        )
      case 'revision':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-300">
            <AlertTriangle className="w-3.5 h-3.5" /> Perlu Revisi
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5" /> Ditolak
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            Draf
          </span>
        )
    }
  }

  return (
    <div className="flex flex-col space-y-4">
      {/* Top Action Bar (Hanya tampil saat preview modal arsip/inbox, disembunyikan saat di tahap peninjauan builder atau di mobile) */}
      {!isBuilderPreview && !hideTopBar && (
        <div className="no-print bg-slate-800 text-white p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-700 rounded-lg text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base leading-tight">
                {letter.letterNumber}
              </h3>
              <p className="text-xs text-slate-300">
                {letter.templateName} &bull; {letter.branchName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {getStatusBadge(letter.status)}

            {/* Tombol Bagikan Surat */}
            {letter.status !== 'draft' && (() => {
              const currentUid = String(currentUser?.id || '')
              const currentName = (currentUser?.name || currentUser?.username || '').trim().toLowerCase()
              const mySharedCount = (letter.sharedWith || []).filter((s) => {
                if (s.sharedById && String(s.sharedById) === currentUid) return true
                if (s.sharedBy && (s.sharedBy || '').trim().toLowerCase() === currentName) return true
                return false
              }).length

              return (
                <button
                  type="button"
                  onClick={() => setIsShareOpen(true)}
                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-xs active:scale-95"
                  title="Bagikan surat ke pengguna lain"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Bagikan</span>
                  {mySharedCount > 0 && (
                    <span className="bg-violet-900 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {mySharedCount}
                    </span>
                  )}
                </button>
              )
            })()}

            {/* Tombol Hapus Draft */}
            {letter.status === 'draft' && (
              <button
                onClick={async () => {
                  const confirmed = await notify.confirm({
                    title: 'Hapus Draf Surat?',
                    text: `Apakah Anda yakin ingin menghapus draf ${letter.letterNumber || letter.title}? Tindakan ini tidak dapat dibatalkan.`,
                    confirmText: 'Ya, Hapus Draf',
                    cancelText: 'Batal',
                    confirmColor: '#dc2626',
                    icon: 'warning',
                  })
                  if (!confirmed) return
                  const ok = deleteLetter(letter.id)
                  if (ok) {
                    notify.success('Draf Dihapus', 'Draf surat berhasil dihapus.')
                    if (onClose) onClose()
                  } else {
                    notify.error('Gagal', 'Gagal menghapus draf.')
                  }
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition shadow-xs"
                title="Hapus draf surat"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hapus Draf</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Banner Khusus jika surat ini dibagikan ke pengguna yang sedang login (seperti email masuk) */}
      {!isBuilderPreview && letter.sharedWith && letter.sharedWith.some((s) => String(s.userId || s.id) === String(currentUser?.id)) && (() => {
        const shareInfo = letter.sharedWith.find((s) => String(s.userId || s.id) === String(currentUser?.id))
        const isRead = isSharedLetterRead(letter, currentUser)
        return (
          <div className="no-print bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 border border-violet-500/40 text-white rounded-xl p-3.5 sm:p-4 shadow-md flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600/30 border border-violet-400/40 flex items-center justify-center text-violet-300 shrink-0">
              <Mail className="w-5 h-5 text-violet-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-violet-200">
                    Surat Dibagikan Kepada Anda
                  </p>
                  {isRead ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ✓ Sudah Dibaca
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-2xs">
                      Baru
                    </span>
                  )}
                </div>
                {shareInfo?.sharedAt && (
                  <span className="text-[10px] text-violet-300/80 font-mono">
                    {formatDateTimeId(shareInfo.sharedAt)}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-200 mt-0.5">
                Pengirim: <span className="font-bold text-white">{shareInfo?.sharedBy || 'Pengguna'}</span>
              </p>
              {shareInfo?.note ? (
                <div className="mt-2 p-2.5 bg-black/30 border border-violet-500/30 rounded-lg text-xs text-violet-100 italic leading-relaxed">
                  "{shareInfo.note}"
                </div>
              ) : (
                <p className="text-[11px] text-violet-200/70 mt-1 italic">
                  Tidak ada pesan pengantar khusus. Anda memiliki hak akses untuk membaca dan berdiskusi pada dokumen ini.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                const nextRead = !isRead
                markSharedLetterRead(letter.id, currentUser, nextRead)
                notify.success('Status Diperbarui', nextRead ? 'Surat ditandai sudah dibaca' : 'Surat ditandai belum dibaca')
              }}
              className="text-[11px] text-violet-200 hover:text-white bg-violet-800/40 hover:bg-violet-700/60 border border-violet-500/40 px-2.5 py-1 rounded-lg transition font-medium shrink-0 self-center sm:self-auto"
              title={isRead ? 'Tandai sebagai belum dibaca' : 'Tandai sebagai sudah dibaca'}
            >
              {isRead ? 'Tandai Belum Dibaca' : 'Tandai Sudah Dibaca'}
            </button>
          </div>
        )
      })()}

      {/* Official Indonesian Letter Document Container (Standard A4 Format) */}
      <div className="bg-slate-200/80 p-2 sm:p-6 rounded-xl flex justify-center overflow-x-auto print:p-0 print:m-0 print:bg-white print:overflow-visible print:rounded-none print:border-none print:shadow-none">
        <div ref={documentRef} className="w-full max-w-[794px] space-y-8 flex flex-col items-center print:max-w-none print:space-y-0 print:w-full">
          {/* ==================== HALAMAN 1: SURAT PERMOHONAN ==================== */}
          <div
            className="page-sheet a4-page bg-white w-full max-w-[794px] p-8 sm:p-12 shadow-lg rounded-sm border border-slate-300 text-slate-900 leading-normal min-h-[1123px] flex flex-col justify-between relative overflow-hidden"
            style={{ fontFamily: "Tahoma, Arial, sans-serif", fontSize: "11pt" }}
          >
            {/* Watermark Logo Perusahaan */}
            <div className="page-watermark" aria-hidden="true" />

            <div className="relative z-10">
              {/* KOP SURAT RESMI PERUSAHAAN (SESUAI CABANG & PT) */}
              <div className="pb-2 mb-6">
                <div className="flex items-center gap-4">
                  <img
                    src="/Logo.jpeg"
                    alt="Logo"
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0"
                  />
                  <div className="text-center flex-1">
                    <h1 className="text-lg sm:text-2xl font-extrabold uppercase tracking-wide text-slate-950 m-0">
                      {currentBranch?.pt ||
                        (letter.branchName?.includes('Banten')
                          ? 'PT. BANTEN MAJU JAYA'
                          : 'CV Makmur Permata')}
                    </h1>
                    {(() => {
                      const rawAddr = currentBranch?.address || 'Jl Raya Banten Lingkungan Kelanggaran Kel Unyur Kec Serang Kota Serang Banten'
                      // Pisahkan: kata Kota / Kab ke sana nya pindah ke baris bawah
                      let parts
                      if (rawAddr.includes('Kota ')) {
                        parts = [rawAddr.split('Kota ')[0].trim(), 'Kota ' + rawAddr.split('Kota ').slice(1).join('Kota ')]
                      } else if (rawAddr.includes('Kab ')) {
                        parts = [rawAddr.split('Kab ')[0].trim(), 'Kab ' + rawAddr.split('Kab ').slice(1).join('Kab ')]
                      } else if (rawAddr.includes('Kab. ')) {
                        parts = [rawAddr.split('Kab. ')[0].trim(), 'Kab. ' + rawAddr.split('Kab. ').slice(1).join('Kab. ')]
                      } else if (rawAddr.includes('Kec ')) {
                        parts = [rawAddr.split('Kec ')[0].trim(), 'Kec ' + rawAddr.split('Kec ').slice(1).join('Kec ')]
                      } else {
                        parts = [rawAddr.slice(0, Math.ceil(rawAddr.length / 2)), rawAddr.slice(Math.ceil(rawAddr.length / 2))]
                      }

                      return (
                        <p className="text-xs sm:text-sm text-slate-700 mt-1 leading-snug">
                          <span>{parts[0]}</span>
                          {parts[1] && (
                            <>
                              <br />
                              <span>{parts[1]}</span>
                            </>
                          )}
                        </p>
                      )
                    })()}
                  </div>
                </div>
                {/* Single Border Line Pembatas Kop Surat */}
                <div className="border-t-2 border-slate-900 mt-3"></div>
              </div>

              {/* ISI SURAT DARI EDITOR */}
              <div
                className="prose prose-slate max-w-none text-[12px] leading-normal mb-8"
                style={{ fontFamily: "Tahoma, Arial, sans-serif", fontSize: "12px" }}
                dangerouslySetInnerHTML={{ __html: letter.content }}
              />
            </div>

            {/* BAGIAN TANDA TANGAN CABANG: DIBUAT (KIRI) & MENGETAHUI (KANAN) */}
            <div className="mt-8 pt-4">
              {/* Baris Tanggal Cabang di Paling Kanan (Text Right) */}
              <div className="w-full text-right mb-3 pr-2 sm:pr-4">
                <p className="text-xs font-semibold text-slate-700">
                  {letter.branchName?.replace('Cabang ', '') || 'Kantor Cabang'}, {formatDateId(letter.createdAt || new Date())}
                </p>
              </div>

              {/* Grid Kolom Tanda Tangan: 2 Kolom (Dibuat & Mengetahui) atau 1 Kolom Tunggal (Dibuat saja) */}
              <div className={`${hasKnownBy ? 'grid grid-cols-2 gap-8 text-center max-w-xl mx-auto' : 'flex justify-end text-center pr-6 sm:pr-10'}`}>
                {/* KIRI: DIAJUKAN / DIBUAT OLEH (PEMOHON) */}
                <div className={`flex flex-col items-center justify-between min-h-[135px] ${!hasKnownBy ? 'w-56 sm:w-64' : ''}`}>
                  <div className="h-5 flex items-center justify-center">
                    <p className="text-xs font-bold text-slate-900 leading-none">
                      {hasKnownBy ? 'Dibuat oleh,' : 'Hormat kami,'}
                    </p>
                  </div>

                  <div className="w-22 h-22 sm:w-24 sm:h-24 p-1 bg-white border border-slate-300 rounded-md shadow-xs flex items-center justify-center my-1 print:border-none print:p-0">
                    {qrCodes['submitter'] ? (
                      <img
                        src={qrCodes['submitter']}
                        alt="QR Dibuat"
                        className="w-full h-full object-contain [image-rendering:crisp-edges]"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                        <QrIcon className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                  </div>

                  <div className="mt-1.5 text-center text-[11px] leading-snug text-slate-900">
                    <p className="font-bold text-slate-950 underline decoration-slate-900 underline-offset-2">{submitterName}</p>
                    <p className="text-[10px] text-slate-600 font-medium mt-0.5">{submitterPosition || 'Pemohon'}</p>
                  </div>
                </div>

                {/* KANAN: DIKETAHUI / MENGETAHUI (Hanya jika hasKnownBy aktif) */}
                {hasKnownBy && (
                  <div className="flex flex-col items-center justify-between min-h-[135px]">
                    <div className="h-5 flex items-center justify-center">
                      <p className="text-xs font-bold text-slate-900 leading-none">Mengetahui,</p>
                    </div>

                    <div className="relative w-22 h-22 sm:w-24 sm:h-24 p-1 flex items-center justify-center my-1 print:p-0">
                      {qrCodes['knownBy'] ? (
                        <div className="w-full h-full p-0.5 bg-white border border-slate-300 rounded-md shadow-xs flex items-center justify-center print:border-none print:p-0">
                          <img
                            src={qrCodes['knownBy']}
                            alt="QR Mengetahui"
                            className="w-full h-full object-contain [image-rendering:crisp-edges]"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full border border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 p-2">
                          <span className={`text-[11px] text-center italic leading-tight font-medium ${
                            (letter?.knownByStatus === 'revision' || letter?.fieldValues?.knownByStatus === 'revision')
                              ? 'text-orange-600 font-bold'
                              : (letter?.knownByStatus === 'rejected' || letter?.fieldValues?.knownByStatus === 'rejected')
                              ? 'text-rose-600 font-bold'
                              : 'text-slate-400'
                          }`}>
                            {(letter?.knownByStatus === 'revision' || letter?.fieldValues?.knownByStatus === 'revision')
                              ? '(Perlu Revisi)'
                              : (letter?.knownByStatus === 'rejected' || letter?.fieldValues?.knownByStatus === 'rejected')
                              ? '(Ditolak)'
                              : '(Menunggu Persetujuan)'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-1.5 text-center text-[11px] leading-snug text-slate-900">
                      <p className="font-bold text-slate-950 underline decoration-slate-900 underline-offset-2">{effectiveKnownByName}</p>
                      <p className="text-[10px] text-slate-600 font-medium mt-0.5">{effectiveKnownByPosition || 'Mengetahui'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* TEMBUSAN / HAK AKSES MELIHAT - hidden per request */}
              {/* Footer Halaman 1 */}
              <div className="mt-8 pt-3 border-t border-slate-200 flex flex-wrap justify-between items-center text-[10px] text-slate-400 select-none">
                <span>Sistem Surat Ajuan Online &bull; Dicetak pada: {formatDateId(new Date())}</span>
                <span className="font-mono">Dokumen Utama &bull; Halaman 1 dari {totalPages}</span>
              </div>
            </div>
          </div>

          {/* PAGE BREAK (UNTUK PRINT & PDF) */}
          <div className="html2pdf__page-break" style={{ pageBreakBefore: 'always', breakBefore: 'page' }}></div>

          {/* Visual Separator in Web View */}
          <div className="no-print my-1 flex items-center justify-center w-full">
            <div className="bg-indigo-100 text-indigo-800 text-xs font-bold px-4 py-1.5 rounded-full shadow-xs flex items-center gap-2 border border-indigo-200">
              <span>Halaman 2: Lembar Persetujuan & Disposisi Pejabat</span>
            </div>
          </div>

          {/* ==================== HALAMAN 2: LEMBAR PERSETUJUAN ==================== */}
          <div
            className="page-sheet a4-page bg-white w-full max-w-[794px] p-8 sm:p-12 shadow-lg rounded-sm border border-slate-300 text-slate-900 leading-normal min-h-[1123px] flex flex-col justify-between relative overflow-hidden"
            style={{ fontFamily: "Tahoma, Arial, sans-serif", fontSize: "11pt" }}
          >
            {/* Watermark Logo Perusahaan */}
            <div className="page-watermark" aria-hidden="true" />

            <div className="relative z-10">
              {/* JUDUL HALAMAN 2 */}
              <div className="text-center mb-6">
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-950">
                  LEMBAR PERSETUJUAN
                </h2>
              </div>

              {/* METADATA SURAT (No & Hal) SESUAI FOTO USER */}
              <div className="space-y-1.5 mb-6 text-xs sm:text-sm font-semibold">
                <div className="flex">
                  <span className="w-20 text-slate-700">No.</span>
                  <span className="w-4">:</span>
                  <span className="font-mono font-bold text-slate-900">{letter.letterNumber}</span>
                </div>
                <div className="flex items-start">
                  <span className="w-20 text-slate-700 shrink-0">Hal</span>
                  <span className="w-4 shrink-0">:</span>
                  <span className="font-bold text-slate-900">{displayHal}</span>
                </div>
              </div>

              {/* TABEL PERSETUJUAN (SESUAI FOTO 2) */}
              <div className="border border-slate-900 rounded-xs overflow-hidden">
                <table className="w-full border-collapse text-xs">
                  <tbody>
                    {letter.approvalHistory &&
                      letter.approvalHistory.map((step, idx) => {
                        const originalIndex = idx
                        const isApproved = step.status === 'approved'
                        const isRejected = step.status === 'rejected'
                        const isPending = step.status === 'pending'
                        const isRevision = step.status === 'revision'

                        return (
                          <tr key={idx} className="border-b border-slate-900 last:border-b-0">
                            {/* KOLOM 1: KOTAK TANDA TANGAN PEJABAT */}
                            <td className="w-[34%] border-r border-slate-900 p-3 text-center align-bottom min-h-[125px]">
                              <div className="flex flex-col items-center justify-between min-h-[115px]">
                                {/* QR Code Tanda Tangan */}
                                <div className="flex-1 flex items-center justify-center my-1">
                                  {isApproved ? (
                                    <div className="w-22 h-22 sm:w-24 sm:h-24 p-1 bg-white border border-slate-300 rounded shadow-xs flex items-center justify-center print:border-none print:p-0">
                                      {qrCodes[`step_${originalIndex >= 0 ? originalIndex : idx}`] ? (
                                        <img
                                          src={qrCodes[`step_${originalIndex >= 0 ? originalIndex : idx}`]}
                                          alt="QR Persetujuan"
                                          className="w-full h-full object-contain [image-rendering:crisp-edges]"
                                        />
                                      ) : (
                                        <QrIcon className="w-6 h-6 text-slate-400" />
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-[11px] text-slate-400 italic">
                                      {isPending
                                        ? '(Menunggu Tanda Tangan)'
                                        : isRevision
                                        ? '(Perlu Revisi)'
                                        : '(Ditolak)'}
                                    </div>
                                  )}
                                </div>

                                <div className="mt-1.5 w-full text-center text-[11px] leading-snug text-slate-900">
                                  <p className="font-bold text-slate-950 underline decoration-slate-900 underline-offset-2">{getApproverDisplayName(step)}</p>
                                  <p className="text-[10px] text-slate-600 font-medium mt-0.5">{step.approverRole || step.title || 'Pejabat Menyetujui'}</p>
                                </div>
                              </div>
                            </td>

                            {/* KOLOM 2: CHECKLIST SETUJU / TIDAK SETUJU */}
                            <td className="w-[28%] border-r border-slate-900 p-4 align-top">
                              <div className="space-y-4 pt-3 text-xs select-none">
                                <label className="flex items-center gap-2 cursor-default">
                                  <span
                                    className={`w-4 h-4 border border-slate-900 rounded-xs flex items-center justify-center text-xs font-black ${
                                      isApproved
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-white text-transparent'
                                    }`}
                                  >
                                    ✓
                                  </span>
                                  <span className="font-bold text-slate-900 text-sm">Setuju</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-default">
                                  <span
                                    className={`w-4 h-4 border border-slate-900 rounded-xs flex items-center justify-center text-xs font-black ${
                                      isRejected
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-white text-transparent'
                                    }`}
                                  >
                                    ✓
                                  </span>
                                  <span className="font-bold text-slate-900 text-sm">Tidak setuju</span>
                                </label>
                              </div>
                            </td>

                            {/* KOLOM 3: KOLOM CATATAN */}
                            <td className="w-[40%] p-4 align-top">
                              <div className="h-full min-h-[140px] flex flex-col justify-start">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
                                    Catatan:
                                  </span>
                                  {canUserEditStepNote(step) && (
                                    <button
                                      type="button"
                                      onClick={() => handleEditStepNote(idx, step.notes)}
                                      className="no-print text-[11px] text-blue-600 hover:text-blue-800 font-bold hover:underline flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition"
                                      title="Ubah atau tambahkan catatan persetujuan Anda"
                                    >
                                      ✎ Ubah Catatan
                                    </button>
                                  )}
                                </div>
                                <p className="text-xs text-slate-800 italic leading-relaxed whitespace-pre-wrap">
                                  {step.notes ? `"${step.notes}"` : ''}
                                </p>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Watermark info */}
            <div className="mt-8 pt-3 border-t border-slate-200 flex flex-wrap justify-between items-center text-[10px] text-slate-400 select-none">
              <span>Sistem Surat Ajuan Online &bull; Dicetak pada: {formatDateId(new Date())}</span>
              <span className="font-mono">Lembar Persetujuan &bull; Halaman 2 dari {totalPages}</span>
            </div>
          </div>

          {/* ==================== HALAMAN 3: LAMPIRAN FOTO / NOTA / BERKAS DOKUMEN ==================== */}
          {(imageAttachments.length > 0 || attachments.length > 0) && (
            <>
              {/* PAGE BREAK (UNTUK PRINT & PDF) */}
              <div className="html2pdf__page-break" style={{ pageBreakBefore: 'always', breakBefore: 'page' }}></div>

              {/* Visual Separator in Web View */}
              <div className="no-print my-1 flex items-center justify-center w-full">
                <div className="bg-emerald-100 text-emerald-800 text-xs font-bold px-4 py-1.5 rounded-full shadow-xs flex items-center gap-2 border border-emerald-200">
                  <span>Halaman 3: Lembar Lampiran Foto &amp; Nota Pengeluaran ({imageAttachments.length} Foto)</span>
                </div>
              </div>

              <div
                className="page-sheet a4-page bg-white w-full max-w-[794px] p-8 sm:p-12 shadow-lg rounded-sm border border-slate-300 text-slate-900 leading-normal min-h-[1123px] flex flex-col justify-between"
                style={{ fontFamily: "Tahoma, Arial, sans-serif", fontSize: "11pt" }}
              >
                <div>
                  {/* JUDUL HALAMAN 3 */}
                  <div className="text-center mb-6">
                    <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-950">
                      LEMBAR LAMPIRAN
                    </h2>
                  </div>

                  {/* METADATA SURAT */}
                  <div className="space-y-1.5 mb-6 text-xs sm:text-sm font-semibold">
                    <div className="flex">
                      <span className="w-20 text-slate-700">No.</span>
                      <span className="w-4">:</span>
                      <span className="font-mono font-bold text-slate-900">{letter.letterNumber}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-20 text-slate-700 shrink-0">Hal</span>
                      <span className="w-4 shrink-0">:</span>
                      <span className="font-bold text-slate-900">{displayHal}</span>
                    </div>
                  </div>

                  {/* KONTEN LAMPIRAN DI HALAMAN 3 (DRAGGABLE) */}
                  <div className="space-y-3">
                    <div
                      className={`grid gap-2.5 items-start ${
                        imgCols === 1
                          ? 'grid-cols-1'
                          : imgCols === 4
                          ? 'grid-cols-4'
                          : imgCols === 3
                          ? 'grid-cols-3'
                          : 'grid-cols-2'
                      }`}
                    >
                      {imageAttachments.map((file, idx) => {
                        const imgSrc = file.dataUrl || file.data || file.url || ''
                        const pos = positions[idx] || { x: 0, y: 0 }
                        const isMoved = pos.x !== 0 || pos.y !== 0
                        const customSize = sizes[idx]

                        return (
                          <div
                            key={file.id || idx}
                            ref={(el) => { cardRefs.current[idx] = el }}
                            onMouseDown={(e) => handleStartDrag(e, idx)}
                            onDoubleClick={() => handleOpenModal(idx)}
                            style={{
                              transform: `translate(${pos.x}px, ${pos.y}px)`,
                              width: customSize?.width ? `${customSize.width}px` : undefined,
                              zIndex: activeDragIdx === idx || activeResizeIdx === idx ? 40 : isMoved || customSize ? 20 : 1,
                              transition: activeDragIdx === idx || activeResizeIdx === idx ? 'none' : 'transform 0.08s ease-out',
                            }}
                            className={`group relative border rounded-lg p-1 bg-white shadow-2xs flex flex-col items-center justify-center overflow-visible cursor-grab active:cursor-grabbing hover:border-blue-500 hover:shadow-md self-start select-none ${
                              isMoved || customSize ? 'border-blue-400 ring-1 ring-blue-300' : 'border-slate-200'
                            }`}
                            title="Klik & tahan untuk menggeser • Tarik sudut/tepi untuk ubah ukuran • Double-klik untuk perbesar layar penuh"
                          >
                            {/* Tombol Reset Ukuran Manual (Hanya di Web) */}
                            {customSize && (
                              <div className="no-print absolute top-1.5 left-1.5 z-20 opacity-0 group-hover:opacity-100 transition shadow">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const nextSizes = { ...sizes }
                                    delete nextSizes[idx]
                                    setSizes(nextSizes)
                                    if (onUpdateImageLayout) {
                                      onUpdateImageLayout({
                                        ...savedLayout,
                                        sizes: nextSizes,
                                      })
                                    }
                                  }}
                                  className="px-1.5 py-0.5 rounded bg-slate-900/80 hover:bg-rose-600 text-white text-[9px] font-bold flex items-center gap-1 transition"
                                  title="Kembalikan ukuran gambar ke otomatis"
                                >
                                  <RotateCcw className="w-2.5 h-2.5" />
                                  <span>Reset Ukuran</span>
                                </button>
                              </div>
                            )}

                            {/* Tombol Perbesar Zoom Layar Penuh (Hanya di Web, otomatis hilang saat cetak) */}
                            <div className="no-print absolute top-1.5 right-1.5 flex items-center bg-slate-900/80 backdrop-blur-xs text-white p-0.5 rounded-md opacity-0 group-hover:opacity-100 transition z-20 shadow">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenModal(idx)
                                }}
                                className="p-0.5 hover:bg-slate-700 rounded flex items-center gap-1 text-[10px] font-medium"
                                title="Perbesar Layar Penuh"
                              >
                                <ZoomIn className="w-3 h-3" />
                                <span className="hidden sm:inline">Perbesar</span>
                              </button>
                            </div>

                            <img
                              src={imgSrc}
                              alt=""
                              draggable={false}
                              style={{
                                maxHeight: customSize?.height ? `${customSize.height}px` : `${imgMaxHeight}px`,
                                height: customSize?.height ? `${customSize.height}px` : 'auto',
                                maxWidth: '100%',
                                width: customSize?.width ? `${customSize.width}px` : '100%',
                                objectFit: 'contain',
                              }}
                              className="rounded pointer-events-none mx-auto block"
                            />

                            {/* RESIZE HANDLES (Tarik untuk mengecilkan / membesarkan manual) */}
                            {/* Sudut Kanan Bawah (SE) - Utama */}
                            <div
                              onMouseDown={(e) => handleStartResize(e, idx, 'se')}
                              className={`resize-handle no-print absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-blue-600 rounded-xs cursor-se-resize shadow-md hover:bg-blue-600 transition-colors z-30 ${
                                activeResizeIdx === idx ? 'opacity-100 bg-blue-600' : 'opacity-0 group-hover:opacity-100'
                              }`}
                              title="Tarik sudut untuk membesarkan / mengecilkan gambar"
                            />
                            {/* Sudut Kiri Bawah (SW) */}
                            <div
                              onMouseDown={(e) => handleStartResize(e, idx, 'sw')}
                              className={`resize-handle no-print absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-blue-600 rounded-xs cursor-sw-resize shadow-md hover:bg-blue-600 transition-colors z-30 ${
                                activeResizeIdx === idx ? 'opacity-100 bg-blue-600' : 'opacity-0 group-hover:opacity-100'
                              }`}
                              title="Tarik sudut untuk membesarkan / mengecilkan gambar"
                            />
                            {/* Sudut Kanan Atas (NE) */}
                            <div
                              onMouseDown={(e) => handleStartResize(e, idx, 'ne')}
                              className={`resize-handle no-print absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-blue-600 rounded-xs cursor-ne-resize shadow-md hover:bg-blue-600 transition-colors z-30 ${
                                activeResizeIdx === idx ? 'opacity-100 bg-blue-600' : 'opacity-0 group-hover:opacity-100'
                              }`}
                              title="Tarik sudut untuk membesarkan / mengecilkan gambar"
                            />
                            {/* Sudut Kiri Atas (NW) */}
                            <div
                              onMouseDown={(e) => handleStartResize(e, idx, 'nw')}
                              className={`resize-handle no-print absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-blue-600 rounded-xs cursor-nw-resize shadow-md hover:bg-blue-600 transition-colors z-30 ${
                                activeResizeIdx === idx ? 'opacity-100 bg-blue-600' : 'opacity-0 group-hover:opacity-100'
                              }`}
                              title="Tarik sudut untuk membesarkan / mengecilkan gambar"
                            />
                            {/* Tepi Kanan (Lebar) */}
                            <div
                              onMouseDown={(e) => handleStartResize(e, idx, 'e')}
                              className={`resize-handle no-print absolute top-1/2 -right-1.5 -translate-y-1/2 w-2 h-4 bg-white border-2 border-blue-600 rounded-xs cursor-e-resize shadow-md hover:bg-blue-600 transition-colors z-30 ${
                                activeResizeIdx === idx ? 'opacity-100 bg-blue-600' : 'opacity-0 group-hover:opacity-100'
                              }`}
                              title="Tarik lebar gambar"
                            />
                            {/* Tepi Bawah (Tinggi) */}
                            <div
                              onMouseDown={(e) => handleStartResize(e, idx, 's')}
                              className={`resize-handle no-print absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-2 bg-white border-2 border-blue-600 rounded-xs cursor-s-resize shadow-md hover:bg-blue-600 transition-colors z-30 ${
                                activeResizeIdx === idx ? 'opacity-100 bg-blue-600' : 'opacity-0 group-hover:opacity-100'
                              }`}
                              title="Tarik tinggi gambar"
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer Halaman 3 */}
                <div className="mt-8 pt-3 border-t border-slate-200 flex flex-wrap justify-between items-center text-[10px] text-slate-400">
                  <span>Sistem Surat Ajuan Online &bull; Dicetak pada: {formatDateId(new Date())}</span>
                  <span className="font-mono">Lembar Lampiran &bull; Halaman 3 dari {totalPages}</span>
                </div>
              </div>
            </>
          )}

          {/* ==================== HALAMAN LAMPIRAN DOKUMEN PDF RESMI (PER HALAMAN A4 UTUH) ==================== */}
          {allPdfPagesList.map((pItem, idx) => {
            const pageNum = 2 + (hasImagePage ? 1 : 0) + (idx + 1)

            return (
              <React.Fragment key={pItem.key || idx}>
                {/* PAGE BREAK (UNTUK PRINT & PDF) */}
                <div className="html2pdf__page-break" style={{ pageBreakBefore: 'always', breakBefore: 'page' }}></div>

                {/* Visual Separator in Web View */}
                <div className="no-print my-1 flex items-center justify-center w-full">
                  <div className="bg-rose-100 text-rose-800 text-xs font-bold px-4 py-1.5 rounded-full shadow-xs flex items-center gap-2 border border-rose-200">
                    <span>
                      Halaman {pageNum}: Lembar Lampiran PDF ({pItem.file.name} - Hal {pItem.pageNumber} dari {pItem.pdfTotalPages})
                    </span>
                  </div>
                </div>

                <div
                  className="page-sheet a4-page bg-white w-full max-w-[794px] shadow-lg rounded-sm border border-slate-300 min-h-[1123px] flex flex-col justify-between overflow-hidden relative"
                >
                  {/* Konten Halaman PDF Rendition Murni (Tanpa Scroll) */}
                  <div className="w-full flex-1 flex items-center justify-center p-3 sm:p-5 bg-white overflow-hidden">
                    {pItem.dataUrl ? (
                      <img
                        src={pItem.dataUrl}
                        alt={`${pItem.file.name} Hal ${pItem.pageNumber}`}
                        className="w-full h-auto max-h-[1040px] object-contain block select-none pointer-events-none bg-white"
                        style={{ backgroundColor: '#ffffff' }}
                      />
                    ) : pItem.fallbackSrc || pItem.file?.url || pItem.file?.dataUrl ? (
                      <div className="w-full h-full flex-1 flex flex-col items-center bg-white">
                        {/* Iframe hanya tampil di browser web, disembunyikan saat print agar tidak menjadi kotak hitam */}
                        <iframe
                          src={`${pItem.fallbackSrc || pItem.file?.url || pItem.file?.dataUrl}#toolbar=0&navpanes=0`}
                          title={pItem.file?.name || 'Dokumen PDF'}
                          className="w-full h-[980px] border-0 rounded bg-white print:hidden"
                        />
                        {/* Lembar khusus cetak jika image rendering belum tersedia */}
                        <div className="hidden print:flex flex-col items-center justify-center p-12 text-center border-2 border-slate-200 rounded-xl my-8 bg-white text-slate-800 w-full max-w-lg">
                          <FileText className="w-16 h-16 text-blue-600 mb-4" />
                          <h4 className="font-bold text-base text-slate-900">{pItem.file?.name || 'Dokumen Lampiran PDF'}</h4>
                          <p className="text-xs text-slate-500 mt-1 font-medium">Halaman {pItem.pageNumber} dari {pItem.pdfTotalPages || 1}</p>
                          <div className="mt-4 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600">
                            Berkas lampiran elektronik resmi tersimpan dan terverifikasi di server E-Surat Ajuan.
                          </div>
                        </div>
                        <div className="no-print mt-2 flex items-center gap-2">
                          <a
                            href={pItem.fallbackSrc || pItem.file?.url || pItem.file?.dataUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold rounded-lg border border-indigo-200 flex items-center gap-1.5 transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Unduh / Buka Dokumen Asli ({pItem.file?.name || 'PDF'})</span>
                          </a>
                        </div>
                      </div>
                    ) : pItem.error ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-rose-50 border border-rose-200 rounded-xl m-4 text-rose-700">
                        <AlertCircle className="w-8 h-8 mb-2 text-rose-600" />
                        <span className="font-bold text-sm">Lampiran Dokumen Tidak Dapat Ditampilkan</span>
                        <span className="text-xs text-rose-600 mt-1 max-w-md">{pItem.errorMsg || 'Berkas rusak atau bukan format PDF resmi.'}</span>
                        <span className="text-[11px] text-slate-500 mt-2">Silakan unduh dokumen asli via tautan lampiran.</span>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 text-xs bg-white">
                        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
                        <span>Memproses Halaman {pItem.pageNumber}...</span>
                      </div>
                    )}
                  </div>

                  {/* Footer Lembar PDF */}
                  <div className="px-8 py-2.5 bg-white border-t border-slate-200 flex flex-wrap justify-between items-center text-[10px] text-slate-400 select-none">
                    <span>
                      Lampiran PDF: {pItem.file.name} &bull; Hal {pItem.pageNumber} dari {pItem.pdfTotalPages}
                    </span>
                    <span className="font-mono">
                      Lembar Lampiran PDF &bull; Halaman {pageNum} dari {totalPages}
                    </span>
                  </div>
                </div>
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Berkas Lampiran Pendukung (Excel, Gambar, Dokumen) */}
      {attachments.length > 0 && (
        <div className="no-print bg-white p-4 sm:p-5 rounded-xl border border-slate-300 shadow-md shadow-slate-400/20 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                Berkas Lampiran Pendukung ({attachments.length} Berkas)
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              File Lampiran Resmi Pemohon (Excel / Gambar / PDF)
            </span>
          </div>
          <AttachmentUploader attachments={attachments} readOnly={true} />
        </div>
      )}

      {/* Audit Log Timeline (Interactive below document) */}
      {auditLogs && auditLogs.length > 0 && (
        <div className="no-print bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <History className="w-4 h-4 text-indigo-600" />
              <span>Riwayat Aktivitas & Jejak Audit (Audit Trail)</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>Dibuat: <strong className="text-slate-800">{letter.userName || letter.createdBy}</strong> ({formatDateTimeId(letter.createdAt)})</span>
              {(letter.lastEditedAt || (letter.updatedAt && letter.updatedAt !== letter.createdAt)) && (
                <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Diedit: <strong className="text-amber-950">{letter.lastEditedBy || letter.userName}</strong> ({formatDateTimeId(letter.lastEditedAt || letter.updatedAt)})
                </span>
              )}
            </div>
          </div>

          <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200">
            {auditLogs.map((log, idx) => (
              <div key={idx} className="relative flex items-start gap-3 pl-7">
                <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-indigo-600 border-2 border-white ring-2 ring-indigo-100" />
                <div className="flex-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                  <div className="flex flex-wrap justify-between items-center gap-2 mb-1">
                    <span className="font-bold text-slate-800">{log.action}</span>
                    <span className="text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {formatDateTimeId(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-slate-600">
                    Oleh: <strong className="text-slate-700">{log.userName}</strong> &bull; {log.notes}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Modal Gambar Perbesar / Slidebar Viewer */}
      {activeModalIndex !== null && imageAttachments[activeModalIndex] && (
        <div
          className="no-print fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-6 animate-fadeIn select-none"
          onClick={handleCloseModal}
        >
          {/* Header Bar */}
          <div
            className="w-full max-w-5xl flex items-center justify-between text-white py-2 px-4 bg-slate-900/80 rounded-xl border border-slate-800 shadow-lg z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-xs sm:text-sm text-slate-100">
                Lampiran Foto #{activeModalIndex + 1} dari {imageAttachments.length}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium hidden sm:inline">
                {Math.round(modalZoom * 100)}%
              </span>
            </div>

            {/* Toolbar Zoom & Reset */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setModalZoom((z) => Math.max(z - 0.25, 0.5))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                title="Perkecil (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setModalZoom(1)}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1"
                title="Reset Ukuran (100%)"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">100%</span>
              </button>
              <button
                type="button"
                onClick={() => setModalZoom((z) => Math.min(z + 0.25, 3))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                title="Perbesar (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="h-4 w-px bg-slate-700 mx-1"></div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white transition flex items-center gap-1 text-xs font-bold"
                title="Tutup (Esc)"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Tutup</span>
              </button>
            </div>
          </div>

          {/* Body Viewer Image Area with Slide Navigation */}
          <div
            className="relative flex-1 w-full max-w-6xl flex items-center justify-center my-3 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tombol Slide Kiri (Prev) */}
            {imageAttachments.length > 1 && (
              <button
                type="button"
                disabled={activeModalIndex === 0}
                onClick={handlePrevImage}
                className="absolute left-2 sm:left-4 z-30 p-2.5 sm:p-3 rounded-full bg-slate-900/85 hover:bg-indigo-600 text-white shadow-2xl transition disabled:opacity-20 disabled:hover:bg-slate-900/85 cursor-pointer disabled:cursor-not-allowed border border-slate-700/60"
                title="Foto Sebelumnya (Panah Kiri)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Kontainer Gambar Aktif */}
            <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
              <img
                src={
                  imageAttachments[activeModalIndex].dataUrl ||
                  imageAttachments[activeModalIndex].data ||
                  imageAttachments[activeModalIndex].url ||
                  ''
                }
                alt={`Lampiran #${activeModalIndex + 1}`}
                onDoubleClick={() => setModalZoom((z) => (z > 1 ? 1 : 2))}
                style={{
                  transform: `scale(${modalZoom})`,
                  transition: 'transform 0.15s ease-out',
                }}
                className="max-h-[72vh] max-w-full object-contain rounded-xl shadow-2xl drop-shadow-2xl cursor-pointer select-none"
                title="Double-klik untuk perbesar 2x / reset • Klik sekali tidak memperbesar"
              />
            </div>

            {/* Tombol Slide Kanan (Next) */}
            {imageAttachments.length > 1 && (
              <button
                type="button"
                disabled={activeModalIndex === imageAttachments.length - 1}
                onClick={handleNextImage}
                className="absolute right-2 sm:right-4 z-30 p-2.5 sm:p-3 rounded-full bg-slate-900/85 hover:bg-indigo-600 text-white shadow-2xl transition disabled:opacity-20 disabled:hover:bg-slate-900/85 cursor-pointer disabled:cursor-not-allowed border border-slate-700/60"
                title="Foto Berikutnya (Panah Kanan)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Footer Bar: Slidebar Thumbnail Strip */}
          {imageAttachments.length > 1 && (
            <div
              className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-2 flex items-center justify-center gap-2 overflow-x-auto z-20 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {imageAttachments.map((att, i) => {
                const thumbSrc = att.dataUrl || att.data || att.url || ''
                const isSelected = i === activeModalIndex
                return (
                  <button
                    key={att.id || i}
                    type="button"
                    onClick={() => {
                      setActiveModalIndex(i)
                      setModalZoom(1)
                    }}
                    className={`relative shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition ${
                      isSelected
                        ? 'border-indigo-500 ring-2 ring-indigo-500/50 scale-105'
                        : 'border-slate-700 opacity-60 hover:opacity-100 hover:border-slate-500'
                    }`}
                  >
                    <img src={thumbSrc} alt="" className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 right-0 bg-slate-950/80 text-white text-[9px] font-bold px-1 rounded-tl">
                      {i + 1}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL DISKUSI / CHAT SURAT */}
      {isChatOpen && letter && (
        <LetterChatModal
          letterId={letter.id}
          initialLetter={letter}
          currentUser={currentUser}
          onClose={() => setIsChatOpen(false)}
        />
      )}

      {/* MODAL BAGIKAN SURAT */}
      {isShareOpen && letter && (
        <ShareLetterModal
          letter={letter}
          currentUser={currentUser}
          onClose={() => setIsShareOpen(false)}
        />
      )}
    </div>
  )
}
