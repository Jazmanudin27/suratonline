import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './utils'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        // Check for updates
        reg.onupdatefound = () => {
          const installingWorker = reg.installing
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('Versi baru aplikasi tersedia.')
              }
            }
          }
        }
      })
      .catch((err) => {
        console.warn('PWA Service Worker registration skipped:', err)
      })
  })
}
