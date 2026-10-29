import React, { useState } from 'react'
import {
  Lock,
  User,
  ShieldCheck,
  Building2,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'
import { api } from '../services/api'
import { setCurrentUser } from '../services/storage'

export default function LoginForm({ onLoginSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password) {
      setErrorMessage('Username/Email dan Password wajib diisi!')
      return
    }

    setLoading(true)
    setErrorMessage('')

    try {
      const res = await api.login(username, password)
      if (res.success && res.data) {
        setCurrentUser(res.data)
        if (onLoginSuccess) {
          onLoginSuccess(res.data)
        }
      } else {
        setErrorMessage(res.message || 'Login gagal. Periksa username dan password Anda.')
      }
    } catch (err) {
      setErrorMessage('Terjadi kesalahan jaringan atau server API offline.')
    } finally {
      setLoading(false)
    }
  }

  // Quick preset login helper for testing
  const handleQuickSelect = (u, p) => {
    setUsername(u)
    setPassword(p)
    setErrorMessage('')
  }

  return (
    <div className="min-h-screen bg-[#070d1e] text-slate-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 font-black text-2xl shadow-xl shadow-emerald-500/20 mb-2">
            MP
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Portal E-Letter MP
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Sistem Informasi Surat Ajuan & Alur Persetujuan Online
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#0e172f]/95 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-5">
          <div className="border-b border-slate-700/60 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              Masuk Akun Pengguna
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Gunakan akun resmi yang terdaftar pada database sistem portal.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {/* Username / Email */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-300">
                Username / Email Perusahaan
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: aisah atau jazmanudin"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium transition"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password akun..."
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              {loading ? (
                <span>Memverifikasi Akun...</span>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Login Presets for Real Users from Database */}
          <div className="pt-4 border-t border-slate-700/60 space-y-2.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Pilihan Akun Cepat (Database Portal):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickSelect('aisah', 'password')}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-left border border-slate-700 transition"
              >
                <strong className="text-white block">Siti Aisah</strong>
                <span className="text-emerald-400 text-[10px]">Pemohon (Admin Bandung)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('dasep', 'password')}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-left border border-slate-700 transition"
              >
                <strong className="text-white block">Dasep Reski</strong>
                <span className="text-amber-400 text-[10px]">Approver 1 (SMM Bandung)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('yusup.jabar', 'password')}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-left border border-slate-700 transition"
              >
                <strong className="text-white block">Yusup Supriatna</strong>
                <span className="text-sky-400 text-[10px]">Approver 2 (RSM Jabar)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('jazmanudin', 'password')}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-left border border-slate-700 transition"
              >
                <strong className="text-white block">Jazmanudin</strong>
                <span className="text-purple-400 text-[10px]">Super Admin (IT Pusat)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500">
          Terintegrasi Database MySQL Portal &bull; CV Makmur Permata
        </div>
      </div>
    </div>
  )
}
