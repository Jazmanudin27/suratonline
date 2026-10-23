import React, { useState } from 'react'
import {
  FileText,
  Building2,
  Users,
  Bell,
  CheckCircle,
  Clock,
  Layers,
  LogOut,
  ChevronDown,
  RefreshCw,
  PlusCircle,
  Shield,
  Menu,
  X,
  Search,
} from 'lucide-react'
import {
  getUsers,
  getCurrentUser,
  setCurrentUser,
  getNotifications,
  markNotificationRead,
  resetDemoData,
} from '../services/storage'
import { isCrmOrIt, isDirekturUser } from '../utils'

export default function Navbar({ activeTab, onTabChange, onOpenLetterById }) {
  const users = getUsers()
  const currentUser = getCurrentUser()
  const notifications = getNotifications(currentUser.id)
  const unreadNotifs = notifications.filter((n) => !n.isRead)

  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userSearchTerm, setUserSearchTerm] = useState('')

  const filteredUsers = users.filter((u) => {
    if (!userSearchTerm.trim()) return true
    const term = userSearchTerm.toLowerCase()
    const name = (u.name || '').toLowerCase()
    const position = (u.position || '').toLowerCase()
    const branch = (u.branchName || u.branchId || '').toLowerCase()
    const role = (u.role || '').toLowerCase()
    const username = (u.username || '').toLowerCase()
    return (
      name.includes(term) ||
      position.includes(term) ||
      branch.includes(term) ||
      role.includes(term) ||
      username.includes(term)
    )
  })

  const handleSwitchUser = (user) => {
    setCurrentUser(user)
    setShowUserDropdown(false)
    setUserSearchTerm('')
  }

  const handleResetData = () => {
    if (confirm('Reset ulang semua data simulasi ke pengaturan awal pabrik?')) {
      resetDemoData()
      window.location.reload()
    }
  }

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center shadow-md">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                  Surat Ajuan Online
                </span>
                <span className="hidden sm:inline-block px-2 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  CV Makmur Permata
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-none">
                Sistem Surat Persetujuan Multi-Cabang
              </p>
            </div>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
            {!isDirekturUser(currentUser) && (
              <>
                <button
                  onClick={() => onTabChange('dashboard')}
                  className={`px-3 py-2 rounded-lg transition ${
                    activeTab === 'dashboard'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  Dasbor
                </button>

                <button
                  onClick={() => onTabChange('templates')}
                  className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${
                    activeTab === 'templates'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Buat Surat</span>
                </button>
              </>
            )}

            <button
              onClick={() => onTabChange('letters')}
              className={`px-3 py-2 rounded-lg transition ${
                activeTab === 'letters'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {currentUser.role === 'pemohon' ? 'Surat Saya' : 'Daftar Surat'}
            </button>


            {isCrmOrIt(currentUser) && (
              <>
                <button
                  onClick={() => onTabChange('admin_templates')}
                  className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${
                    activeTab === 'admin_templates'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-indigo-300 hover:text-white hover:bg-indigo-950/60'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Kelola Template</span>
                </button>
                <button
                  onClick={() => onTabChange('branches')}
                  className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${
                    activeTab === 'branches'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-indigo-300 hover:text-white hover:bg-indigo-950/60'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Data Cabang</span>
                </button>
              </>
            )}
          </nav>

          {/* Right Action: Notifications & User Switcher */}
          <div className="flex items-center gap-3">
            {/* Notification Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg relative transition"
                title="Notifikasi"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-slate-900 animate-pulse" />
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Notifikasi Masuk</span>
                    <span className="text-[10px] text-slate-400">{notifications.length} Pesan</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-slate-400">Tidak ada notifikasi baru.</p>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            markNotificationRead(notif.id)
                            setShowNotifDropdown(false)
                            if (notif.letterId && onOpenLetterById) {
                              onOpenLetterById(notif.letterId)
                            }
                          }}
                          className={`p-3 cursor-pointer hover:bg-slate-50 transition ${
                            !notif.isRead ? 'bg-indigo-50/40 font-semibold' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] mb-0.5">
                            <span className="text-indigo-600 font-bold">{notif.title}</span>
                            {!notif.isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                            )}
                          </div>
                          <p className="text-slate-600 text-xs font-normal leading-relaxed">
                            {notif.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Switcher Dropdown (Demo Helper for testing all 3 roles!) */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition text-left text-xs"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <span className="block font-bold text-white text-xs leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="block text-[10px] text-slate-400 leading-tight">
                    {currentUser.branchName}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                  <div className="p-3 bg-slate-50 border-b border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Ganti Akun Demo (Simulasi Peran)
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Pilih pengguna untuk menguji alur pembuatan, persetujuan, atau kelola template:
                    </p>
                  </div>

                  {/* Input Pencarian Pengguna */}
                  <div className="p-2 border-b border-slate-200 bg-white">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        placeholder="Cari nama, jabatan, cabang..."
                        className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition"
                        autoFocus
                      />
                      {userSearchTerm && (
                        <button
                          type="button"
                          onClick={() => setUserSearchTerm('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-1 divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((u) => {
                        const isSelected = u.id === currentUser.id
                        return (
                          <button
                            key={u.id}
                            onClick={() => handleSwitchUser(u)}
                            className={`w-full p-2.5 text-left rounded-lg text-xs transition flex items-start gap-2.5 ${
                              isSelected ? 'bg-indigo-50 font-bold text-indigo-900' : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div
                              className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                                u.role === 'admin_pusat'
                                  ? 'bg-purple-100 text-purple-700'
                                  : u.role === 'approver'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {u.role === 'admin_pusat' ? 'ADM' : u.role === 'approver' ? 'APP' : 'USR'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="block truncate font-semibold">{u.name}</span>
                              <span className="block text-[10px] text-slate-500 truncate">
                                {u.position} &bull; {u.branchName}
                              </span>
                            </div>
                            {isSelected && <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0" />}
                          </button>
                        )
                      })
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-400">
                        Pengguna "{userSearchTerm}" tidak ditemukan.
                      </div>
                    )}
                  </div>

                  <div className="p-2 bg-slate-50 border-t border-slate-200 text-center">
                    <button
                      onClick={handleResetData}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold flex items-center justify-center gap-1 w-full py-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Reset Ulang Data Demo Pabrik
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-800 space-y-1 text-xs font-semibold">
            {!isDirekturUser(currentUser) && (
              <>
                <button
                  onClick={() => {
                    onTabChange('dashboard')
                    setMobileMenuOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800"
                >
                  Dasbor
                </button>
                <button
                  onClick={() => {
                    onTabChange('templates')
                    setMobileMenuOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                  Buat Surat Ajuan
                </button>
              </>
            )}
            <button
              onClick={() => {
                onTabChange('letters')
                setMobileMenuOpen(false)
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800"
            >
              Daftar Surat
            </button>

            {isCrmOrIt(currentUser) && (
              <>
                <button
                  onClick={() => {
                    onTabChange('admin_templates')
                    setMobileMenuOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-indigo-300 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Kelola Template</span>
                </button>
                <button
                  onClick={() => {
                    onTabChange('branches')
                    setMobileMenuOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-indigo-300 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Data Cabang</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
