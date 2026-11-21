import React, { useState, useMemo } from 'react'
import {
  FileText,
  Search,
  Filter,
  ArrowRight,
  Briefcase,
  Layers,
  ChevronRight,
  X,
  Sparkles,
  Users,
  Package,
  Laptop,
  Mail,
  Coins,
  RotateCw,
  CheckCircle2,
  ShieldCheck,
  Tag,
  Eye,
  Check,
} from 'lucide-react'
import {
  BLANK_TEMPLATE,
  getCategories,
  getTemplates,
  syncWithDatabase,
  compileTemplateContent,
  formatDateId,
} from '../services/storage'
import LetterDocumentView from './LetterDocumentView'

export default function TemplateCatalog({ templates: propTemplates = [], onSelectTemplate }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [storedCategories, setStoredCategories] = useState(getCategories())
  const [templates, setTemplates] = useState(() => (propTemplates && propTemplates.length > 0 ? propTemplates : getTemplates()))
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState(null)

  React.useEffect(() => {
    if (propTemplates && propTemplates.length > 0) {
      setTemplates(propTemplates)
    }
  }, [propTemplates])

  React.useEffect(() => {
    const handleCatChange = () => setStoredCategories(getCategories())
    const handleTplChange = () => setTemplates(getTemplates())
    window.addEventListener('categories_change', handleCatChange)
    window.addEventListener('templates_change', handleTplChange)

    // Sync langsung dari database saat katalog dibuka
    syncWithDatabase().catch(() => {})

    return () => {
      window.removeEventListener('categories_change', handleCatChange)
      window.removeEventListener('templates_change', handleTplChange)
    }
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await syncWithDatabase()
      setTemplates(getTemplates())
      setStoredCategories(getCategories())
    } catch (err) {
      console.warn('Refresh error:', err)
    } finally {
      setTimeout(() => setIsRefreshing(false), 300)
    }
  }

  // Build unified categories list
  const categories = useMemo(() => {
    const catSet = new Set(storedCategories)
    templates.forEach((t) => {
      if (t.category) catSet.add(t.category)
    })
    return ['all', ...Array.from(catSet)]
  }, [storedCategories, templates])

  // Count active templates per category for notification badges
  const categoryCounts = useMemo(() => {
    const counts = { all: 0 }
    templates.forEach((t) => {
      if (t.isActive !== false) {
        counts.all = (counts.all || 0) + 1
        const cat = t.category || 'Umum'
        counts[cat] = (counts[cat] || 0) + 1
      }
    })
    return counts
  }, [templates])

  // Filter templates by search and category
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      if (tpl.isActive === false) return false

      const matchesSearch =
        !searchQuery.trim() ||
        tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.description?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory =
        selectedCategory === 'all' ||
        (tpl.category || 'Umum').toLowerCase() === selectedCategory.toLowerCase()

      return matchesSearch && matchesCategory
    })
  }, [templates, searchQuery, selectedCategory])

  // Category visual metadata
  const getCategoryMeta = (category = '') => {
    const cat = (category || '').toLowerCase()
    if (cat.includes('it') || cat.includes('teknologi') || cat.includes('sistem')) {
      return {
        badge: 'bg-blue-50 text-blue-700 border-blue-200/90',
        icon: Laptop,
      }
    }
    if (cat.includes('market') || cat.includes('sales') || cat.includes('crm') || cat.includes('promo')) {
      return {
        badge: 'bg-purple-50 text-purple-700 border-purple-200/90',
        icon: Sparkles,
      }
    }
    if (cat.includes('keuangan') || cat.includes('finance') || cat.includes('account') || cat.includes('kas')) {
      return {
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/90',
        icon: Coins,
      }
    }
    if (cat.includes('hrd') || cat.includes('personalia') || cat.includes('karyawan') || cat.includes('sdm')) {
      return {
        badge: 'bg-amber-50 text-amber-800 border-amber-200/90',
        icon: Users,
      }
    }
    if (cat.includes('gudang') || cat.includes('logistik') || cat.includes('stok') || cat.includes('barang')) {
      return {
        badge: 'bg-sky-50 text-sky-700 border-sky-200/90',
        icon: Package,
      }
    }
    if (cat.includes('affair') || cat.includes('ga') || cat.includes('umum') || cat.includes('operasional')) {
      return {
        badge: 'bg-slate-100 text-slate-700 border-slate-300/80',
        icon: Briefcase,
      }
    }
    return {
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200/90',
      icon: FileText,
    }
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
      ringkasan: 'Sehubungan dengan kebutuhan peningkatan efisiensi operasional, bersama ini kami mengajukan permohonan persetujuan resmi sesuai format template.',
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
          .replace('{{roman_month}}', 'XI')
          .replace('{{year}}', new Date().getFullYear())
      : '001/SP/TSM/XI/2026'

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
      notes: 'Disetujui untuk pratinjau format surat resmi.',
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

  return (
    <div className="space-y-3.5">
      {/* ========================================================================= */}
      {/* PAGE TITLE BAR DENGAN TOMBOL AKSI BERSIH                                  */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center shadow-2xs shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight leading-tight">
              Katalog Template Surat Pengajuan
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Pilih format baku resmi untuk memulai penyusunan surat dinas dan operasional.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition active:scale-95 cursor-pointer disabled:opacity-50"
            title="Muat ulang data template"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>

          {/* Buat Surat Bebas */}
          <button
            type="button"
            id="btn-custom-blank-letter"
            onClick={() => onSelectTemplate(BLANK_TEMPLATE)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-lg shadow-sm transition-all duration-150 cursor-pointer"
            title="Tulis surat ajuan bebas secara mandiri tanpa template"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Buat Surat Bebas</span>
          </button>
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
            placeholder="Cari nama template, perihal, atau deskripsi..."
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

        {/* Filter Kategori Select Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Kategori:</span>
          </div>
          <select
            id="select-template-category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="py-1.5 pl-3 pr-8 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition cursor-pointer"
          >
            {categories.map((cat) => {
              const count = categoryCounts[cat] || (cat === 'all' ? categoryCounts.all : 0) || 0
              const label = cat === 'all' ? 'Semua Kategori' : cat
              return (
                <option key={cat} value={cat}>
                  {label} ({count})
                </option>
              )
            })}
          </select>
          {selectedCategory !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline ml-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. DATA TABLE ELEGAN (Header Gelap / Charcoal Mirip Screenshot Referensi)  */}
      {/* ========================================================================= */}
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
                <th className="py-3 px-3 w-28 text-center border-r border-slate-700/60">STATUS</th>
                <th className="py-3 px-3.5 w-40 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700 text-sm">Tidak ada template ditemukan</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Coba ganti kata kunci pencarian atau gunakan tombol "Buat Surat Bebas".
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTemplates.map((tpl, idx) => {
                  const meta = getCategoryMeta(tpl.category)
                  const CategoryIcon = meta.icon

                  return (
                    <tr
                      key={tpl.id}
                      id={`template-row-${idx}`}
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
                          {tpl.code && (
                            <span className="text-[10px] font-mono text-slate-400 block">
                              Kode Format: {tpl.code}
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
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border shadow-2xs ${meta.badge}`}>
                          <CategoryIcon className="w-3.5 h-3.5 shrink-0" />
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

                      {/* STATUS */}
                      <td className="py-3 px-3 text-center border-r border-slate-200 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Siap Pakai</span>
                        </span>
                      </td>

                      {/* AKSI */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Tombol Preview Mata (Hijau Seperti di Referensi) */}
                          <button
                            type="button"
                            onClick={() => setPreviewTemplate(tpl)}
                            className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-300 rounded-lg transition shadow-2xs cursor-pointer"
                            title="Pratinjau Lembar Surat Resmi"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Tombol Gunakan Template (Biru Kuat) */}
                          <button
                            id={idx === 0 ? 'btn-use-template-first' : `btn-use-template-${idx}`}
                            onClick={() => onSelectTemplate(tpl)}
                            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                            title={`Gunakan template ${tpl.name}`}
                          >
                            <span>Gunakan</span>
                            <ArrowRight className="w-3.5 h-3.5" />
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

      {/* ========================================================================= */}
      {/* 5. MODAL PRATINJAU LEMBAR RESMI (KETIKA KLIK ICON MATA)                    */}
      {/* ========================================================================= */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
            {/* Header Modal */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-blue-600 text-white">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">{previewTemplate.name}</h3>
                  <p className="text-[11px] text-slate-400">Pratinjau lembar surat baku resmi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Viewer Body */}
            <div className="p-4 sm:p-6 overflow-y-auto bg-slate-100 flex-1 flex justify-center">
              <div className="bg-white shadow-lg p-6 sm:p-10 rounded-xs border border-slate-200 max-w-2xl w-full">
                <LetterDocumentView letter={generatePreviewLetter(previewTemplate)} />
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                Kategori: <strong className="text-slate-800">{previewTemplate.category || 'Umum'}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewTemplate(null)}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const t = previewTemplate
                    setPreviewTemplate(null)
                    onSelectTemplate(t)
                  }}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Gunakan Template Ini</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
