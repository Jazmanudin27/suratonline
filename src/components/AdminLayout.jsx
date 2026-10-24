import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  LayoutDashboard,
  FilePlus,
  FileText,
  CheckSquare,
  Layers,
  Building2,
  Users,
  Menu,
  X,
  Maximize2,
  Minimize2,
  Bell,
  ChevronDown,
  LogOut,
  Clock,
  Sparkles,
  ShieldCheck,
  Search,
  Inbox,
  Mail,
  CheckCheck,
  Check,
} from 'lucide-react'
import {
  getUsers,
  getLetters,
  getCurrentUser,
  setCurrentUser,
  getNotifications,
  markNotificationRead,
  getSharedLetterInfo,
  isSharedLetterRead,
  markSharedLetterRead,
  markAllSharedLettersRead,
} from '../services/storage'
import { isCrmOrIt, isDirekturUser } from '../utils'

export default function AdminLayout({
  activeMenu,
  onMenuChange,
  pendingCount = 0,
  letters = [],
  children,
  onOpenLetterById,
  onLogout,
  onSwitchToMobile = () => {},
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentDateTime, setCurrentDateTime] = useState('')
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)
  const [showSharedDropdown, setShowSharedDropdown] = useState(false)
  const [sharedFilter, setSharedFilter] = useState('all') // 'all' | 'unread' | 'read'
  const [readVersion, setReadVersion] = useState(0)
  const [userSearchTerm, setUserSearchTerm] = useState('')

  const sharedDropdownRef = useRef(null)
  const notifDropdownRef = useRef(null)
  const userDropdownRef = useRef(null)

  useEffect(() => {
    const handleReadChange = () => setReadVersion((v) => v + 1)
    window.addEventListener('shared_read_change', handleReadChange)
    window.addEventListener('letters_change', handleReadChange)

    const handleClickOutside = (e) => {
      if (sharedDropdownRef.current && !sharedDropdownRef.current.contains(e.target)) {
        setShowSharedDropdown(false)
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setShowNotifDropdown(false)
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setShowUserDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      window.removeEventListener('shared_read_change', handleReadChange)
      window.removeEventListener('letters_change', handleReadChange)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleGoToMobile = () => {
    localStorage.setItem('suratajuan_view_mode', 'mobile')
    if (typeof onSwitchToMobile === 'function') {
      onSwitchToMobile()
    } else {
      window.location.reload()
    }
  }

  const users = getUsers()
  const currentUser = getCurrentUser()
  const notifications = getNotifications(currentUser?.id)
  const unreadNotifs = notifications.filter((n) => !n.isRead)

  // Realtime Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const dateStr = now.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
      const timeStr = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).replace(/\./g, ':')
      setCurrentDateTime(`${dateStr} • ${timeStr}`)
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {})
        setIsFullscreen(false)
      }
    }
  }

  const handleSwitchUser = (user) => {
    setCurrentUser(user)
    setShowUserDropdown(false)
  }

  const isDirektur = isDirekturUser(currentUser)

  const allCurrentLetters = letters && letters.length > 0 ? letters : getLetters()

  const mySharedLetters = useMemo(() => {
    return allCurrentLetters
      .filter((l) => getSharedLetterInfo(l, currentUser) !== null)
      .sort((a, b) => {
        const infoA = getSharedLetterInfo(a, currentUser)
        const infoB = getSharedLetterInfo(b, currentUser)
        const dateA = new Date(infoA?.sharedAt || a.createdAt || 0).getTime()
        const dateB = new Date(infoB?.sharedAt || b.createdAt || 0).getTime()
        return dateB - dateA
      })
  }, [allCurrentLetters, currentUser, readVersion])

  const unreadSharedCount = useMemo(() => {
    return mySharedLetters.filter((l) => !isSharedLetterRead(l, currentUser)).length
  }, [mySharedLetters, currentUser, readVersion])

  const filteredSharedLetters = useMemo(() => {
    if (sharedFilter === 'unread') {
      return mySharedLetters.filter((l) => !isSharedLetterRead(l, currentUser))
    }
    if (sharedFilter === 'read') {
      return mySharedLetters.filter((l) => isSharedLetterRead(l, currentUser))
    }
    return mySharedLetters
  }, [mySharedLetters, sharedFilter, currentUser, readVersion])

  const menuItems = [
    ...(!isDirektur
      ? [
          {
            id: 'templates',
            label: 'Buat Surat Ajuan',
            icon: FilePlus,
            isActive: activeMenu === 'templates' || activeMenu === 'builder',
            badge: 'BARU',
            badgeClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
          },
        ]
      : []),
    {
      id: 'letters',
      label: 'Daftar Arsip Surat',
      icon: FileText,
      isActive: activeMenu === 'letters',
      badge: pendingCount > 0 ? pendingCount : null,
      badgeClass: 'bg-amber-500 text-slate-950 font-black',
    },
    ...(isCrmOrIt(currentUser)
      ? [
          {
            id: 'admin_templates',
            label: 'Kelola Template',
            icon: Layers,
            isActive: activeMenu === 'admin_templates',
          },
          {
            id: 'branches',
            label: 'Data Cabang',
            icon: Building2,
            isActive: activeMenu === 'branches',
          },
        ]
      : []),
  ]

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

  return (
    <div className="min-h-screen bg-[#dce3ec] flex flex-col font-sans text-slate-800 antialiased">
      {/* =========================================================
          NAVBAR ATAS 2 BARIS ELEGAN (TANPA TERPOTONG)
          ========================================================= */}
      <header className="sticky top-0 z-40 shadow-lg shadow-slate-950/15">
        
        {/* BARIS 1: Brand Identity & Profil User */}
        <div className="bg-slate-900 border-b border-slate-800 text-white w-full px-3 sm:px-5 lg:px-6">
          <div className="flex items-center justify-between h-12 sm:h-13 gap-4">
            
            {/* Left: Brand Identity */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-sky-500 to-emerald-400 p-0.5 shadow-md shadow-indigo-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-black text-xs tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-300">
                  SA
                </div>
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-white text-sm sm:text-base tracking-tight uppercase">
                    SURAT AJUAN
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-extrabold tracking-wider bg-indigo-900/60 text-indigo-300 border border-indigo-700/60 uppercase">
                    <ShieldCheck className="w-3 h-3 text-indigo-400" />
                    {currentUser?.role === 'admin_pusat'
                      ? 'ADMIN PUSAT'
                      : currentUser?.role === 'approver'
                      ? 'APPROVER'
                      : 'PEMOHON'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                  CV Makmur Permata &bull; Multi Cabang
                </p>
              </div>
            </div>

            {/* Right: Status, Clock, Notifikasi & Profil */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              
              {/* Portal Status Pill */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-semibold rounded-lg text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Portal Cabang Aktif</span>
              </div>

              {/* Realtime Date & Clock */}
              <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-300 font-medium bg-slate-800/60 border border-slate-700/60 px-2.5 py-1 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentDateTime}</span>
              </div>

              {/* Tombol Beralih ke Tampilan Mobile */}
              <button
                type="button"
                onClick={handleGoToMobile}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition text-xs font-semibold shadow-xs"
                title="Buka Tampilan Khusus Mobile"
              >
                <span>📱</span>
                <span className="hidden sm:inline">Mode Mobile</span>
              </button>

              {/* Fullscreen Toggle */}
              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition hidden sm:inline-flex"
                title="Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Kotak Masuk Surat Dibagikan Dropdown (Icon Surat di Pinggir Notifikasi) */}
              <div className="relative" ref={sharedDropdownRef}>
                <button
                  onClick={() => {
                    setShowSharedDropdown(!showSharedDropdown)
                    setShowNotifDropdown(false)
                    setShowUserDropdown(false)
                  }}
                  className={`p-1.5 rounded-lg relative transition flex items-center justify-center ${
                    showSharedDropdown
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Kotak Masuk Surat (Dibagikan ke Saya)"
                >
                  <Mail className="w-4.5 h-4.5" />
                  {unreadSharedCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[15px] h-3.5 px-1 bg-indigo-500 text-white rounded-full text-[9px] font-black flex items-center justify-center ring-2 ring-slate-900 animate-pulse">
                      {unreadSharedCount > 9 ? '9+' : unreadSharedCount}
                    </span>
                  )}
                </button>

                {showSharedDropdown && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-fadeIn">
                    {/* Header Dropdown */}
                    <div className="p-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-950 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-indigo-500/30 flex items-center justify-center">
                          <Mail className="w-3.5 h-3.5 text-indigo-300" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-white block leading-tight">Kotak Masuk Surat</span>
                          <span className="text-[10px] text-indigo-300">Surat dibagikan ke Anda</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadSharedCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-xs">
                            {unreadSharedCount} Baru
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Semua Dibaca
                          </span>
                        )}
                        {unreadSharedCount > 0 && (
                          <button
                            type="button"
                            onClick={() => markAllSharedLettersRead(currentUser)}
                            className="text-[10px] text-indigo-200 hover:text-white font-bold flex items-center gap-1 hover:underline transition ml-1"
                            title="Tandai semua surat dibagikan sebagai sudah dibaca"
                          >
                            <CheckCheck className="w-3.5 h-3.5 text-indigo-300" />
                            <span className="hidden sm:inline">Tandai Semua Dibaca</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Filter Tabs (Semua / Belum Dibaca / Sudah Dibaca) */}
                    <div className="p-2 bg-slate-50 border-b border-slate-200 flex items-center gap-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setSharedFilter('all')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
                          sharedFilter === 'all'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                        }`}
                      >
                        <span>Semua</span>
                        <span className={`px-1 py-0.2 rounded-full text-[9px] font-black ${
                          sharedFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {mySharedLetters.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSharedFilter('unread')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
                          sharedFilter === 'unread'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                        }`}
                      >
                        <span>Belum Dibaca</span>
                        {unreadSharedCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-500 text-white font-black animate-pulse">
                            {unreadSharedCount}
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setSharedFilter('read')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
                          sharedFilter === 'read'
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                        }`}
                      >
                        <span>Sudah Dibaca</span>
                        <span className={`px-1 py-0.2 rounded-full text-[9px] font-semibold ${
                          sharedFilter === 'read' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {mySharedLetters.length - unreadSharedCount}
                        </span>
                      </button>
                    </div>

                    {/* List Surat */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
                      {filteredSharedLetters.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 space-y-1.5">
                          <Mail className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
                          <p className="font-semibold text-slate-600 text-xs">
                            {sharedFilter === 'unread'
                              ? 'Tidak ada surat yang belum dibaca.'
                              : sharedFilter === 'read'
                              ? 'Belum ada surat yang ditandai sudah dibaca.'
                              : 'Belum ada surat yang dibagikan kepada Anda.'}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Surat yang dibagikan oleh rekan kerja akan muncul di sini.
                          </p>
                        </div>
                      ) : (
                        filteredSharedLetters.map((l) => {
                          const isRead = isSharedLetterRead(l, currentUser)
                          const shareInfo = getSharedLetterInfo(l, currentUser)

                          return (
                            <div
                              key={l.id}
                              className={`p-3 transition relative group flex items-start justify-between gap-2.5 cursor-pointer ${
                                !isRead
                                  ? 'bg-indigo-50/70 hover:bg-indigo-100/70 border-l-4 border-indigo-600'
                                  : 'bg-white hover:bg-slate-50 border-l-4 border-transparent'
                              }`}
                              onClick={() => {
                                markSharedLetterRead(l.id, currentUser, true)
                                setShowSharedDropdown(false)
                                if (onOpenLetterById) {
                                  onOpenLetterById(l.id)
                                }
                              }}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="font-mono text-[10px] font-extrabold text-indigo-900 bg-indigo-100/90 px-1.5 py-0.5 rounded">
                                    {l.letterNumber || 'Tanpa No Surat'}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {shareInfo?.sharedAt
                                      ? new Date(shareInfo.sharedAt).toLocaleDateString('id-ID', {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric',
                                        })
                                      : '-'}
                                  </span>
                                </div>

                                <h4
                                  className={`text-xs text-slate-900 leading-snug line-clamp-1 ${
                                    !isRead ? 'font-black' : 'font-medium'
                                  }`}
                                >
                                  {l.title}
                                </h4>

                                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                                  <span>
                                    Dibagikan oleh:{' '}
                                    <strong className="text-slate-800 font-bold">
                                      {shareInfo?.sharedBy || l.userName || 'Rekan'}
                                    </strong>
                                  </span>
                                  {shareInfo?.branchName && (
                                    <span className="text-slate-400">&bull; {shareInfo.branchName}</span>
                                  )}
                                </div>

                                {shareInfo?.note && (
                                  <p className="mt-1.5 p-1.5 bg-slate-100/80 rounded border border-slate-200/60 text-[10px] text-slate-600 italic line-clamp-2">
                                    "{shareInfo.note}"
                                  </p>
                                )}
                              </div>

                              {/* Action & Status Indicator */}
                              <div className="flex flex-col items-end gap-2 shrink-0 pt-0.5">
                                {!isRead ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-indigo-600 text-white shadow-2xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> BARU
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                    <Check className="w-2.5 h-2.5 text-emerald-600" /> Dibaca
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    markSharedLetterRead(l.id, currentUser, !isRead)
                                  }}
                                  className={`p-1.5 rounded-md transition text-xs flex items-center gap-1 font-bold ${
                                    !isRead
                                      ? 'bg-indigo-100/80 text-indigo-700 hover:bg-indigo-200'
                                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800'
                                  }`}
                                  title={isRead ? 'Tandai sebagai belum dibaca' : 'Tandai sebagai sudah dibaca'}
                                >
                                  {isRead ? (
                                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                                  ) : (
                                    <CheckCheck className="w-3.5 h-3.5 text-indigo-600" />
                                  )}
                                </button>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>

                    {/* Footer Dropdown */}
                    <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
                      <span className="text-[10px] text-slate-500 font-semibold">
                        Total {mySharedLetters.length} surat dibagikan
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSharedDropdown(false)
                          if (typeof onMenuChange === 'function') {
                            onMenuChange('inbox')
                          }
                        }}
                        className="text-indigo-600 hover:text-indigo-800 font-bold text-xs flex items-center gap-1 hover:underline"
                      >
                        <span>Buka Tampilan Lengkap</span>
                        <span>&rarr;</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Notification Bell */}
              <div className="relative" ref={notifDropdownRef}>
                <button
                  onClick={() => {
                    setShowNotifDropdown(!showNotifDropdown)
                    setShowSharedDropdown(false)
                    setShowUserDropdown(false)
                  }}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg relative transition"
                  title="Notifikasi"
                >
                  <Bell className="w-4.5 h-4.5" />
                  {unreadNotifs.length > 0 && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center ring-2 ring-slate-900">
                      {unreadNotifs.length}
                    </span>
                  )}
                </button>

                {showNotifDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-fadeIn">
                    <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800">Notifikasi Persetujuan</span>
                      <span className="text-[10px] text-slate-500 font-semibold">{notifications.length} Pesan</span>
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
                              !notif.isRead ? 'bg-indigo-50/70 font-semibold' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px] mb-0.5">
                              <span className="text-indigo-600 font-bold">{notif.title}</span>
                              {!notif.isRead && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
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

              {/* User Profile Pill & Dropdown */}
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => {
                    setShowUserDropdown(!showUserDropdown)
                    setShowSharedDropdown(false)
                    setShowNotifDropdown(false)
                  }}
                  className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition text-left"
                >
                  <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-indigo-500 to-sky-400 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-xs">
                    {currentUser?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <span className="block font-bold text-white text-xs leading-none">
                      {currentUser?.name || 'User'}
                    </span>
                    <span className="block text-[9px] text-slate-400 mt-0.5 leading-none">
                      {currentUser?.position || currentUser?.roleLabel}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-fadeIn">
                    <div className="p-3 bg-slate-50 border-b border-slate-200">
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                        Ganti Akun Demo (Uji Peran)
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Pilih peran untuk menguji alur pembuatan, persetujuan, dan admin:
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
                          className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:bg-white transition"
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
                          const isSelected = u.id === currentUser?.id
                          return (
                            <button
                              key={u.id}
                              onClick={() => {
                                handleSwitchUser(u)
                                setUserSearchTerm('')
                              }}
                              className={`w-full p-2.5 text-left rounded-lg text-xs transition flex items-start gap-2.5 ${
                                isSelected ? 'bg-sky-50 font-bold text-sky-900' : 'hover:bg-slate-50 text-slate-700'
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
                            </button>
                          )
                        })
                      ) : (
                        <div className="p-4 text-center text-xs text-slate-400">
                          Pengguna "{userSearchTerm}" tidak ditemukan.
                        </div>
                      )}
                    </div>

                    <div className="p-2 bg-slate-50 border-t border-slate-200">
                      <button
                        onClick={() => {
                          if (onLogout) onLogout()
                        }}
                        className="text-xs text-rose-600 hover:bg-rose-50 font-bold flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border border-rose-200 transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Keluar Akun (Logout)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Hamburger Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
                title="Buka Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* BARIS 2: Khusus Seluruh Menu Navigasi (Kompak & Berdekatan) */}
        <div className="hidden md:block bg-slate-950 border-b border-slate-800/90 w-full px-3 sm:px-4 lg:px-5">
          <nav className="flex items-center gap-0.5 py-1 overflow-x-auto scrollbar-none">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => onMenuChange(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold text-xs transition duration-150 shrink-0 ${
                    item.isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-md shadow-indigo-500/25 ring-1 ring-white/10'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${item.isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="whitespace-nowrap">{item.label}</span>
                  {item.badge && (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${item.badgeClass}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Mobile Dropdown Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-950 border-b border-slate-800 px-4 py-3 space-y-1 animate-fadeIn">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onMenuChange(item.id)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-semibold text-xs transition ${
                    item.isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${item.badgeClass}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </header>

      {/* =========================================================
          MAIN PAGE CONTENT (FULL 100% WIDTH CANVAS)
          ========================================================= */}
      <main className="flex-1 w-full px-3 sm:px-4 lg:px-5 py-2.5 sm:py-3">
        {children}
      </main>
    </div>
  )
}
