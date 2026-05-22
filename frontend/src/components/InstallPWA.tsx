import { useState, useEffect } from 'react'
import { Download, X, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPWA() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Don't show if already running as standalone PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }
    // Don't show if user dismissed in the last 3 days
    const dismissed = localStorage.getItem('pwa-dismissed')
    if (dismissed && Date.now() - Number(dismissed) < 3 * 24 * 60 * 60 * 1000) return

    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setInstalled(true))
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setShow(false)
    setPrompt(null)
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa-dismissed', String(Date.now()))
    setShow(false)
  }

  if (!show || installed) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-4 flex items-start gap-3 border border-slate-700">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Smartphone className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Instalar app CMMS</p>
          <p className="text-xs text-slate-400 mt-0.5">Instala la app en tu celular para acceso rápido sin abrir el navegador</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Instalar
            </button>
            <button
              onClick={handleDismiss}
              className="text-xs text-slate-400 hover:text-white py-2 px-3 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Ahora no
            </button>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-slate-500 hover:text-white flex-shrink-0 -mt-1 -mr-1">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
