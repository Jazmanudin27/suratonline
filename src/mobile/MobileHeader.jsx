import React, { useState, useEffect } from 'react'
import { isCrmOrIt } from '../utils'

export default function MobileHeader({
  currentUser,
  onLogout,
  onSwitchToDesktop,
  pendingApprovalsCount = 0,
  onOpenInbox,
}) {
  const [currentTime, setCurrentTime] = useState('')
  const [currentDate, setCurrentDate] = useState('')
  const [greeting, setGreeting] = useState('Selamat Pagi')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = now.getHours()

      if (hours >= 4 && hours < 11) setGreeting('Selamat Pagi')
      else if (hours >= 11 && hours < 15) setGreeting('Selamat Siang')
      else if (hours >= 15 && hours < 18) setGreeting('Selamat Sore')
      else setGreeting('Selamat Malam')

      const timeStr = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }) + ' WIB'
      setCurrentTime(timeStr)

      const dateStr = now.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
      setCurrentDate(dateStr)
    }

    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // Initials
  const initials = (currentUser?.name || 'User')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

  return (
    <header className="relative bg-gradient-to-b from-blue-700 via-indigo-700 to-blue-600 text-white pt-3 pb-6 px-4 rounded-b-[28px] shadow-lg overflow-hidden">
      {/* Background ambient decorative circles */}
      <div className="absolute -top-10 -right-10 w-44 h-44 bg-blue-400/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute top-16 -left-12 w-36 h-36 bg-indigo-400/20 rounded-full blur-2xl pointer-events-none" />

      {/* Top Bar: Brand, Quick Switch, Notification, Logout */}
      <div className="relative z-10 flex items-center justify-between mb-4">
        {/* App Title Badge */}
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
          <div className="w-6 h-6 rounded-full bg-blue-500/80 flex items-center justify-center text-xs shadow-xs">
            ✉
          </div>
          <span className="font-bold text-sm tracking-tight">E-Surat Ajuan</span>
          <span className="text-[10px] bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-extrabold px-1.5 py-0.5 rounded-full shadow-xs">
            PRO
          </span>
        </div>

        {/* Quick Action Icons */}
        <div className="flex items-center gap-2">
          {/* Switch to Desktop Button */}
          <button
            onClick={onSwitchToDesktop}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition flex items-center justify-center border border-white/20 text-xs shadow-xs"
            title="Beralih ke Tampilan Desktop"
          >
            💻
          </button>

          {/* Inbox Notification Icon */}
          <button
            onClick={onOpenInbox}
            className="relative w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition flex items-center justify-center border border-white/20 text-xs shadow-xs"
            title="Inbox Persetujuan"
          >
            🔔
            {pendingApprovalsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-xs">
                {pendingApprovalsCount > 9 ? '9+' : pendingApprovalsCount}
              </span>
            )}
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="w-8 h-8 rounded-full bg-rose-600/80 hover:bg-rose-500 active:scale-95 transition flex items-center justify-center border border-rose-300/40 text-xs shadow-xs"
            title="Keluar"
          >
            🚪
          </button>
        </div>
      </div>

      {/* User Info & Live Clock Card */}
      <div className="relative z-10 flex items-center gap-3">
        {/* Squircle Avatar with Status Dot */}
        <div className="relative flex-shrink-0">
          <div className="w-13 h-13 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-md">
            <span className="text-lg font-black tracking-wider text-white">
              {initials}
            </span>
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-indigo-700 rounded-full shadow-xs" />
        </div>

        {/* Name, Greeting & Badge Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-blue-100 font-medium">
            <span>🌅</span>
            <span>{greeting},</span>
          </div>
          <h2 className="text-base font-bold text-white truncate leading-tight">
            {currentUser?.name || 'Pengguna'}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] text-blue-200/90 truncate max-w-[140px]">
              {currentUser?.position || currentUser?.role || 'Staff'}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white backdrop-blur-xs border border-white/20 truncate">
              🏢 {currentUser?.branchName || currentUser?.branchId || currentUser?.branchCode || 'Pusat'}
            </span>
          </div>
        </div>
      </div>

      {/* Live Date & Time Capsule */}
      <div className="relative z-10 mt-3.5 bg-black/20 backdrop-blur-md rounded-xl px-3 py-1.5 flex items-center justify-between border border-white/15 text-xs">
        <div className="flex items-center gap-1.5 text-blue-100 font-medium">
          <span>📅</span>
          <span>{currentDate}</span>
        </div>
        <div className="flex items-center gap-1.5 font-bold text-emerald-300 tracking-wide">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
          <span>{currentTime}</span>
        </div>
      </div>
    </header>
  )
}
