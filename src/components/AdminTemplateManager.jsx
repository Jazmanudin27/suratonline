import React, { useState, useEffect } from 'react'
import {
  Plus,
  Edit,
  Copy,
  Trash2,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Layers,
  Settings,
  Tag,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  ListPlus,
  ShieldCheck,
  Code,
  FileCode,
  X,
  UserCheck,
  Eye,
  Users,
  User,
  Building,
  Search,
  Check,
  FileText,
  Paperclip,
  Maximize2,
  Minimize2,
  Sparkles,
  Save,
  Clock,
  Send,
  HelpCircle,
  Sliders,
  DollarSign,
  List,
  LayoutGrid,
  RotateCw,
} from 'lucide-react'
import RichEditor from './RichEditor'
import SearchableSelect from './SearchableSelect'
import LetterDocumentView from './LetterDocumentView'
import AttachmentUploader from './AttachmentUploader'
import {
  getTemplates,
  saveTemplate,
  toggleTemplateStatus,
  deleteTemplate,
  getLetters,
  getBranches,
  getUsers,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  compileTemplateContent,
  formatDateId,
  getGlobalDefaultViewers,
  saveGlobalDefaultViewers,
  getJabatan,
  HRD_JABATAN,
} from '../services/storage'
import Swal, { notify } from '../utils/alert'

export default function AdminTemplateManager({ onSelectTemplateForLetter }) {
  const [templates, setTemplates] = useState(getTemplates())
  const [usersList, setUsersList] = useState(getUsers())
  const [lettersList, setLettersList] = useState(getLetters())
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [approverModalTemplate, setApproverModalTemplate] = useState(null)
  const [reviewModalTemplate, setReviewModalTemplate] = useState(null)
  
  // 2 Langkah Identik dengan Buat Surat Ajuan: 'form' (Form Isian) & 'preview' (Pratinjau & Review Surat)
  const [activeTab, setActiveTab] = useState('form') 
  const [showAttachmentManager, setShowAttachmentManager] = useState(false)
  const [isWordFullscreen, setIsWordFullscreen] = useState(false)

  const branches = getBranches()
  const [categories, setCategories] = useState(getCategories())
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategory, setEditingCategory] = useState({ oldName: '', newName: '' })
  const [globalDefaultViewers, setGlobalDefaultViewers] = useState(getGlobalDefaultViewers())
  const [showGlobalViewerModal, setShowGlobalViewerModal] = useState(false)
  const [viewerSearchQuery, setViewerSearchQuery] = useState('')
  const [viewerBranchFilter, setViewerBranchFilter] = useState('ALL')
  const [jabatanList, setJabatanList] = useState(getJabatan())
  const [viewMode, setViewMode] = useState('table') // 'table' | 'grid'
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isWordFullscreen) {
        setIsWordFullscreen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isWordFullscreen])

  const refreshList = () => {
    setTemplates(getTemplates())
    setLettersList(getLetters())
    setJabatanList(getJabatan())
    setUsersList(getUsers())
    setCategories(getCategories())
  }

  useEffect(() => {
    const handleCatChange = () => setCategories(getCategories())
    const handleGlobalViewersChange = () => setGlobalDefaultViewers(getGlobalDefaultViewers())
    const handleTplChange = () => setTemplates(getTemplates())
    const handleJabatanChange = () => setJabatanList(getJabatan())
    const handleUsersChange = () => setUsersList(getUsers())
    window.addEventListener('categories_change', handleCatChange)
    window.addEventListener('global_viewers_change', handleGlobalViewersChange)
    window.addEventListener('templates_change', handleTplChange)
    window.addEventListener('jabatan_change', handleJabatanChange)
    window.addEventListener('users_change', handleUsersChange)
    return () => {
      window.removeEventListener('categories_change', handleCatChange)
      window.removeEventListener('global_viewers_change', handleGlobalViewersChange)
      window.removeEventListener('templates_change', handleTplChange)
      window.removeEventListener('jabatan_change', handleJabatanChange)
      window.removeEventListener('users_change', handleUsersChange)
    }
  }, [])

  const handleToggleActive = (id) => {
    const updated = toggleTemplateStatus(id)
    setTemplates(updated)
  }

  const handleCreateNew = () => {
    setEditingTemplate({
      name: '',
      code: '',
      category: categories[0] || 'Operasional',
      description: '',
      numberFormat: '{{seq}}/{{code}}/{{branch_code}}/{{roman_month}}/{{year}}',
      allowedBranches: ['all'],
      isActive: true,
      hasNominalLimit: false,
      nominalField: 'total_biaya',
      attachments: [],
      approvalSteps: [
        { step: 1, title: 'Persetujuan Kepala Cabang', approverRole: 'Kepala Cabang', kodeJabatan: 'J08', maxAmount: null },
      ],
      fields: [
        { id: `f_${Date.now()}_1`, label: 'Nama Pemohon', name: 'nama_pemohon', type: 'text', required: true },
        { id: `f_${Date.now()}_2`, label: 'Keperluan / Perihal', name: 'perihal', type: 'text', required: true },
      ],
      letterTemplate: `
<table style="width: 100%; border: none; border-collapse: collapse; margin-bottom: 14px; font-family: Tahoma, Arial, sans-serif; font-size: 11pt; table-layout: fixed;">
  <tbody>
    <tr>
      <td style="width: 15%; vertical-align: top; padding: 2px 0;"><strong>Nomor</strong></td>
      <td style="width: 3%; vertical-align: top; padding: 2px 0;">:</td>
      <td style="vertical-align: top; padding: 2px 0;">{{nomor_surat}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; padding: 2px 0;"><strong>Lampiran</strong></td>
      <td style="vertical-align: top; padding: 2px 0;">:</td>
      <td style="vertical-align: top; padding: 2px 0;">-</td>
    </tr>
    <tr>
      <td style="vertical-align: top; padding: 2px 0;"><strong>Perihal</strong></td>
      <td style="vertical-align: top; padding: 2px 0;">:</td>
      <td style="vertical-align: top; padding: 2px 0;"><strong>{{perihal}}</strong></td>
    </tr>
    <tr>
      <td style="vertical-align: top; padding: 2px 0;"><strong>Dari</strong></td>
      <td style="vertical-align: top; padding: 2px 0;">:</td>
      <td style="vertical-align: top; padding: 2px 0;">{{nama_pemohon}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; padding: 2px 0;"><strong>Kepada</strong></td>
      <td style="vertical-align: top; padding: 2px 0;">:</td>
      <td style="vertical-align: top; padding: 2px 0;">Yth. [Pimpinan / Manajer Terkait]</td>
    </tr>
  </tbody>
</table>
<p><br></p>
<p>Dengan hormat,</p>
<p>Bersama surat ini kami mengajukan permohonan sebagaimana perihal di atas dengan uraian sebagai berikut:</p>
<p><br></p>
`,
    })
    setActiveTab('form')
  }

  const handleDuplicateTemplate = async (tpl) => {
    const dup = JSON.parse(JSON.stringify(tpl))
    delete dup.id
    dup.name = `${tpl.name} (Salinan)`

    // Pastikan kode template salinan selalu unik dan tidak bentrok dengan template asli
    const cleanBaseCode = (tpl.code || 'SP')
      .replace(/(_COPY|_CP)[\w]*/gi, '')
      .replace(/[^A-Za-z0-9]/g, '_')
      .slice(0, 8)
      .toUpperCase()
    const uniqueSuffix = `_CP${Date.now().toString(36).slice(-4).toUpperCase()}`
    dup.code = `${cleanBaseCode}${uniqueSuffix}`
    dup.isActive = true

    const res = await saveTemplate(dup)
    if (res && res.success === false) {
      notify.error(
        'Gagal Menyimpan ke Database',
        res.message || 'Terjadi kesalahan saat menyimpan ke database MySQL.'
      )
      return
    }
    refreshList()
    notify.success(
      'Template Diduplikasi',
      `Berhasil membuat salinan template "${tpl.name}" dan tersimpan ke database.`
    )
  }

  const handleDeleteTemplate = async (tpl) => {
    if (!tpl) return

    // 1. Validasi jika template sudah pernah digunakan dalam surat
    const usageCount = lettersList.filter((l) => l.templateId === tpl.id).length
    if (usageCount > 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Template Tidak Dapat Dihapus',
        html: `
          <div class="text-left text-xs text-slate-600 space-y-2 mt-2">
            <p>Template surat <b>"${tpl.name}"</b> sudah digunakan dalam <b>${usageCount} surat ajuan</b> resmi.</p>
            <p class="text-slate-500">Untuk menjaga arsip dan riwayat surat yang sudah terbit, template ini tidak dapat dihapus. Anda dapat <b>menonaktifkan</b> statusnya agar tidak lagi dipilih saat membuat surat baru.</p>
          </div>
        `,
        confirmButtonText: 'Mengerti',
        confirmButtonColor: '#3b82f6',
        customClass: {
          popup: 'rounded-2xl font-sans p-6 shadow-2xl border border-slate-100',
          title: 'text-base font-bold text-slate-900',
          confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-md',
        },
      })
      return
    }

    // 2. SweetAlert Konfirmasi Hapus dengan Tombol Berwarna Jelas
    const result = await Swal.fire({
      title: 'Hapus Template Surat?',
      html: `
        <div class="text-left text-xs text-slate-600 space-y-2.5 mt-2">
          <p>Apakah Anda yakin ingin menghapus template surat ini secara permanen?</p>
          <div class="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1 shadow-2xs">
            <div class="font-extrabold text-sm text-rose-950">${tpl.name}</div>
            <div class="text-rose-700 font-mono text-[11px] flex flex-wrap gap-x-2">
              <span>Kode: <b>${tpl.code || '-'}</b></span>
              <span>&bull;</span>
              <span>Kategori: <b>${tpl.category || 'Umum'}</b></span>
            </div>
          </div>
          <p class="text-[11px] text-rose-600 font-medium">⚠️ Template yang sudah dihapus tidak dapat dipulihkan kembali.</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus Sekarang',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#e11d48', // Merah / Rose tegas
      cancelButtonColor: '#64748b',  // Abu-abu Slate
      reverseButtons: true,
      focusCancel: true,
      buttonsStyling: true,
      customClass: {
        popup: 'rounded-3xl font-sans p-6 shadow-2xl border border-slate-100',
        title: 'text-lg font-black text-slate-900',
        confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-xs shadow-md bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white cursor-pointer transition',
        cancelButton: 'px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-500 hover:bg-slate-600 text-white cursor-pointer transition',
      },
    })

    if (!result.isConfirmed) return

    const res = deleteTemplate(tpl.id)
    if (!res.success) {
      notify.warning('Gagal Menghapus', res.message)
    } else {
      notify.success('Template Dihapus', `Template "${tpl.name}" telah berhasil dihapus.`)
      if (editingTemplate && editingTemplate.id === tpl.id) {
        setEditingTemplate(null)
        setIsWordFullscreen(false)
        setShowAttachmentManager(false)
      }
      refreshList()
    }
  }

  const handleAddField = () => {
    const newField = {
      id: `f_${Date.now()}`,
      label: 'Field Baru',
      name: `field_${Date.now().toString(36)}`,
      type: 'text',
      required: false,
      placeholder: '',
      options: ['Opsi 1', 'Opsi 2'],
    }
    setEditingTemplate({
      ...editingTemplate,
      fields: [...(editingTemplate.fields || []), newField],
    })
  }

  const handleUpdateField = (index, key, value) => {
    const fields = [...editingTemplate.fields]
    fields[index][key] = value
    setEditingTemplate({ ...editingTemplate, fields })
  }

  const handleRemoveField = (index) => {
    const fields = editingTemplate.fields.filter((_, i) => i !== index)
    setEditingTemplate({ ...editingTemplate, fields })
  }

  const handleAddApprovalStep = () => {
    const steps = [...(editingTemplate.approvalSteps || [])]
    const nextStepNum = steps.length + 1
    steps.push({
      step: nextStepNum,
      title: `Persetujuan Tahap ${nextStepNum}`,
      approverRole: nextStepNum === 2 ? 'Manajer Area' : 'Pimpinan Pusat',
      kodeJabatan: '',
      maxAmount: null,
    })
    setEditingTemplate({ ...editingTemplate, approvalSteps: steps })
  }

  const handleRemoveApprovalStep = (index) => {
    const steps = editingTemplate.approvalSteps
      .filter((_, i) => i !== index)
      .map((s, idx) => ({ ...s, step: idx + 1 }))
    setEditingTemplate({ ...editingTemplate, approvalSteps: steps })
  }

  const handleProceedToPreview = () => {
    if (!editingTemplate.name?.trim()) {
      notify.warning('Nama Wajib Diisi', 'Silakan isi Nama Template Surat terlebih dahulu.')
      return
    }
    const autoCode =
      editingTemplate.code?.trim() ||
      editingTemplate.name
        .trim()
        .replace(/[^A-Za-z0-9]/g, '_')
        .slice(0, 15)
        .toUpperCase() ||
      'SURAT'
    setEditingTemplate((prev) => ({
      ...prev,
      code: autoCode,
      allowedBranches: prev.allowedBranches?.length ? prev.allowedBranches : ['all'],
    }))
    setActiveTab('preview')
  }

  const handleSaveTemplate = async () => {
    if (!editingTemplate.name?.trim()) {
      notify.warning('Nama Template Kosong', 'Nama Template Surat wajib diisi!')
      return
    }
    const autoCode =
      editingTemplate.code?.trim() ||
      editingTemplate.name
        .trim()
        .replace(/[^A-Za-z0-9]/g, '_')
        .slice(0, 15)
        .toUpperCase() ||
      'SURAT'
    const toSave = {
      ...editingTemplate,
      code: autoCode,
      allowedBranches: editingTemplate.allowedBranches?.length ? editingTemplate.allowedBranches : ['all'],
    }

    const res = await saveTemplate(toSave)
    if (res && res.success === false) {
      notify.error('Gagal Menyimpan', res.message || 'Gagal menyimpan template ke database MySQL.')
      return
    }
    notify.success('Template Tersimpan', `Template "${editingTemplate.name}" berhasil disimpan ke sistem!`)
    setEditingTemplate(null)
    setIsWordFullscreen(false)
    setShowAttachmentManager(false)
    refreshList()
  }

  // Generate Sample Document Object for Live LetterDocumentView Preview
  const generatePreviewLetter = (tpl) => {
    if (!tpl) return null
    const sampleValues = {
      nama_pemohon: 'Jazmanudin',
      jabatan: 'IT & Administrator Sistem',
      nama_cabang: 'Cabang Tasikmalaya',
      cabang: 'Cabang Tasikmalaya',
      perihal: tpl.name || 'Permohonan Operasional',
      ringkasan: 'Sehubungan dengan kebutuhan peningkatan efisiensi sistem, bersama ini kami mengajukan permohonan persetujuan resmi sesuai template yang telah dirancang.',
    }

    ;(tpl.fields || []).forEach((f) => {
      if (!sampleValues[f.name]) {
        if (f.type === 'number') sampleValues[f.name] = '1500000'
        else if (f.type === 'date') sampleValues[f.name] = formatDateId(new Date())
        else sampleValues[f.name] = `[${f.label}]`
      }
    })

    const sampleNumber = tpl.numberFormat
      ? tpl.numberFormat
          .replace('{{seq}}', '001')
          .replace('{{code}}', tpl.code || 'SP')
          .replace('{{branch_code}}', 'TSM')
          .replace('{{roman_month}}', 'X')
          .replace('{{year}}', new Date().getFullYear())
      : '001/SP/TSM/X/2026'

    const compiledContent = compileTemplateContent(tpl, sampleValues, {
      nomor_surat: sampleNumber,
      nama_cabang: 'Cabang Tasikmalaya',
      tanggal_surat: formatDateId(new Date()),
    })

    const approvalHistory = (tpl.approvalSteps || []).map((step, idx) => ({
      step: step.step || idx + 1,
      title: step.title || `Persetujuan Tahap ${idx + 1}`,
      approverRole: step.approverRole || 'Pejabat Berwenang',
      approverName: `Pejabat (${step.approverRole || 'Approver'})`,
      status: 'approved',
      date: new Date().toISOString(),
      notes: 'Disetujui untuk demonstrasi pratinjau format surat.',
    }))

    return {
      id: `prev-${tpl.id || 'draft'}`,
      letterNumber: sampleNumber,
      templateId: tpl.id,
      templateName: tpl.name,
      title: tpl.name || 'Pratinjau Surat Resmi',
      userName: 'Jazmanudin',
      userPosition: 'IT & Administrator Sistem',
      branchName: 'Cabang Tasikmalaya',
      branchId: 'TSM',
      status: 'approved',
      createdAt: new Date().toISOString(),
      attachments: tpl.attachments || [],
      includeKnownBy: true,
      knownByName: 'Drs. H. Maman Suratman',
      knownByPosition: 'Kepala Cabang Tasikmalaya',
      content: compiledContent,
      approvalHistory,
    }
  }

  // Filter templates list
  const filteredTemplates = templates.filter((tpl) => {
    const matchCategory = selectedCategory === 'ALL' || tpl.category === selectedCategory
    const q = searchQuery.toLowerCase().trim()
    const matchSearch =
      !q ||
      tpl.name?.toLowerCase().includes(q) ||
      tpl.code?.toLowerCase().includes(q) ||
      tpl.description?.toLowerCase().includes(q)
    return matchCategory && matchSearch
  })

  // Dynamic available variables for Word Editor
  const availableVariables = [
    { key: 'nomor_surat', label: 'Nomor Surat Resmi' },
    { key: 'nama_cabang', label: 'Nama Cabang' },
    { key: 'tanggal_surat', label: 'Tanggal Surat' },
    { key: 'perihal', label: 'Perihal / Judul Surat' },
    { key: 'nama_pemohon', label: 'Nama Pemohon' },
    { key: 'jabatan', label: 'Jabatan Pemohon' },
    ...(editingTemplate?.fields || []).map((f) => ({ key: f.name, label: f.label })),
  ]

  return (
    <div className="space-y-3.5">
      {/* ---------------------------------------------------- */}
      {/* MODE 1: DAFTAR KATALOG TEMPLATE (KETIKA TIDAK EDIT) */}
      {/* ---------------------------------------------------- */}
      {!editingTemplate ? (
        <>
          {/* ========================================================================= */}
          {/* 1. TOP STATS / KPI CARDS (Simple & Elegan Persis Referensi)               */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card 1: Total Template (Sky Blue) */}
            <div className="bg-[#0284c7] text-white rounded-xl p-3.5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black tracking-wider uppercase opacity-90 block">
                  TOTAL TEMPLATE SURAT
                </span>
                <span className="text-2xl font-black mt-0.5 block">{templates.length}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                <Layers className="w-5 h-5" />
              </div>
            </div>

            {/* Card 2: Template Aktif (Emerald Green) */}
            <div className="bg-[#059669] text-white rounded-xl p-3.5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black tracking-wider uppercase opacity-90 block">
                  TEMPLATE AKTIF
                </span>
                <span className="text-2xl font-black mt-0.5 block">
                  {templates.filter((t) => t.isActive).length}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            {/* Card 3: Surat Diterbitkan (Amber / Orange) */}
            <div className="bg-[#d97706] text-white rounded-xl p-3.5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black tracking-wider uppercase opacity-90 block">
                  SURAT DITERBITKAN
                </span>
                <span className="text-2xl font-black mt-0.5 block">{lettersList.length}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            {/* Card 4: Kategori Format (Purple) */}
            <div className="bg-[#7c3aed] text-white rounded-xl p-3.5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black tracking-wider uppercase opacity-90 block">
                  KATEGORI FORMAT
                </span>
                <span className="text-2xl font-black mt-0.5 block">{categories.length}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                <Tag className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. TITLE BAR DENGAN AKSI BERSIH                                           */}
          {/* ========================================================================= */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center shadow-2xs shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight leading-tight">
                  Manajemen Template Surat
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Rancang format teks baku surat resmi, konfigurasi pola penomoran otomatis cabang, dan tetapkan alur persetujuan.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Tombol Kelola Kategori */}
              <button
                type="button"
                onClick={() => setShowCategoryModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition active:scale-95 cursor-pointer"
                title="Kelola Daftar Kategori Template"
              >
                <Tag className="w-3.5 h-3.5 text-amber-500" />
                <span>Kelola Kategori</span>
              </button>

              {/* Tombol Buat Template Baru */}
              <button
                type="button"
                onClick={handleCreateNew}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition-all duration-150 cursor-pointer"
                title="Buat template surat resmi baru"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Buat Template Baru</span>
              </button>

              {/* View Mode Toggle: Table / Grid */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 ml-1">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1 rounded-md transition cursor-pointer ${
                    viewMode === 'table' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="Tampilan Tabel"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded-md transition cursor-pointer ${
                    viewMode === 'grid' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="Tampilan Grid Kartu"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. FILTER & SEARCH TOOLBAR (Rapi, Sejajar & Compact)                       */}
          {/* ========================================================================= */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama template, format, perihal..."
                className="w-full pl-8 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter Kategori Pills (Putih, Teks Hitam, Biru Saat Aktif) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs no-scrollbar shrink-0">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap border ${
                  selectedCategory === 'ALL'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400/80 shadow-md shadow-blue-500/25 ring-2 ring-blue-500/20'
                    : 'bg-white hover:bg-slate-100 text-slate-900 border-slate-200 shadow-2xs'
                }`}
              >
                <span>Semua</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${selectedCategory === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-800 border border-slate-200'}`}>
                  {templates.length}
                </span>
              </button>

              {categories.map((cat) => {
                const count = templates.filter((t) => t.category === cat).length
                const isSelected = selectedCategory === cat
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap border ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400/80 shadow-md shadow-blue-500/25 ring-2 ring-blue-500/20'
                        : 'bg-white hover:bg-slate-100 text-slate-900 border-slate-200 shadow-2xs'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-800 border border-slate-200'}`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4A. TAMPILAN TABEL ELEGAN (DEFAULT - IDENTIK SCREENSHOT REFERENSI)         */}
          {/* ========================================================================= */}
          {viewMode === 'table' ? (
            <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  {/* Header Gelap Slate-900 / Charcoal seperti di Gambar Referensi */}
                  <thead className="bg-[#1e293b] text-white">
                    <tr className="border-b border-slate-800 text-[11px] font-extrabold uppercase tracking-wider">
                      <th className="py-3 px-3 w-12 text-center border-r border-slate-700/60">NO</th>
                      <th className="py-3 px-4 border-r border-slate-700/60">PERIHAL &amp; TEMPLATE SURAT</th>
                      <th className="py-3 px-3.5 w-36 border-r border-slate-700/60">KATEGORI</th>
                      <th className="py-3 px-4 border-r border-slate-700/60">ALUR PERSETUJUAN</th>
                      <th className="py-3 px-3 w-28 text-center border-r border-slate-700/60">TERBIT</th>
                      <th className="py-3 px-3 w-28 text-center border-r border-slate-700/60">STATUS</th>
                      <th className="py-3 px-3.5 w-48 text-center">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredTemplates.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-slate-500">
                          <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="font-bold text-slate-700 text-sm">Tidak ada template ditemukan</p>
                          <p className="text-xs text-slate-400 mt-1">
                            Gunakan tombol "Buat Template Baru" untuk menambahkan format surat.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredTemplates.map((tpl, idx) => {
                        const letterUsageCount = lettersList.filter((l) => l.templateId === tpl.id).length
                        return (
                          <tr
                            key={tpl.id}
                            className="hover:bg-slate-50/90 transition-colors"
                          >
                            {/* NO */}
                            <td className="py-3 px-3 text-center font-bold text-slate-500 border-r border-slate-200">
                              {idx + 1}
                            </td>

                            {/* PERIHAL & TEMPLATE SURAT */}
                            <td className="py-3 px-4 border-r border-slate-200">
                              <div className="space-y-0.5">
                                <span className="font-bold text-slate-900 text-xs sm:text-sm block leading-snug">
                                  {tpl.name}
                                </span>
                                {tpl.numberFormat && (
                                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 inline-block">
                                    {tpl.numberFormat}
                                  </span>
                                )}
                                {tpl.description && (
                                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                    {tpl.description}
                                  </p>
                                )}
                              </div>
                            </td>

                            {/* KATEGORI */}
                            <td className="py-3 px-3.5 border-r border-slate-200 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs">
                                <Tag className="w-3 h-3 text-blue-500 shrink-0" />
                                <span>{tpl.category || 'Umum'}</span>
                              </span>
                            </td>

                            {/* ALUR PERSETUJUAN */}
                            <td className="py-3 px-4 border-r border-slate-200">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {tpl.approvalSteps && tpl.approvalSteps.length > 0 ? (
                                  tpl.approvalSteps.map((step, sIdx) => (
                                    <React.Fragment key={sIdx}>
                                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-slate-50 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                                        <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                          {step.step || sIdx + 1}
                                        </span>
                                        <span className="truncate max-w-[120px]">
                                          {step.specificUserName || step.approverRole || step.title}
                                        </span>
                                      </span>
                                      {sIdx < tpl.approvalSteps.length - 1 && (
                                        <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
                                      )}
                                    </React.Fragment>
                                  ))
                                ) : (
                                  <span className="text-[11px] text-slate-400 italic">1 Tingkat (Standar)</span>
                                )}
                              </div>
                            </td>

                            {/* DITERBITKAN */}
                            <td className="py-3 px-3 text-center border-r border-slate-200 whitespace-nowrap">
                              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                                {letterUsageCount} Surat
                              </span>
                            </td>

                            {/* STATUS */}
                            <td className="py-3 px-3 text-center border-r border-slate-200 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleToggleActive(tpl.id)}
                                className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full transition border shadow-2xs cursor-pointer ${
                                  tpl.isActive
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                }`}
                                title="Klik untuk ubah status aktif/nonaktif"
                              >
                                <span className={`w-2 h-2 rounded-full ${tpl.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                <span>{tpl.isActive ? 'Aktif' : 'Non-Aktif'}</span>
                              </button>
                            </td>

                            {/* AKSI (Berwarna Menarik Seperti Gambar Referensi) */}
                            <td className="py-3 px-3.5 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                {/* Pratinjau Cepat Lembar Surat (Hijau) */}
                                <button
                                  type="button"
                                  onClick={() => setReviewModalTemplate(tpl)}
                                  className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-300 rounded-lg transition shadow-2xs cursor-pointer"
                                  title="Pratinjau Lembar Surat Resmi"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                {/* Setting Approver Cepat (Ungu) */}
                                <button
                                  type="button"
                                  onClick={() => setApproverModalTemplate(tpl)}
                                  className="p-1.5 text-purple-700 bg-purple-50 hover:bg-purple-600 hover:text-white border border-purple-300 rounded-lg transition shadow-2xs cursor-pointer"
                                  title="Atur Urutan Pejabat Approver"
                                >
                                  <Settings className="w-4 h-4" />
                                </button>

                                {/* Duplikat (Sky) */}
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateTemplate(tpl)}
                                  className="p-1.5 text-sky-700 bg-sky-50 hover:bg-sky-600 hover:text-white border border-sky-300 rounded-lg transition shadow-2xs cursor-pointer"
                                  title="Duplikat Template"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>

                                {/* Edit Template (Biru) */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingTemplate(JSON.parse(JSON.stringify(tpl)))
                                    setActiveTab('form')
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                                  title="Edit Template"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>

                                {/* Hapus Template (Merah) */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTemplate(tpl)}
                                  className="p-1.5 text-rose-700 bg-rose-50 hover:bg-rose-600 hover:text-white border border-rose-300 rounded-lg transition shadow-2xs cursor-pointer"
                                  title="Hapus Template Surat"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
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
          ) : (
            /* ========================================================================= */}
            {/* 4B. TAMPILAN GRID KARTU (PILIHAN ALTERNATIF JIKA KLIK TOGGLE GRID)         */}
            {/* ========================================================================= */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTemplates.map((tpl) => {
                const letterUsageCount = lettersList.filter((l) => l.templateId === tpl.id).length
                return (
                  <div
                    key={tpl.id}
                    className={`group relative bg-white border rounded-2xl p-5 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden ${
                      tpl.isActive
                        ? 'border-slate-200/90 hover:border-blue-400'
                        : 'border-slate-200 bg-slate-50/60 opacity-80'
                    }`}
                  >
                    <div
                      className={`absolute top-0 left-0 right-0 h-1.5 ${
                        tpl.isActive
                          ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-400'
                          : 'bg-slate-300'
                      }`}
                    />

                    <div className="space-y-3.5 pt-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-3 py-1 rounded-xl text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs flex items-center gap-1.5">
                          <Tag className="w-3 h-3 text-blue-500" />
                          <span>{tpl.category || 'Umum'}</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => handleToggleActive(tpl.id)}
                          className={`text-[11px] px-3 py-1 rounded-full font-bold flex items-center gap-1.5 transition border shadow-2xs ${
                            tpl.isActive
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              tpl.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                            }`}
                          />
                          <span>{tpl.isActive ? 'Aktif' : 'Non-Aktif'}</span>
                        </button>
                      </div>

                      <div>
                        <h3 className="font-black text-slate-900 text-base leading-snug group-hover:text-blue-600 transition line-clamp-2">
                          {tpl.name}
                        </h3>
                        {tpl.numberFormat && (
                          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100/80 border border-slate-200 rounded-lg text-[10px] font-mono text-slate-600 font-semibold truncate max-w-full">
                            <span>📋</span>
                            <span className="truncate">{tpl.numberFormat}</span>
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-extrabold text-slate-700 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Alur Approval</span>
                          </span>
                          <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                            {tpl.approvalSteps?.length || 1} Tahap
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] text-slate-600 overflow-x-auto no-scrollbar pt-0.5">
                          <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-medium text-slate-500 shrink-0">
                            Pemohon
                          </span>
                          <span className="text-slate-300 font-black">&rarr;</span>
                          {(tpl.approvalSteps || []).slice(0, 2).map((st, i) => (
                            <React.Fragment key={i}>
                              <span className="px-2 py-0.5 rounded-md bg-white border border-indigo-200 text-indigo-900 font-bold shrink-0 truncate max-w-[120px]">
                                {st.title || st.approverRole || `Tahap ${st.step}`}
                              </span>
                              {i < Math.min((tpl.approvalSteps?.length || 1) - 1, 1) && (
                                <span className="text-slate-300 font-black">&rarr;</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>

                      <div className="pt-1 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <span className="text-blue-500">✉</span>
                          <span>Diterbitkan:</span>
                          <strong className="text-slate-800 font-bold">{letterUsageCount} Surat</strong>
                        </div>
                        <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          Semua Cabang
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setReviewModalTemplate(tpl)}
                          className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-300 rounded-lg transition shadow-2xs cursor-pointer"
                          title="Pratinjau Lembar Surat Resmi"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setApproverModalTemplate(tpl)}
                          className="p-1.5 text-purple-700 bg-purple-50 hover:bg-purple-600 hover:text-white border border-purple-300 rounded-lg transition shadow-2xs cursor-pointer"
                          title="Atur Urutan Pejabat Approver"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicateTemplate(tpl)}
                          className="p-1.5 text-sky-700 bg-sky-50 hover:bg-sky-600 hover:text-white border border-sky-300 rounded-lg transition shadow-2xs cursor-pointer"
                          title="Duplikat Template"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(tpl)}
                          className="p-1.5 text-rose-700 bg-rose-50 hover:bg-rose-600 hover:text-white border border-rose-300 rounded-lg transition shadow-2xs cursor-pointer"
                          title="Hapus Template Surat"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingTemplate(JSON.parse(JSON.stringify(tpl)))
                          setActiveTab('form')
                        }}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      ) : (
        /* ---------------------------------------------------- */
        /* MODE 2: FORM BUILDER & TEMPLATE STUDIO (SAMAIN ALUR SURAT AJUAN) */
        /* ---------------------------------------------------- */
        <div className="space-y-4">
          {/* Sticky Header Wrapper: Wizard Header & Review Action Bar */}
          <div className="sticky top-20 z-30 space-y-2 bg-[#dce3ec]/95 backdrop-blur-md pb-2 pt-1">
            {/* Top Wizard Steps Header - Gradient Banner */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-2xl p-3.5 sm:p-4 text-white shadow-xl border border-blue-900/40 flex flex-wrap items-center justify-between gap-3 transition-all">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-blue-200/90 font-medium">
                    Template Studio (Admin Pusat)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/15 text-white border border-white/20">
                    {editingTemplate.code || 'BARU'}
                  </span>
                </div>
                <h2 className="text-base sm:text-xl font-extrabold text-white leading-tight drop-shadow-xs truncate">
                  {editingTemplate.id ? `Edit: ${editingTemplate.name}` : 'Buat Template Baru'}
                </h2>
                <p className="text-xs text-blue-100/80 hidden sm:block mt-0.5 max-w-xl truncate">
                  {editingTemplate.description || 'Atur isian form, format teks baku surat, dan urutan persetujuan.'}
                </p>
              </div>

              {/* Step Indicator Tabs (2 Langkah: 1 Form Isian, 2 Pratinjau & Review Surat) */}
              <div className="flex items-center gap-1.5 bg-black/25 backdrop-blur-md border border-white/15 p-1 rounded-xl text-xs font-semibold shadow-inner">
                {/* TAB 1: FORM ISIAN */}
                <button
                  type="button"
                  onClick={() => setActiveTab('form')}
                  className={`px-3.5 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                    activeTab === 'form'
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-950/40 ring-2 ring-emerald-300 font-bold'
                      : 'text-blue-100 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 transition ${
                      activeTab === 'form'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'bg-white/20 text-white'
                    }`}
                  >
                    1
                  </span>
                  <span className="whitespace-nowrap">Form Isian</span>
                </button>

                {/* TAB 2: PRATINJAU & REVIEW RESMI */}
                <button
                  type="button"
                  onClick={handleProceedToPreview}
                  className={`px-3.5 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                    activeTab === 'preview'
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md shadow-purple-950/40 ring-2 ring-purple-300 font-bold'
                      : 'text-blue-100 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 transition ${
                      activeTab === 'preview'
                        ? 'bg-white text-purple-700 shadow-xs'
                        : 'bg-white/20 text-white'
                    }`}
                  >
                    2
                  </span>
                  <span className="whitespace-nowrap font-bold">Pratinjau &amp; Review Surat</span>
                </button>
              </div>

              {/* Action Buttons Top */}
              <div className="flex items-center gap-2">
                {editingTemplate?.id && (
                  <button
                    type="button"
                    onClick={() => handleDeleteTemplate(editingTemplate)}
                    className="px-3 py-1.5 text-xs font-bold text-rose-100 hover:text-white bg-rose-600/80 hover:bg-rose-600 active:bg-rose-700 border border-rose-400/50 rounded-lg transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    title="Hapus template surat ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Hapus Template</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setEditingTemplate(null)
                    setIsWordFullscreen(false)
                    setShowAttachmentManager(false)
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:text-white bg-slate-700/80 hover:bg-slate-600 active:bg-slate-800 border border-slate-500/40 rounded-lg transition shadow-xs cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 rounded-lg transition flex items-center gap-1.5 shadow-md shadow-emerald-950/30 border border-emerald-400/40 cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Simpan Template</span>
                </button>
              </div>
            </div>

            {/* Top Control Bar di Halaman Review (Sticky bersama header saat preview) */}
            {activeTab === 'preview' && (
              <div className="bg-white/95 backdrop-blur-md border border-slate-300 rounded-xl p-3 shadow-md flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <span className="p-1 rounded-md bg-purple-100 text-purple-700">
                      <Eye className="w-4 h-4" />
                    </span>
                    <span>Pratinjau Dokumen Resmi</span>
                  </span>
                  <span className="text-xs text-slate-300">&bull;</span>
                  <span className="text-xs text-slate-600 hidden sm:inline font-medium">
                    Periksa tampilan surat atau klik tombol di kanan untuk mengedit teks baku ala Word &amp; kelola lampiran.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Tombol Edit Isi Surat (Word) */}
                  <button
                    type="button"
                    onClick={() => setIsWordFullscreen(true)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
                    title="Buka Editor Word Layar Penuh untuk mengubah isi format baku surat"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Edit Isi Surat (Word)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ---------------------------------------------------- */}
          {/* LANGKAH 1: FORM ISIAN & PENGATURAN TEMPLATE */}
          {/* ---------------------------------------------------- */}
          {activeTab === 'form' && (
            <div className="space-y-5">
              {/* Card 1: Identitas & Pola Penomoran */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">1. Identitas &amp; Pola Penomoran Surat</h3>
                    <p className="text-[11px] text-slate-500">Informasi dasar nama surat, kode, dan format penomoran otomatis cabang.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Template Surat *</label>
                    <input
                      type="text"
                      value={editingTemplate.name}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                      placeholder="Contoh: Ajuan Mutasi Karyawan"
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-slate-700">Kategori Ajuan</label>
                      <button
                        type="button"
                        onClick={() => setShowCategoryModal(true)}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition-colors"
                        title="Tambah atau kelola kategori baru"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Kelola / Tambah Kategori</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <SearchableSelect
                          options={categories.map((cat) => ({ value: cat, label: cat }))}
                          value={editingTemplate.category || ''}
                          onChange={(val) => setEditingTemplate({ ...editingTemplate, category: val })}
                          placeholder="-- Cari / Pilih Kategori --"
                          isClearable={true}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCategoryModal(true)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-slate-700 font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer transition h-[38px]"
                        title="Buka popup manajemen kategori"
                      >
                        <Tag className="w-3.5 h-3.5 text-amber-500" />
                        <span className="hidden sm:inline">Kelola</span>
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Pola Format Nomor Surat Otomatis</label>
                    <input
                      type="text"
                      value={editingTemplate.numberFormat}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, numberFormat: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Variabel pola: <code className="text-indigo-600">{'{{seq}}'}</code>, <code className="text-indigo-600">{'{{branch_code}}'}</code>, <code className="text-indigo-600">{'{{roman_month}}'}</code>, <code className="text-indigo-600">{'{{year}}'}</code>
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Jalur Persetujuan Bertingkat */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">2. Jalur Persetujuan Bertingkat (Approver)</h3>
                      <p className="text-[11px] text-slate-500">Tentukan urutan pejabat yang berhak memverifikasi dan menyetujui surat (urutan dari atas ke bawah).</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddApprovalStep}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Tambah Tingkat Persetujuan</span>
                  </button>
                </div>

                {/* Opsi Batasan Limit Nominal Approval */}
                <div className="p-3.5 bg-gradient-to-r from-amber-50/90 to-orange-50/80 border border-amber-200/90 rounded-xl space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-amber-500 text-white rounded-lg shadow-2xs shrink-0">
                        <Sliders className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-amber-950">
                            Aturan Limit Nominal Persetujuan (Approval Threshold)
                          </h4>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                              editingTemplate.hasNominalLimit
                                ? 'bg-amber-500 text-white shadow-2xs'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {editingTemplate.hasNominalLimit ? 'AKTIF' : 'NON-AKTIF'}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-800">
                          Aktifkan jika pengajuan bernilai kecil cukup disetujui sampai pejabat tertentu (misal: &lt; 300rb cukup SMM, &lt; 500rb cukup Manager, 500rb–5jt Wakil Direktur, dst).
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={Boolean(editingTemplate.hasNominalLimit)}
                        onChange={(e) =>
                          setEditingTemplate({
                            ...editingTemplate,
                            hasNominalLimit: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600 shadow-inner"></div>
                    </label>
                  </div>

                  {editingTemplate.hasNominalLimit && (
                    <div className="pt-2.5 border-t border-amber-200/80 flex flex-wrap items-center justify-between gap-3 text-xs animate-fadeIn">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-900">Sumber Acuan Nominal:</span>
                        <select
                          value={editingTemplate.nominalField || 'total_biaya'}
                          onChange={(e) =>
                            setEditingTemplate({
                              ...editingTemplate,
                              nominalField: e.target.value,
                            })
                          }
                          className="p-1.5 bg-white border border-amber-300 rounded-lg text-slate-800 font-semibold text-xs focus:ring-2 focus:ring-amber-500 outline-none shadow-2xs"
                        >
                          <option value="total_biaya">Total Biaya (Tabel Rincian Biaya / Pengeluaran)</option>
                          {(editingTemplate.fields || [])
                            .filter(
                              (f) =>
                                f.type === 'number' ||
                                /biaya|nominal|dana|jumlah|harga|nilai/i.test(f.name || f.label)
                            )
                            .map((f) => (
                              <option key={f.name} value={f.name}>
                                Kolom Form: {f.label} ({f.name})
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className="w-full mt-2 pt-2 border-t border-amber-200">
                        <div className="overflow-x-auto rounded-lg border border-amber-300/80 bg-white shadow-2xs">
                          <table className="w-full text-xs text-slate-800 border-collapse">
                            <thead>
                              <tr className="bg-amber-100/90 text-amber-950 border-b border-amber-300 font-extrabold text-[11px]">
                                <th className="py-1.5 px-3 text-left">JABATAN</th>
                                <th className="py-1.5 px-3 text-right">MINIMAL</th>
                                <th className="py-1.5 px-3 text-right">MAKSIMAL</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-amber-100 text-[11px]">
                              <tr className="hover:bg-amber-50/60 transition">
                                <td className="py-1.5 px-3 font-bold text-slate-900">DIREKTUR</td>
                                <td className="py-1.5 px-3 text-right font-mono font-medium">50.000.000</td>
                                <td className="py-1.5 px-3 text-right font-mono font-extrabold text-indigo-700">TIDAK TERBATAS</td>
                              </tr>
                              <tr className="hover:bg-amber-50/60 transition">
                                <td className="py-1.5 px-3 font-bold text-slate-900">WAKIL DIREKTUR</td>
                                <td className="py-1.5 px-3 text-right font-mono font-medium">2.000.000</td>
                                <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">50.000.000</td>
                              </tr>
                              <tr className="hover:bg-amber-50/60 transition">
                                <td className="py-1.5 px-3 font-bold text-slate-900">PEMBELIAN</td>
                                <td className="py-1.5 px-3 text-right font-mono font-medium">1.000.000</td>
                                <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">2.000.000</td>
                              </tr>
                              <tr className="hover:bg-amber-50/60 transition">
                                <td className="py-1.5 px-3 font-bold text-slate-900">RSM &amp; NSM</td>
                                <td className="py-1.5 px-3 text-right font-mono font-medium">500.000</td>
                                <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">1.000.000</td>
                              </tr>
                              <tr className="hover:bg-amber-50/60 transition">
                                <td className="py-1.5 px-3 font-bold text-slate-900">ALL HEAD DEPT.</td>
                                <td className="py-1.5 px-3 text-right font-mono font-medium">300.000</td>
                                <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">500.000</td>
                              </tr>
                              <tr className="hover:bg-amber-50/60 transition">
                                <td className="py-1.5 px-3 font-bold text-slate-900">CABANG</td>
                                <td className="py-1.5 px-3 text-right font-mono font-medium">-</td>
                                <td className="py-1.5 px-3 text-right font-mono font-bold text-emerald-700">300.000</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {editingTemplate.approvalSteps?.map((step, idx) => {
                    const isUserType = step.assignmentType === 'user' || Boolean(step.specificUserId)
                    return (
                      <div
                        key={idx}
                        className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl flex flex-wrap items-center gap-3 text-xs"
                      >
                        <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-extrabold flex items-center justify-center shrink-0 shadow-2xs">
                          {step.step}
                        </div>

                        <div className="flex-1 min-w-[200px]">
                          <label className="block text-[11px] text-slate-500 font-semibold mb-0.5">Judul Tahapan</label>
                          <input
                            type="text"
                            value={step.title}
                            onChange={(e) => {
                              const steps = [...editingTemplate.approvalSteps]
                              steps[idx].title = e.target.value
                              setEditingTemplate({ ...editingTemplate, approvalSteps: steps })
                            }}
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>

                        <div className="w-80 sm:w-96">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] text-slate-500 font-semibold">
                              Target Penyetuju:
                            </label>
                            <div className="flex items-center gap-0.5 bg-slate-200/90 p-0.5 rounded-md text-[10px] font-bold">
                              <button
                                type="button"
                                onClick={() => {
                                  const steps = [...editingTemplate.approvalSteps]
                                  steps[idx].assignmentType = 'role'
                                  steps[idx].specificUserId = null
                                  steps[idx].specificUserName = null
                                  setEditingTemplate({ ...editingTemplate, approvalSteps: steps })
                                }}
                                className={`px-2 py-0.5 rounded transition ${
                                  !isUserType
                                    ? 'bg-white text-indigo-700 shadow-2xs font-extrabold'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                🏢 Jabatan
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const steps = [...editingTemplate.approvalSteps]
                                  steps[idx].assignmentType = 'user'
                                  setEditingTemplate({ ...editingTemplate, approvalSteps: steps })
                                }}
                                className={`px-2 py-0.5 rounded transition ${
                                  isUserType
                                    ? 'bg-white text-indigo-700 shadow-2xs font-extrabold'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                👤 User
                              </button>
                            </div>
                          </div>

                          {!isUserType ? (
                            <SearchableSelect
                              value={step.kodeJabatan || step.approverRole || ''}
                              placeholder="-- Pilih Kode Jabatan HRD --"
                              options={jabatanList.map((j) => ({
                                value: j.kode,
                                label: `${j.kode} - ${j.nama}`,
                                sublabel: j.alias,
                              }))}
                              onChange={(selectedKode) => {
                                const matched = jabatanList.find((j) => j.kode === selectedKode)
                                const steps = [...editingTemplate.approvalSteps]
                                steps[idx].assignmentType = 'role'
                                steps[idx].kodeJabatan = selectedKode
                                steps[idx].specificUserId = null
                                steps[idx].specificUserName = null
                                if (matched) {
                                  steps[idx].approverRole = matched.nama
                                  if (!steps[idx].title || steps[idx].title.startsWith('Persetujuan')) {
                                    steps[idx].title = `Persetujuan ${matched.nama}`
                                  }
                                }
                                setEditingTemplate({ ...editingTemplate, approvalSteps: steps })
                              }}
                              isClearable
                            />
                          ) : (
                            <SearchableSelect
                              value={step.specificUserId ? String(step.specificUserId) : ''}
                              placeholder="-- Cari / Pilih Pengguna Approver --"
                              options={usersList.map((u) => ({
                                value: String(u.id),
                                label: u.name,
                                sublabel: `${u.position || u.roleLabel || 'User'} • Cabang ${u.branchName || u.branchId || 'Pusat'}`,
                              }))}
                              onChange={(selectedUserId) => {
                                const matchedUser = usersList.find((u) => String(u.id) === String(selectedUserId))
                                const steps = [...editingTemplate.approvalSteps]
                                steps[idx].assignmentType = 'user'
                                if (matchedUser) {
                                  steps[idx].specificUserId = matchedUser.id
                                  steps[idx].specificUserName = matchedUser.name
                                  steps[idx].kodeJabatan = matchedUser.kodeJabatan || ''
                                  steps[idx].approverRole = matchedUser.position || matchedUser.name
                                  if (!steps[idx].title || steps[idx].title.startsWith('Persetujuan')) {
                                    steps[idx].title = `Persetujuan ${matchedUser.name}`
                                  }
                                } else {
                                  steps[idx].specificUserId = null
                                  steps[idx].specificUserName = null
                                }
                                setEditingTemplate({ ...editingTemplate, approvalSteps: steps })
                              }}
                              isClearable
                            />
                          )}
                        </div>

                        {editingTemplate.hasNominalLimit && (
                          <div className="w-full mt-1 pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/80">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-amber-950 text-[11px] flex items-center gap-1 shrink-0">
                                <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                                <span>Batas Nominal Maksimal (Wewenang):</span>
                              </span>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs select-none">
                                  Rp
                                </span>
                                <input
                                  type="text"
                                  value={
                                    step.maxAmount
                                      ? Number(step.maxAmount).toLocaleString('id-ID')
                                      : ''
                                  }
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(/[^0-9]/g, '')
                                    const val = raw ? parseInt(raw, 10) : null
                                    const steps = [...editingTemplate.approvalSteps]
                                    steps[idx].maxAmount = val
                                    setEditingTemplate({
                                      ...editingTemplate,
                                      approvalSteps: steps,
                                    })
                                  }}
                                  placeholder="Tanpa batas (Tingkat akhir)"
                                  className="pl-8 pr-3 py-1 bg-white border border-amber-300 rounded-lg font-mono font-bold text-slate-800 text-xs w-48 focus:ring-2 focus:ring-amber-500 outline-none shadow-2xs"
                                />
                              </div>
                            </div>
                            <div className="text-[11px] text-amber-900 font-medium">
                              {step.maxAmount ? (
                                <span>
                                  Cukup sampai tahap ini jika nominal{' '}
                                  <strong className="text-amber-950">
                                    &le; Rp {Number(step.maxAmount).toLocaleString('id-ID')}
                                  </strong>
                                </span>
                              ) : (
                                <span className="text-slate-500 italic">
                                  Tanpa batas nominal (Persetujuan untuk nominal di atas limit sebelumnya)
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {editingTemplate.approvalSteps.length > 1 && (
                          <div className="pt-4">
                            <button
                              type="button"
                              onClick={() => handleRemoveApprovalStep(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Hapus tingkat persetujuan ini"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Action Buttons Step 1 */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <div className="text-xs font-medium text-slate-600 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Setelah isian selesai, klik lanjut ke pratinjau untuk melihat tampilan resmi surat dan mengedit format teks baku Word.</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleProceedToPreview}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:from-emerald-800 active:to-teal-800 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 transition shadow-lg shadow-emerald-600/30 ring-1 ring-white/20"
                  >
                    <span>Lanjut ke Review Surat</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* LANGKAH 2: PRATINJAU & REVIEW SURAT (PERSIS SURAT AJUAN) */}
          {/* ---------------------------------------------------- */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              {/* Lembar Dokumen Surat Resmi (Halaman Pratinjau) */}
              <LetterDocumentView
                letter={generatePreviewLetter(editingTemplate)}
                isBuilderPreview={true}
              />

              {/* Bottom Navigation */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('form')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 flex items-center gap-1.5 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Sebelumnya (Form Isian)</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-extrabold rounded-xl shadow-md shadow-emerald-600/30 flex items-center gap-2 transition"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Selesai &amp; Simpan Template</span>
                </button>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* FULLSCREEN MICROSOFT WORD MODE (PERSIS SURAT AJUAN) */}
          {/* ---------------------------------------------------- */}
          {isWordFullscreen && (
            <RichEditor
              value={editingTemplate.letterTemplate}
              onChange={(val) =>
                setEditingTemplate((prev) => ({ ...prev, letterTemplate: val }))
              }
              availableVariables={availableVariables}
              letterNumber="001/SP/TSM/X/2026"
              perihal={editingTemplate.name || 'Permohonan'}
              submitterName="Jazmanudin"
              submitterPosition="IT & Administrator Sistem"
              isFullscreen={true}
              onSave={handleSaveTemplate}
              onClose={() => {
                setIsWordFullscreen(false)
                setActiveTab('preview')
              }}
            />
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL PRATINJAU CEPAT DOKUMEN DARI DAFTAR TABEL */}
      {/* ---------------------------------------------------- */}
      {reviewModalTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-3.5 bg-slate-900 text-white flex justify-between items-center text-xs shrink-0">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-400" />
                <span className="font-bold">Pratinjau Format Surat: {reviewModalTemplate.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalTemplate(null)}
                className="text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-semibold transition"
              >
                ✕ Tutup
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100">
              <LetterDocumentView
                letter={generatePreviewLetter(reviewModalTemplate)}
                isBuilderPreview={true}
              />
            </div>

            <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
              <span className="text-slate-500">
                Pola Nomor: <code className="font-bold text-slate-800">{reviewModalTemplate.numberFormat}</code>
              </span>
              <button
                type="button"
                onClick={() => {
                  const tpl = reviewModalTemplate
                  setReviewModalTemplate(null)
                  setEditingTemplate(JSON.parse(JSON.stringify(tpl)))
                  setActiveTab('form')
                }}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Buka di Template Editor</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL SETTING APPROVER PUSAT */}
      {/* ---------------------------------------------------- */}
      {approverModalTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Jalur Persetujuan: {approverModalTemplate.name}
                  </h3>
                  <p className="text-xs text-slate-500">Atur urutan pejabat approver yang memverifikasi surat ajuan ini.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApproverModalTemplate(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
              {(approverModalTemplate.approvalSteps || []).map((step, idx) => {
                const isUserType = step.assignmentType === 'user' || Boolean(step.specificUserId)
                return (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-xs"
                  >
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Judul Tahapan</label>
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) => {
                          const steps = [...approverModalTemplate.approvalSteps]
                          steps[idx].title = e.target.value
                          setApproverModalTemplate({ ...approverModalTemplate, approvalSteps: steps })
                        }}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                      />
                    </div>
                    <div className="w-72 sm:w-80">
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="block text-[10px] text-slate-400 font-bold">Penyetuju:</label>
                        <div className="flex items-center gap-0.5 bg-slate-200/90 p-0.5 rounded text-[9px] font-bold">
                          <button
                            type="button"
                            onClick={() => {
                              const steps = [...approverModalTemplate.approvalSteps]
                              steps[idx].assignmentType = 'role'
                              steps[idx].specificUserId = null
                              steps[idx].specificUserName = null
                              setApproverModalTemplate({ ...approverModalTemplate, approvalSteps: steps })
                            }}
                            className={`px-1.5 py-0.5 rounded ${
                              !isUserType ? 'bg-white text-indigo-700 shadow-2xs font-extrabold' : 'text-slate-600'
                            }`}
                          >
                            🏢 Jabatan
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const steps = [...approverModalTemplate.approvalSteps]
                              steps[idx].assignmentType = 'user'
                              setApproverModalTemplate({ ...approverModalTemplate, approvalSteps: steps })
                            }}
                            className={`px-1.5 py-0.5 rounded ${
                              isUserType ? 'bg-white text-indigo-700 shadow-2xs font-extrabold' : 'text-slate-600'
                            }`}
                          >
                            👤 User
                          </button>
                        </div>
                      </div>

                      {!isUserType ? (
                        <SearchableSelect
                          value={step.kodeJabatan || step.approverRole || ''}
                          placeholder="-- Pilih Jabatan HRD --"
                          options={jabatanList.map((j) => ({
                            value: j.kode,
                            label: `${j.kode} - ${j.nama}`,
                            sublabel: j.alias,
                          }))}
                          onChange={(selectedKode) => {
                            const matched = jabatanList.find((j) => j.kode === selectedKode)
                            const steps = [...approverModalTemplate.approvalSteps]
                            steps[idx].assignmentType = 'role'
                            steps[idx].kodeJabatan = selectedKode
                            steps[idx].specificUserId = null
                            steps[idx].specificUserName = null
                            if (matched) {
                              steps[idx].approverRole = matched.nama
                              if (!steps[idx].title || steps[idx].title.startsWith('Persetujuan')) {
                                steps[idx].title = `Persetujuan ${matched.nama}`
                              }
                            }
                            setApproverModalTemplate({ ...approverModalTemplate, approvalSteps: steps })
                          }}
                          isClearable
                        />
                      ) : (
                        <SearchableSelect
                          value={step.specificUserId ? String(step.specificUserId) : ''}
                          placeholder="-- Pilih Pengguna Approver --"
                          options={usersList.map((u) => ({
                            value: String(u.id),
                            label: u.name,
                            sublabel: `${u.position || u.roleLabel || 'User'} • Cabang ${u.branchName || u.branchId || 'Pusat'}`,
                          }))}
                          onChange={(selectedUserId) => {
                            const matchedUser = usersList.find((u) => String(u.id) === String(selectedUserId))
                            const steps = [...approverModalTemplate.approvalSteps]
                            steps[idx].assignmentType = 'user'
                            if (matchedUser) {
                              steps[idx].specificUserId = matchedUser.id
                              steps[idx].specificUserName = matchedUser.name
                              steps[idx].kodeJabatan = matchedUser.kodeJabatan || ''
                              steps[idx].approverRole = matchedUser.position || matchedUser.name
                              if (!steps[idx].title || steps[idx].title.startsWith('Persetujuan')) {
                                steps[idx].title = `Persetujuan ${matchedUser.name}`
                              }
                            } else {
                              steps[idx].specificUserId = null
                              steps[idx].specificUserName = null
                            }
                            setApproverModalTemplate({ ...approverModalTemplate, approvalSteps: steps })
                          }}
                          isClearable
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const steps = [...(approverModalTemplate.approvalSteps || [])]
                  const nextStepNum = steps.length + 1
                  steps.push({
                    step: nextStepNum,
                    title: `Persetujuan Tahap ${nextStepNum}`,
                    approverRole: 'Kepala Bagian',
                    kodeJabatan: '',
                  })
                  setApproverModalTemplate({ ...approverModalTemplate, approvalSteps: steps })
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Tingkat</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  saveTemplate(approverModalTemplate)
                  notify.success('Approver Diperbarui', 'Jalur persetujuan berhasil disimpan.')
                  setApproverModalTemplate(null)
                  refreshList()
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                Simpan Jalur Approver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL KELOLA KATEGORI SURAT */}
      {/* ---------------------------------------------------- */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-base text-slate-900">Kelola Kategori Template Surat</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Input Tambah Kategori Baru */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nama kategori baru..."
                className="flex-1 p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-800"
              />
              <button
                type="button"
                onClick={async () => {
                  const trimmed = newCategoryName.trim()
                  if (!trimmed) return
                  const updated = await addCategory(trimmed)
                  setCategories(updated)
                  setEditingTemplate((prev) => (prev ? { ...prev, category: trimmed } : prev))
                  setNewCategoryName('')
                  refreshList()
                  notify.success('Kategori Ditambahkan', `Kategori "${trimmed}" berhasil disimpan ke database.`)
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition shrink-0"
              >
                Tambah
              </button>
            </div>

            {/* List Kategori */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {categories.map((cat) => {
                const isEditing = editingCategory.oldName === cat
                const count = templates.filter((t) => t.category === cat).length
                return (
                  <div
                    key={cat}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-xs"
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editingCategory.newName}
                          onChange={(e) =>
                            setEditingCategory({ ...editingCategory, newName: e.target.value })
                          }
                          className="flex-1 p-1 bg-white border border-indigo-400 rounded-md font-bold text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (!editingCategory.newName.trim()) return
                            const updated = await updateCategory(
                              editingCategory.oldName,
                              editingCategory.newName
                            )
                            setCategories(updated)
                            setEditingCategory({ oldName: '', newName: '' })
                            refreshList()
                            notify.success('Kategori Diperbarui', 'Nama kategori dan template terkait berhasil diubah di database.')
                          }}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded-md font-bold text-[11px]"
                        >
                          Simpan
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCategory({ oldName: '', newName: '' })}
                          className="px-2 py-1 bg-slate-200 text-slate-600 rounded-md text-[11px]"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-800">{cat}</span>
                          <span className="text-[10px] text-slate-400 font-medium">({count} Template)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingCategory({ oldName: cat, newName: cat })}
                            className="p-1 text-slate-500 hover:text-indigo-600 rounded hover:bg-slate-200 transition"
                            title="Edit nama kategori"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (count > 0) {
                                notify.warning(
                                  'Kategori Digunakan',
                                  `Masih ada ${count} template yang memakai kategori ini.`
                                )
                                return
                              }
                              const confirmed = await notify.confirm({
                                title: 'Hapus Kategori?',
                                text: `Apakah Anda yakin ingin menghapus kategori "${cat}"?`,
                                confirmText: 'Ya, Hapus Kategori',
                                confirmColor: '#e11d48',
                              })
                              if (!confirmed) return
                              const updated = await deleteCategory(cat)
                              setCategories(updated)
                              refreshList()
                              notify.success('Kategori Dihapus', 'Kategori berhasil dihapus dari database.')
                            }}
                            className="p-1 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition"
                            title="Hapus kategori"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
