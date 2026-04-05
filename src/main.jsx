import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Register service worker with auto-update
const updateSW = registerSW({
  onNeedRefresh() {
    // Auto-update in background — no prompt needed for a personal app
    updateSW(true)
  },
  onOfflineReady() {
    console.log('App ready for offline use')
  },
  onRegisteredSW(swUrl, r) {
    // Check for updates every 30 minutes
    if (r) {
      setInterval(() => {
        r.update()
      }, 30 * 60 * 1000)
    }
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
