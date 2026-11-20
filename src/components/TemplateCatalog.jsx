import React, { useState, useMemo } from 'react'
import {
  FileText,
  Search,
  ArrowRight,
  Plane,
  Wrench,
  Tag,
  Coins,
  Briefcase,
  Layers,
  ChevronRight,
  X,
  Sparkles,
  Users,
  Package,
  Laptop,
  Building2,
  Mail,
  CheckCircle2,
} from 'lucide-react'
import { BLANK_TEMPLATE, getCategories } from '../services/storage'

export default function TemplateCatalog({ templates = [], onSelectTemplate }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [storedCategories, setStoredCategories] = useState(getCategories())

  React.useEffect(() => {
    const handleCatChange = () => setStoredCategories(getCategories())
    window.addEventListener('categories_change', handleCatChange)
    return () => window.removeEventListener('categories_change', handleCatChange)
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

  // Elegant category visual metadata
  const getCategoryMeta = (category = '') => {
    const cat = (category || '').toLowerCase()
    if (cat.includes('it') || cat.includes('teknologi') || cat.includes('sistem')) {
      return {
        name: category || 'IT',
        badge: 'bg-blue-50 text-blue-700 border-blue-200/90',
        icon: Laptop,
        accent: 'from-blue-600 via-indigo-600 to-cyan-500',
        ring: 'hover:border-blue-400',
      }
    }
    if (cat.includes('market') || cat.includes('sales') || cat.includes('crm') || cat.includes('promo')) {
      return {
        name: category || 'Marketing',
        badge: 'bg-purple-50 text-purple-700 border-purple-200/90',
        icon: Sparkles,
        accent: 'from-purple-600 via-pink-600 to-indigo-500',
        ring: 'hover:border-purple-400',
      }
    }
    if (cat.includes('keuangan') || cat.includes('finance') || cat.includes('account') || cat.includes('kas')) {
      return {
        name: category || 'Keuangan',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/90',
        icon: Coins,
        accent: 'from-emerald-600 via-teal-600 to-cyan-500',
        ring: 'hover:border-emerald-400',
      }
    }
    if (cat.includes('hrd') || cat.includes('personalia') || cat.includes('karyawan') || cat.includes('sdm')) {
      return {
        name: category || 'HRD',
        badge: 'bg-amber-50 text-amber-800 border-amber-200/90',
        icon: Users,
        accent: 'from-amber-500 via-orange-500 to-yellow-500',
        ring: 'hover:border-amber-400',
      }
    }
    if (cat.includes('gudang') || cat.includes('logistik') || cat.includes('stok') || cat.includes('barang')) {
      return {
        name: category || 'Logistik',
        badge: 'bg-sky-50 text-sky-700 border-sky-200/90',
        icon: Package,
        accent: 'from-sky-600 via-blue-600 to-teal-500',
        ring: 'hover:border-sky-400',
      }
    }
    if (cat.includes('affair') || cat.includes('ga') || cat.includes('umum') || cat.includes('operasional')) {
      return {
        name: category || 'GA',
        badge: 'bg-slate-100 text-slate-700 border-slate-300/80',
        icon: Briefcase,
        accent: 'from-slate-700 via-slate-800 to-blue-900',
        ring: 'hover:border-slate-400',
      }
    }
    return {
      name: category || 'Umum',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200/90',
      icon: FileText,
      accent: 'from-indigo-600 via-blue-600 to-sky-500',
      ring: 'hover:border-indigo-400',
    }
  }

  return (
    <div className="space-y-3.5">
      {/* Top Header Banner Berwarna */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white border border-blue-900/40 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20 text-white shadow-xs shrink-0">
              <Layers className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Katalog Template Surat Pengajuan</h2>
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/15 text-sky-200 border border-white/20">
                  {categoryCounts.all || 0} Template
                </span>
              </div>
              <p className="text-xs text-blue-100/80 mt-0.5">
                Pilih template resmi di bawah ini untuk memulai pengisian form dan editor otomatis.
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-custom-blank-letter"
            onClick={() => onSelectTemplate(BLANK_TEMPLATE)}
            className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950 hover:bg-black text-white font-bold text-xs shadow-md shadow-black/40 hover:shadow-black/60 active:scale-95 transition-all duration-200 border border-slate-700/80 hover:border-slate-500 cursor-pointer"
            title="Buat surat ajuan baru secara mandiri tanpa template baku"
          >
            <div className="p-1 rounded-md bg-white/10 text-white group-hover:scale-110 transition-transform duration-200">
              <Mail className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="tracking-wide">Buat Surat Bebas</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 shadow-xs space-y-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Tabs with Notification Counter */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-slate-200 flex-1">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat
              const count = categoryCounts[cat] || (cat === 'all' ? categoryCounts.all : 0) || 0
              const label = cat === 'all' ? 'Semua Kategori' : cat

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs ring-1 ring-slate-900'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <span>{label}</span>
                  {/* Notification Badge */}
                  <span
                    className={`inline-flex items-center justify-center min-w-[20px] h-[19px] px-1.5 rounded-full text-[11px] font-bold transition-all ${
                      isSelected
                        ? 'bg-blue-500 text-white shadow-2xs'
                        : count > 0
                        ? 'bg-blue-50 text-blue-700 border border-blue-200/80 group-hover:bg-blue-100 group-hover:text-blue-800'
                        : 'bg-slate-200/70 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64 lg:w-72 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari template surat..."
              className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Templates (Simple & Elegant) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Tidak ada template pada kategori ini</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Coba pilih kategori lain atau gunakan tombol <strong>Buat Surat Bebas</strong> untuk menyusun surat tanpa template.
            </p>
          </div>
        ) : (
          filteredTemplates.map((tpl, idx) => {
            const stepsCount = tpl.approvalSteps?.length || 1
            const meta = getCategoryMeta(tpl.category)
            const CategoryIcon = meta.icon

            return (
              <div
                key={tpl.id}
                id={`template-card-${idx}`}
                className={`bg-white border border-slate-200 rounded-2xl shadow-xs hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group overflow-hidden ${meta.ring}`}
              >
                {/* Sleek Gradient Accent Line */}
                <div className={`h-1 w-full bg-gradient-to-r ${meta.accent}`} />

                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Category Badge & Status Pill */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border shadow-2xs flex items-center gap-1.5 ${meta.badge}`}>
                        <CategoryIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>{tpl.category || 'Umum'}</span>
                      </span>

                      <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Siap Digunakan</span>
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-blue-600 transition-colors leading-snug line-clamp-1">
                      {tpl.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed min-h-[32px]">
                      {tpl.description || 'Pilih template resmi ini untuk memulai pengisian surat ajuan.'}
                    </p>

                    {/* Approval Pipeline Box */}
                    <div className="mt-3.5 bg-slate-50/80 border border-slate-100 rounded-xl p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-500">
                          Alur Persetujuan
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 bg-white px-1.5 py-0.2 rounded border border-slate-200/60">
                          {stepsCount} Tingkat
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        {tpl.approvalSteps?.map((step, sIdx) => (
                          <React.Fragment key={sIdx}>
                            <span className="text-[10px] font-semibold bg-white text-slate-700 px-2 py-0.5 rounded-lg flex items-center gap-1 border border-slate-200/80 shadow-2xs">
                              <span className="w-3.5 h-3.5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                                {step.step || sIdx + 1}
                              </span>
                              <span className="truncate max-w-[120px]">
                                {step.specificUserName || step.approverRole || step.title}
                              </span>
                            </span>
                            {sIdx < (tpl.approvalSteps?.length || 0) - 1 && (
                              <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action Button */}
                <div className="p-3 sm:px-4 bg-slate-50/60 border-t border-slate-100">
                  <button
                    id={idx === 0 ? 'btn-use-template-first' : `btn-use-template-${idx}`}
                    onClick={() => onSelectTemplate(tpl)}
                    className="w-full py-2 px-4 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-xs hover:shadow-md hover:shadow-blue-600/20 active:scale-98 cursor-pointer"
                  >
                    <span>Gunakan Template Ini</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

