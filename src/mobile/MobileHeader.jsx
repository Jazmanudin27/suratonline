import React, { useState, useEffect } from 'react'
import {
  FileText,
  Monitor,
  Bell,
  LogOut,
  Calendar,
  Clock,
  Building2,
  Sun,
  Moon,
  Sunset,
} from 'lucide-react'

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
  const [timeOfDay, setTimeOfDay] = useState('morning')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = now.getHours()

      if (hours >= 4 && hours < 11) {
        setGreeting('Selamat Pagi')
        setTimeOfDay('morning')
      } else if (hours >= 11 && hours < 15) {
        setGreeting('Selamat Siang')
        setTimeOfDay('day')
      } else if (hours >= 15 && hours < 18) {
        setGreeting('Selamat Sore')
        setTimeOfDay('afternoon')
      } else {
        setGreeting('Selamat Malam')
        setTimeOfDay('night')
      }

      const timeStr =
        now.toLocaleTimeString('id-ID', {
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
    <header className="relative bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 text-white pt-3 pb-5 px-4 rounded-b-3xl shadow-md overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-12 -left-12 w-40 h-40 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar: Brand, Quick Switch, Notification, Logout */}
      <div className="relative z-10 flex items-center justify-between mb-3.5">
        {/* App Title Badge */}
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/15">
          <div className="w-5 h-5 rounded-lg bg-blue-500 flex items-center justify-center text-white">
            <FileText size={12} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-xs tracking-tight text-white">E-Surat Ajuan</span>
        </div>

        {/* Quick Action Icons */}
        <div className="flex items-center gap-1.5">
          {/* Switch to Desktop Button */}
          <button
            onClick={onSwitchToDesktop}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition flex items-center justify-center border border-white/15 text-white/90"
            title="Beralih ke Tampilan Desktop"
          >
            <Monitor size={15} strokeWidth={2} />
          </button>

          {/* Inbox Notification Icon */}
          <button
            onClick={onOpenInbox}
            className="relative w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition flex items-center justify-center border border-white/15 text-white/90"
            title="Inbox Persetujuan"
          >
            <Bell size={15} strokeWidth={2} />
            {pendingApprovalsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse">
                {pendingApprovalsCount > 9 ? '9+' : pendingApprovalsCount}
              </span>
            )}
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="w-8 h-8 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 active:scale-95 transition flex items-center justify-center border border-rose-400/30 text-rose-200"
            title="Keluar"
          >
            <LogOut size={14} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* User Info & Greeting */}
      <div className="relative z-10 flex items-center gap-3">
        {/* Squircle Avatar with Status Dot */}
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-sm">
            <span className="text-base font-black tracking-wider text-white">
              {initials}
            </span>
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-indigo-800 rounded-full" />
        </div>

        {/* Name, Greeting & Badge Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-blue-200 font-medium">
            {timeOfDay === 'night' ? (
              <Moon size={12} className="text-amber-300" />
            ) : timeOfDay === 'afternoon' ? (
              <Sunset size={12} className="text-amber-300" />
            ) : (
              <Sun size={12} className="text-amber-300" />
            )}
            <span>{greeting},</span>
          </div>
          <h2 className="text-sm font-bold text-white truncate leading-tight mt-0.5">
            {currentUser?.name || 'Pengguna'}
          </h2>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[11px] text-blue-200/90 truncate max-w-[130px]">
              {currentUser?.position || currentUser?.role || 'Staff'}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/15 text-white backdrop-blur-xs border border-white/15 truncate">
              <Building2 size={10} className="shrink-0 text-blue-200" />
              <span>{currentUser?.branchName || currentUser?.branchId || currentUser?.branchCode || 'Pusat'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Live Date & Time Capsule */}
      <div className="relative z-10 mt-3 bg-black/25 backdrop-blur-md rounded-xl px-3 py-1.5 flex items-center justify-between border border-white/10 text-xs">
        <div className="flex items-center gap-1.5 text-blue-100 text-[11px] font-medium">
          <Calendar size={12} className="text-blue-300" />
          <span>{currentDate}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-300 tracking-wide">
          <Clock size={12} className="text-emerald-400" />
          <span>{currentTime}</span>
        </div>
      </div>
    </header>
  )
}

