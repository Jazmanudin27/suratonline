import React from 'react'
import { FileText, Inbox, User, Package, FileCheck2 } from 'lucide-react'

export default function MobileBottomNav({
  activeTab = 'archive',
  onTabChange,
  pendingApprovalsCount = 0,
}) {
  const tabs = [
    {
      id: 'archive',
      label: 'Surat',
      icon: FileText,
    },
    {
      id: 'inbox',
      label: 'Inbox',
      icon: Inbox,
      badge: pendingApprovalsCount,
    },
    {
      id: 'memo',
      label: 'IM',
      icon: FileCheck2,
    },
    {
      id: 'products',
      label: 'Produk',
      icon: Package,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto pointer-events-none select-none px-3.5 pb-3.5">
      <div className="pointer-events-auto bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 shadow-[0_12px_36px_rgba(15,23,42,0.45)] backdrop-blur-xl rounded-2xl p-1.5 flex items-center justify-around gap-1 ring-1 ring-white/10">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1.5 rounded-xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'bg-gradient-to-b from-blue-600 to-indigo-600 text-white font-extrabold shadow-md shadow-blue-500/30 ring-1 ring-white/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 font-medium'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  size={19}
                  strokeWidth={isActive ? 2.5 : 1.9}
                  className={`transition-colors ${isActive ? 'text-white' : 'text-slate-400'}`}
                />
                {tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-md ring-2 ring-slate-900 animate-pulse">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10.5px] mt-1 tracking-tight leading-none ${isActive ? 'font-extrabold text-white' : 'text-slate-400'}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

