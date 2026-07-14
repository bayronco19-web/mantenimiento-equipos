import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard, Wrench, ClipboardList, Calendar, Package,
  BookOpen, Bell, Users, LogOut, Settings, ChevronRight, AlertTriangle, Tags
} from 'lucide-react'
import { alertsApi } from '../api/client'
import clsx from 'clsx'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/equipment', icon: Wrench, label: 'Equipos' },
  { to: '/work-orders', icon: ClipboardList, label: 'Órdenes de Trabajo' },
  { to: '/schedule', icon: Calendar, label: 'Cronograma' },
  { to: '/inventory', icon: Package, label: 'Inventario' },
  { to: '/price-comparison', icon: Tags, label: 'Comparador de Precios' },
  { to: '/alerts', icon: Bell, label: 'Alertas', badge: true },
  { to: '/users', icon: Users, label: 'Usuarios' },
]

export default function Layout() {
  const navigate = useNavigate()
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null

  const { data: alertCount } = useQuery({
    queryKey: ['alert-count'],
    queryFn: () => alertsApi.count().then(r => r.data),
    refetchInterval: 60_000,
  })

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl flex-shrink-0">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">CMMS</p>
              <p className="text-xs text-slate-400">Mantenimiento</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {badge && alertCount?.pending > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {alertCount.pending > 9 ? '9+' : alertCount.pending}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.full_name || 'Usuario'}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.role || ''}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 text-slate-400 hover:text-white text-sm py-1.5 px-2 rounded hover:bg-slate-800 transition-colors">
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto relative">
        {/* Marca de agua de fondo */}
        <div className="pointer-events-none fixed inset-0 left-64 flex items-center justify-center overflow-hidden z-0">
          <svg viewBox="0 0 500 500" className="w-[520px] h-[520px] opacity-[0.04] select-none" fill="currentColor">
            {/* Engranaje externo */}
            <path d="M250 60
              l18 -8 l4 -20 l-8 -18 l20 -8 l12 16 l20 2 l14 -14 l20 6 l-2 20
              l16 12 l20 -6 l10 18 l-14 14 l2 20 l18 8 l-2 22 l-20 4 l-8 18
              l10 18 l-16 14 l-18 -10 l-18 8 l-4 20 l-22 2 l-12 -16 l-20 -2
              l-14 14 l-20 -6 l2 -20 l-16 -12 l-20 6 l-10 -18 l14 -14 l-2 -20
              l-18 -8 l2 -22 l20 -4 l8 -18 l-10 -18 l16 -14 l18 10 l18 -8 Z"
              fillRule="evenodd" />
            {/* Círculo interior del engranaje */}
            <circle cx="250" cy="250" r="70" />
            <circle cx="250" cy="250" r="52" fill="white" className="text-white" style={{fill:'var(--tw-prose-body, #f9fafb)'}} />
            {/* Llave inglesa dentro */}
            <path d="M220 210 Q210 220 212 235 L270 293 Q275 298 282 296
              Q298 290 304 274 Q306 264 298 258 L285 245 L290 240
              Q302 228 302 212 Q302 196 290 186 Q278 176 262 176
              Q252 176 244 180 L262 198 L258 210 L246 214 L228 196
              Q222 202 220 210 Z" />
          </svg>
        </div>
        {/* Texto CMMS debajo del icono */}
        <div className="pointer-events-none fixed left-64 right-0 flex items-center justify-center overflow-hidden z-0" style={{top: 'calc(50% + 220px)'}}>
          <span className="text-[120px] font-black tracking-widest opacity-[0.025] select-none text-gray-900 leading-none">
            CMMS
          </span>
        </div>
        <div className="relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
