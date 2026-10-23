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
} from '../services/storage'
import { HRD_JABATAN } from '../data/mockData'
import { notify } from '../utils/alert'

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
  }

  useEffect(() => {
    const handleCatChange = () => setCategories(getCategories())
    const handleGlobalViewersChange = () => setGlobalDefaultViewers(getGlobalDefaultViewers())
    const handleTplChange = () => setTemplates(getTemplates())
    window.addEventListener('categories_change', handleCatChange)
    window.addEventListener('global_viewers_change', handleGlobalViewersChange)
    window.addEventListener('templates_change', handleTplChange)
    return () => {
      window.removeEventListener('categories_change', handleCatChange)
      window.removeEventListener('global_viewers_change', handleGlobalViewersChange)
      window.removeEventListener('templates_change', handleTplChange)
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
      attachments: [],
      approvalSteps: [
        { step: 1, title: 'Persetujuan Kepala Cabang', approverRole: 'Kepala Cabang', kodeJabatan: 'J08' },
      ],
      fields: [
        { id: `f_${Date.now()}_1`, label: 'Nama Pemohon', name: 'nama_pemohon', type: 'text', required: true },
        { id: `f_${Date.now()}_2`, label: 'Keperluan / Perihal', name: 'perihal', type: 'text', required: true },
        { id: `f_${Date.now()}_3`, label: 'Uraian Pengajuan', name: 'ringkasan', type: 'textarea', required: true },
      ],
      letterTemplate: `
<p style="text-align: right;">{{nama_cabang}}, {{tanggal_surat}}</p>
<p>Nomor: {{nomor_surat}}<br>Perihal: {{perihal}}</p>
<p>Kepada Yth,<br>Pimpinan Terkait<br>Di Tempat</p>
<p>Dengan hormat,</p>
<p>Saya yang bertanda tangan di bawah ini:</p>
<p>Nama: {{nama_pemohon}}<br>Cabang: {{nama_cabang}}</p>
<p>Mengajukan permohonan dengan uraian sebagai berikut:</p>
<p>{{ringkasan}}</p>
<p>Demikian surat permohonan ini kami sampaikan atas perhatian dan persetujuannya kami ucapkan terima kasih.</p>
`,
    })
    setActiveTab('form')
  }

  const handleDuplicateTemplate = (tpl) => {
    const dup = JSON.parse(JSON.stringify(tpl))
    delete dup.id
    dup.name = `${tpl.name} (Salinan)`
    dup.code = `${tpl.code || 'SP'}_COPY`.slice(0, 15)
    dup.isActive = true
    saveTemplate(dup)
    refreshList()
    notify.success('Template Diduplikasi', `Berhasil membuat salinan dari template ${tpl.name}`)
  }

  const handleDeleteTemplate = (tpl) => {
    const res = deleteTemplate(tpl.id)
    if (!res.success) {
      notify.warning('Gagal Menghapus', res.message)
    } else {
      notify.success('Template Dihapus', `Template ${tpl.name} telah berhasil dihapus.`)
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
    if (!editingTemplate.code?.trim()) {
      notify.warning('Kode Wajib Diisi', 'Silakan isi Kode Jenis Surat terlebih dahulu.')
      return
    }
    setActiveTab('preview')
  }

  const handleSaveTemplate = () => {
    if (!editingTemplate.name?.trim()) {
      notify.warning('Nama Template Kosong', 'Nama Template Surat wajib diisi!')
      return
    }
    if (!editingTemplate.code?.trim()) {
      notify.warning('Kode Template Kosong', 'Kode Surat wajib diisi!')
      return
    }

    saveTemplate(editingTemplate)
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
    <div className="space-y-6">
      {/* ---------------------------------------------------- */}
      {/* MODE 1: DAFTAR KATALOG TEMPLATE (KETIKA TIDAK EDIT) */}
      {/* ---------------------------------------------------- */}
      {!editingTemplate ? (
        <>
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-xl flex flex-wrap items-center justify-between gap-4 border border-indigo-900/40">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 uppercase tracking-wider">
                  Admin Panel Pusat
                </span>
                <span className="text-xs text-slate-400">&bull;</span>
                <span className="text-xs text-slate-300">Total {templates.length} Template Aktif &amp; Terdaftar</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5 tracking-tight">
                <Layers className="w-6 h-6 text-indigo-400 shrink-0" />
                Manajemen Template Surat
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Rancang formulir isian khusus, format teks baku surat ala Microsoft Word, dan tentukan alur persetujuan bertingkat bagi seluruh cabang.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowCategoryModal(true)}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-white/20 shadow-sm"
              >
                <Tag className="w-4 h-4 text-amber-300" />
                <span>Kelola Kategori</span>
              </button>

              <button
                type="button"
                onClick={handleCreateNew}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:from-emerald-700 active:to-teal-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 transition shadow-lg shadow-emerald-500/25 ring-1 ring-white/20"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Buat Template Baru</span>
              </button>
            </div>
          </div>

          {/* Filter & Pencarian Bar */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  selectedCategory === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Semua ({templates.length})
              </button>
              {categories.map((cat) => {
                const count = templates.filter((t) => t.category === cat).length
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                )
              })}
            </div>

            <div className="relative flex-1 min-w-[220px] max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama / kode template..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
              />
            </div>
          </div>

          {/* Grid Kartu Template */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredTemplates.map((tpl) => {
              const letterUsageCount = lettersList.filter((l) => l.templateId === tpl.id).length
              return (
                <div
                  key={tpl.id}
                  className={`bg-white border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group ${
                    tpl.isActive ? 'border-slate-200/90' : 'border-slate-200 bg-slate-50/70 opacity-75'
                  }`}
                >
                  <div>
                    {/* Header Card: Kode & Status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {tpl.code || 'NO-CODE'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                          {tpl.category || 'Umum'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleActive(tpl.id)}
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 transition ${
                          tpl.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                        title="Klik untuk ubah status aktif/non-aktif template"
                      >
                        {tpl.isActive ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-slate-500" />}
                        <span>{tpl.isActive ? 'Aktif' : 'Non-Aktif'}</span>
                      </button>
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-indigo-600 transition">
                      {tpl.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {tpl.description || 'Tidak ada keterangan khusus.'}
                    </p>

                    {/* Metadata Pill Ringkasan */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Isian Form Input:</span>
                        <strong className="text-slate-800 font-bold">{tpl.fields?.length || 0} Field</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Jalur Persetujuan:</span>
                        <strong className="text-indigo-600 font-bold">{tpl.approvalSteps?.length || 1} Tingkat Approver</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Total Penggunaan:</span>
                        <span className="text-slate-700 font-medium">{letterUsageCount} Surat Dibuat</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Hak Akses Cabang:</span>
                        <strong className="text-slate-700 font-semibold truncate max-w-[150px]">
                          {tpl.allowedBranches?.includes('all') ? 'Semua Cabang' : `${tpl.allowedBranches?.length || 0} Cabang`}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Tombol Aksi Bawah */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1">
                      {/* Pratinjau Cepat */}
                      <button
                        type="button"
                        onClick={() => setReviewModalTemplate(tpl)}
                        className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="Pratinjau Lembar Surat Resmi"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Setting Approver Cepat */}
                      <button
                        type="button"
                        onClick={() => setApproverModalTemplate(tpl)}
                        className="p-1.5 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                        title="Atur Urutan Pejabat Approver"
                      >
                        <Settings className="w-4 h-4" />
                      </button>

                      {/* Duplikat */}
                      <button
                        type="button"
                        onClick={() => handleDuplicateTemplate(tpl)}
                        className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                        title="Duplikat Template"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      {/* Hapus */}
                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(tpl)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Hapus Template"
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
                      className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-indigo-200 hover:border-indigo-600 shadow-2xs"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Template</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
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
                <button
                  type="button"
                  onClick={() => {
                    setEditingTemplate(null)
                    setIsWordFullscreen(false)
                    setShowAttachmentManager(false)
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-500/90 hover:bg-rose-600 active:bg-rose-700 border border-rose-400/40 rounded-lg transition shadow-xs"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 rounded-lg transition flex items-center gap-1.5 shadow-md shadow-emerald-950/30 border border-emerald-400/40"
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

                  {/* Tombol Kelola Lampiran & Foto */}
                  <button
                    type="button"
                    onClick={() => setShowAttachmentManager(true)}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition border bg-white border-slate-300 hover:bg-slate-50 text-slate-800 shadow-2xs hover:border-indigo-400"
                    title="Buka popup modal untuk mengunggah dan mengatur foto/dokumen lampiran bawaan template"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Kelola Lampiran &amp; Foto ({editingTemplate.attachments?.length || 0})</span>
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
                    <label className="block font-bold text-slate-700 mb-1">Kode Jenis Surat (Singkat) *</label>
                    <input
                      type="text"
                      value={editingTemplate.code}
                      onChange={(e) =>
                        setEditingTemplate({
                          ...editingTemplate,
                          code: e.target.value.toUpperCase().replace(/\s/g, ''),
                        })
                      }
                      placeholder="Contoh: MUTASI / CUTI / LEMBUR"
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-800 uppercase focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kategori Ajuan</label>
                    <select
                      value={editingTemplate.category || 'Operasional'}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 font-semibold bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Pola Format Nomor Surat Otomatis</label>
                    <input
                      type="text"
                      value={editingTemplate.numberFormat}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, numberFormat: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Variabel pola: <code className="text-indigo-600">{'{{seq}}'}</code>, <code className="text-indigo-600">{'{{code}}'}</code>, <code className="text-indigo-600">{'{{branch_code}}'}</code>, <code className="text-indigo-600">{'{{roman_month}}'}</code>, <code className="text-indigo-600">{'{{year}}'}</code>
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Deskripsi Singkat Template</label>
                    <textarea
                      rows={2}
                      value={editingTemplate.description}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                      placeholder="Keterangan peruntukan surat ini bagi staf cabang..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1.5">Cabang yang Dapat Menggunakan</label>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 cursor-pointer text-xs font-bold">
                        <input
                          type="checkbox"
                          checked={editingTemplate.allowedBranches?.includes('all')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditingTemplate({ ...editingTemplate, allowedBranches: ['all'] })
                            } else {
                              setEditingTemplate({ ...editingTemplate, allowedBranches: [] })
                            }
                          }}
                          className="rounded text-indigo-600"
                        />
                        <span>Semua Cabang CV Makmur Permata</span>
                      </label>
                      {!editingTemplate.allowedBranches?.includes('all') && (
                        <span className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                          Pilih cabang secara spesifik di bawah jika tidak dibuka untuk semua cabang.
                        </span>
                      )}
                    </div>
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

                <div className="space-y-3">
                  {editingTemplate.approvalSteps?.map((step, idx) => (
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

                      <div className="w-72">
                        <label className="block text-[11px] text-slate-500 font-semibold mb-0.5">
                          Peran / Jabatan Approver (HRD)
                        </label>
                        <SearchableSelect
                          value={step.kodeJabatan || step.approverRole || ''}
                          placeholder="-- Pilih Kode Jabatan HRD --"
                          options={HRD_JABATAN.map((j) => ({
                            value: j.kode,
                            label: `${j.kode} - ${j.nama}`,
                            sublabel: j.alias,
                          }))}
                          onChange={(selectedKode) => {
                            const matched = HRD_JABATAN.find((j) => j.kode === selectedKode)
                            const steps = [...editingTemplate.approvalSteps]
                            steps[idx].kodeJabatan = selectedKode
                            if (matched) {
                              steps[idx].approverRole = matched.nama
                              steps[idx].title = `Persetujuan ${matched.nama}`
                            }
                            setEditingTemplate({ ...editingTemplate, approvalSteps: steps })
                          }}
                          isClearable
                        />
                      </div>

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
                  ))}
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
              {/* Modal Kelola Lampiran & Foto Template (Popup Dialog) */}
              {showAttachmentManager && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
                  <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
                    {/* Header Modal Lampiran */}
                    <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-4 text-white flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center font-bold">
                          <Paperclip className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-white">
                            Kelola Lampiran &amp; Foto Bawaan Template
                          </h3>
                          <p className="text-[11px] text-blue-100/80">
                            Unggah berkas referensi atau foto panduan yang otomatis disertakan pada template ini.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAttachmentManager(false)}
                        className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition"
                        title="Tutup Modal"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Body Modal Lampiran */}
                    <div className="p-4 overflow-y-auto space-y-4 flex-1">
                      <AttachmentUploader
                        attachments={editingTemplate.attachments || []}
                        onChange={(newAtts) =>
                          setEditingTemplate((prev) => ({ ...prev, attachments: newAtts }))
                        }
                      />
                    </div>

                    {/* Footer Modal Lampiran */}
                    <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs">
                      <span className="text-slate-600 font-medium">
                        Total Berkas Lampiran: <strong className="text-indigo-600 font-bold">{editingTemplate.attachments?.length || 0}</strong> file
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAttachmentManager(false)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Selesai &amp; Simpan Lampiran</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

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
            <div className="fixed inset-0 z-50 bg-[#eef2f6] flex flex-col h-screen w-screen overflow-hidden animate-fadeIn select-none">
              {/* WORD TOP TITLE BAR */}
              <div className="bg-[#185abd] text-white px-4 py-2.5 flex items-center justify-between shadow-md shrink-0">
                {/* Sisi Kiri: Identitas Dokumen Word */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0e4b9e] flex items-center justify-center font-bold text-white shadow-xs border border-blue-400/30">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold leading-tight">
                        {editingTemplate.name || 'Desain Teks Baku Surat'}
                      </h3>
                      <span className="text-[10px] font-mono bg-blue-900/70 text-blue-100 px-1.5 py-0.5 rounded border border-blue-400/30">
                        {editingTemplate.code || 'TEMPLATE'}
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-100/80">
                      Microsoft Word Mode &bull; Rancang Format Teks Baku Surat &amp; Variabel Dinamis
                    </p>
                  </div>
                </div>

                {/* Sisi Tengah: Tombol Simpan Template Cepat */}
                <div className="hidden md:flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveTemplate}
                    className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-white/20"
                    title="Simpan Template"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Template</span>
                  </button>
                </div>

                {/* Sisi Kanan: Kontrol Window Word (Minimize & Tutup/Review) */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsWordFullscreen(false)}
                    className="px-3.5 py-1.5 bg-white/15 hover:bg-white/25 active:bg-white/35 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-white/20"
                    title="Kecilkan ke halaman review (Esc)"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>Minimize</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsWordFullscreen(false)
                      setActiveTab('preview')
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                    title="Tutup editor Word dan kembali ke lembar review pratinjau surat"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Tutup &amp; Lihat Review Surat</span>
                  </button>
                </div>
              </div>

              {/* BAR VARIABEL DINAMIS DI ATAS EDITOR */}
              <div className="bg-blue-900 text-blue-100 px-4 py-2 border-b border-blue-800 text-xs flex flex-wrap items-center gap-2 shrink-0">
                <span className="font-bold text-white flex items-center gap-1">
                  <Code className="w-3.5 h-3.5 text-amber-300" />
                  Variabel Tersedia:
                </span>
                <span className="text-blue-300 text-[11px] hidden sm:inline">
                  (Sisipkan kode ini ke teks untuk memuat nilai otomatis dari form):
                </span>
                <div className="flex flex-wrap gap-1">
                  {availableVariables.map((v) => (
                    <span
                      key={v.key}
                      className="px-2 py-0.5 rounded bg-blue-800/80 border border-blue-600/60 font-mono text-[11px] text-amber-200"
                      title={v.label}
                    >
                      {`{{${v.key}}}`}
                    </span>
                  ))}
                </div>
              </div>

              {/* AREA WORKSPACE EDITOR WORD (SCROLLABLE) */}
              <div className="flex-1 overflow-y-auto select-text p-4 sm:p-6 bg-slate-300/80">
                <div className="max-w-6xl mx-auto space-y-6">
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
                  />
                </div>
              </div>

              {/* WORD STATUS BAR (BOTTOM) */}
              <div className="bg-[#185abd] text-white/90 px-4 py-1.5 text-xs flex items-center justify-between shadow-inner shrink-0 select-none">
                <div className="flex items-center gap-2.5 text-[11px]">
                  <span className="font-semibold">Format Baku Template</span>
                  <span>&bull;</span>
                  <span>Bahasa Indonesia (Standar Surat Resmi CV Makmur Permata)</span>
                </div>
                <div className="text-[11px] text-blue-100">
                  Variabel dinamis akan otomatis terisi saat staf membuat surat ajuan
                </div>
              </div>
            </div>
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
              {(approverModalTemplate.approvalSteps || []).map((step, idx) => (
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
                  <div className="w-60">
                    <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Jabatan HRD</label>
                    <SearchableSelect
                      value={step.kodeJabatan || step.approverRole || ''}
                      placeholder="-- Pilih Jabatan HRD --"
                      options={HRD_JABATAN.map((j) => ({
                        value: j.kode,
                        label: `${j.kode} - ${j.nama}`,
                        sublabel: j.alias,
                      }))}
                      onChange={(selectedKode) => {
                        const matched = HRD_JABATAN.find((j) => j.kode === selectedKode)
                        const steps = [...approverModalTemplate.approvalSteps]
                        steps[idx].kodeJabatan = selectedKode
                        if (matched) {
                          steps[idx].approverRole = matched.nama
                          steps[idx].title = `Persetujuan ${matched.nama}`
                        }
                        setApproverModalTemplate({ ...approverModalTemplate, approvalSteps: steps })
                      }}
                      isClearable
                    />
                  </div>
                </div>
              ))}
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
                onClick={() => {
                  if (!newCategoryName.trim()) return
                  const updated = addCategory(newCategoryName)
                  setCategories(updated)
                  setNewCategoryName('')
                  notify.success('Kategori Ditambahkan', 'Kategori baru berhasil dibuat.')
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
                          onClick={() => {
                            if (!editingCategory.newName.trim()) return
                            const updated = updateCategory(
                              editingCategory.oldName,
                              editingCategory.newName
                            )
                            setCategories(updated)
                            setEditingCategory({ oldName: '', newName: '' })
                            refreshList()
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
                            onClick={() => {
                              if (count > 0) {
                                notify.warning(
                                  'Kategori Digunakan',
                                  `Masih ada ${count} template yang memakai kategori ini.`
                                )
                                return
                              }
                              const updated = deleteCategory(cat)
                              setCategories(updated)
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition"
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
