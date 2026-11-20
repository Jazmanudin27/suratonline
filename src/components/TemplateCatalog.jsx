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
} from 'lucide-react'
import { BLANK_TEMPLATE, getCategories, getTemplates, syncWithDatabase } from '../services/storage'

export default function TemplateCatalog({ templates: propTemplates = [], onSelectTemplate }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [storedCategories, setStoredCategories] = useState(getCategories())
  const [templates, setTemplates] = useState(() => (propTemplates && propTemplates.length > 0 ? propTemplates : getTemplates()))

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

  return (
    <div className="space-y-2.5">
      {/* Top Header Banner Berwarna - Ringkas & Padat */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white border border-blue-900/40 rounded-xl p-3 sm:p-3.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20 text-white shadow-xs shrink-0">
              <Layers className="w-4.5 h-4.5 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Katalog Template Surat Pengajuan</h2>
                <span className="inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-semibold bg-white/15 text-sky-200 border border-white/20">
                  {categoryCounts.all || 0} Template
                </span>
              </div>
              <p className="text-[11px] text-blue-100/80">
                Pilih template resmi di bawah ini untuk memulai pengisian form surat otomatis.
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-custom-blank-letter"
            onClick={() => onSelectTemplate(BLANK_TEMPLATE)}
            className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-black text-white font-bold text-xs shadow-md shadow-black/40 hover:shadow-black/60 active:scale-95 transition-all duration-200 border border-slate-700/80 hover:border-slate-500 cursor-pointer"
            title="Buat surat ajuan baru secara mandiri tanpa template baku"
          >
            <Mail className="w-3.5 h-3.5 text-white" />
            <span className="tracking-wide">Buat Surat Bebas</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar Card - Rapat & Bersih */}
      <div className="bg-white border border-slate-300 rounded-xl p-2.5 sm:p-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Category Select Dropdown */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 shrink-0">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <span>Filter Kategori:</span>
            </div>
            <select
              id="select-template-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-1.5 pl-3 pr-8 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white transition cursor-pointer"
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
                Reset Filter
              </button>
            )}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-60 md:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari template surat..."
              className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Templates Table / List View (Simple, Elegan & Rapat) */}
      <div className="bg-white border border-slate-300 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-blue-600 text-white font-bold border-b-2 border-blue-700 text-xs">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center border-r border-blue-500/50">No</th>
                <th className="py-2.5 px-3.5 border-r border-blue-500/50">Perihal & Template Surat</th>
                <th className="py-2.5 px-3.5 border-r border-blue-500/50">Alur Persetujuan</th>
                <th className="py-2.5 px-3 w-28 text-center border-r border-blue-500/50">Status</th>
                <th className="py-2.5 px-3.5 w-32 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500">
                    <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Tidak ada template pada kategori ini</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Gunakan tombol "Buat Surat Bebas" untuk membuat surat tanpa template.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTemplates.map((tpl, idx) => {
                  const stepsCount = tpl.approvalSteps?.length || 1
                  const meta = getCategoryMeta(tpl.category)
                  const CategoryIcon = meta.icon

                  return (
                    <tr
                      key={tpl.id}
                      id={`template-row-${idx}`}
                      className="hover:bg-blue-50/60 transition-colors group"
                    >
                      {/* No */}
                      <td className="py-2.5 px-3 text-center font-bold text-slate-400 border-r border-slate-200">
                        {idx + 1}
                      </td>

                      {/* Perihal & Template Surat (Kategori di atas, Nama Perihal di bawah) */}
                      <td className="py-2 px-3.5 border-r border-slate-200">
                        <div className="space-y-1">
                          {/* Kategori Badge di atas */}
                          <div>
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${meta.badge}`}>
                              <CategoryIcon className="w-3 h-3 shrink-0" />
                              <span>{tpl.category || 'Umum'}</span>
                            </span>
                          </div>

                          {/* Nama / Perihal Surat di bawah */}
                          <div>
                            <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-xs sm:text-sm block leading-snug">
                              {tpl.name}
                            </span>
                            {tpl.description && (
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                {tpl.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Alur Persetujuan */}
                      <td className="py-2.5 px-3.5 border-r border-slate-200">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {tpl.approvalSteps && tpl.approvalSteps.length > 0 ? (
                            tpl.approvalSteps.map((step, sIdx) => (
                              <React.Fragment key={sIdx}>
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-50 text-slate-700 px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                                  <span className="w-3.5 h-3.5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
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

                      {/* Status */}
                      <td className="py-2.5 px-3 text-center border-r border-slate-200 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Siap Pakai</span>
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <button
                          id={idx === 0 ? 'btn-use-template-first' : `btn-use-template-${idx}`}
                          onClick={() => onSelectTemplate(tpl)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer w-full"
                          title={`Gunakan template ${tpl.name}`}
                        >
                          <span>Gunakan</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
