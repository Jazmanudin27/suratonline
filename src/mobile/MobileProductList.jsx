import React, { useState, useEffect, useMemo } from 'react'
import {
  Package,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Layers,
  Box,
  Hash,
  Tag,
  Percent,
  Coins,
  Calendar,
  Clock,
  X,
  ChevronRight,
  Info,
  Archive,
  SlidersHorizontal,
} from 'lucide-react'
import { getProducts, formatDateId, formatDateTimeId, formatRupiah } from '../services/storage'

export default function MobileProductList({ currentUser }) {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'active' | 'inactive'
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState(null)

  useEffect(() => {
    setProducts(getProducts())

    const handleProductsChange = () => {
      setProducts(getProducts())
    }

    window.addEventListener('products_change', handleProductsChange)
    return () => {
      window.removeEventListener('products_change', handleProductsChange)
    }
  }, [])

  // Ekstrak kategori unik
  const categories = useMemo(() => {
    const set = new Set()
    products.forEach((p) => {
      if (p.kode_kategori_produk) {
        set.add(p.kode_kategori_produk)
      }
    })
    return Array.from(set).sort()
  }, [products])

  // Filter produk
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      const q = search.trim().toLowerCase()
      const matchSearch =
        !q ||
        (p.nama_produk && p.nama_produk.toLowerCase().includes(q)) ||
        (p.kode_produk && p.kode_produk.toLowerCase().includes(q)) ||
        (p.kode_sku && p.kode_sku.toLowerCase().includes(q)) ||
        (p.kode_kategori_produk && p.kode_kategori_produk.toLowerCase().includes(q)) ||
        (p.kode_jenis_produk && p.kode_jenis_produk.toLowerCase().includes(q))

      // Status
      let matchStatus = true
      if (statusFilter === 'active') {
        matchStatus = String(p.status_aktif_produk) === '1'
      } else if (statusFilter === 'inactive') {
        matchStatus = String(p.status_aktif_produk) === '0'
      }

      // Kategori
      const matchCategory =
        categoryFilter === 'all' || p.kode_kategori_produk === categoryFilter

      return matchSearch && matchStatus && matchCategory
    })
  }, [products, search, statusFilter, categoryFilter])

  const totalActive = products.filter((p) => String(p.status_aktif_produk) === '1').length
  const totalInactive = products.filter((p) => String(p.status_aktif_produk) === '0').length

  return (
    <div className="space-y-3 pb-24">
      {/* Top Banner Khusus Mobile */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-2xl p-4 text-white shadow-md shadow-indigo-900/10 border border-blue-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-xs">
              <Package size={22} className="text-sky-300" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-white leading-tight">
                Katalog Master Produk
              </h2>
              <p className="text-[11px] text-blue-100/80 font-medium">
                CV Makmur Permata &bull; Khusus Mobile
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-white/15 backdrop-blur-md rounded-xl text-xs font-black border border-white/20">
            {products.length} Item
          </span>
        </div>

        {/* Quick Stats Counter */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/15">
          <div className="bg-white/10 rounded-xl p-2 text-center backdrop-blur-xs">
            <span className="block text-[10px] text-emerald-200 font-semibold uppercase">
              Produk Aktif
            </span>
            <span className="text-base font-black text-white">{totalActive}</span>
          </div>
          <div className="bg-white/10 rounded-xl p-2 text-center backdrop-blur-xs">
            <span className="block text-[10px] text-rose-200 font-semibold uppercase">
              Non-Aktif
            </span>
            <span className="text-base font-black text-white">{totalInactive}</span>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white rounded-2xl p-3 shadow-xs border border-slate-200/80 space-y-2.5">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama produk, kode, SKU..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap shrink-0 flex items-center gap-1 ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>Semua</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              statusFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {products.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap shrink-0 flex items-center gap-1 ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 size={13} />
            <span>Aktif</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              statusFilter === 'active' ? 'bg-white/20 text-white' : 'bg-emerald-200/80 text-emerald-900'
            }`}>
              {totalActive}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap shrink-0 flex items-center gap-1 ${
              statusFilter === 'inactive'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <XCircle size={13} />
            <span>Non-Aktif</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              statusFilter === 'inactive' ? 'bg-white/20 text-white' : 'bg-rose-200/80 text-rose-900'
            }`}>
              {totalInactive}
            </span>
          </button>
        </div>

        {/* Category Filter Pills (if any) */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1 border-t border-slate-100 text-[11px]">
            <span className="text-slate-400 font-semibold shrink-0 flex items-center gap-1 text-[10px]">
              <Tag size={12} /> Kategori:
            </span>
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-2 py-0.5 rounded-lg font-bold transition whitespace-nowrap shrink-0 ${
                categoryFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-2 py-0.5 rounded-lg font-bold transition whitespace-nowrap shrink-0 ${
                  categoryFilter === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product List Cards */}
      <div className="space-y-2.5">
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-200/80 space-y-2 shadow-xs">
            <Package size={40} className="mx-auto text-slate-300 stroke-[1.5]" />
            <h4 className="font-bold text-slate-700 text-sm">Produk Tidak Ditemukan</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Tidak ada produk yang cocok dengan pencarian atau filter yang dipilih.
            </p>
          </div>
        ) : (
          filteredProducts.map((p) => {
            const isActive = String(p.status_aktif_produk) === '1'

            return (
              <div
                key={p.kode_produk}
                onClick={() => setSelectedProduct(p)}
                className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs hover:shadow-md transition active:scale-[0.99] cursor-pointer space-y-2.5"
              >
                {/* Header: Nama & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="font-mono text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded-md">
                        {p.kode_produk}
                      </span>
                      {p.kode_sku && (
                        <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded-md">
                          {p.kode_sku}
                        </span>
                      )}
                      {p.urutan !== undefined && p.urutan !== null && (
                        <span className="text-[10px] text-slate-400 font-semibold">
                          #{p.urutan}
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug">
                      {p.nama_produk}
                    </h3>
                  </div>

                  {/* Status Pill */}
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isActive
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                    {isActive ? 'Aktif' : 'Non-Aktif'}
                  </span>
                </div>

                {/* Packaging & Konversi Dus / Pack / Pcs */}
                <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-150 text-[11px]">
                  <div className="text-center">
                    <span className="block text-[9px] text-slate-400 font-bold uppercase">
                      Satuan
                    </span>
                    <span className="font-extrabold text-slate-800">
                      {p.satuan || '-'}
                    </span>
                  </div>
                  <div className="text-center border-x border-slate-200">
                    <span className="block text-[9px] text-slate-400 font-bold uppercase">
                      Isi Dus
                    </span>
                    <span className="font-extrabold text-blue-700">
                      {p.isi_pcs_dus !== undefined ? `${p.isi_pcs_dus} pcs` : '-'}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="block text-[9px] text-slate-400 font-bold uppercase">
                      Pack / Dus
                    </span>
                    <span className="font-extrabold text-indigo-700">
                      {p.isi_pack_dus !== undefined ? `${p.isi_pack_dus} pack` : '-'}
                    </span>
                  </div>
                </div>

                {/* Kategori & Footer info */}
                <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {p.kode_kategori_produk && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        <Tag size={10} className="text-blue-600" />
                        {p.kode_kategori_produk}
                      </span>
                    )}
                    {p.kode_jenis_produk && (
                      <span className="text-[10px] text-slate-500 font-medium">
                        &bull; {p.kode_jenis_produk}
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-blue-600 font-bold flex items-center gap-0.5">
                    <span>Detail</span>
                    <ChevronRight size={13} />
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Detail Bottom Sheet / Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-slideUp">
            
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-sky-300">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white leading-tight">
                    Detail Data Produk
                  </h3>
                  <span className="font-mono text-[10px] text-sky-300">
                    {selectedProduct.kode_produk}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              {/* Nama & Status Banner */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Nama Produk
                </span>
                <h4 className="font-extrabold text-slate-900 text-base leading-snug">
                  {selectedProduct.nama_produk}
                </h4>
                <div className="flex items-center gap-2 pt-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      String(selectedProduct.status_aktif_produk) === '1'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        String(selectedProduct.status_aktif_produk) === '1'
                          ? 'bg-emerald-600'
                          : 'bg-rose-600'
                      }`}
                    />
                    Status: {String(selectedProduct.status_aktif_produk) === '1' ? 'Aktif' : 'Non-Aktif'}
                  </span>
                  {selectedProduct.urutan !== undefined && (
                    <span className="text-[11px] text-slate-500 font-semibold">
                      Urutan: #{selectedProduct.urutan}
                    </span>
                  )}
                </div>
              </div>

              {/* SECTION 1: Identifikasi & Kode */}
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wide block">
                  Identifikasi & SKU
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">
                      Kode Produk
                    </span>
                    <span className="font-mono font-extrabold text-indigo-700 text-xs">
                      {selectedProduct.kode_produk || '-'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">
                      Kode SKU
                    </span>
                    <span className="font-mono font-extrabold text-slate-800 text-xs">
                      {selectedProduct.kode_sku || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Spesifikasi Kemasan & Konversi */}
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wide block">
                  Kemasan & Konversi Satuan
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-200">
                    <span className="block text-[10px] text-blue-600 font-bold uppercase">
                      Satuan Utama
                    </span>
                    <span className="font-extrabold text-blue-900 text-xs">
                      {selectedProduct.satuan || '-'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-200">
                    <span className="block text-[10px] text-blue-600 font-bold uppercase">
                      Isi Dus (Pcs/Dus)
                    </span>
                    <span className="font-extrabold text-blue-900 text-xs">
                      {selectedProduct.isi_pcs_dus !== undefined ? `${selectedProduct.isi_pcs_dus} Pcs` : '-'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-indigo-50/70 rounded-xl border border-indigo-200">
                    <span className="block text-[10px] text-indigo-600 font-bold uppercase">
                      Isi Dus (Pack/Dus)
                    </span>
                    <span className="font-extrabold text-indigo-900 text-xs">
                      {selectedProduct.isi_pack_dus !== undefined ? `${selectedProduct.isi_pack_dus} Pack` : '-'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-indigo-50/70 rounded-xl border border-indigo-200">
                    <span className="block text-[10px] text-indigo-600 font-bold uppercase">
                      Isi Pack (Pcs/Pack)
                    </span>
                    <span className="font-extrabold text-indigo-900 text-xs">
                      {selectedProduct.isi_pcs_pack !== undefined ? `${selectedProduct.isi_pcs_pack} Pcs` : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Daftar Harga Produk (produk_harga) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wide block">
                    Daftar Harga Produk
                  </span>
                  {selectedProduct.kode_harga && (
                    <span className="font-mono text-[10px] text-indigo-700 font-bold bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
                      {selectedProduct.kode_harga}
                    </span>
                  )}
                </div>

                {/* Badge Info Status Harga & Cabang */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {selectedProduct.status_aktif_harga !== undefined && selectedProduct.status_aktif_harga !== null && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Harga Aktif
                    </span>
                  )}
                  {selectedProduct.status_ppn !== undefined && selectedProduct.status_ppn !== null && (
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                      PPN: {String(selectedProduct.status_ppn) === '1' ? 'Ya' : 'Tidak'}
                    </span>
                  )}
                  {selectedProduct.status_promo !== undefined && selectedProduct.status_promo !== null && String(selectedProduct.status_promo) === '1' && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      Promo
                    </span>
                  )}
                  {selectedProduct.kode_cabang && (
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                      Cabang: {selectedProduct.kode_cabang}
                    </span>
                  )}
                  {selectedProduct.kode_kategori_salesman && (
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                      Sales: {selectedProduct.kode_kategori_salesman}
                    </span>
                  )}
                </div>

                {/* Grid Harga Jual */}
                <div className="p-3 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 rounded-2xl border border-emerald-200/80 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-emerald-200/60 pb-1.5">
                    <span className="text-[11px] font-black text-emerald-900 uppercase tracking-wide">
                      Harga Jual
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold">
                      Pelanggan Umum
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white/90 p-2 rounded-xl border border-emerald-100 shadow-2xs">
                      <span className="block text-[9px] text-slate-400 font-bold uppercase">
                        Per Dus
                      </span>
                      <span className="font-extrabold text-emerald-800 text-xs block truncate mt-0.5">
                        {selectedProduct.harga_dus !== null && selectedProduct.harga_dus !== undefined
                          ? `Rp ${formatRupiah(selectedProduct.harga_dus)}`
                          : '-'}
                      </span>
                    </div>

                    <div className="bg-white/90 p-2 rounded-xl border border-emerald-100 shadow-2xs">
                      <span className="block text-[9px] text-slate-400 font-bold uppercase">
                        Per Pack
                      </span>
                      <span className="font-extrabold text-emerald-800 text-xs block truncate mt-0.5">
                        {selectedProduct.harga_pack !== null && selectedProduct.harga_pack !== undefined
                          ? `Rp ${formatRupiah(selectedProduct.harga_pack)}`
                          : '-'}
                      </span>
                    </div>

                    <div className="bg-white/90 p-2 rounded-xl border border-emerald-100 shadow-2xs">
                      <span className="block text-[9px] text-slate-400 font-bold uppercase">
                        Per Pcs
                      </span>
                      <span className="font-extrabold text-emerald-800 text-xs block truncate mt-0.5">
                        {selectedProduct.harga_pcs !== null && selectedProduct.harga_pcs !== undefined
                          ? `Rp ${formatRupiah(selectedProduct.harga_pcs)}`
                          : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Grid Harga Retur */}
                <div className="p-3 bg-gradient-to-br from-slate-50 to-rose-50/40 rounded-2xl border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                    <span className="text-[11px] font-black text-rose-900 uppercase tracking-wide">
                      Harga Retur
                    </span>
                    <span className="text-[10px] text-rose-600 font-semibold">
                      Pengembalian
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white/90 p-2 rounded-xl border border-slate-200/80 shadow-2xs">
                      <span className="block text-[9px] text-slate-400 font-bold uppercase">
                        Retur Dus
                      </span>
                      <span className="font-extrabold text-rose-800 text-xs block truncate mt-0.5">
                        {selectedProduct.harga_retur_dus !== null && selectedProduct.harga_retur_dus !== undefined
                          ? `Rp ${formatRupiah(selectedProduct.harga_retur_dus)}`
                          : '-'}
                      </span>
                    </div>

                    <div className="bg-white/90 p-2 rounded-xl border border-slate-200/80 shadow-2xs">
                      <span className="block text-[9px] text-slate-400 font-bold uppercase">
                        Retur Pack
                      </span>
                      <span className="font-extrabold text-rose-800 text-xs block truncate mt-0.5">
                        {selectedProduct.harga_retur_pack !== null && selectedProduct.harga_retur_pack !== undefined
                          ? `Rp ${formatRupiah(selectedProduct.harga_retur_pack)}`
                          : '-'}
                      </span>
                    </div>

                    <div className="bg-white/90 p-2 rounded-xl border border-slate-200/80 shadow-2xs">
                      <span className="block text-[9px] text-slate-400 font-bold uppercase">
                        Retur Pcs
                      </span>
                      <span className="font-extrabold text-rose-800 text-xs block truncate mt-0.5">
                        {selectedProduct.harga_retur_pcs !== null && selectedProduct.harga_retur_pcs !== undefined
                          ? `Rp ${formatRupiah(selectedProduct.harga_retur_pcs)}`
                          : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
