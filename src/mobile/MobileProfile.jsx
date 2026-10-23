import React, { useState, useMemo } from 'react'
import { getUsers, setCurrentUser as storageSetCurrentUser } from '../services/storage'
import { notify } from '../utils/alert'

export default function MobileProfile({
  currentUser,
  onLogout,
  onSwitchToDesktop,
  onSwitchUser,
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all') // 'all' | 'pemohon' | 'approver' | 'admin_pusat'
  const allUsers = useMemo(() => getUsers(), [])

  const filteredUsers = useMemo(() => {
    return allUsers.filter((u) => {
      // Role filter
      if (roleFilter !== 'all') {
        if (roleFilter === 'admin_pusat' && u.role !== 'admin_pusat') return false
        if (roleFilter === 'approver' && u.role !== 'approver') return false
        if (roleFilter === 'pemohon' && u.role !== 'pemohon') return false
      }

      // Search filter
      if (!searchTerm.trim()) return true
      const term = searchTerm.toLowerCase()
      const name = (u.name || '').toLowerCase()
      const pos = (u.position || '').toLowerCase()
      const branch = (u.branchName || u.branchId || '').toLowerCase()
      const code = (u.kodeJabatan || '').toLowerCase()
      return name.includes(term) || pos.includes(term) || branch.includes(term) || code.includes(term)
    })
  }, [allUsers, searchTerm, roleFilter])

  const handleSelectUser = (u) => {
    if (u.id === currentUser?.id) return
    storageSetCurrentUser(u)
    if (onSwitchUser) {
      onSwitchUser(u)
    }
    notify.success('Beralih Pengguna', `Berhasil beralih ke akun ${u.name} (${u.position || u.role})`)
  }

  const initials = (currentUser?.name || 'User')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

  return (
    <div className="space-y-4 pb-28 px-1 animate-fadeIn">
      {/* Header Profile Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500" />

        <div className="relative z-10 -mt-2 flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-white p-1.5 shadow-md">
            <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white text-2xl font-black">
              {initials}
            </div>
          </div>

          <h3 className="text-base font-bold text-slate-900 mt-3">
            {currentUser?.name || 'Pengguna'}
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            {currentUser?.position || currentUser?.role || 'Staff'}
          </p>

          <span className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            🏢 {currentUser?.branchName ? (currentUser.branchName.toLowerCase().startsWith('cabang') ? currentUser.branchName : `Cabang ${currentUser.branchName}`) : (currentUser?.branchId || 'Pusat')}
          </span>
        </div>
      </div>

      {/* Quick Switch User Card (Peralihan User Demo / Test) */}
      <div className="bg-white rounded-2xl p-4 border border-blue-200 shadow-sm space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">
              👥
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-900">
                Peralihan User (Uji Peran)
              </h4>
              <p className="text-[10px] text-slate-400">
                Ganti user langsung untuk menguji persetujuan atau pembuatan surat.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
            {filteredUsers.length} User
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama, jabatan, cabang..."
            className="w-full pl-8 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">
            🔍
          </span>
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-0.5"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-semibold no-scrollbar">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'pemohon', label: 'Pemohon' },
            { id: 'approver', label: 'Approver' },
            { id: 'admin_pusat', label: 'Admin Pusat' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRoleFilter(tab.id)}
              className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                roleFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List of Users */}
        <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/50">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((u) => {
              const isCurrent = u.id === currentUser?.id
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleSelectUser(u)}
                  className={`w-full p-2.5 text-left transition flex items-center justify-between gap-2.5 ${
                    isCurrent
                      ? 'bg-blue-50/90 border-l-4 border-blue-600 cursor-default'
                      : 'hover:bg-white bg-transparent active:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 shadow-2xs ${
                        u.role === 'admin_pusat'
                          ? 'bg-purple-100 text-purple-700'
                          : u.role === 'approver'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {u.role === 'admin_pusat' ? 'ADM' : u.role === 'approver' ? 'APP' : 'STF'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {u.name}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] bg-emerald-500 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs shrink-0">
                            Aktif
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {u.position || u.role} &bull; {u.branchName || u.branchId || 'Pusat'}
                      </p>
                    </div>
                  </div>

                  {!isCurrent ? (
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-lg shrink-0">
                      Ganti &rarr;
                    </span>
                  ) : (
                    <span className="text-xs text-emerald-600 font-bold shrink-0">
                      ✓
                    </span>
                  )}
                </button>
              )
            })
          ) : (
            <div className="p-4 text-center text-xs text-slate-400">
              Tidak ada user yang cocok dengan "{searchTerm}"
            </div>
          )}
        </div>
      </div>

      {/* Account Details */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Informasi Akun
        </h4>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Username / NIK</span>
            <span className="font-semibold text-slate-800 font-mono">
              {currentUser?.username || currentUser?.nik || '-'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Kode Jabatan</span>
            <span className="font-semibold text-slate-800 font-mono">
              {currentUser?.kodeJabatan || '-'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Tingkat Approval</span>
            <span className="font-semibold text-slate-800">
              Level {currentUser?.approvalLevel || '-'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-slate-500">Role Sistem</span>
            <span className="font-semibold text-indigo-600 uppercase">
              {currentUser?.role || 'User'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        <button
          onClick={onSwitchToDesktop}
          className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition active:scale-98"
        >
          <span>💻</span> Beralih ke Tampilan Desktop
        </button>

        <button
          onClick={onLogout}
          className="w-full py-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-2xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition active:scale-98"
        >
          <span>🚪</span> Keluar dari Akun
        </button>
      </div>
    </div>
  )
}
