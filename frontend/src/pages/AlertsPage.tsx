import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { alertsApi } from '../api/client'
import { Bell, CheckCircle, Eye, AlertTriangle, Info, Wrench, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Alert } from '../types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  maintenance_due: { icon: Wrench, color: 'text-blue-600 bg-blue-50', label: 'Mantenimiento' },
  low_stock: { icon: Package, color: 'text-orange-600 bg-orange-50', label: 'Stock Bajo' },
  warranty_expiry: { icon: AlertTriangle, color: 'text-yellow-600 bg-yellow-50', label: 'Garantía' },
  calibration_due: { icon: Info, color: 'text-purple-600 bg-purple-50', label: 'Calibración' },
  equipment_down: { icon: AlertTriangle, color: 'text-red-600 bg-red-50', label: 'Equipo Caído' },
}

const PRIORITY_BORDER: Record<string, string> = {
  critical: 'border-l-red-600', high: 'border-l-orange-500',
  medium: 'border-l-yellow-400', low: 'border-l-blue-400',
}

export default function AlertsPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('pending')

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts', statusFilter],
    queryFn: () => alertsApi.list({ status: statusFilter || undefined }).then(r => r.data),
    refetchInterval: 30_000,
  })

  const handleAcknowledge = async (id: number) => {
    try {
      await alertsApi.acknowledge(id)
      toast.success('Alerta reconocida')
      qc.invalidateQueries({ queryKey: ['alerts'] })
      qc.invalidateQueries({ queryKey: ['alert-count'] })
    } catch { toast.error('Error') }
  }

  const handleResolve = async (id: number) => {
    try {
      await alertsApi.resolve(id)
      toast.success('Alerta resuelta')
      qc.invalidateQueries({ queryKey: ['alerts'] })
      qc.invalidateQueries({ queryKey: ['alert-count'] })
    } catch { toast.error('Error') }
  }

  const byType = alerts.reduce((acc: Record<string, number>, a: Alert) => {
    acc[a.type] = (acc[a.type] || 0) + 1
    return acc
  }, {})

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alertas del Sistema</h1>
          <p className="text-sm text-gray-500">Las alertas se generan automáticamente en tiempo real</p>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-sm font-medium">
          <Bell className="w-4 h-4" />
          {alerts.filter((a: Alert) => a.status === 'pending').length} pendientes
        </div>
      </div>

      {/* Type breakdown */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(TYPE_CONFIG).map(([type, { icon: Icon, color, label }]) => {
          const count = byType[type] || 0
          return (
            <div key={type} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${color} text-sm`}>
              <Icon className="w-4 h-4" />
              <span className="font-medium">{label}</span>
              <span className="font-bold">{count}</span>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[['pending', 'Pendientes'], ['acknowledged', 'Reconocidas'], ['resolved', 'Resueltas'], ['', 'Todas']].map(([val, label]) => (
          <button key={val} onClick={() => setStatusFilter(val)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === val ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Alert list */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="space-y-3">
          {alerts.length === 0 && (
            <div className="card text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Sin alertas {statusFilter === 'pending' ? 'pendientes' : ''}</p>
              <p className="text-sm text-gray-400 mt-1">El sistema está en buen estado</p>
            </div>
          )}
          {alerts.map((alert: Alert) => {
            const config = TYPE_CONFIG[alert.type] || { icon: Bell, color: 'text-gray-600 bg-gray-50', label: alert.type }
            const Icon = config.icon
            return (
              <div key={alert.id} className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${PRIORITY_BORDER[alert.priority]} p-4`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge text-xs ${config.color}`}>{config.label}</span>
                      <span className={`badge text-xs ${
                        alert.priority === 'critical' ? 'bg-red-100 text-red-700' :
                        alert.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                        alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'
                      }`}>{alert.priority}</span>
                      {alert.status !== 'pending' && (
                        <span className={`badge text-xs ${alert.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {alert.status === 'resolved' ? 'Resuelta' : 'Reconocida'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-800">{alert.message}</p>
                    <div className="flex items-center gap-4 mt-1">
                      {alert.equipment && <p className="text-xs text-gray-400">{alert.equipment.name} · {alert.equipment.code}</p>}
                      {alert.due_date && <p className="text-xs text-gray-400">Vence: {alert.due_date}</p>}
                      {alert.created_at && (
                        <p className="text-xs text-gray-300">
                          {format(new Date(alert.created_at), "d MMM yyyy", { locale: es })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {alert.status === 'pending' && (
                      <>
                        <button onClick={() => handleAcknowledge(alert.id)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:bg-blue-50 px-2 py-1.5 rounded-lg transition-colors">
                          <Eye className="w-3 h-3" /> Reconocer
                        </button>
                        <button onClick={() => handleResolve(alert.id)}
                          className="flex items-center gap-1 text-xs text-green-600 hover:bg-green-50 px-2 py-1.5 rounded-lg transition-colors">
                          <CheckCircle className="w-3 h-3" /> Resolver
                        </button>
                      </>
                    )}
                    {alert.status === 'acknowledged' && (
                      <button onClick={() => handleResolve(alert.id)}
                        className="flex items-center gap-1 text-xs text-green-600 hover:bg-green-50 px-2 py-1.5 rounded-lg transition-colors">
                        <CheckCircle className="w-3 h-3" /> Resolver
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
