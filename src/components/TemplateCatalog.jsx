import React, { useState } from 'react'
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
  FileCheck2,
  Sparkles,
  CheckCircle2,
  FilePenLine,
  Mail,
  MailPlus,
} from 'lucide-react'
import { BLANK_TEMPLATE } from '../services/storage'

export default function TemplateCatalog({ templates = [], onSelectTemplate }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = ['all', ...Array.from(new Set(templates.map((t) => t.category || 'Umum')))]

  const filteredTemplates = templates.filter((tpl) => {
    if (!tpl.isActive) return false

    const matchesSearch =
      tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === 'all' || tpl.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const getCategoryTheme = (category = '') => {
    const cat = category.toLowerCase()
    if (cat.includes('operasional')) {
      return {
        bar: 'from-emerald-500 to-teal-400',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200/60',
      }
    }
    if (cat.includes('sales') || cat.includes('crm') || cat.includes('diskon')) {
      return {
        bar: 'from-indigo-600 to-sky-500',
        badge: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
        iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200/60',
      }
    }
    if (cat.includes('pemeliharaan') || cat.includes('service')) {
      return {
        bar: 'from-amber-500 to-orange-400',
        badge: 'bg-amber-50 text-amber-700 border-amber-200/80',
        iconBg: 'bg-amber-50 text-amber-600 border-amber-200/60',
      }
    }
    return {
      bar: 'from-purple-600 to-indigo-500',
      badge: 'bg-purple-50 text-purple-700 border-purple-200/80',
      iconBg: 'bg-purple-50 text-purple-600 border-purple-200/60',
    }
  }

  const getTemplateIcon = (code = '', category = '') => {
    const c = code.toUpperCase()
    if (c.includes('PERDIN')) return <Plane className="w-3.5 h-3.5" />
    if (c.includes('SERVICE')) return <Wrench className="w-3.5 h-3.5" />
    if (c.includes('DISKON') || c.includes('CRM')) return <Tag className="w-3.5 h-3.5" />
    if (c.includes('REALISASI') || c.includes('BIAYA')) return <Coins className="w-3.5 h-3.5" />
    if (category.toLowerCase().includes('operasional')) return <Briefcase className="w-3.5 h-3.5" />
    return <FileText className="w-3.5 h-3.5" />
  }

  return (
    <div className="space-y-3">
      {/* Top Header Banner Berwarna */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white border border-blue-900/40 rounded-xl p-3.5 sm:p-4 pb-2 sm:pb-2 shadow-md shadow-slate-900/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20 text-white shadow-xs shrink-0">
              <Layers className="w-4.5 h-4.5 text-sky-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Katalog Template Surat Pengajuan</h2>
              <p className="text-xs text-blue-100/80">
                Pilih template resmi di bawah ini untuk memulai pengisian form dan editor.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelectTemplate(BLANK_TEMPLATE)}
            className="group inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-slate-950 hover:bg-black text-white font-extrabold text-xs shadow-lg shadow-black/40 hover:shadow-black/60 active:scale-95 transition-all duration-200 border border-slate-700/80 hover:border-slate-500 cursor-pointer"
            title="Buat surat ajuan baru secara mandiri tanpa template baku"
          >
            <div className="p-1 rounded-md bg-white/10 text-white group-hover:scale-110 transition-transform duration-200">
              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <span className="tracking-wide">Buat Surat Bebas</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar Card */}
      <div className="bg-white border border-slate-300 rounded-xl p-3 sm:p-3.5 shadow-md shadow-slate-400/20 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs scrollbar-none flex-1">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition capitalize whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {cat === 'all' ? 'Semua Kategori' : cat}
                </button>
              )
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64 md:w-72 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari template..."
              className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Templates (Modern & High-Contrast) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-300 rounded-2xl p-8 text-center shadow-xs">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="font-bold text-slate-700 text-sm">Tidak ada template pada kategori ini</h3>
            <p className="text-xs text-slate-500 mt-1">
              Gunakan tombol <strong>Buat Surat Bebas</strong> di kanan atas untuk membuat surat tanpa template.
            </p>
          </div>
        ) : (
          filteredTemplates.map((tpl, idx) => {
          const stepsCount = tpl.approvalSteps?.length || 1

          return (
            <div
              key={tpl.id}
              id={`template-card-${idx}`}
              className="bg-white border border-slate-300/80 hover:border-indigo-400 rounded-2xl shadow-md shadow-slate-900/5 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group overflow-hidden"
            >
              {/* Top Accent Strip */}
              <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500" />

              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                <div>
                  {/* Category Badge & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/90 shadow-2xs flex items-center gap-1.5">
                      <Tag className="w-3 h-3 text-indigo-500" />
                      <span>{tpl.category || 'Umum'}</span>
                    </span>

                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Siap Digunakan</span>
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-extrabold text-slate-900 text-base group-hover:text-indigo-600 transition-colors leading-snug line-clamp-1">
                    {tpl.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed min-h-[32px]">
                    {tpl.description || 'Pilih template ini untuk memulai pengisian surat ajuan.'}
                  </p>

                  {/* Approval Pipeline Box */}
                  <div className="mt-4 bg-slate-50/90 border border-slate-200/80 rounded-xl p-3 space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      Alur Persetujuan ({stepsCount} Tingkat):
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {tpl.approvalSteps?.map((step, idx) => (
                        <React.Fragment key={idx}>
                          <span className="text-[10px] font-bold bg-white text-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1 border border-slate-200/90 shadow-2xs">
                            <span className="w-3.5 h-3.5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-black shrink-0">
                              {step.step}
                            </span>
                            <span className="truncate max-w-[120px]">
                              {step.specificUserName || step.approverRole || step.title}
                            </span>
                          </span>
                          {idx < (tpl.approvalSteps?.length || 0) - 1 && (
                            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Action Button */}
              <div className="p-3 sm:px-4 bg-gradient-to-r from-slate-50 to-indigo-50/40 border-t border-slate-200/80">
                <button
                  onClick={() => onSelectTemplate(tpl)}
                  className="w-full py-2 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-md shadow-indigo-500/20 active:scale-98 group-hover:shadow-indigo-500/30 cursor-pointer"
                >
                  <span>Gunakan Template Ini</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </button>
              </div>
            </div>
          )
        }))}
      </div>
    </div>
  )
}
