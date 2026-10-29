import React, { useState, useEffect } from 'react'
import { Download, Share2, PlusSquare, X, Smartphone, Check, ArrowDown } from 'lucide-react'

export default function PwaInstallPrompt({ forceOpen = false, onCloseModal }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [showIOSModal, setShowIOSModal] = useState(false)

  useEffect(() => {
    // Check if running as installed standalone app
    const checkStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://')

    setIsStandalone(checkStandalone)

    // Check if device is iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
    setIsIOS(isIosDevice)

    // Check if user previously dismissed floating prompt in current session
    const dismissed = sessionStorage.getItem('suratajuan_pwa_dismissed') === 'true'
    setIsDismissed(dismissed)

    // Listen for Android / Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  // If forceOpen triggered externally (e.g., from Profile or Header button)
  useEffect(() => {
    if (forceOpen) {
      if (isIOS) {
        setShowIOSModal(true)
      } else if (deferredPrompt) {
        handleInstallClick()
      } else {
        // Fallback for Chrome without prompt event ready
        setShowIOSModal(true)
      }
    }
  }, [forceOpen])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        setIsDismissed(true)
      }
    } else if (isIOS) {
      setShowIOSModal(true)
    } else {
      setShowIOSModal(true)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    sessionStorage.setItem('suratajuan_pwa_dismissed', 'true')
  }

  const handleCloseModal = () => {
    setShowIOSModal(false)
    if (onCloseModal) onCloseModal()
  }

  // Hide floating banner if already standalone or dismissed
  const showBanner = !isStandalone && !isDismissed && (deferredPrompt || isIOS)

  return (
    <>
      {/* Floating Bottom Install Banner */}
      {showBanner && !forceOpen && (
        <div className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-40 animate-bounce-in">
          <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3.5 shadow-2xl border border-indigo-500/40 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white p-1 shrink-0 shadow-inner flex items-center justify-center overflow-hidden border border-slate-200">
              <img
                src="/icon-192.png"
                alt="Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-white truncate">E-Letter MP</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-indigo-500/80 text-white rounded-full">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate mt-0.5">
                {isIOS ? 'Pasang di Layar Utama iPhone' : 'Install ke Layar HP agar lebih cepat'}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleInstallClick}
                className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/30 flex items-center gap-1 transition active:scale-95"
              >
                <Download size={13} strokeWidth={2.5} />
                <span>Pasang</span>
              </button>
              <button
                onClick={handleDismiss}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
                title="Tutup"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panduan Install Modal (Khusus iPhone / Safari & Browser Manual) */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm sm:max-w-md p-5 shadow-2xl border border-slate-200 animate-slideUp">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 p-1.5 border border-slate-200 shrink-0 shadow-xs flex items-center justify-center">
                  <img src="/icon-192.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Pasang Aplikasi E-Letter MP</h3>
                  <p className="text-xs text-slate-500">
                    {isIOS ? 'Petunjuk untuk iPhone / iPad' : 'Petunjuk Tambah ke Layar Utama'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Steps Content */}
            <div className="py-4 space-y-3.5">
              {isIOS ? (
                <>
                  <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      1
                    </div>
                    <div className="text-xs text-slate-700">
                      <p className="font-semibold text-slate-800">
                        Buka di browser <span className="text-indigo-600 font-bold">Safari</span> lalu ketuk tombol <span className="font-bold">Bagikan (Share)</span>
                      </p>
                      <div className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 bg-white border border-indigo-200 rounded-lg text-indigo-700 font-medium text-[11px]">
                        <Share2 size={13} className="text-indigo-600 stroke-[2.5]" />
                        <span>Ikon Kotak Panah ke Atas (di bilah bawah Safari)</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      2
                    </div>
                    <div className="text-xs text-slate-700">
                      <p className="font-semibold text-slate-800">
                        Gulir ke bawah dan pilih <span className="text-indigo-600 font-bold">"Tambah ke Layar Utama"</span>
                      </p>
                      <div className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 bg-white border border-indigo-200 rounded-lg text-indigo-700 font-medium text-[11px]">
                        <PlusSquare size={13} className="text-indigo-600 stroke-[2.5]" />
                        <span>Add to Home Screen</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      3
                    </div>
                    <div className="text-xs text-slate-700">
                      <p className="font-semibold text-slate-800">
                        Ketuk <span className="font-bold text-indigo-600">"Tambah" (Add)</span> di sudut kanan atas
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Ikon aplikasi akan otomatis tampil di layar utama iPhone Anda seperti aplikasi native.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      1
                    </div>
                    <div className="text-xs text-slate-700">
                      <p className="font-semibold text-slate-800">
                        Ketuk menu titik tiga <span className="font-bold">(⋮)</span> di pojok kanan atas browser Chrome
                      </p>
                    </div>
                  </div>

                  <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      2
                    </div>
                    <div className="text-xs text-slate-700">
                      <p className="font-semibold text-slate-800">
                        Pilih menu <span className="text-indigo-600 font-bold">"Install aplikasi"</span> atau <span className="text-indigo-600 font-bold">"Tambahkan ke Layar Utama"</span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      3
                    </div>
                    <div className="text-xs text-slate-700">
                      <p className="font-semibold text-slate-800">
                        Konfirmasi <span className="font-bold text-indigo-600">"Install"</span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Aplikasi akan otomatis terpasang di layar utama HP Anda tanpa melalui Play Store.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-2">
              <button
                onClick={handleCloseModal}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-98"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
