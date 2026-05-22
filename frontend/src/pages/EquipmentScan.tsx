import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api, { equipmentApi, workOrdersApi } from '../api/client'
import { Wrench, ClipboardList, CheckCircle, AlertTriangle, ArrowLeft, Calendar, DollarSign, Camera } from 'lucide-react'
import toast from 'react-hot-toast'

const TYPE_LABELS: Record<string, string> = {
  preventive: 'Preventivo', corrective: 'Correctivo', predictive: 'Predictivo',
  lubrication: 'Lubricación', calibration: 'Calibración', inspection: 'Inspección',
}
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  in_maintenance: 'bg-yellow-100 text-yellow-700',
  inactive: 'bg-gray-100 text-gray-500',
  decommissioned: 'bg-red-100 text-red-700',
}
const STATUS_LABELS: Record<string, string> = {
  active: 'Activo', in_maintenance: 'En Mantenimiento',
  inactive: 'Inactivo', decommissioned: 'Dado de Baja',
}

interface ReportForm {
  type: string
  description: string
  findings: string
  actions_taken: string
  labor_hours: string
  materials_cost: string
  labor_cost: string
}

const emptyForm: ReportForm = {
  type: 'preventive', description: '', findings: '',
  actions_taken: '', labor_hours: '0', materials_cost: '0', labor_cost: '0',
}

export default function EquipmentScan() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const eqId = Number(id)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<ReportForm>({ ...emptyForm })
  const [submitting, setSubmitting] = useState(false)

  const photoInputRef = useRef<HTMLInputElement>(null)
  const token = localStorage.getItem('token')
  const currentUser = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null } })()

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await equipmentApi.uploadPhoto(eqId, file)
      toast.success('Foto guardada')
      qc.invalidateQueries({ queryKey: ['equipment', eqId] })
    } catch {
      toast.error('Error al subir la foto')
    }
    e.target.value = ''
  }

  const { data: eq, isLoading } = useQuery({
    queryKey: ['equipment', eqId],
    queryFn: () => equipmentApi.get(eqId).then(r => r.data),
  })
  const { data: wos = [] } = useQuery({
    queryKey: ['wo-scan', eqId],
    queryFn: () => workOrdersApi.list({ equipment_id: eqId, status: 'pending' }).then(r => r.data),
    enabled: !!token,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) { navigate('/login'); return }
    setSubmitting(true)
    try {
      await api.post(`/lifecycle/${eqId}/register`, {
        type: form.type,
        description: form.description,
        findings: form.findings,
        actions_taken: form.actions_taken,
        labor_hours: Number(form.labor_hours),
        labor_cost: Number(form.labor_cost),
        materials_cost: Number(form.materials_cost),
      })
      toast.success('Actividad registrada en la hoja de vida')
      qc.invalidateQueries({ queryKey: ['wo-scan', eqId] })
      setShowForm(false)
      setForm({ ...emptyForm })
    } catch {
      toast.error('Error al registrar. Verifica tu sesión.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center">
          <Wrench className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Acceso requerido</h2>
          <p className="text-gray-500 text-sm mb-6">Inicia sesión para registrar actividades de mantenimiento</p>
          <button onClick={() => navigate('/login', { state: { redirect: `/scan/${eqId}` } })}
            className="btn-primary w-full">Iniciar Sesión</button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!eq) return <div className="p-6 text-gray-500">Equipo no encontrado</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-700 text-white p-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg bg-blue-800/50 hover:bg-blue-800">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <p className="text-xs text-blue-200 font-mono">{eq.code}</p>
          <h1 className="font-bold text-lg leading-tight">{eq.name}</h1>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[eq.status] || 'bg-gray-100 text-gray-600'}`}>
          {STATUS_LABELS[eq.status] || eq.status}
        </span>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Equipment photo */}
        <input ref={photoInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
        {eq.image_url ? (
          <div className="relative rounded-2xl overflow-hidden shadow-sm">
            <img
              src={equipmentApi.getPhotoUrl(eq.image_url) || ''}
              alt={eq.name}
              className="w-full h-48 object-cover"
            />
            <button
              onClick={() => photoInputRef.current?.click()}
              className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" /> Cambiar foto
            </button>
          </div>
        ) : (
          <button
            onClick={() => photoInputRef.current?.click()}
            className="w-full bg-white rounded-2xl shadow-sm h-28 flex flex-col items-center justify-center gap-2 text-gray-400 border-2 border-dashed border-gray-200"
          >
            <Camera className="w-7 h-7" />
            <span className="text-sm font-medium">Tomar foto del equipo</span>
          </button>
        )}

        {/* Equipment info card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Marca', eq.brand], ['Modelo', eq.model],
              ['Ubicación', eq.location], ['Área', eq.area],
              ['Último Mant.', eq.last_maintenance || '—'],
              ['Próximo Mant.', eq.next_maintenance || '—'],
            ].map(([label, val]) => (
              <div key={label as string}>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="font-medium text-gray-800 text-sm">{val || '—'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pending work orders */}
        {wos.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <p className="text-sm font-semibold text-yellow-800">{wos.length} orden(es) pendiente(s)</p>
            </div>
            {wos.slice(0, 3).map((wo: any) => (
              <div key={wo.id} className="flex items-center justify-between text-sm py-1.5 border-b border-yellow-100 last:border-0">
                <div>
                  <p className="font-mono text-xs text-yellow-700">{wo.order_number}</p>
                  <p className="text-gray-600 text-xs">{wo.description}</p>
                </div>
                <span className="text-xs text-yellow-600">{wo.scheduled_date}</span>
              </div>
            ))}
          </div>
        )}

        {/* Main action button */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-5 flex items-center gap-4 shadow-lg transition-colors"
          >
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="font-bold text-lg">Registrar Actividad</p>
              <p className="text-blue-200 text-sm">Diligenciar hoja de vida del equipo</p>
            </div>
          </button>
        ) : (
          /* Activity form */
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-blue-600 text-white p-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              <h2 className="font-semibold">Registro de Actividad</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="label">Tipo de Mantenimiento *</label>
                <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Descripción del trabajo *</label>
                <textarea className="input h-20 resize-none text-sm"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Ej: PM mensual caldera - limpieza tubos y análisis combustión"
                  required />
              </div>
              <div>
                <label className="label">Hallazgos / Observaciones</label>
                <textarea className="input h-20 resize-none text-sm"
                  value={form.findings}
                  onChange={e => setForm({ ...form, findings: e.target.value })}
                  placeholder="Ej: Tubos con depósito leve, pH agua 10.2, válvulas OK..." />
              </div>
              <div>
                <label className="label">Acciones realizadas *</label>
                <textarea className="input h-20 resize-none text-sm"
                  value={form.actions_taken}
                  onChange={e => setForm({ ...form, actions_taken: e.target.value })}
                  placeholder="Ej: Limpieza tubos, dosificación antiincrustante, cambio empaque..."
                  required />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label flex items-center gap-1"><Calendar className="w-3 h-3" /> Horas</label>
                  <input type="number" min="0" step="0.5" className="input" value={form.labor_hours}
                    onChange={e => setForm({ ...form, labor_hours: e.target.value })} />
                </div>
                <div>
                  <label className="label flex items-center gap-1"><DollarSign className="w-3 h-3" /> Mano obra</label>
                  <input type="number" min="0" step="0.01" className="input" value={form.labor_cost}
                    onChange={e => setForm({ ...form, labor_cost: e.target.value })} />
                </div>
                <div>
                  <label className="label flex items-center gap-1"><DollarSign className="w-3 h-3" /> Materiales</label>
                  <input type="number" min="0" step="0.01" className="input" value={form.materials_cost}
                    onChange={e => setForm({ ...form, materials_cost: e.target.value })} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                  <CheckCircle className="w-5 h-5" />
                  {submitting ? 'Guardando...' : 'Guardar en Hoja de Vida'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* View full detail */}
        <button onClick={() => navigate(`/equipment/${eqId}`)}
          className="w-full text-center text-sm text-blue-600 hover:underline py-2">
          Ver hoja de vida completa →
        </button>
      </div>
    </div>
  )
}
