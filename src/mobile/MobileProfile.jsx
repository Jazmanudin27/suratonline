import React from 'react'

export default function MobileProfile({
  currentUser,
  onLogout,
  onSwitchToDesktop,
}) {
  const initials = (currentUser?.name || 'User')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

  return (
    <div className="space-y-4 pb-24 px-1">
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
