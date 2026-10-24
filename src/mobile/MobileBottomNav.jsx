import React from 'react'
import { FileText, Inbox, User, Package } from 'lucide-react'

export default function MobileBottomNav({
  activeTab = 'archive',
  onTabChange,
  pendingApprovalsCount = 0,
}) {
  const tabs = [
    {
      id: 'archive',
      label: 'Arsip Surat',
      icon: FileText,
    },
    {
      id: 'inbox',
      label: 'Inbox ACC',
      icon: Inbox,
      badge: pendingApprovalsCount,
    },
    {
      id: 'products',
      label: 'Produk',
      icon: Package,
    },
    {
      id: 'profile',
      label: 'Profil',
      icon: User,
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto pointer-events-none select-none px-4 pb-4">
      <div className="pointer-events-auto bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_10px_30px_rgba(15,23,42,0.12)] rounded-2xl p-1.5 flex items-center justify-around gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`relative flex-1 flex flex-col items-center justify-center py-2 px-2 rounded-xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-medium'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.4 : 1.8}
                  className={`transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400'}`}
                />
                {tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] mt-1 tracking-tight leading-none ${isActive ? 'font-bold text-blue-600' : 'text-slate-500'}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

