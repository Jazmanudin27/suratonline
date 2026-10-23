import React from 'react'

export default function MobileBottomNav({
  activeTab = 'dashboard',
  onTabChange,
  pendingApprovalsCount = 0,
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto pointer-events-none select-none">
      <div className="relative mx-3.5 mb-3.5 pointer-events-auto">
        {/* Floating Curved Dock Glass Container */}
        <div className="relative bg-white/95 backdrop-blur-2xl border border-white/80 shadow-[0_10px_35px_rgba(15,23,42,0.15)] rounded-[28px] px-3 py-2 flex items-center justify-between">
          {/* TAB 1: Beranda */}
          <button
            type="button"
            onClick={() => onTabChange('dashboard')}
            className="flex-1 flex flex-col items-center py-1 transition-all duration-200 active:scale-90 group"
          >
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-105'
                  : 'text-slate-400 group-hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span
              className={`text-[10px] mt-1 font-bold tracking-tight transition-colors ${
                activeTab === 'dashboard' ? 'text-blue-600 font-extrabold' : 'text-slate-500'
              }`}
            >
              Beranda
            </span>
            {activeTab === 'dashboard' && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-0.5 animate-pulse" />
            )}
          </button>

          {/* TAB 2: Arsip Surat */}
          <button
            type="button"
            onClick={() => onTabChange('archive')}
            className="flex-1 flex flex-col items-center py-1 transition-all duration-200 active:scale-90 group"
          >
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                activeTab === 'archive'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-105'
                  : 'text-slate-400 group-hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === 'archive' ? 2.5 : 2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span
              className={`text-[10px] mt-1 font-bold tracking-tight transition-colors ${
                activeTab === 'archive' ? 'text-blue-600 font-extrabold' : 'text-slate-500'
              }`}
            >
              Arsip
            </span>
            {activeTab === 'archive' && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-0.5 animate-pulse" />
            )}
          </button>


          {/* TAB 3: Inbox ACC */}
          <button
            type="button"
            onClick={() => onTabChange('inbox')}
            className="flex-1 flex flex-col items-center py-1 transition-all duration-200 active:scale-90 group relative"
          >
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 relative ${
                activeTab === 'inbox'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-105'
                  : 'text-slate-400 group-hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === 'inbox' ? 2.5 : 2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              {pendingApprovalsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-bounce shadow-xs">
                  {pendingApprovalsCount}
                </span>
              )}
            </div>
            <span
              className={`text-[10px] mt-1 font-bold tracking-tight transition-colors ${
                activeTab === 'inbox' ? 'text-blue-600 font-extrabold' : 'text-slate-500'
              }`}
            >
              Inbox ACC
            </span>
            {activeTab === 'inbox' && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-0.5 animate-pulse" />
            )}
          </button>

          {/* TAB 4: Profil */}
          <button
            type="button"
            onClick={() => onTabChange('profile')}
            className="flex-1 flex flex-col items-center py-1 transition-all duration-200 active:scale-90 group"
          >
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                activeTab === 'profile'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-105'
                  : 'text-slate-400 group-hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === 'profile' ? 2.5 : 2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span
              className={`text-[10px] mt-1 font-bold tracking-tight transition-colors ${
                activeTab === 'profile' ? 'text-blue-600 font-extrabold' : 'text-slate-500'
              }`}
            >
              Profil
            </span>
            {activeTab === 'profile' && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-0.5 animate-pulse" />
            )}
          </button>
        </div>
      </div>
    </nav>
  )
}
