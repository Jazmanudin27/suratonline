import React, { useState } from 'react'
import { Users, Shield, Building, Mail, CheckCircle, Search } from 'lucide-react'
import { getUsers } from '../services/storage'

export default function UserMaster() {
  const [users] = useState(getUsers())
  const [search, setSearch] = useState('')

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.branchName.toLowerCase().includes(search.toLowerCase()) ||
      u.roleLabel.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            Master Pengguna & Hak Akses
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Daftar pengguna terdaftar di seluruh cabang beserta perannya dalam alur pengajuan & persetujuan.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari pengguna berdasarkan nama, cabang, peran..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f8fafc] text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">PENGGUNA</th>
                <th className="py-3 px-4">UNIT / CABANG</th>
                <th className="py-3 px-4">JABATAN</th>
                <th className="py-3 px-4">PERAN DALAM SISTEM</th>
                <th className="py-3 px-4 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-900 text-emerald-400 font-black flex items-center justify-center text-xs shrink-0 shadow-xs border border-slate-700">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <strong className="text-slate-950 font-bold block text-xs">{u.name}</strong>
                        <span className="text-[11px] text-slate-700 font-medium flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-500" /> {u.email}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <span className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-sky-700" />
                      {u.branchName}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-800">{u.position}</td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black border ${
                        u.role === 'admin_pusat'
                          ? 'bg-purple-100 text-purple-950 border-purple-300'
                          : u.role === 'approver'
                          ? 'bg-amber-100 text-amber-950 border-amber-300'
                          : 'bg-emerald-100 text-emerald-950 border-emerald-300'
                      }`}
                    >
                      {u.roleLabel}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Aktif
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
