import React, { useState, useEffect, useMemo } from 'react'
import {
  Building2,
  Plus,
  MapPin,
  Phone,
  Mail,
  Search,
  Edit3,
  UserCheck,
  ShieldCheck,
  Users,
  LayoutGrid,
  List,
  Layers,
  X,
} from 'lucide-react'
import { getBranches, saveBranch, getUsers, syncWithDatabase } from '../services/storage'
import { notify } from '../utils/alert'

export default function BranchMaster() {
  const [branches, setBranches] = useState(() => getBranches())
  const [users, setUsers] = useState(() => getUsers())
  const [modalState, setModalState] = useState({ open: false, isEdit: false })
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('table') // 'table' | 'grid'
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    code: '',
    pt: '',
    address: '',
    phone: '',
    email: '',
    madeBy: '',
    madeByPosition: '',
    knownBy: '',
    knownByPosition: '',
    rsmId: '',
    rsmName: '',
    regionalName: '',
  })

  useEffect(() => {
    const handleBranchesChange = () => setBranches(getBranches())
    const handleUsersChange = () => setUsers(getUsers())

    window.addEventListener('branches_change', handleBranchesChange)
    window.addEventListener('users_change', handleUsersChange)

    // Segera sinkronisasi dengan database MySQL saat halaman dibuka
    syncWithDatabase().catch(() => {})

    return () => {
      window.removeEventListener('branches_change', handleBranchesChange)
      window.removeEventListener('users_change', handleUsersChange)
    }
  }, [])

  const openAddModal = () => {
    setFormData({
      id: '',
      name: '',
      code: '',
      pt: '',
      address: '',
      phone: '',
      email: '',
      madeBy: 'Pembuat Surat',
      madeByPosition: 'Staf Cabang',
      knownBy: '',
      knownByPosition: 'Kepala Cabang',
      rsmId: '',
      rsmName: '',
      regionalName: 'Regional',
    })
    setModalState({ open: true, isEdit: false })
  }

  const openEditModal = (branch) => {
    setFormData({
      id: branch.id,
      name: branch.name || '',
      code: branch.code || '',
      pt: branch.pt || '',
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || '',
      madeBy: branch.madeBy || 'Pembuat Surat',
      madeByPosition: branch.madeByPosition || 'Staf Cabang',
      knownBy: branch.knownBy || '',
      knownByPosition: branch.knownByPosition || 'Kepala Cabang',
      rsmId: branch.rsmId || '',
      rsmName: branch.rsmName || '',
      regionalName: branch.regionalName || 'Regional',
    })
    setModalState({ open: true, isEdit: true })
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!formData.name || !formData.code) {
      notify.warning('Perhatian', 'Nama dan Kode Cabang wajib diisi!')
      return
    }

    const payload = {
      ...formData,
      code: formData.code.toUpperCase().replace(/\s/g, ''),
      madeBy: (formData.madeBy || '').trim() || 'Pembuat Surat',
      madeByPosition: (formData.madeByPosition || '').trim() || 'Staf Cabang',
      knownBy: (formData.knownBy || '').trim(),
      knownByPosition: (formData.knownByPosition || '').trim() || 'Kepala Cabang',
      rsmId: formData.rsmId || '',
      rsmName: formData.rsmName || '',
      regionalName: formData.regionalName || '',
    }

    const updated = saveBranch(payload)
    setBranches([...updated])
    setModalState({ open: false, isEdit: false })
    notify.success(
      'Berhasil Disimpan',
      `Data cabang ${formData.name} berhasil disimpan ke database.`
    )
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return branches.filter(
      (b) =>
        b.name?.toLowerCase().includes(q) ||
        b.code?.toLowerCase().includes(q) ||
        b.pt?.toLowerCase().includes(q) ||
        b.address?.toLowerCase().includes(q) ||
        b.knownBy?.toLowerCase().includes(q) ||
        b.rsmName?.toLowerCase().includes(q)
    )
  }, [branches, search])

  // Total personil di seluruh cabang
  const totalUsersAcrossBranches = useMemo(() => {
    return users.length
  }, [users])

  return (
    <div className="space-y-3">
      {/* Top Header Banner Berwarna */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white border border-blue-900/40 rounded-xl p-3 sm:p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20 text-white shadow-xs shrink-0">
              <Building2 className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Master Data &amp; Pengaturan Cabang
                </h2>
                <span className="hidden sm:inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-bold bg-white/15 text-sky-200 border border-white/20">
                  {branches.length} Cabang Resmi (MySQL)
                </span>
              </div>
              <p className="text-[11px] text-blue-100/80">
                Data unit cabang, alamat resmi kantor, dan pimpinan operasional sesuai database CV Makmur Permata.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-950/30 transition border border-emerald-400/40 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Cabang Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar: Search & View Mode Toggle */}
      <div className="bg-white border border-slate-300 rounded-xl p-2.5 sm:p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama cabang, kode, alamat, atau kepala cabang..."
            className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-slate-500 hidden md:inline">Tampilan:</span>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilan Tabel (Rapi & Padat)"
            >
              <List className="w-3.5 h-3.5" />
              <span>Tabel</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilan Kartu Grid"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kartu</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: TABLE VIEW (DEFAULT - RAPI, SESUAI DATABASE) */}
      {viewMode === 'table' ? (
        <div className="bg-white border border-slate-300 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-blue-600 text-white font-bold border-b-2 border-blue-700 text-xs">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center border-r border-blue-500/50">No</th>
                  <th className="py-2.5 px-3.5 w-48 border-r border-blue-500/50">Kode &amp; Nama Cabang</th>
                  <th className="py-2.5 px-3.5 border-r border-blue-500/50">Alamat &amp; Kontak</th>
                  <th className="py-2.5 px-3.5 w-60 border-r border-blue-500/50">Pimpinan Cabang (Mengetahui)</th>
                  <th className="py-2.5 px-3.5 w-48 border-r border-blue-500/50">RSM &amp; Personel</th>
                  <th className="py-2.5 px-3 w-24 text-center border-r border-blue-500/50">Status</th>
                  <th className="py-2.5 px-3 w-32 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-500 font-medium">
                      <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                      Tidak ditemukan cabang yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filtered.map((b, idx) => (
                    <tr
                      key={b.id || idx}
                      className="hover:bg-blue-50/60 transition-colors group"
                    >
                      {/* No */}
                      <td className="py-2 px-3 text-center font-bold text-slate-400 border-r border-slate-200">
                        {idx + 1}
                      </td>

                      {/* Kode & Nama Cabang */}
                      <td className="py-2 px-3.5 border-r border-slate-200">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] font-black px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                              {b.code}
                            </span>
                            <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-xs sm:text-sm">
                              {b.name}
                            </span>
                          </div>
                          {b.pt && (
                            <span className="text-[10px] font-semibold text-slate-500 block truncate max-w-[200px]" title={b.pt}>
                              {b.pt}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Alamat & Kontak */}
                      <td className="py-2 px-3.5 border-r border-slate-200">
                        <div className="space-y-1">
                          <p className="text-[11px] text-slate-600 leading-snug line-clamp-2" title={b.address}>
                            {b.address || <span className="italic text-slate-400">Belum ada alamat</span>}
                          </p>
                          <div className="flex items-center gap-3 text-[10px] text-slate-500">
                            {b.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5 text-slate-400" />
                                <span>{b.phone}</span>
                              </span>
                            )}
                            {b.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-2.5 h-2.5 text-slate-400" />
                                <span>{b.email}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Pimpinan Cabang (Mengetahui) */}
                      <td className="py-2 px-3.5 border-r border-slate-200">
                        <div className="flex items-start gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs truncate">
                              {b.knownBy || <span className="text-slate-400 italic">Belum disetting</span>}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">
                              {b.knownByPosition || 'Kepala Cabang'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* RSM & Personel */}
                      <td className="py-2 px-3.5 border-r border-slate-200">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-800">
                            <ShieldCheck className="w-3 h-3 text-purple-600 shrink-0" />
                            <span className="truncate max-w-[140px]">{b.rsmName || 'RSM Regional'}</span>
                          </div>
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                            <Users className="w-2.5 h-2.5" />
                            <span>{b.totalPersonnel || 0} User Terdaftar</span>
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-2 px-3 text-center border-r border-slate-200 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Aktif</span>
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEditModal(b)}
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-indigo-50 text-indigo-700 border border-slate-200 hover:border-indigo-300 rounded-lg text-xs font-bold transition cursor-pointer w-full"
                          title={`Ubah setting pejabat cabang ${b.name}`}
                        >
                          <Edit3 className="w-3 h-3 text-indigo-600" />
                          <span>Atur Cabang</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VIEW 2: GRID CARD VIEW (MODERN & TERTATA) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filtered.map((b) => (
            <div
              key={b.id}
              className="bg-white border border-slate-200 rounded-2xl shadow-xs hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col justify-between overflow-hidden group"
            >
              {/* Top Accent Strip */}
              <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500" />

              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-black px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                      {b.code}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Aktif
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                    {b.name}
                  </h3>
                  {b.pt && (
                    <p className="text-[11px] font-semibold text-slate-500 truncate mt-0.5">
                      {b.pt}
                    </p>
                  )}

                  <p className="text-xs text-slate-500 mt-2 flex items-start gap-1.5 line-clamp-2 leading-relaxed">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{b.address || 'Alamat kantor cabang'}</span>
                  </p>

                  {/* Pejabat Cabang Box */}
                  <div className="mt-3 bg-slate-50/80 border border-slate-200/80 rounded-xl p-2.5 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-700 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                        Pimpinan Cabang:
                      </span>
                      <span className="text-[10px] text-slate-400 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                        {b.totalPersonnel || 0} User
                      </span>
                    </div>
                    <div className="pl-2 border-l-2 border-indigo-500">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {b.knownBy || '(Belum disetting)'}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {b.knownByPosition || 'Kepala Cabang'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">ID: {b.code}</span>
                  <button
                    type="button"
                    onClick={() => openEditModal(b)}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 text-indigo-700 border border-slate-200 hover:border-indigo-300 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Atur Pejabat Cabang</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalState.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  {modalState.isEdit ? `Pengaturan Cabang: ${formData.name}` : 'Tambah Cabang Baru'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Atur identitas cabang dan pejabat "Yang Mengetahui" di cabang tersebut.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalState({ open: false, isEdit: false })}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Cabang *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Cabang Semarang"
                    className="w-full p-2 border border-slate-300 rounded-xl font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode Cabang (Singkat) *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="Contoh: SMG"
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono uppercase font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Badan Usaha / PT</label>
                <input
                  type="text"
                  value={formData.pt}
                  onChange={(e) => setFormData({ ...formData, pt: e.target.value })}
                  placeholder="Contoh: PT. ASIA BOGOR DISTRIBUSI"
                  className="w-full p-2 border border-slate-300 rounded-xl text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Kantor Cabang</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Alamat lengkap kantor cabang..."
                  className="w-full p-2 border border-slate-300 rounded-xl text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telepon</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Contoh: 0251-123456"
                    className="w-full p-2 border border-slate-300 rounded-xl text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Contoh: cabang.bogor@portalmp.com"
                    className="w-full p-2 border border-slate-300 rounded-xl text-slate-800"
                  />
                </div>
              </div>

              {/* Setting Pejabat Mengetahui Cabang */}
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-900 text-xs">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    <span>Pejabat "Yang Mengetahui" (Kepala Cabang)</span>
                  </div>
                  <span className="text-[10px] text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full font-semibold">
                    Cabang {formData.code || 'Terkait'}
                  </span>
                </div>

                {/* Pilih Pimpinan Khusus Cabang Tersebut */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Pilih User Karyawan Cabang ({formData.name || formData.code}):
                  </label>
                  {(() => {
                    const branchUsers = users.filter((u) => {
                      const matchId = u.branchId && (u.branchId === formData.id || u.branchId === formData.code)
                      const matchName = u.branchName && formData.name && (
                        u.branchName.toLowerCase().includes(formData.name.toLowerCase().replace('cabang ', '')) ||
                        formData.name.toLowerCase().includes(u.branchName.toLowerCase().replace('cabang ', ''))
                      )
                      return matchId || matchName
                    })

                    const currentKnownByUserId = users.find((u) => u.name === formData.knownBy)?.id || ''
                    const hasKnownByInBranch = branchUsers.some((u) => String(u.id) === String(currentKnownByUserId))

                    return (
                      <select
                        value={currentKnownByUserId ? String(currentKnownByUserId) : ''}
                        onChange={(e) => {
                          const selectedUser = users.find((u) => String(u.id) === String(e.target.value))
                          if (selectedUser) {
                            setFormData({
                              ...formData,
                              knownBy: selectedUser.name,
                              knownByPosition: selectedUser.position || 'Kepala Cabang',
                            })
                          }
                        }}
                        className="w-full p-2 border border-indigo-300 rounded-xl bg-white text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">-- Pilih Pimpinan / Kepala Cabang --</option>
                        {formData.knownBy && !hasKnownByInBranch && (
                          <option value={currentKnownByUserId || 'custom-current'}>
                            {formData.knownBy} — {formData.knownByPosition || 'Pimpinan Saat Ini'} (Terpilih)
                          </option>
                        )}
                        {branchUsers.map((u) => (
                          <option key={u.id} value={String(u.id)}>
                            {u.name} — {u.position || u.roleLabel || 'Karyawan'}
                          </option>
                        ))}
                      </select>
                    )
                  })()}
                </div>

                {/* Tampilan Ringkas Info Terpilih */}
                {formData.knownBy && (
                  <div className="bg-white border border-indigo-200 rounded-lg p-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Pejabat Mengetahui:</span>
                      <strong className="text-slate-900">{formData.knownBy}</strong>
                    </div>
                    <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {formData.knownByPosition || 'Kepala Cabang'}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalState({ open: false, isEdit: false })}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-xs"
                >
                  Simpan ke Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
