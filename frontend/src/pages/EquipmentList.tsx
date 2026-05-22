import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { equipmentApi } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import { Plus, Search, QrCode, ChevronRight, Pencil, X } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Equipment } from '../types'

const CRITICALITY_ICON: Record<string, string> = { high: '🔴', medium: '🟡', low: '🟢' }

const emptyForm = { code: '', name: '', brand: '', model: '', serial_number: '', location: '', area: '', status: 'active', criticality: 'medium', description: '' }

export default function EquipmentList() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [critFilter, setCritFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editEq, setEditEq] = useState<Equipment | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [editForm, setEditForm] = useState({ ...emptyForm })

  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ['equipment', search, statusFilter, critFilter],
    queryFn: () => equipmentApi.list({ search, status: statusFilter || undefined, criticality: critFilter || undefined }).then(r => r.data),
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => equipmentApi.listCategories().then(r => r.data),
  })

  const openEdit = (eq: Equipment) => {
    setEditEq(eq)
    setEditForm({
      code: eq.code,
      name: eq.name,
      brand: eq.brand || '',
      model: eq.model || '',
      serial_number: eq.serial_number || '',
      location: eq.location || '',
      area: eq.area || '',
      status: eq.status,
      criticality: eq.criticality,
      description: eq.description || '',
    })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await equipmentApi.create(form)
      toast.success('Equipo creado exitosamente')
      qc.invalidateQueries({ queryKey: ['equipment'] })
      setShowCreate(false)
      setForm({ ...emptyForm })
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error al crear equipo')
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editEq) return
    try {
      await equipmentApi.update(editEq.id, editForm)
      toast.success('Equipo actualizado')
      qc.invalidateQueries({ queryKey: ['equipment'] })
      setEditEq(null)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error al actualizar equipo')
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipos</h1>
          <p className="text-sm text-gray-500">{equipment.length} equipos registrados</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo Equipo
        </button>
      </div>

      <div className="card py-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Buscar por nombre, código, serie..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-44" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="in_maintenance">En Mantenimiento</option>
          <option value="inactive">Inactivo</option>
          <option value="decommissioned">Dado de Baja</option>
        </select>
        <select className="input w-40" value={critFilter} onChange={e => setCritFilter(e.target.value)}>
          <option value="">Criticidad</option>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full" /></div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-header">Código</th>
                <th className="table-header">Nombre</th>
                <th className="table-header">Marca / Modelo</th>
                <th className="table-header">Ubicación</th>
                <th className="table-header">Estado</th>
                <th className="table-header">Criticidad</th>
                <th className="table-header">Próx. Mant.</th>
                <th className="table-header">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {equipment.map((eq: Equipment) => (
                <tr key={eq.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/equipment/${eq.id}`)}>
                  <td className="table-cell font-mono text-xs font-semibold text-blue-700">{eq.code}</td>
                  <td className="table-cell">
                    <p className="font-medium text-gray-800">{eq.name}</p>
                    <p className="text-xs text-gray-400">{eq.area}</p>
                  </td>
                  <td className="table-cell text-gray-500">{[eq.brand, eq.model].filter(Boolean).join(' · ')}</td>
                  <td className="table-cell text-gray-500 text-xs">{eq.location}</td>
                  <td className="table-cell"><StatusBadge value={eq.status} /></td>
                  <td className="table-cell">
                    <span className="text-sm">{CRITICALITY_ICON[eq.criticality]} <StatusBadge value={eq.criticality} /></span>
                  </td>
                  <td className="table-cell">
                    {eq.next_maintenance ? (
                      <span className={`text-xs font-medium ${new Date(eq.next_maintenance) < new Date() ? 'text-red-600' : 'text-gray-600'}`}>
                        {new Date(eq.next_maintenance) < new Date() ? '⚠️ ' : ''}{eq.next_maintenance}
                      </span>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="table-cell" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="Ver QR"
                        onClick={() => window.open(equipmentApi.getQR(eq.id), '_blank')}>
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded hover:bg-yellow-50 text-yellow-600" title="Editar"
                        onClick={() => openEdit(eq)}>
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded hover:bg-gray-100 text-gray-600" title="Ver detalle"
                        onClick={() => navigate(`/equipment/${eq.id}`)}>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {equipment.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">No se encontraron equipos</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Crear */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Nuevo Equipo</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Código *</label><input className="input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required placeholder="EQ-001" /></div>
                <div><label className="label">Nombre *</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                <div><label className="label">Marca</label><input className="input" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} /></div>
                <div><label className="label">Modelo</label><input className="input" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} /></div>
                <div><label className="label">N° Serie</label><input className="input" value={form.serial_number} onChange={e => setForm({ ...form, serial_number: e.target.value })} /></div>
                <div><label className="label">Ubicación</label><input className="input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
                <div><label className="label">Área</label><input className="input" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} /></div>
                <div>
                  <label className="label">Estado</label>
                  <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="active">Activo</option><option value="inactive">Inactivo</option>
                    <option value="in_maintenance">En Mantenimiento</option><option value="decommissioned">Dado de Baja</option>
                  </select>
                </div>
                <div>
                  <label className="label">Criticidad</label>
                  <select className="input" value={form.criticality} onChange={e => setForm({ ...form, criticality: e.target.value })}>
                    <option value="high">Alta</option><option value="medium">Media</option><option value="low">Baja</option>
                  </select>
                </div>
              </div>
              <div><label className="label">Descripción</label><textarea className="input h-20 resize-none" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">Crear Equipo</button>
                <button type="button" className="btn-secondary flex-1" onClick={() => setShowCreate(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {editEq && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditEq(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">Editar Equipo</h2>
                <p className="text-sm text-gray-400 font-mono">{editEq.code}</p>
              </div>
              <button onClick={() => setEditEq(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Código *</label><input className="input" value={editForm.code} onChange={e => setEditForm({ ...editForm, code: e.target.value })} required /></div>
                <div><label className="label">Nombre *</label><input className="input" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required /></div>
                <div><label className="label">Marca</label><input className="input" value={editForm.brand} onChange={e => setEditForm({ ...editForm, brand: e.target.value })} /></div>
                <div><label className="label">Modelo</label><input className="input" value={editForm.model} onChange={e => setEditForm({ ...editForm, model: e.target.value })} /></div>
                <div><label className="label">N° Serie</label><input className="input" value={editForm.serial_number} onChange={e => setEditForm({ ...editForm, serial_number: e.target.value })} /></div>
                <div><label className="label">Ubicación</label><input className="input" value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} /></div>
                <div><label className="label">Área</label><input className="input" value={editForm.area} onChange={e => setEditForm({ ...editForm, area: e.target.value })} /></div>
                <div>
                  <label className="label">Estado</label>
                  <select className="input" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                    <option value="active">Activo</option><option value="inactive">Inactivo</option>
                    <option value="in_maintenance">En Mantenimiento</option><option value="decommissioned">Dado de Baja</option>
                  </select>
                </div>
                <div>
                  <label className="label">Criticidad</label>
                  <select className="input" value={editForm.criticality} onChange={e => setEditForm({ ...editForm, criticality: e.target.value })}>
                    <option value="high">Alta</option><option value="medium">Media</option><option value="low">Baja</option>
                  </select>
                </div>
              </div>
              <div><label className="label">Descripción</label><textarea className="input h-20 resize-none" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} /></div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">Guardar Cambios</button>
                <button type="button" className="btn-secondary flex-1" onClick={() => setEditEq(null)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
