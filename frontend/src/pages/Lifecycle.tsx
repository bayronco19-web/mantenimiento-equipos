import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { lifecycleApi, equipmentApi, reportsApi } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import { ArrowLeft, Download, Wrench, DollarSign, Clock, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { LifecycleEntry } from '../types'

const EVENT_ICONS: Record<string, string> = {
  preventive: '🔧', corrective: '🔨', predictive: '🔍',
  lubrication: '🛢️', calibration: '📐', inspection: '👁️',
}

export default function Lifecycle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const eqId = Number(id)

  const { data: eq } = useQuery({ queryKey: ['equipment', eqId], queryFn: () => equipmentApi.get(eqId).then(r => r.data) })
  const { data: history = [], isLoading } = useQuery({ queryKey: ['lifecycle', eqId], queryFn: () => lifecycleApi.getHistory(eqId).then(r => r.data) })
  const { data: summary } = useQuery({ queryKey: ['lifecycle-summary', eqId], queryFn: () => lifecycleApi.getSummary(eqId).then(r => r.data) })

  if (isLoading) return <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-secondary p-2"><ArrowLeft className="w-4 h-4" /></button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Hoja de Vida del Equipo</h1>
          <p className="text-sm text-gray-500">{eq?.name} · {eq?.code}</p>
        </div>
        <button onClick={() => reportsApi.lifecycle(eqId)} className="btn-primary flex items-center gap-2 text-sm">
          <Download className="w-4 h-4" /> Exportar Excel
        </button>
      </div>

      {/* Summary stats */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Wrench, label: 'Total Intervenciones', value: summary.total_maintenances, color: 'bg-blue-100 text-blue-700' },
            { icon: DollarSign, label: 'Costo Total Histórico', value: `$${(summary.total_cost || 0).toLocaleString()}`, color: 'bg-green-100 text-green-700' },
            { icon: Clock, label: 'Horas Labor Total', value: `${summary.total_labor_hours}h`, color: 'bg-purple-100 text-purple-700' },
            { icon: Clock, label: 'MTTR Promedio', value: `${summary.avg_repair_hours}h`, color: 'bg-amber-100 text-amber-700' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className={`rounded-xl p-4 ${color}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4" />
                <p className="text-xs font-medium">{label}</p>
              </div>
              <p className="text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* By type breakdown */}
      {summary?.by_type && Object.keys(summary.by_type).length > 0 && (
        <div className="card py-4">
          <h3 className="font-semibold text-gray-700 mb-3 text-sm">Intervenciones por Tipo</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(summary.by_type).map(([type, count]) => (
              <div key={type} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-lg">{EVENT_ICONS[type] || '🔧'}</span>
                <div>
                  <StatusBadge value={type} />
                  <p className="text-xs font-bold text-gray-700 text-center">{String(count)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Historial Cronológico</h3>
        {history.length === 0 && (
          <div className="text-center py-12">
            <Wrench className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">Sin registros de mantenimiento aún.</p>
            <p className="text-xs text-gray-300 mt-1">El historial se actualiza automáticamente al completar órdenes de trabajo.</p>
          </div>
        )}
        <div className="relative">
          {/* Vertical line */}
          {history.length > 0 && <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />}
          <div className="space-y-6">
            {history.map((entry: LifecycleEntry, idx: number) => (
              <div key={entry.id} className="flex gap-4 relative">
                {/* Icon */}
                <div className="w-12 h-12 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-xl">
                  {EVENT_ICONS[entry.event_type] || '🔧'}
                </div>
                {/* Content */}
                <div className="flex-1 bg-gray-50 rounded-xl p-4 -mt-0.5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge value={entry.event_type} size="md" />
                        {entry.equipment_status_after && <StatusBadge value={entry.equipment_status_after} />}
                      </div>
                      <p className="text-xs text-gray-400">
                        {entry.date ? format(new Date(entry.date), "d 'de' MMMM yyyy, HH:mm", { locale: es }) : '—'}
                        {entry.technician && ` · ${entry.technician.full_name}`}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {entry.total_cost > 0 && <p className="text-sm font-semibold text-gray-800">${entry.total_cost.toLocaleString()}</p>}
                      {entry.labor_hours > 0 && <p className="text-xs text-gray-400">{entry.labor_hours}h labor</p>}
                    </div>
                  </div>

                  {entry.description && <p className="text-sm text-gray-700 mb-2">{entry.description}</p>}

                  {entry.findings && (
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Hallazgos</p>
                      <p className="text-sm text-gray-700 bg-yellow-50 rounded-lg p-2">{entry.findings}</p>
                    </div>
                  )}
                  {entry.actions_taken && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Acciones Realizadas</p>
                      <p className="text-sm text-gray-700 bg-green-50 rounded-lg p-2">{entry.actions_taken}</p>
                    </div>
                  )}
                  {entry.next_maintenance_date && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                      <Calendar className="w-3 h-3" /> Próximo: {entry.next_maintenance_date}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
