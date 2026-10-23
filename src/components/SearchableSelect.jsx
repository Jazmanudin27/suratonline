import React, { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, Check, X } from 'lucide-react'

/**
 * SearchableSelect - Dropdown pengganti <select> bawaan dengan fitur pencarian interaktif
 * 
 * Props:
 * - options: Array<{ value, label, sublabel, group }> atau Array<string>
 * - value: string | number
 * - onChange: (value) => void
 * - placeholder: string
 * - disabled: boolean
 * - className: string (custom container classes)
 * - isClearable: boolean
 */
export default function SearchableSelect({
  options = [],
  value = '',
  onChange,
  placeholder = '-- Pilih --',
  disabled = false,
  className = '',
  isClearable = false,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  // Normalize options array into standardized objects
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { value: opt, label: String(opt) }
    }
    return {
      value: opt.value !== undefined ? opt.value : opt.id || '',
      label: opt.label || opt.name || String(opt.value || ''),
      sublabel: opt.sublabel || opt.description || '',
      group: opt.group || '',
      badge: opt.badge !== undefined && opt.badge !== null ? opt.badge : null,
    }
  })

  // Selected item object
  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value)
  )

  // Filter based on searchTerm
  const filteredOptions = normalizedOptions.filter((opt) => {
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase()
    const matchLabel = opt.label?.toLowerCase().includes(term)
    const matchSub = opt.sublabel?.toLowerCase().includes(term)
    const matchGroup = opt.group?.toLowerCase().includes(term)
    return matchLabel || matchSub || matchGroup
  })

  // Grouping
  const hasGroups = filteredOptions.some((opt) => !!opt.group)
  const grouped = {}
  if (hasGroups) {
    filteredOptions.forEach((opt) => {
      const g = opt.group || 'Lainnya'
      if (!grouped[g]) grouped[g] = []
      grouped[g].push(opt)
    })
  }

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto focus search input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSelect = (val) => {
    if (onChange) onChange(val)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = (e) => {
    e.stopPropagation()
    if (onChange) onChange('')
    setSearchTerm('')
  }

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            setIsOpen(!isOpen)
          }
        }}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs sm:text-sm rounded-xl border transition cursor-pointer select-none ${
          disabled
            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
            : isOpen
            ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
            : 'bg-white text-slate-900 border-slate-300 hover:border-slate-400 shadow-2xs'
        }`}
      >
        <div className="flex-1 truncate text-left">
          {selectedOption ? (
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">
                {selectedOption.label}
              </span>
              {selectedOption.sublabel && (
                <span className="text-xs text-indigo-950 font-bold truncate">
                  ({selectedOption.sublabel})
                </span>
              )}
              {selectedOption.badge !== null && selectedOption.badge !== undefined && (
                <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-800 shrink-0">
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-500 font-medium text-xs sm:text-sm">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-500">
          {isClearable && selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:text-slate-900 rounded-md hover:bg-slate-100 transition"
              title="Hapus pilihan"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 text-slate-600 ${
              isOpen ? 'rotate-180 text-indigo-600' : ''
            }`}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-300 rounded-xl shadow-2xl overflow-hidden ring-1 ring-black/10 animate-fadeIn">
          {/* Search Box */}
          <div className="p-2.5 border-b border-slate-200 bg-slate-50">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-2.5 text-slate-500 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ketik untuk mencari..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 font-bold placeholder:text-slate-400 placeholder:font-normal shadow-inner"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-700 text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-64 overflow-y-auto p-1.5 divide-y divide-slate-100 text-xs">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-slate-500 font-semibold text-xs sm:text-sm">
                Tidak ada opsi yang sesuai
              </div>
            ) : hasGroups ? (
              Object.entries(grouped).map(([grpName, groupOpts]) => (
                <div key={grpName} className="py-1">
                  <div className="px-3 py-1.5 text-xs font-black tracking-wider uppercase text-indigo-900 bg-indigo-50/70 border-y border-indigo-100/60 mb-1 rounded-md">
                    {grpName}
                  </div>
                  {groupOpts.map((opt) => {
                    const isSelected = String(opt.value) === String(value)
                    return (
                      <div
                        key={opt.value}
                        onClick={() => handleSelect(opt.value)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-bold shadow-xs'
                            : 'text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex flex-col truncate pr-2">
                          <span className={`text-xs sm:text-sm font-extrabold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                            {opt.label}
                          </span>
                          {opt.sublabel && (
                            <span className={`text-xs mt-0.5 truncate ${isSelected ? 'text-indigo-100 font-semibold' : 'text-slate-700 font-semibold'}`}>
                              {opt.sublabel}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {opt.badge !== null && opt.badge !== undefined && (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                            }`}>
                              {opt.badge}
                            </span>
                          )}
                          {isSelected && (
                            <Check className="w-4 h-4 text-white shrink-0 stroke-[3]" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value)
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-bold shadow-xs'
                        : 'text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex flex-col truncate pr-2">
                      <span className={`text-xs sm:text-sm font-extrabold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {opt.label}
                      </span>
                      {opt.sublabel && (
                        <span className={`text-xs mt-0.5 truncate ${isSelected ? 'text-indigo-100 font-semibold' : 'text-slate-700 font-semibold'}`}>
                          {opt.sublabel}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.badge !== null && opt.badge !== undefined && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                        }`}>
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-4 h-4 text-white shrink-0 stroke-[3]" />
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
