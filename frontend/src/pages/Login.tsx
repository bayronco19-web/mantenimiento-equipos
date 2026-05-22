import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authApi } from '../api/client'
import toast from 'react-hot-toast'
import { Settings, Loader2 } from 'lucide-react'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = (location.state as any)?.redirect || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authApi.login(username, password)
      localStorage.setItem('token', res.data.access_token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate(redirectTo)
    } catch {
      toast.error('Usuario o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Settings className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CMMS</h1>
          <p className="text-gray-500 text-sm mt-1">Sistema de Gestión de Mantenimiento</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Usuario</label>
            <input
              type="text" className="input" placeholder="Ingresa tu usuario"
              value={username} onChange={e => setUsername(e.target.value)} required
            />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input
              type="password" className="input" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required
            />
          </div>
          <button type="submit" disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-xs font-semibold text-blue-800 mb-2">Credenciales de demo:</p>
          <div className="text-xs text-blue-700 space-y-1">
            <p><span className="font-mono bg-white px-1.5 py-0.5 rounded">admin</span> / <span className="font-mono bg-white px-1.5 py-0.5 rounded">admin123</span> → Administrador</p>
            <p><span className="font-mono bg-white px-1.5 py-0.5 rounded">tecnico1</span> / <span className="font-mono bg-white px-1.5 py-0.5 rounded">tec123</span> → Técnico</p>
          </div>
        </div>
      </div>
    </div>
  )
}
