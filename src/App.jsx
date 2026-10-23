import React, { useState, useEffect, useRef, useCallback } from 'react'
import ReactDOM from 'react-dom'
import AdminLayout from './components/AdminLayout'
import Dashboard from './components/Dashboard'
import TemplateCatalog from './components/TemplateCatalog'
import LetterFormBuilder from './components/LetterFormBuilder'
import LetterList from './components/LetterList'
import ApproverInbox, { canUserApproveLetter } from './components/ApproverInbox'
import AdminTemplateManager from './components/AdminTemplateManager'
import BranchMaster from './components/BranchMaster'
import UserMaster from './components/UserMaster'
import LetterDocumentView from './components/LetterDocumentView'
import LoginForm from './components/LoginForm'
import MobileLayout from './mobile/MobileLayout'
import {
  initializeStorage,
  syncWithDatabase,
  getCurrentUser,
  clearCurrentUser,
  getLetters,
  getTemplates,
  BLANK_TEMPLATE,
  getBranches,
  getLetterById,
  getAuditLogs,
  approveLetter,
  rejectLetter,
  requestRevisionLetter,
  updateLetterApprovalNotes,
  canUserEditLetter,
} from './services/storage'
import { notify } from './utils/alert'
import { isCrmOrIt, isDirekturUser } from './utils'

export default function App() {
  const getInitialMenu = () => {
    const user = getCurrentUser()
    const hash = window.location.hash.replace(/^#\/?/, '')
    if (isDirekturUser(user)) {
      if (!hash || hash === 'dashboard' || hash === 'templates' || hash === 'builder') {
        return 'letters'
      }
      return hash
    }
    if (hash && hash !== 'dashboard') return hash
    const saved = localStorage.getItem('suratajuan_active_menu')
    if (saved && saved !== 'dashboard') return saved
    return 'letters'
  }

  const [currentUser, setCurrentUser] = useState(null)
  const [activeMenu, setActiveMenuState] = useState(getInitialMenu)
  const [letters, setLetters] = useState([])
  const [templates, setTemplates] = useState([])
  const [branches, setBranches] = useState([])

  // Mobile mode toggle & detection
  const [isMobileMode, setIsMobileMode] = useState(() => {
    const saved = localStorage.getItem('suratajuan_view_mode')
    if (saved === 'mobile') return true
    if (saved === 'desktop') return false
    return typeof window !== 'undefined' && window.innerWidth < 768
  })

  const switchToMobile = () => {
    setIsMobileMode(true)
    localStorage.setItem('suratajuan_view_mode', 'mobile')
  }

  const switchToDesktop = () => {
    setIsMobileMode(false)
    localStorage.setItem('suratajuan_view_mode', 'desktop')
  }

  // Selection states
  const [selectedTemplateForNew, setSelectedTemplateForNew] = useState(null)
  const [editingLetter, setEditingLetter] = useState(null)
  const [previewingLetter, setPreviewingLetter] = useState(null)
  const [directPrintLetter, setDirectPrintLetter] = useState(null)
  const [isPreparingPrint, setIsPreparingPrint] = useState(false)
  const printTimeoutRef = useRef(null)

  const handleDirectPrint = (ltr) => {
    if (!ltr) return
    setIsPreparingPrint(true)
    setDirectPrintLetter(ltr)
  }

  const handleReadyToPrint = useCallback(() => {
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

  useEffect(() => {
    if (directPrintLetter) {
      printTimeoutRef.current = setTimeout(() => {
        handleReadyToPrint()
      }, 10000)
      return () => {
        if (printTimeoutRef.current) clearTimeout(printTimeoutRef.current)
      }
    }
  }, [directPrintLetter, handleReadyToPrint])

  const setActiveMenu = (menu) => {
    setActiveMenuState(menu)
    window.location.hash = `#${menu}`
    localStorage.setItem('suratajuan_active_menu', menu)
  }

  // Initialize storage once & listen to hash & auth changes
  useEffect(() => {
    initializeStorage().then(() => {
      refreshAll()
    })
    refreshAll()

    const handleAuthChange = () => {
      setCurrentUser(getCurrentUser())
      refreshAll()
    }

    const checkViewParam = () => {
      const urlParams = new URLSearchParams(window.location.search)
      let viewId = urlParams.get('view')
      if (!viewId && window.location.hash.includes('view=')) {
        const hashQuery = window.location.hash.split('?')[1]
        if (hashQuery) {
          const hashParams = new URLSearchParams(hashQuery)
          viewId = hashParams.get('view')
        }
      }
      if (viewId) {
        const all = getLetters()
        const target = all.find((l) => l.id === viewId)
        if (target) {
          setPreviewingLetter(target)
        }
      }
    }

    const handleHashChange = () => {
      const rawHash = window.location.hash.replace(/^#\/?/, '')
      const cleanHash = rawHash.split('?')[0]
      if (cleanHash && cleanHash !== activeMenu) {
        setActiveMenuState(cleanHash)
      }
      checkViewParam()
    }

    const handleTemplatesChange = () => {
      setTemplates(getTemplates())
    }

    const handleBranchesChange = () => {
      setBranches(getBranches())
    }

    const handleLettersChange = () => {
      setLetters(getLetters())
      checkViewParam()
    }

    // Periksa parameter view saat pertama kali dimuat
    setTimeout(checkViewParam, 500)

    // Set initial hash if missing
    if (!window.location.hash) {
      window.location.hash = `#${activeMenu}`
    }

    // Auto-sync berkala dari API database agar revisi/ACC realtime
    const pollInterval = setInterval(() => {
      syncWithDatabase().catch(() => {})
    }, 4000)

    const handleFocus = () => {
      syncWithDatabase().catch(() => {})
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('auth_change', handleAuthChange)
    window.addEventListener('hashchange', handleHashChange)
    window.addEventListener('templates_change', handleTemplatesChange)
    window.addEventListener('branches_change', handleBranchesChange)
    window.addEventListener('letters_change', handleLettersChange)
    return () => {
      clearInterval(pollInterval)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('auth_change', handleAuthChange)
      window.removeEventListener('hashchange', handleHashChange)
      window.removeEventListener('templates_change', handleTemplatesChange)
      window.removeEventListener('branches_change', handleBranchesChange)
      window.removeEventListener('letters_change', handleLettersChange)
    }
  }, [])

  const refreshAll = () => {
    const user = getCurrentUser()
    setCurrentUser(user)
    setLetters(getLetters())
    setTemplates(getTemplates())
    setBranches(getBranches())
  }

  // Direktur tidak ada menu Dashboard maupun Buat Surat Ajuan
  useEffect(() => {
    if (isDirekturUser(currentUser)) {
      if (activeMenu === 'dashboard' || activeMenu === 'templates' || activeMenu === 'builder') {
        setActiveMenu('letters')
      }
    }
  }, [currentUser, activeMenu])

  // Auto-restore builder state if user refreshes page while on #builder
  useEffect(() => {
    if (activeMenu === 'builder' && !selectedTemplateForNew && templates.length > 0) {
      const savedTplId = localStorage.getItem('suratajuan_active_builder_template_id')
      const savedLetterId = localStorage.getItem('suratajuan_active_builder_letter_id')

      let tpl = templates.find((t) => t.id === savedTplId)
      if (!tpl && savedTplId === 'custom_blank') {
        tpl = BLANK_TEMPLATE
      }
      if (!tpl && savedTplId) {
        tpl = templates.find((t) => t.code === savedTplId || t.name === savedTplId)
      }
      if (!tpl) {
        tpl = templates[0] || BLANK_TEMPLATE // fallback
      }

      if (tpl) {
        setSelectedTemplateForNew(tpl)
        if (savedLetterId) {
          const allLetters = getLetters()
          const ltr = allLetters.find((l) => l.id === savedLetterId)
          if (ltr) setEditingLetter(ltr)
        }
      } else {
        setActiveMenu('templates')
      }
    }
  }, [activeMenu, templates, selectedTemplateForNew])

  const handleStartNewLetter = (template) => {
    setSelectedTemplateForNew(template)
    setEditingLetter(null)
    if (template?.id) {
      localStorage.setItem('suratajuan_active_builder_template_id', template.id)
    }
    localStorage.removeItem('suratajuan_active_builder_letter_id')
    setActiveMenu('builder')
  }

  const handleEditLetter = (letter) => {
    const tpl =
      templates.find((t) => t.id === letter.templateId) ||
      templates.find((t) => t.name === letter.templateName || t.code === letter.templateCode) ||
      templates[0]
    if (tpl) {
      setSelectedTemplateForNew(tpl)
      setEditingLetter(letter)
      if (tpl.id) {
        localStorage.setItem('suratajuan_active_builder_template_id', tpl.id)
      }
      if (letter.id) {
        localStorage.setItem('suratajuan_active_builder_letter_id', letter.id)
      }
      setActiveMenu('builder')
    }
  }

  const handleLetterSavedOrSubmitted = (savedLetter) => {
    localStorage.removeItem('suratajuan_active_builder_template_id')
    localStorage.removeItem('suratajuan_active_builder_letter_id')
    refreshAll()
    setSelectedTemplateForNew(null)
    setEditingLetter(null)
    setActiveMenu('letters')
  }

  const handleOpenLetterById = (letterId) => {
    const ltr = getLetterById(letterId)
    if (ltr) {
      setPreviewingLetter(ltr)
    }
  }

  if (!currentUser) {
    return (
      <LoginForm
        onLoginSuccess={(user) => {
          setCurrentUser(user)
          refreshAll()
        }}
      />
    )
  }

  const pendingCount = currentUser?.role === 'admin_pusat'
    ? letters.filter((l) => l.status === 'pending').length
    : letters.filter((l) => canUserApproveLetter(l, currentUser)).length

  // Render Mobile Layout jika dalam mode mobile
  if (isMobileMode) {
    return (
      <MobileLayout
        currentUser={currentUser}
        letters={letters}
        branches={branches}
        onLogout={() => {
          clearCurrentUser()
          setCurrentUser(null)
        }}
        onSwitchToDesktop={switchToDesktop}
        onSwitchUser={(user) => {
          setCurrentUser(user)
          refreshAll()
        }}
        onApproveLetter={(id, note) => {
          const updated = approveLetter(id, note)
          if (updated) {
            refreshAll()
            notify.success('Surat Disetujui!', 'Surat berhasil disetujui & diverifikasi sah.')
          }
        }}
        onRejectLetter={(id, reason) => {
          const updated = rejectLetter(id, reason)
          if (updated) {
            refreshAll()
            notify.warning('Surat Ditolak', 'Surat telah ditolak.')
          }
        }}
        onRequestRevision={(id, note) => {
          const updated = requestRevisionLetter(id, note)
          if (updated) {
            refreshAll()
            notify.warning('Minta Revisi', 'Surat dikembalikan untuk revisi.')
          }
        }}
        onUpdateNotes={(id, idx, note) => {
          const updated = updateLetterApprovalNotes(id, idx, note)
          if (updated) {
            refreshAll()
            notify.success('Catatan Diperbarui', 'Catatan persetujuan berhasil diperbarui.')
          }
        }}
      />
    )
  }

  return (
    <>
    <AdminLayout
      activeMenu={activeMenu}
      onSwitchToMobile={switchToMobile}
      onMenuChange={(menu) => {
        setSelectedTemplateForNew(null)
        setEditingLetter(null)
        if (menu === 'templates' || menu === 'dashboard') {
          setTemplates(getTemplates())
        }
        setActiveMenu(menu)
      }}
      pendingCount={pendingCount}
      onOpenLetterById={handleOpenLetterById}
      onLogout={() => {
        clearCurrentUser()
        setCurrentUser(null)
      }}
    >
      {/* Dynamic Views */}
      {activeMenu === 'dashboard' && (
        <Dashboard
          user={currentUser}
          letters={letters}
          templates={templates}
          branches={branches}
          onNavigate={(menu) => setActiveMenu(menu)}
          onOpenLetter={(ltr) => setPreviewingLetter(ltr)}
        />
      )}

      {activeMenu === 'templates' && (
        <TemplateCatalog
          templates={templates}
          onSelectTemplate={handleStartNewLetter}
        />
      )}

      {activeMenu === 'builder' && (
        selectedTemplateForNew ? (
          <LetterFormBuilder
            template={selectedTemplateForNew}
            initialLetter={editingLetter}
            onSaved={handleLetterSavedOrSubmitted}
            onCancel={() => {
              localStorage.removeItem('suratajuan_active_builder_template_id')
              localStorage.removeItem('suratajuan_active_builder_letter_id')
              setSelectedTemplateForNew(null)
              setEditingLetter(null)
              setActiveMenu('templates')
            }}
          />
        ) : (
          <div className="bg-white rounded-xl border border-slate-200/90 p-8 text-center max-w-md mx-auto my-12 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <span className="animate-spin text-lg">⏳</span>
            </div>
            <p className="text-xs font-bold text-slate-700">Memuat formulir pengajuan...</p>
            <p className="text-[11px] text-slate-400">Jika tidak berpindah otomatis, klik tombol di bawah:</p>
            <button
              onClick={() => setActiveMenu('templates')}
              className="px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
            >
              Pilih Template Surat
            </button>
          </div>
        )
      )}

      {activeMenu === 'letters' && (
        <LetterList
          letters={letters}
          currentUser={currentUser}
          branches={branches}
          templates={templates}
          onOpenLetter={(ltr) => setPreviewingLetter(ltr)}
          onEditLetter={handleEditLetter}
          onDirectPrint={handleDirectPrint}
        />
      )}

      {activeMenu === 'approvals' && (
        <LetterList
          letters={letters}
          currentUser={currentUser}
          branches={branches}
          templates={templates}
          initialStatusFilter="pending"
          onOpenLetter={(ltr) => setPreviewingLetter(ltr)}
          onEditLetter={handleEditLetter}
          onDirectPrint={handleDirectPrint}
        />
      )}

      {activeMenu === 'admin_templates' && (
        isCrmOrIt(currentUser) ? (
          <AdminTemplateManager
            onSelectTemplateForLetter={handleStartNewLetter}
          />
        ) : (
          <Dashboard
            currentUser={currentUser}
            letters={letters}
            templates={templates}
            onNavigate={(m) => handleMenuChange(m)}
            onOpenLetter={(ltr) => setPreviewingLetter(ltr)}
          />
        )
      )}

      {activeMenu === 'branches' && (
        isCrmOrIt(currentUser) ? (
          <BranchMaster />
        ) : (
          <Dashboard
            currentUser={currentUser}
            letters={letters}
            templates={templates}
            onNavigate={(m) => handleMenuChange(m)}
            onOpenLetter={(ltr) => setPreviewingLetter(ltr)}
          />
        )
      )}

      {/* Standalone Letter Modal View (for viewing anywhere) */}
      {previewingLetter && (
        <div className="print-modal-backdrop fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:m-0 print:bg-white print:static print:overflow-visible">
          <div className="print-modal-content bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:max-w-none print:max-h-none print:shadow-none print:border-none print:rounded-none print:overflow-visible">
            <div className="no-print p-3 bg-[#0b132b] text-white flex justify-between items-center text-xs">
              <span className="font-semibold tracking-wide">
                Pratinjau Resmi: {previewingLetter.letterNumber}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleDirectPrint(previewingLetter)
                  }}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs active:scale-95"
                  title="Cetak langsung dokumen resmi"
                >
                  <span>🖨 Cetak</span>
                </button>
                <button
                  onClick={() => setPreviewingLetter(null)}
                  className="text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-semibold"
                >
                  ✕ Tutup
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100 print:p-0 print:m-0 print:bg-white print:overflow-visible">
              <LetterDocumentView
                letter={previewingLetter}
                auditLogs={getAuditLogs(previewingLetter.id)}
                onClose={() => setPreviewingLetter(null)}
                onEdit={(ltr) => {
                  setPreviewingLetter(null)
                  handleEditLetter(ltr)
                }}
              />
            </div>
            {/* Modal Footer: Action Bar di Bawah */}
            <div className="no-print p-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Status:</span>
                <strong
                  className={`uppercase font-bold px-2.5 py-1 rounded-md text-xs border transition ${
                    previewingLetter.status === 'approved'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : previewingLetter.status === 'rejected'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : previewingLetter.status === 'revision'
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  }`}
                >
                  {previewingLetter.status === 'approved' ? 'APPROVED' : previewingLetter.status}
                </strong>
              </div>

              <div className="flex items-center gap-2">
                {canUserEditLetter(previewingLetter, currentUser) && (
                  <button
                    onClick={() => {
                      const ltr = previewingLetter
                      setPreviewingLetter(null)
                      handleEditLetter(ltr)
                    }}
                    className="px-3 py-1.5 text-white bg-amber-600 hover:bg-amber-500 rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1"
                    title="Edit isi surat"
                  >
                    Edit Dokumen
                  </button>
                )}

                <button
                  onClick={() => setPreviewingLetter(null)}
                  className="px-4 py-1.5 text-white bg-slate-900 hover:bg-slate-800 rounded-lg text-xs font-bold transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>

    {/* Direct Print Portal: Terpasang di luar #root (di #print-mount-point) agar tidak ada modal & halaman 1 tidak kosong */}
    {directPrintLetter && typeof document !== 'undefined' && document.getElementById('print-mount-point') &&
      ReactDOM.createPortal(
        <div id="direct-print-portal" style={{ background: '#fff', width: '100%' }}>
          <LetterDocumentView
            letter={directPrintLetter}
            auditLogs={getAuditLogs(directPrintLetter.id)}
            hideTopBar={true}
            isBuilderPreview={false}
            onReadyToPrint={handleReadyToPrint}
          />
        </div>,
        document.getElementById('print-mount-point')
      )
    }

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
    </>
  )
}
