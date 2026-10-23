import React, { useState, useEffect } from 'react'
import { Building2, Plus, MapPin, Phone, CheckCircle, Search, Edit3, UserCheck, ShieldCheck, User } from 'lucide-react'
import { getBranches, saveBranch, getUsers } from '../services/storage'
import { HRD_JABATAN } from '../data/mockData'
import { notify } from '../utils/alert'

export default function BranchMaster() {
  const [branches, setBranches] = useState(() => getBranches())
  const [users, setUsers] = useState(() => getUsers())
  const [modalState, setModalState] = useState({ open: false, isEdit: false })
  const [search, setSearch] = useState('')
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    code: '',
    pt: '',
    address: '',
    madeBy: 'Anif Ardiana',
    madeByPosition: 'Sales Marketing Manager (SMM)',
    knownBy: '',
    knownByPosition: 'Kepala Cabang',
    rsmId: '',
    rsmName: '',
    regionalName: '',
  })

  useEffect(() => {
    const handleBranchesChange = () => setBranches(getBranches())
    const handleUsersChange = () => setUsers(getUsers())

    window.addEventListener('branches_change', handleBranchesChange)
    window.addEventListener('users_change', handleUsersChange)
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
      madeBy: 'Anif Ardiana',
      madeByPosition: 'Sales Marketing Manager (SMM)',
      knownBy: '',
      knownByPosition: 'Kepala Cabang',
      rsmId: '',
      rsmName: '',
      regionalName: '',
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
      madeBy: branch.madeBy || 'Anif Ardiana',
      madeByPosition: branch.madeByPosition || 'Sales Marketing Manager (SMM)',
      knownBy: branch.knownBy || '',
      knownByPosition: branch.knownByPosition || 'Kepala Cabang',
      rsmId: branch.rsmId || '',
      rsmName: branch.rsmName || '',
      regionalName: branch.regionalName || '',
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
      madeBy: (formData.madeBy || '').trim() || 'Anif Ardiana',
      madeByPosition: (formData.madeByPosition || '').trim() || 'Sales Marketing Manager (SMM)',
      knownBy: (formData.knownBy || '').trim() || 'Kepala Cabang',
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
      `Setting cabang ${formData.name} & pejabat penandatangan berhasil diperbarui.`
    )
  }

  const filtered = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase()) ||
      (b.knownBy && b.knownBy.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-sky-600" />
            Master Data & Pengaturan Cabang
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola unit cabang dan pejabat "Yang Mengetahui" (Kepala Cabang) untuk pengesahan surat dinas di masing-masing cabang.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Cabang Baru</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama cabang, kode, atau nama kepala cabang (pejabat mengetahui)..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      {/* Branch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((b) => (
          <div
            key={b.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-sky-300 transition space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-black px-2.5 py-1 bg-sky-50 text-sky-700 rounded-md border border-sky-200">
                  {b.code}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Aktif
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-slate-900 text-base">{b.name}</h3>
                {b.pt && (
                  <p className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100 inline-block mt-1">
                    {b.pt}
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-2 leading-relaxed flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{b.address || 'Alamat kantor cabang'}</span>
                </p>
              </div>

              {/* Pejabat Cabang Setting Boxes */}
              <div className="space-y-2">
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2.5 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span className="flex items-center gap-1 text-emerald-800">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Dibuat oleh (Kiri):
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Pembuat Surat</span>
                  </div>
                  <div className="pl-3 border-l-2 border-emerald-500">
                    <p className="text-xs font-bold text-slate-900">
                      {b.madeBy || 'Anif Ardiana'}
                    </p>
                    <p className="text-[11px] text-slate-600 font-medium">
                      {b.madeByPosition || 'Sales Marketing Manager (SMM)'}
                    </p>
                  </div>
                </div>

                <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-2.5 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span className="flex items-center gap-1 text-indigo-800">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                      Yang Mengetahui (Kanan):
                    </span>
                    <span className="text-[10px] text-indigo-600 font-semibold">Pimpinan Cabang</span>
                  </div>
                  <div className="pl-3 border-l-2 border-indigo-500">
                    <p className="text-xs font-bold text-slate-900">
                      {b.knownBy || '(Belum disetting)'}
                    </p>
                    <p className="text-[11px] text-slate-600 font-medium">
                      {b.knownByPosition || 'Kepala Cabang'}
                    </p>
                  </div>
                </div>

                {/* Pejabat RSM / Regional */}
                <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-2.5 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span className="flex items-center gap-1 text-purple-800">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                      RSM & Regional:
                    </span>
                    <span className="text-[10px] text-purple-600 font-semibold">{b.regionalName || 'Regional'}</span>
                  </div>
                  <div className="pl-3 border-l-2 border-purple-500">
                    <p className="text-xs font-bold text-slate-900">
                      {b.rsmName || '(Belum ditentukan RSM)'}
                    </p>
                    <p className="text-[11px] text-purple-700 font-medium">
                      Regional Sales Manager (J03)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">ID: {b.id}</span>
              <button
                type="button"
                onClick={() => openEditModal(b)}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1 transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Atur Pejabat Cabang</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {modalState.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                {modalState.isEdit ? `Pengaturan Cabang: ${formData.name}` : 'Tambah Cabang Baru'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Atur identitas cabang dan pejabat "Yang Mengetahui" di cabang tersebut.
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Cabang *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Cabang Semarang"
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
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
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Badan Usaha / PT</label>
                <input
                  type="text"
                  value={formData.pt}
                  onChange={(e) => setFormData({ ...formData, pt: e.target.value })}
                  placeholder="Contoh: PT. PANGAN SEMARANG SEJAHTERA"
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Kantor Cabang</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Alamat lengkap kantor cabang..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              {/* Setting Pejabat Pembuat (Dibuat Oleh) Cabang */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Pejabat "Dibuat oleh," (Kiri Surat)</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full font-semibold">
                    Cabang {formData.code || 'Terkait'}
                  </span>
                </div>

                {/* Pilih Karyawan Khusus Cabang Tersebut */}
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

                    const currentMadeByUserId = users.find((u) => u.name === formData.madeBy)?.id || ''
                    const hasMadeByInBranch = branchUsers.some((u) => String(u.id) === String(currentMadeByUserId))

                    return (
                      <select
                        value={currentMadeByUserId ? String(currentMadeByUserId) : ''}
                        onChange={(e) => {
                          const selectedUser = users.find((u) => String(u.id) === String(e.target.value))
                          if (selectedUser) {
                            setFormData({
                              ...formData,
                              madeBy: selectedUser.name,
                              madeByPosition: selectedUser.position || 'Sales Marketing Manager (SMM)',
                            })
                          }
                        }}
                        className="w-full p-2.5 border border-emerald-300 rounded-xl bg-white text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">-- Pilih Karyawan {formData.name || formData.code} --</option>
                        {formData.madeBy && !hasMadeByInBranch && (
                          <option value={currentMadeByUserId || 'custom-current'}>
                            {formData.madeBy} — {formData.madeByPosition || 'Pejabat Saat Ini'} (Terpilih)
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
                {formData.madeBy && (
                  <div className="bg-white border border-emerald-200 rounded-lg p-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Pejabat Pembuat Terpilih:</span>
                      <strong className="text-slate-900">{formData.madeBy}</strong>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {formData.madeByPosition || 'Karyawan'}
                    </span>
                  </div>
                )}
              </div>

              {/* Setting Pejabat Mengetahui Cabang */}
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-900 text-xs">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    <span>Pejabat "Yang Mengetahui" (Kanan Surat)</span>
                  </div>
                  <span className="text-[10px] text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full font-semibold">
                    Cabang {formData.code || 'Terkait'}
                  </span>
                </div>

                {/* Pilih Pimpinan Khusus Cabang Tersebut */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Pilih Pimpinan Cabang ({formData.name || formData.code}):
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
                        className="w-full p-2.5 border border-indigo-300 rounded-xl bg-white text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">-- Pilih Pimpinan {formData.name || formData.code} --</option>
                        {formData.knownBy && !hasKnownByInBranch && (
                          <option value={currentKnownByUserId || 'custom-current'}>
                            {formData.knownBy} — {formData.knownByPosition || 'Pimpinan Saat Ini'} (Terpilih)
                          </option>
                        )}
                        {branchUsers.map((u) => (
                          <option key={u.id} value={String(u.id)}>
                            {u.name} — {u.position || u.roleLabel || 'Pimpinan'}
                          </option>
                        ))}
                      </select>
                    )
                  })()}
                </div>

                {/* Tampilan Ringkas Info Terpilih */}
                {formData.knownBy && (
                  <div className="bg-white border border-indigo-200 rounded-lg p-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Pejabat Mengetahui Terpilih:</span>
                      <strong className="text-slate-900">{formData.knownBy}</strong>
                    </div>
                    <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {formData.knownByPosition || 'Kepala Cabang'}
                    </span>
                  </div>
                )}
              </div>

              {/* Setting Pejabat RSM (Regional Sales Manager - J03) */}
              <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-purple-900 text-xs">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>Pejabat RSM (Regional Sales Manager / Regional)</span>
                  </div>
                  <span className="text-[10px] text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-full font-semibold">
                    Kode J03
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nama Wilayah / Regional:
                    </label>
                    <input
                      type="text"
                      value={formData.regionalName || ''}
                      onChange={(e) => setFormData({ ...formData, regionalName: e.target.value })}
                      placeholder="Contoh: Regional 1 (Jabar & Banten)"
                      className="w-full p-2.5 border border-purple-300 rounded-xl bg-white text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Pilih Pejabat RSM (J03):
                    </label>
                    {(() => {
                      const rsmUsers = users.filter((u) => u.kodeJabatan === 'J03' || (u.position && u.position.toLowerCase().includes('regional sales manager')))
                      return (
                        <select
                          value={formData.rsmId ? String(formData.rsmId) : ''}
                          onChange={(e) => {
                            const selectedRsm = users.find((u) => String(u.id) === String(e.target.value))
                            if (selectedRsm) {
                              setFormData({
                                ...formData,
                                rsmId: selectedRsm.id,
                                rsmName: selectedRsm.name,
                              })
                            } else {
                              setFormData({
                                ...formData,
                                rsmId: '',
                                rsmName: '',
                              })
                            }
                          }}
                          className="w-full p-2.5 border border-purple-300 rounded-xl bg-white text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">-- Pilih Pejabat RSM --</option>
                          {rsmUsers.map((r) => (
                            <option key={r.id} value={String(r.id)}>
                              {r.name} — (ID: {r.id})
                            </option>
                          ))}
                        </select>
                      )
                    })()}
                  </div>
                </div>

                {/* Tampilan Ringkas RSM Terpilih */}
                {formData.rsmName && (
                  <div className="bg-white border border-purple-200 rounded-lg p-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">RSM Bertugas Untuk Cabang Ini:</span>
                      <strong className="text-slate-900">{formData.rsmName}</strong>
                    </div>
                    <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {formData.regionalName || 'Regional Sales Manager'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalState({ open: false, isEdit: false })}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Simpan Pengaturan Cabang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
