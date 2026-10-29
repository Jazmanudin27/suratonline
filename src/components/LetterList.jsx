import React, { useState } from 'react'
import {
  FileText,
  Search,
  Filter,
  Eye,
  Edit,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building,
  User,
  Calendar,
  History,
  ShieldCheck,
  MessageSquare,
  Trash2,
  Printer,
  Share2,
  Inbox,
  Mail,
  CheckCheck,
  Check,
} from 'lucide-react'
import ShareLetterModal from './ShareLetterModal'
import {
  formatDateId,
  formatDateTimeId,
  getAuditLogs,
  approveLetter,
  rejectLetter,
  requestRevisionLetter,
  getUsers,
  getLetters,
  canUserAccessLetterChat,
  isLetterVisibleToUser,
  deleteLetter,
  isLetterAwaitingKnownBy,
  isUserLetterKnownBy,
  getEffectiveKnownBy,
  canUserEditLetter,
  getCategories,
  isSharedLetterRead,
  markSharedLetterRead,
  markAllSharedLettersRead,
  getSharedLetterInfo,
} from '../services/storage'
import { notify } from '../utils/alert'
import SearchableSelect from './SearchableSelect'
import LetterChatModal from './LetterChatModal'
import LetterDocumentView from './LetterDocumentView'

export default function LetterList({
  letters = [],
  currentUser,
  branches = [],
  templates = [],
  initialStatusFilter = 'all',
  isInboxView = false,
  onOpenLetter,
  onEditLetter,
  onDirectPrint,
}) {
  const users = getUsers()
  const [localLetters, setLocalLetters] = useState(() => (letters && letters.length > 0 ? letters : getLetters()))

  React.useEffect(() => {
    if (letters && letters.length > 0) {
      setLocalLetters(letters)
    } else {
      setLocalLetters(getLetters())
    }
  }, [letters])

  React.useEffect(() => {
    const handleUpdate = () => setLocalLetters(getLetters())
    window.addEventListener('letters_change', handleUpdate)
    return () => window.removeEventListener('letters_change', handleUpdate)
  }, [])

  const [search, setSearch] = useState('')
  const [directPrintLetter, setDirectPrintLetter] = useState(null)
  const [isPreparingPrint, setIsPreparingPrint] = useState(false)
  const printTimeoutRef = React.useRef(null)

  const handleReadyToPrint = React.useCallback(() => {
    if (!directPrintLetter) return
    if (printTimeoutRef.current) clearTimeout(printTimeoutRef.current)
    setTimeout(() => {
      document.body.classList.add('direct-printing-active')
      setIsPreparingPrint(false)
      window.print()
      setTimeout(() => {
        document.body.classList.remove('direct-printing-active')
        setDirectPrintLetter(null)
      }, 500)
    }, 120)
  }, [directPrintLetter])

  React.useEffect(() => {
    if (directPrintLetter) {
      setIsPreparingPrint(true)
      printTimeoutRef.current = setTimeout(() => {
        handleReadyToPrint()
      }, 10000)
      return () => {
        if (printTimeoutRef.current) clearTimeout(printTimeoutRef.current)
      }
    }
  }, [directPrintLetter, handleReadyToPrint])
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter || 'all')
  const [branchFilter, setBranchFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [historyLetter, setHistoryLetter] = useState(null)
  const [chatLetter, setChatLetter] = useState(null)
  const [shareLetter, setShareLetter] = useState(null)
  const [approvalModalLetter, setApprovalModalLetter] = useState(null)
  const [approvalActionType, setApprovalActionType] = useState('approve')
  const [approvalNotes, setApprovalNotes] = useState('')

  // Resolve nama pejabat approver sesuai tahap
  const getApproverName = (step, letter) => {
    if (!step) return 'Pejabat Terkait'
    if (step.specificUserName) return step.specificUserName
    if (step.approverName && !['RSM', 'RSM1', 'GM MARKETING', 'GM', 'OM', 'Kepala Cabang'].includes(step.approverName.trim())) {
      return step.approverName
    }
    if (step.specificUserId) {
      const u = users.find((usr) => String(usr.id) === String(step.specificUserId))
      if (u) return u.name
    }
    const roleUpper = (step.approverRole || step.title || '').toUpperCase()
    if (step.kodeJabatan === 'J08' || roleUpper.includes('OPERATION MANAGER') || roleUpper.includes('OM')) {
      const omUser = users.find((usr) =>
        (usr.branchId === letter?.branchId || usr.branchName?.includes(letter?.branchName)) &&
        (usr.kodeJabatan === 'J08' || usr.position?.toUpperCase().includes('OPERATION MANAGER'))
      ) || users.find((usr) => usr.kodeJabatan === 'J08' && usr.name?.toLowerCase().includes('anif'))
      if (omUser) return omUser.name
    }
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
    return step.approverRole || step.title || 'Pejabat Terkait'
  }

  // Cek apakah user yang login berhak meng-approve tahap aktif saat ini
  const canUserApproveLetter = (letter) => {
    if (!letter || letter.status !== 'pending' || !currentUser) return false

    // Pembuat/pemohon surat tidak boleh menyetujui surat buatannya sendiri
    const uid = String(currentUser.id || '')
    const lUid = String(letter.userId || '')
    if (uid && lUid && uid === lUid) return false

    const uName = (currentUser.name || '').trim().toLowerCase()
    const lCreator = (letter.createdBy || '').trim().toLowerCase()
    const lUser = (letter.userName || '').trim().toLowerCase()
    if (uName && (lCreator === uName || lUser === uName)) return false

    // JIKA SURAT MASIH MENUNGGU PERSETUJUAN DARI PIHAK MENGETAHUI:
    if (isLetterAwaitingKnownBy(letter)) {
      return isUserLetterKnownBy(letter, currentUser)
    }

    // JIKA SUDAH DISETUJUI MENGETAHUI, BARU GILIRAN PEJABAT PENYETUJU:
    const currentStepInfo = letter.approvalHistory?.[letter.currentStep - 1]
    if (!currentStepInfo) return false

    // 1. Jika tahap ditujukan ke user spesifik (assignmentType === 'user' atau ada specificUserId / specificUserName):
    const isUserSpecific =
      currentStepInfo.assignmentType === 'user' ||
      Boolean(currentStepInfo.specificUserId || currentStepInfo.specificUserName)

    if (isUserSpecific) {
      const matchId = currentStepInfo.specificUserId && String(currentStepInfo.specificUserId) === String(currentUser.id)
      const matchName = currentStepInfo.specificUserName && currentStepInfo.specificUserName.toLowerCase() === currentUser.name?.toLowerCase()
      const matchApproverName = currentStepInfo.approverName && currentStepInfo.approverName.toLowerCase() === currentUser.name?.toLowerCase()
      return Boolean(matchId || matchName || matchApproverName)
    }

    // 2. Cocokkan kodeJabatan (jika tahap berbasis jabatan umum)
    if (currentStepInfo.kodeJabatan && currentUser.kodeJabatan && currentStepInfo.kodeJabatan === currentUser.kodeJabatan) {
      // Jika level cabang (seperti OM J08), pastikan cabangnya sesuai
      if (currentStepInfo.kodeJabatan === 'J08' && currentUser.branchId) {
        return letter.branchId === currentUser.branchId || !letter.branchId
      }
      return true
    }

    // 3. Cocokkan nama approver teresolusi
    const resolvedName = getApproverName(currentStepInfo, letter)
    if (resolvedName && currentUser.name && resolvedName.toLowerCase() === currentUser.name.toLowerCase()) {
      return true
    }

    // 4. Cocokkan approverRole dengan position user
    const roleReq = (currentStepInfo.approverRole || '').toLowerCase()
    const userPos = (currentUser.position || currentUser.roleLabel || '').toLowerCase()
    if (roleReq && userPos && (userPos.includes(roleReq) || roleReq.includes(userPos))) {
      if (roleReq.includes('operation manager') || roleReq.includes('om')) {
        return letter.branchId === currentUser.branchId || !letter.branchId
      }
      return true
    }

    return false
  }

  // Pemeriksaan hak akses data cabang:
  // User kantor cabang hanya berhak melihat surat dari cabangnya sendiri
  const isPusatUser =
    currentUser?.branchId === 'PST' ||
    currentUser?.role === 'admin_pusat' ||
    currentUser?.kodeJabatan === 'J01' || // Direktur
    currentUser?.kodeJabatan === 'J02' || // GM
    currentUser?.kodeJabatan === 'J27'   // IT Pusat

  const allLetters = (localLetters && localLetters.length > 0) ? localLetters : (letters || [])
  const myUid = String(currentUser?.id || '')
  const myName = (currentUser?.name || currentUser?.username || '').trim().toLowerCase()

  const visibleLetters = allLetters.filter((l) => {
    if (isInboxView) {
      return (l.sharedWith || []).some((s) => {
        if (s.userId && String(s.userId) === myUid) return true
        if (s.id && String(s.id) === myUid) return true
        if (s.userName && s.userName.trim().toLowerCase() === myName) return true
        return false
      })
    }
    return isLetterVisibleToUser(l, currentUser)
  })

  const handleDeleteDraft = async (letter) => {
    if (letter.status !== 'draft') {
      notify.warning('Perhatian', 'Hanya surat berstatus Draf yang dapat dihapus.')
      return
    }

    const confirmed = await notify.confirm({
      title: 'Hapus Draf Surat?',
      text: `Apakah Anda yakin ingin menghapus draf ${letter.letterNumber || letter.title}? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Ya, Hapus Draf',
      cancelText: 'Batal',
      confirmColor: '#dc2626',
      icon: 'warning',
    })

    if (!confirmed) return

    const success = deleteLetter(letter.id)
    if (success) {
      notify.success('Draf Dihapus', `Draf surat ${letter.letterNumber || ''} berhasil dihapus.`)
    } else {
      notify.error('Gagal', 'Gagal menghapus draf surat.')
    }
  }

  const statusCounts = isInboxView
    ? {
        all: visibleLetters.length,
        unread: visibleLetters.filter((l) => !isSharedLetterRead(l, currentUser)).length,
        read: visibleLetters.filter((l) => isSharedLetterRead(l, currentUser)).length,
      }
    : {
        all: visibleLetters.length,
        pending: visibleLetters.filter((l) => l.status === 'pending').length,
        myAction: visibleLetters.filter((l) => canUserApproveLetter(l)).length,
        approved: visibleLetters.filter((l) => l.status === 'approved').length,
        revision: visibleLetters.filter((l) => l.status === 'revision').length,
        rejected: visibleLetters.filter((l) => l.status === 'rejected').length,
        draft: visibleLetters.filter((l) => l.status === 'draft').length,
      }

  // Lookup template map
  const templateMap = React.useMemo(() => {
    const map = new Map()
    ;(templates || []).forEach((t) => {
      if (t.id) map.set(t.id, t)
      if (t.code) map.set(t.code, t)
    })
    return map
  }, [templates])

  const getLetterCategory = React.useCallback((letter) => {
    if (letter.category && letter.category !== 'all') return letter.category
    if (letter.templateCategory) return letter.templateCategory
    if (letter.templateId) {
      const t = templateMap.get(letter.templateId) || templateMap.get(letter.templateCode)
      if (t?.category) return t.category
    }
    const tName = (letter.templateName || letter.title || '').toLowerCase()
    if (tName.includes('sample') || tName.includes('kemasan') || tName.includes('promosi') || tName.includes('marketing')) {
      return 'Marketing'
    }
    if (tName.includes('operasional') || tName.includes('biaya operasional')) {
      return 'Operasional'
    }
    if (tName.includes('cuti') || tName.includes('karyawan') || tName.includes('hrd') || tName.includes('izin')) {
      return 'Kepegawaian / HRD'
    }
    if (tName.includes('keuangan') || tName.includes('anggaran') || tName.includes('kas')) {
      return 'Keuangan & Anggaran'
    }
    if (tName.includes('sales') || tName.includes('crm') || tName.includes('penjualan')) {
      return 'Sales & CRM'
    }
    if (tName.includes('logistik') || tName.includes('distribusi') || tName.includes('pengiriman')) {
      return 'Logistik & Distribusi'
    }
    if (tName.includes('legal') || tName.includes('perizinan') || tName.includes('kontrak')) {
      return 'Legal & Perizinan'
    }
    return 'Umum'
  }, [templateMap])

  const categoriesList = React.useMemo(() => {
    const defaultCats = [
      'Umum',
      'Operasional',
      'Kepegawaian / HRD',
      'Marketing',
      'Sales & CRM',
      'Keuangan & Anggaran',
      'Logistik & Distribusi',
      'Legal & Perizinan',
    ]
    const stored = getCategories() || []
    return Array.from(new Set([...defaultCats, ...stored]))
  }, [])

  const categoryOptions = React.useMemo(() => {
    const branchFilteredLetters = visibleLetters.filter((l) => {
      return (
        branchFilter === 'all' ||
        l.branchId === branchFilter ||
        String(l.branchId).toLowerCase() === String(branchFilter).toLowerCase() ||
        (l.branchName && branchFilter && l.branchName.toLowerCase().includes(branchFilter.toLowerCase()))
      )
    })

    const counts = { all: branchFilteredLetters.length }
    categoriesList.forEach((cat) => {
      counts[cat] = 0
    })

    branchFilteredLetters.forEach((l) => {
      const cat = getLetterCategory(l)
      if (counts[cat] !== undefined) {
        counts[cat] += 1
      } else {
        counts[cat] = 1
      }
    })

    return [
      {
        value: 'all',
        label: 'Semua',
        badge: counts.all,
      },
      ...categoriesList.map((cat) => ({
        value: cat,
        label: cat,
        badge: counts[cat] || 0,
      })),
    ]
  }, [visibleLetters, branchFilter, categoriesList, getLetterCategory])

  const filteredLetters = visibleLetters.filter((l) => {
    const matchSearch =
      l.letterNumber?.toLowerCase().includes(search.toLowerCase()) ||
      l.userName?.toLowerCase().includes(search.toLowerCase()) ||
      l.branchName?.toLowerCase().includes(search.toLowerCase()) ||
      l.title?.toLowerCase().includes(search.toLowerCase())

    let matchStatus = true
    if (isInboxView) {
      if (statusFilter === 'unread') {
        matchStatus = !isSharedLetterRead(l, currentUser)
      } else if (statusFilter === 'read') {
        matchStatus = isSharedLetterRead(l, currentUser)
      } else {
        matchStatus = true
      }
    } else {
      if (statusFilter === 'all') {
        matchStatus = true
      } else if (statusFilter === 'my_action') {
        matchStatus = canUserApproveLetter(l)
      } else {
        matchStatus = l.status === statusFilter
      }
    }

    const matchBranch =
      branchFilter === 'all' ||
      l.branchId === branchFilter ||
      String(l.branchId).toLowerCase() === String(branchFilter).toLowerCase() ||
      (l.branchName && branchFilter && l.branchName.toLowerCase().includes(branchFilter.toLowerCase()))
    const matchCategory =
      categoryFilter === 'all' ||
      getLetterCategory(l) === categoryFilter

    return matchSearch && matchStatus && matchBranch && matchCategory
  })

  return (
    <div className="space-y-3">
      {/* Top Header Banner Berwarna */}
      <div className={`text-white rounded-xl p-3.5 sm:p-4 pb-2 sm:pb-2 shadow-md shadow-slate-900/10 border ${
        isInboxView
          ? 'bg-gradient-to-r from-violet-800 via-indigo-800 to-slate-900 border-violet-900/40'
          : 'bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 border-blue-900/40'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20 text-white shadow-xs shrink-0">
              {isInboxView ? <Inbox className="w-4.5 h-4.5 text-violet-300" /> : <FileText className="w-4.5 h-4.5 text-sky-300" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isInboxView ? 'Kotak Masuk Surat (Dibagikan ke Saya)' : 'Daftar Arsip & Pengajuan Surat'}
              </h2>
              <p className="text-xs text-blue-100/80">
                {isInboxView
                  ? 'Daftar surat dinas dan dokumen pengajuan yang dibagikan oleh rekan kerja kepada Anda.'
                  : 'Pantau status, otorisasi persetujuan surat, atau unduh dokumen PDF resmi.'}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-white/15 text-white border border-white/20 backdrop-blur-xs rounded-lg">
            Total: {filteredLetters.length} Dokumen
          </span>
        </div>
      </div>

      {/* Filter Controls Card */}
      <div className="bg-white border border-slate-300 rounded-xl p-3.5 sm:p-4 shadow-md shadow-slate-400/20 space-y-3">
        {/* Quick Status Filter Pills */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto py-1.5 text-xs">
          <div className="flex items-center gap-1.5 shrink-0">
            {isInboxView ? (
              <>
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 ${
                    statusFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
                  }`}
                >
                  <span className={`font-extrabold ${statusFilter === 'all' ? 'text-white' : 'text-slate-800'}`}>Semua Surat</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      statusFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-900 font-extrabold'
                    }`}
                  >
                    {statusCounts.all}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('unread')}
                  className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 ${
                    statusFilter === 'unread'
                      ? 'bg-indigo-700 text-white shadow-xs ring-2 ring-indigo-400'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-300'
                  }`}
                >
                  <Mail className={`w-3.5 h-3.5 shrink-0 ${statusFilter === 'unread' ? 'text-white' : 'text-indigo-600'}`} />
                  <span className={`font-extrabold ${statusFilter === 'unread' ? 'text-white' : 'text-indigo-950'}`}>Belum Dibaca</span>
                  {statusCounts.unread > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                      {statusCounts.unread}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('read')}
                  className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 ${
                    statusFilter === 'read'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300'
                  }`}
                >
                  <Check className={`w-3.5 h-3.5 shrink-0 ${statusFilter === 'read' ? 'text-white' : 'text-emerald-600'}`} />
                  <span className={`font-extrabold ${statusFilter === 'read' ? 'text-white' : 'text-emerald-950'}`}>Sudah Dibaca</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      statusFilter === 'read' ? 'bg-white/20 text-white' : 'bg-emerald-200 text-emerald-950 font-extrabold'
                    }`}
                  >
                    {statusCounts.read}
                  </span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 ${
                    statusFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
                  }`}
                >
                  <span className={`font-extrabold ${statusFilter === 'all' ? 'text-white' : 'text-slate-800'}`}>Semua</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      statusFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-900 font-extrabold'
                    }`}
                  >
                    {statusCounts.all}
                  </span>
                </button>

                {statusCounts.myAction > 0 && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter('my_action')}
                    className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 ${
                      statusFilter === 'my_action'
                        ? 'bg-indigo-700 text-white shadow-xs ring-2 ring-indigo-400'
                        : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-300'
                    }`}
                    title="Surat yang saat ini sedang menunggu persetujuan / giliran tanda tangan Anda"
                  >
                    <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${statusFilter === 'my_action' ? 'text-white' : 'text-indigo-700'}`} />
                    <span className={`font-extrabold ${statusFilter === 'my_action' ? 'text-white' : 'text-indigo-950'}`}>Giliran Saya ACC</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[10px] font-black animate-pulse">
                      {statusCounts.myAction}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 ${
                    statusFilter === 'pending'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300'
                  }`}
                >
                  <Clock className={`w-3.5 h-3.5 shrink-0 ${statusFilter === 'pending' ? 'text-white' : 'text-amber-700'}`} />
                  <span className={`font-extrabold ${statusFilter === 'pending' ? 'text-white' : 'text-amber-950'}`}>Pending</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      statusFilter === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-200 text-amber-950 font-extrabold'
                    }`}
                  >
                    {statusCounts.pending}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('approved')}
                  className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 ${
                    statusFilter === 'approved'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300'
                  }`}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${statusFilter === 'approved' ? 'text-white' : 'text-emerald-700'}`} />
                  <span className={`font-extrabold ${statusFilter === 'approved' ? 'text-white' : 'text-emerald-950'}`}>Disetujui</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      statusFilter === 'approved' ? 'bg-white/20 text-white' : 'bg-emerald-200 text-emerald-950 font-extrabold'
                    }`}
                  >
                    {statusCounts.approved}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('revision')}
                  className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 ${
                    statusFilter === 'revision'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-orange-50 hover:bg-orange-100 text-orange-950 border border-orange-300'
                  }`}
                >
                  <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${statusFilter === 'revision' ? 'text-white' : 'text-orange-700'}`} />
                  <span className={`font-extrabold ${statusFilter === 'revision' ? 'text-white' : 'text-orange-950'}`}>Perlu Revisi</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      statusFilter === 'revision' ? 'bg-white/20 text-white' : 'bg-orange-200 text-orange-950 font-extrabold'
                    }`}
                  >
                    {statusCounts.revision}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('rejected')}
                  className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 ${
                    statusFilter === 'rejected'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-950 border border-rose-300'
                  }`}
                >
                  <XCircle className={`w-3.5 h-3.5 shrink-0 ${statusFilter === 'rejected' ? 'text-white' : 'text-rose-700'}`} />
                  <span className={`font-extrabold ${statusFilter === 'rejected' ? 'text-white' : 'text-rose-950'}`}>Ditolak</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      statusFilter === 'rejected' ? 'bg-white/20 text-white' : 'bg-rose-200 text-rose-950 font-extrabold'
                    }`}
                  >
                    {statusCounts.rejected}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('draft')}
                  className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 ${
                    statusFilter === 'draft'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300'
                  }`}
                >
                  <span className={`font-extrabold ${statusFilter === 'draft' ? 'text-white' : 'text-slate-900'}`}>Draf</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      statusFilter === 'draft' ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-900 font-extrabold'
                    }`}
                  >
                    {statusCounts.draft}
                  </span>
                </button>
              </>
            )}
          </div>

          {isInboxView && statusCounts.unread > 0 && (
            <button
              type="button"
              onClick={() => {
                markAllSharedLettersRead(currentUser)
                notify.success('Berhasil', 'Semua surat dibagikan telah ditandai sudah dibaca.')
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition shrink-0 shadow-xs"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Tandai Semua Dibaca</span>
            </button>
          )}
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="sm:col-span-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nomor/nama/pemohon/perihal..."
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <SearchableSelect
              value={isPusatUser ? branchFilter : (currentUser?.branchId || 'all')}
              disabled={!isPusatUser}
              onChange={(val) => setBranchFilter(val || 'all')}
              placeholder="Semua Cabang"
              options={[
                ...(isPusatUser ? [{ value: 'all', label: 'Semua Cabang' }] : []),
                ...branches
                  .filter((b) => isPusatUser || b.id === currentUser?.branchId || b.code === currentUser?.branchId)
                  .map((b) => ({
                    value: b.id,
                    label: b.name,
                    sublabel: b.code,
                  })),
              ]}
            />
          </div>

          <div>
            <SearchableSelect
              value={categoryFilter}
              onChange={(val) => setCategoryFilter(val || 'all')}
              placeholder="Semua Kategori"
              options={categoryOptions}
            />
          </div>
        </div>
      </div>

      {/* Letters Table */}
      <div className="bg-white border border-slate-300 rounded-xl shadow-md shadow-slate-400/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-blue-600 text-white font-bold border-b border-blue-700 text-xs shadow-xs">
              <tr>
                <th className="py-2.5 px-3.5 font-bold tracking-wide">Nomor & Tanggal</th>
                <th className="py-2.5 px-3.5 font-bold tracking-wide">Perihal / Judul Surat</th>
                <th className="py-2.5 px-3.5 font-bold tracking-wide">Pemohon & Cabang</th>
                <th className="py-2.5 px-3.5 font-bold tracking-wide">Status & Alur</th>
                <th className="py-2.5 px-3.5 font-bold tracking-wide text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLetters.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-slate-600 font-medium">
                    {isInboxView
                      ? 'Belum ada surat yang dibagikan ke Anda.'
                      : 'Tidak ditemukan dokumen yang sesuai dengan kriteria filter.'}
                  </td>
                </tr>
              ) : (
                filteredLetters.map((l) => {
                  const isApproved = l.status === 'approved'

                  return (
                    <tr key={l.id} className="hover:bg-slate-50 transition">
                      <td className="py-2 px-3.5">
                        <span className="font-mono font-black text-indigo-900 block text-xs">
                          {l.letterNumber}
                        </span>
                        {l.sharedWith && l.sharedWith.some((s) => String(s.userId || s.id) === String(currentUser?.id)) && (() => {
                          const myShare = l.sharedWith.find((s) => String(s.userId || s.id) === String(currentUser?.id))
                          return (
                            <div className="mt-1 space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-violet-100 text-violet-800 border border-violet-200 w-fit">
                                <Share2 className="w-2.5 h-2.5 text-violet-600" /> Dibagikan {myShare?.sharedBy ? `oleh ${myShare.sharedBy}` : ''}
                              </span>
                              {myShare?.note && (
                                <p className="text-[10px] text-slate-500 italic truncate max-w-[200px]" title={myShare.note}>
                                  "{myShare.note}"
                                </p>
                              )}
                            </div>
                          )
                        })()}
                        <span className="text-[11px] text-slate-700 font-medium flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>Dibuat: {formatDateTimeId(l.createdAt)}</span>
                        </span>
                      </td>

                      <td className="py-2 px-3.5">
                        <span className="font-extrabold text-slate-900 block text-xs sm:text-sm">
                          {l.title}
                        </span>
                      </td>

                      <td className="py-2 px-3.5">
                        <div className="flex items-center gap-1 text-slate-900">
                          <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="font-bold text-xs">{l.userName}</span>
                        </div>
                        <span className="text-[11px] text-slate-600 font-medium flex items-center gap-1 mt-0.5">
                          <Building className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                          {l.branchName}
                        </span>
                        {l.lastEditedBy && (
                          <span className="text-[10px] text-indigo-900 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded flex items-center gap-1 mt-0.5 font-medium w-fit">
                            Diedit: <strong className="font-bold">{l.lastEditedBy}</strong>
                          </span>
                        )}
                      </td>

                      <td className="py-2 px-3.5">
                        {isInboxView ? (
                          !isSharedLetterRead(l, currentUser) ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-indigo-100 text-indigo-950 border border-indigo-400 shadow-2xs">
                              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                              <span>Belum Dibaca</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Sudah Dibaca</span>
                            </span>
                          )
                        ) : (
                          <>
                            {l.status === 'approved' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-950 border border-emerald-400 shadow-2xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" /> Disetujui Penuh
                              </span>
                            )}
                            {l.status === 'pending' && (() => {
                              if (isLetterAwaitingKnownBy(l)) {
                                const { name: effectiveKnownName } = getEffectiveKnownBy(l)
                                const knownName = effectiveKnownName || l.knownByName || l.fieldValues?.knownByName || 'Pihak Mengetahui'
                                return (
                                  <span
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-950 border border-amber-400 shadow-2xs"
                                    title="Menunggu tanda tangan / persetujuan dari Pihak Mengetahui"
                                  >
                                    <Clock className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                                    <span>{knownName} (Mengetahui)</span>
                                  </span>
                                )
                              }
                              const activeStep = l.approvalHistory?.[l.currentStep - 1]
                              const approverName = getApproverName(activeStep, l)
                              return (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-950 border border-amber-400 shadow-2xs">
                                  <Clock className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                                  <span>{approverName}</span>
                                </span>
                              )
                            })()}
                            {l.status === 'revision' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-orange-100 text-orange-950 border border-orange-400 shadow-2xs">
                                <AlertTriangle className="w-3.5 h-3.5 text-orange-700 shrink-0" /> Perlu Revisi
                              </span>
                            )}
                            {l.status === 'rejected' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-950 border border-rose-400 shadow-2xs">
                                <XCircle className="w-3.5 h-3.5 text-rose-700 shrink-0" /> Ditolak
                              </span>
                            )}
                            {l.status === 'draft' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-slate-200 text-slate-900 border border-slate-400 shadow-2xs">
                                Draf Belum Dikirim
                              </span>
                            )}
                          </>
                        )}
                      </td>

                      <td className="py-2 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Tombol Lihat (Biru - Icon Only) */}
                          <button
                            onClick={() => {
                              if (isInboxView) {
                                markSharedLetterRead(l.id, currentUser, true)
                              }
                              onOpenLetter(l)
                            }}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-xs flex items-center justify-center"
                            title="Lihat Dokumen Surat"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Tombol Toggle Read/Unread khusus Tampilan Kotak Masuk */}
                          {isInboxView && (
                            <button
                              type="button"
                              onClick={() => {
                                const nextRead = !isSharedLetterRead(l, currentUser)
                                markSharedLetterRead(l.id, currentUser, nextRead)
                                notify.success('Status Diperbarui', nextRead ? 'Surat ditandai sudah dibaca' : 'Surat ditandai belum dibaca')
                              }}
                              className={`p-2 rounded-lg transition shadow-xs flex items-center justify-center ${
                                isSharedLetterRead(l, currentUser)
                                  ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              }`}
                              title={isSharedLetterRead(l, currentUser) ? 'Tandai sebagai belum dibaca' : 'Tandai sebagai sudah dibaca'}
                            >
                              {isSharedLetterRead(l, currentUser) ? <Mail className="w-4 h-4" /> : <CheckCheck className="w-4 h-4" />}
                            </button>
                          )}

                          {/* Tombol Cetak Langsung (Slate - Icon Only, Langsung Cetak Tanpa Pratinjau di Layar) */}
                          <button
                            type="button"
                            onClick={() => {
                              if (typeof onDirectPrint === 'function') {
                                onDirectPrint(l)
                              } else {
                                setDirectPrintLetter(l)
                              }
                            }}
                            className="p-2 bg-slate-700 hover:bg-slate-800 active:bg-slate-900 text-white rounded-lg transition shadow-xs flex items-center justify-center"
                            title="Cetak Dokumen Surat (Print / PDF Langsung)"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Tombol Edit (Kuning/Amber - Icon Only, HANYA untuk IT & Pembuat Surat) */}
                          {canUserEditLetter(l, currentUser) && (
                            <button
                              onClick={() => onEditLetter(l)}
                              className="p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition shadow-xs flex items-center justify-center"
                              title="Edit Isi Dokumen Surat"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                          {/* Tombol Approval / Persetujuan Cepat (Hijau Emerald, HANYA tampil jika user berhak approve tahap aktif saat ini) */}
                          {canUserApproveLetter(l) && (
                            <button
                              onClick={() => {
                                setApprovalModalLetter(l)
                                setApprovalActionType('approve')
                                setApprovalNotes('')
                              }}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg transition shadow-xs flex items-center gap-1 font-bold text-xs ring-2 ring-emerald-300 animate-pulse"
                              title={`Persetujuan Surat / Approval (${getApproverName(l.approvalHistory?.[l.currentStep - 1], l)})`}
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>ACC</span>
                            </button>
                          )}

                          {/* Tombol Histori (Ungu/Indigo - Icon Only) */}
                          <button
                            onClick={() => setHistoryLetter(l)}
                            className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-xs flex items-center justify-center"
                            title="Histori & Jejak Audit Lengkap"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          {/* Tombol Diskusi / Chat (Cyan/Teal - Icon Only, HANYA untuk Pembuat, Mengetahui, dan Penyetuju) */}
                          {canUserAccessLetterChat(l, currentUser) && (
                            <button
                              onClick={() => setChatLetter(l)}
                              className="p-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition shadow-xs flex items-center justify-center relative group"
                              title={`Diskusi / Tanya Jawab Surat (${l.comments?.length || 0} Pesan)`}
                            >
                              <MessageSquare className="w-4 h-4" />
                              {l.comments && l.comments.length > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-black rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center border-2 border-white shadow-xs">
                                  {l.comments.length}
                                </span>
                              )}
                            </button>
                          )}

                          {/* Tombol Bagikan Akses Surat (Violet/Indigo - Icon Only) */}
                          {(() => {
                            const currentUid = String(currentUser?.id || '')
                            const currentName = (currentUser?.name || currentUser?.username || '').trim().toLowerCase()
                            const mySharedCount = (l.sharedWith || []).filter((s) => {
                              if (s.sharedById && String(s.sharedById) === currentUid) return true
                              if (s.sharedBy && (s.sharedBy || '').trim().toLowerCase() === currentName) return true
                              return false
                            }).length

                            return (
                              <button
                                type="button"
                                onClick={() => setShareLetter(l)}
                                className="p-2 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white rounded-lg transition shadow-xs flex items-center justify-center relative group"
                                title={`Bagikan Surat ke Pengguna Lain (${mySharedCount} Anda Bagikan)`}
                              >
                                <Share2 className="w-4 h-4" />
                                {mySharedCount > 0 && (
                                  <span className="absolute -top-1.5 -right-1.5 bg-violet-900 text-white text-[9px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center border-2 border-white shadow-xs">
                                    {mySharedCount}
                                  </span>
                                )}
                              </button>
                            )
                          })()}

                          {/* Tombol Hapus (Merah/Rose - Icon Only, HANYA jika masih status Draf / belum diajukan) */}
                          {l.status === 'draft' && (
                            <button
                              onClick={() => handleDeleteDraft(l)}
                              className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition shadow-xs flex items-center justify-center"
                              title="Hapus Draf Surat"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PORTAL CETAK LANGSUNG (TERSEMBUNYI DI LAYAR, HANYA AKTIF SAAT CETAK BROWSER) */}
      {directPrintLetter && (
        <div id="direct-print-portal">
          <LetterDocumentView
            letter={directPrintLetter}
            auditLogs={getAuditLogs(directPrintLetter.id)}
            hideTopBar={true}
            isBuilderPreview={false}
            onReadyToPrint={handleReadyToPrint}
          />
        </div>
      )}

      {/* Indikator Menyiapkan Berkas Cetak */}
      {isPreparingPrint && (
        <div className="no-print fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-3 border border-slate-200 text-center max-w-sm animate-fadeIn">
            <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Menyiapkan Dokumen</h4>
              <p className="text-xs text-slate-500 mt-1">Merender lembar dokumen &amp; lampiran PDF...</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RIWAYAT / HISTORI SURAT LENGKAP */}
      {historyLetter && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">
                    Histori & Jejak Audit Dokumen
                  </h3>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">
                    {historyLetter.letterNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHistoryLetter(null)}
                className="text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 text-xs font-semibold transition"
              >
                ✕ Tutup
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 bg-slate-50 flex-1">
              {/* Ringkasan Identitas Surat */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Perihal / Template
                    </span>
                    <strong className="text-sm text-slate-800 block">
                      {historyLetter.title}
                    </strong>
                    <span className="text-xs text-slate-500">
                      {historyLetter.templateName} &bull; {historyLetter.branchName}
                    </span>
                  </div>
                  <div>
                    {historyLetter.status === 'approved' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Disetujui Penuh
                      </span>
                    )}
                    {historyLetter.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        <Clock className="w-3.5 h-3.5 text-amber-700" /> Menunggu Persetujuan
                      </span>
                    )}
                    {historyLetter.status === 'revision' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-900 border border-orange-300">
                        <AlertTriangle className="w-3.5 h-3.5 text-orange-700" /> Perlu Revisi
                      </span>
                    )}
                    {historyLetter.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
                        <XCircle className="w-3.5 h-3.5 text-rose-700" /> Ditolak
                      </span>
                    )}
                    {historyLetter.status === 'draft' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-800 border border-slate-300">
                        Draf
                      </span>
                    )}
                  </div>
                </div>

                {/* 2-Box Summary Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                      DIBUAT OLEH (PEMOHON):
                    </span>
                    <strong className="text-slate-900 font-bold block text-sm mt-0.5">
                      {historyLetter.userName || historyLetter.createdBy}
                    </strong>
                    <span className="text-[11px] text-slate-600 block">
                      Cabang: {historyLetter.branchName}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-900 flex items-center gap-1 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                      {formatDateTimeId(historyLetter.createdAt)}
                    </span>
                  </div>

                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 block">
                      TERAKHIR DIEDIT OLEH:
                    </span>
                    <strong className="text-slate-900 font-bold block text-sm mt-0.5">
                      {historyLetter.lastEditedBy || (historyLetter.updatedAt && historyLetter.updatedAt !== historyLetter.createdAt ? historyLetter.userName : 'Belum pernah diedit')}
                    </strong>
                    <span className="text-[11px] text-slate-600 block">
                      {historyLetter.lastEditedPosition ? `Jabatan: ${historyLetter.lastEditedPosition}` : (historyLetter.lastEditedBy ? 'Pengguna Sistem' : 'Dokumen asli sesuai saat pembuatan')}
                    </span>
                    <span className="text-[11px] font-semibold text-amber-900 flex items-center gap-1 mt-1">
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                      {historyLetter.lastEditedAt
                        ? formatDateTimeId(historyLetter.lastEditedAt)
                        : (historyLetter.updatedAt && historyLetter.updatedAt !== historyLetter.createdAt
                            ? formatDateTimeId(historyLetter.updatedAt)
                            : '-')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detail Timeline Jejak Audit */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-indigo-600" />
                    <span>Kronologi Lengkap Aktivitas:</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Waktu Real-Time (WIB)
                  </span>
                </div>

                {(() => {
                  const logs = getAuditLogs(historyLetter.id)
                  if (!logs || logs.length === 0) {
                    return (
                      <div className="text-center py-6 text-slate-500 text-xs">
                        Belum ada aktivitas terekam untuk dokumen ini.
                      </div>
                    )
                  }

                  return (
                    <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                      {logs.map((log, idx) => {
                        const isApprove = log.action?.toLowerCase().includes('setuju') || log.action?.toLowerCase().includes('approved')
                        const isReject = log.action?.toLowerCase().includes('tolak') || log.action?.toLowerCase().includes('reject')
                        const isRevision = log.action?.toLowerCase().includes('revisi')
                        const isEdit = log.action?.toLowerCase().includes('edit') || log.action?.toLowerCase().includes('perubahan')
                        const isCreate = log.action?.toLowerCase().includes('buat') || log.action?.toLowerCase().includes('draf')

                        return (
                          <div key={idx} className="relative flex items-start gap-3.5 pl-8">
                            <div
                              className={`absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ring-2 ${
                                isApprove
                                  ? 'bg-emerald-600 ring-emerald-100'
                                  : isReject
                                  ? 'bg-rose-600 ring-rose-100'
                                  : isRevision
                                  ? 'bg-orange-600 ring-orange-100'
                                  : isEdit
                                  ? 'bg-amber-600 ring-amber-100'
                                  : 'bg-indigo-600 ring-indigo-100'
                              }`}
                            />
                            <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs shadow-2xs">
                              <div className="flex flex-wrap justify-between items-center gap-1 mb-1.5">
                                <span
                                  className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                                    isApprove
                                      ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                                      : isReject
                                      ? 'bg-rose-100 text-rose-950 border border-rose-300'
                                      : isRevision
                                      ? 'bg-orange-100 text-orange-950 border border-orange-300'
                                      : isEdit
                                      ? 'bg-amber-100 text-amber-950 border border-amber-300'
                                      : 'bg-indigo-100 text-indigo-950 border border-indigo-300'
                                  }`}
                                >
                                  {log.action}
                                </span>
                                <span className="text-[11px] font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                                  {formatDateTimeId(log.timestamp)}
                                </span>
                              </div>
                              <p className="text-slate-800 font-medium">
                                Oleh: <strong className="font-bold text-slate-950">{log.userName}</strong>
                              </p>
                              {log.notes && (
                                <p className="text-slate-600 text-[11px] mt-1 bg-white p-2 rounded border border-slate-200 italic">
                                  &ldquo;{log.notes}&rdquo;
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-white border-t border-slate-200 flex justify-between items-center text-xs">
              <button
                onClick={() => {
                  const target = historyLetter
                  setHistoryLetter(null)
                  onOpenLetter(target)
                }}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg font-bold flex items-center gap-1.5 transition"
              >
                <Eye className="w-3.5 h-3.5 text-slate-600" />
                <span>Lihat Isi Dokumen Surat</span>
              </button>

              <button
                onClick={() => setHistoryLetter(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL APPROVAL / PERSETUJUAN SURAT CEPAT */}
      {approvalModalLetter && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 bg-emerald-950 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">
                    Persetujuan Surat (Approval)
                  </h3>
                  <p className="text-xs text-emerald-200 font-mono mt-0.5">
                    {approvalModalLetter.letterNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setApprovalModalLetter(null)}
                className="text-emerald-300 hover:text-white px-2 py-1 rounded bg-emerald-900/60 text-xs font-semibold transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <p className="text-slate-500 font-medium">Judul / Perihal:</p>
                <p className="font-bold text-slate-900 text-sm">{approvalModalLetter.title}</p>
                <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200 mt-2">
                  <span>Pemohon: <strong>{approvalModalLetter.userName}</strong></span>
                  <span>Cabang: <strong>{approvalModalLetter.branchName}</strong></span>
                </div>
              </div>

              {/* Action Tabs */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Pilih Keputusan Persetujuan:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setApprovalActionType('approve')}
                    className={`py-2 px-3 rounded-lg font-bold border text-center transition flex items-center justify-center gap-1.5 ${
                      approvalActionType === 'approve'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Setujui</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovalActionType('revision')}
                    className={`py-2 px-3 rounded-lg font-bold border text-center transition flex items-center justify-center gap-1.5 ${
                      approvalActionType === 'revision'
                        ? 'bg-orange-600 text-white border-orange-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Revisi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovalActionType('reject')}
                    className={`py-2 px-3 rounded-lg font-bold border text-center transition flex items-center justify-center gap-1.5 ${
                      approvalActionType === 'reject'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Tolak</span>
                  </button>
                </div>
              </div>

              {/* Notes Input */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Catatan {approvalActionType === 'approve' ? '(Opsional)' : '(Wajib Diisi)'}:
                </label>
                <textarea
                  rows={3}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder={
                    approvalActionType === 'approve'
                      ? 'Catatan persetujuan (contoh: Disetujui sesuai rincian anggaran operasional)'
                      : approvalActionType === 'revision'
                      ? 'Tuliskan bagian rincian atau poin yang perlu direvisi oleh pemohon...'
                      : 'Tuliskan alasan penolakan surat ajuan ini...'
                  }
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setApprovalModalLetter(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-semibold transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if ((approvalActionType === 'revision' || approvalActionType === 'reject') && !approvalNotes.trim()) {
                    notify.warning('Catatan Wajib Diisi', 'Catatan wajib diisi untuk penolakan atau permintaan revisi!')
                    return
                  }

                  let updated
                  if (approvalActionType === 'approve') {
                    const isKnown = isLetterAwaitingKnownBy(approvalModalLetter)
                    updated = approveLetter(approvalModalLetter.id, approvalNotes)
                    if (isKnown) {
                      notify.success('Tanda Tangan Mengetahui Sah!', `Surat ${approvalModalLetter.letterNumber} telah disetujui Pihak Mengetahui dan diteruskan ke pejabat penyetuju.`)
                    } else {
                      notify.success('Surat Disetujui!', `Surat ${approvalModalLetter.letterNumber} berhasil disetujui & diverifikasi sah.`)
                    }
                  } else if (approvalActionType === 'revision') {
                    updated = requestRevisionLetter(approvalModalLetter.id, approvalNotes)
                    notify.warning('Dikembalikan ke Pemohon', `Surat ${approvalModalLetter.letterNumber} dikembalikan untuk revisi.`)
                  } else if (approvalActionType === 'reject') {
                    updated = rejectLetter(approvalModalLetter.id, approvalNotes)
                    notify.error('Surat Ditolak', `Surat ${approvalModalLetter.letterNumber} telah ditolak.`)
                  }

                  setApprovalModalLetter(null)
                  setApprovalNotes('')
                }}
                className={`px-5 py-2 font-bold text-white rounded-lg transition shadow-xs ${
                  approvalActionType === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : approvalActionType === 'revision'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {approvalActionType === 'approve' && (
                  isLetterAwaitingKnownBy(approvalModalLetter)
                    ? 'Konfirmasi Tanda Tangan Mengetahui'
                    : 'Konfirmasi Setujui Surat'
                )}
                {approvalActionType === 'revision' && 'Kirim Permintaan Revisi'}
                {approvalActionType === 'reject' && 'Simpan Penolakan Surat'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DISKUSI / CHAT SURAT */}
      {chatLetter && (
        <LetterChatModal
          letterId={chatLetter.id}
          initialLetter={chatLetter}
          currentUser={currentUser}
          onClose={() => {
            setChatLetter(null)
            setLocalLetters(getLetters())
          }}
        />
      )}

      {/* MODAL BAGIKAN SURAT */}
      {shareLetter && (
        <ShareLetterModal
          letter={shareLetter}
          currentUser={currentUser}
          onClose={() => setShareLetter(null)}
          onUpdated={() => {
            setLocalLetters(getLetters())
          }}
        />
      )}
    </div>
  )
}
