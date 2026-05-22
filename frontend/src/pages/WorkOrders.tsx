import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { workOrdersApi, equipmentApi } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import { Plus, Search, Play, CheckCircle, ClipboardList } from 'lucide-react'
import toast from 'react-hot-toast'
import type { WorkOrder } from '../types'
import { reportsApi } from '../api/client'

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'border-l-red-600', high: 'border-l-orange-500',
  medium: 'border-l-yellow-400', low: 'border-l-green-400'
}

export default function WorkOrders() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showComplete, setShowComplete] = useState<WorkOrder | null>(null)
  const [form, setForm] = useState({ equipment_id: '', type: 'preventive', priority: 'medium', scheduled_date: '', description: '', technician_id: '' })
  const [completeForm, setCompleteForm] = useState({ findings: '', actions_taken: '', labor_hours: '0', labor_cost: '0', materials_cost: '0', downtime_hours: '0' })

  const { data: wos = [], isLoading } = useQuery({
    queryKey: ['work-orders', statusFilter, typeFilter],
    queryFn: () => workOrdersApi.list({ status: statusFilter || undefined, type: typeFilter || undefined }).then(r => r.data),
  })
  const { data: equipment = [] } = useQuery({ queryKey: ['equipment-all'], queryFn: () => equipmentApi.list({ limit: 500 }).then(r => r.data) })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await workOrdersApi.create({ ...form, equipment_id: Number(form.equipment_id), technician_id: form.technician_id ? Number(form.technician_id) : undefined })
      toast.success('Orden de trabajo creada')
      qc.invalidateQueries({ queryKey: ['work-orders'] })
      setShowCreate(false)
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Error') }
  }

  const handleStart = async (wo: WorkOrder) => {
    try {
      await workOrdersApi.start(wo.id)
      toast.success('Orden iniciada')
      qc.invalidateQueries({ queryKey: ['work-orders'] })
    } catch { toast.error('Error al iniciar') }
  }

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showComplete) return
    try {
      await workOrdersApi.complete(showComplete.id, {
        findings: completeForm.findings, actions_taken: completeForm.actions_taken,
        labor_hours: Number(completeForm.labor_hours), labor_cost: Number(completeForm.labor_cost),
        materials_cost: Number(completeForm.materials_cost), downtime_hours: Number(completeForm.downtime_hours),
      })
      toast.success('Orden completada — Hoja de vida actualizada automáticamente ✅')
      qc.invalidateQueries({ queryKey: ['work-orders'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
      setShowComplete(null)
    } catch { toast.error('Error al completar') }
  }

  const grouped = {
    pending: wos.filter((w: WorkOrder) => w.status === 'pending'),
    in_progress: wos.filter((w: WorkOrder) => w.status === 'in_progress'),
    completed: wos.filter((w: WorkOrder) => ['completed', 'cancelled', 'on_hold'].includes(w.status)),
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Órdenes de Trabajo</h1>
          <p className="text-sm text-gray-500">{wos.length} órdenes en total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => reportsApi.workOrders()} className="btn-secondary text-sm">Exportar Excel</button>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nueva OT
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card py-3 flex gap-3">
        <select className="input w-44" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option><option value="in_progress">En Progreso</option>
          <option value="completed">Completado</option><option value="on_hold">En Espera</option>
        </select>
        <select className="input w-40" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">Todos los tipos</option>
          <option value="preventive">Preventivo</option><option value="corrective">Correctivo</option>
          <option value="predictive">Predictivo</option>
        </select>
      </div>

      {/* Kanban-style columns */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {[
            { key: 'pending', label: 'Pendientes', color: 'bg-blue-100 text-blue-800', items: grouped.pending },
            { key: 'in_progress', label: 'En Progreso', color: 'bg-yellow-100 text-yellow-800', items: grouped.in_progress },
            { key: 'completed', label: 'Completadas', color: 'bg-green-100 text-green-800', items: grouped.completed },
          ].map(({ key, label, color, items }) => (
            <div key={key}>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-3 ${color}`}>
                <span className="w-4 h-4 bg-current rounded-full opacity-30" />
                {label} ({items.length})
              </div>
              <div className="space-y-3">
                {items.map((wo: WorkOrder) => (
                  <div key={wo.id} className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${PRIORITY_COLORS[wo.priority]} p-4`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-mono text-xs text-blue-700 font-semibold">{wo.order_number}</p>
                      <div className="flex gap-1 flex-wrap justify-end">
                        <StatusBadge value={wo.priority} />
                        <StatusBadge value={wo.type} />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-800 mb-1">
                      {wo.equipment?.name || `Equipo #${wo.equipment_id}`}
                    </p>
                    {wo.description && <p className="text-xs text-gray-500 mb-2 line-clamp-2">{wo.description}</p>}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">{wo.scheduled_date || 'Sin fecha'}</p>
                      <div className="flex gap-1">
                        {wo.status === 'pending' && (
                          <button onClick={() => handleStart(wo)}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors">
                            <Play className="w-3 h-3" /> Iniciar
                          </button>
                        )}
                        {wo.status === 'in_progress' && (
                          <button onClick={() => { setShowComplete(wo); setCompleteForm({ findings: '', actions_taken: '', labor_hours: '0', labor_cost: '0', materials_cost: '0', downtime_hours: '0' }) }}
                            className="flex items-center gap-1 text-xs text-green-600 hover:bg-green-50 px-2 py-1 rounded-lg transition-colors">
                            <CheckCircle className="w-3 h-3" /> Completar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="bg-gray-50 rounded-xl p-6 text-center text-xs text-gray-400">Sin órdenes</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100"><h2 className="text-lg font-semibold">Nueva Orden de Trabajo</h2></div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="label">Equipo *</label>
                <select className="input" value={form.equipment_id} onChange={e => setForm({...form, equipment_id: e.target.value})} required>
                  <option value="">Seleccionar equipo...</option>
                  {equipment.map((eq: any) => <option key={eq.id} value={eq.id}>{eq.code} - {eq.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Tipo</label>
                  <select className="input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    <option value="preventive">Preventivo</option><option value="corrective">Correctivo</option>
                    <option value="predictive">Predictivo</option><option value="inspection">Inspección</option>
                  </select>
                </div>
                <div>
                  <label className="label">Prioridad</label>
                  <select className="input" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                    <option value="critical">Crítica</option><option value="high">Alta</option>
                    <option value="medium">Media</option><option value="low">Baja</option>
                  </select>
                </div>
                <div>
                  <label className="label">Fecha Programada</label>
                  <input type="date" className="input" value={form.scheduled_date} onChange={e => setForm({...form, scheduled_date: e.target.value})} />
                </div>
              </div>
              <div><label className="label">Descripción</label><textarea className="input h-20 resize-none" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">Crear OT</button>
                <button type="button" className="btn-secondary flex-1" onClick={() => setShowCreate(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {showComplete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold">Completar Orden: {showComplete.order_number}</h2>
              <p className="text-sm text-gray-500 mt-1">Al completar se actualizará automáticamente la hoja de vida del equipo</p>
            </div>
            <form onSubmit={handleComplete} className="p-6 space-y-4">
              <div><label className="label">Hallazgos</label><textarea className="input h-24 resize-none" value={completeForm.findings} onChange={e => setCompleteForm({...completeForm, findings: e.target.value})} placeholder="Describe lo encontrado..." /></div>
              <div><label className="label">Acciones Realizadas</label><textarea className="input h-24 resize-none" value={completeForm.actions_taken} onChange={e => setCompleteForm({...completeForm, actions_taken: e.target.value})} placeholder="Describe las acciones tomadas..." /></div>
              <div className="grid grid-cols-2 gap-4">
                {[['Horas Labor', 'labor_hours'], ['Costo Labor ($)', 'labor_cost'], ['Costo Materiales ($)', 'materials_cost'], ['Horas Parada', 'downtime_hours']].map(([label, key]) => (
                  <div key={key}>
                    <label className="label">{label}</label>
                    <input type="number" step="0.1" min="0" className="input" value={(completeForm as any)[key]} onChange={e => setCompleteForm({...completeForm, [key]: e.target.value})} />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4" /> Completar y Guardar</button>
                <button type="button" className="btn-secondary flex-1" onClick={() => setShowComplete(null)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
