import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { equipmentApi, lifecycleApi, workOrdersApi, reportsApi } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import { ArrowLeft, QrCode, BookOpen, Download, Wrench, Calendar, DollarSign, Package, AlertTriangle, CheckCircle, Camera } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EquipmentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const eqId = Number(id)
  const [activeTab, setActiveTab] = useState<'info' | 'tools'>('info')
  const photoInputRef = useRef<HTMLInputElement>(null)

  const { data: eq, isLoading } = useQuery({ queryKey: ['equipment', eqId], queryFn: () => equipmentApi.get(eqId).then(r => r.data) })
  const { data: summary } = useQuery({ queryKey: ['lifecycle-summary', eqId], queryFn: () => lifecycleApi.getSummary(eqId).then(r => r.data) })
  const { data: wos = [] } = useQuery({ queryKey: ['wo-by-eq', eqId], queryFn: () => workOrdersApi.list({ equipment_id: eqId, limit: 5 }).then(r => r.data) })
  const { data: toolsNeeded } = useQuery({
    queryKey: ['tools-needed', eqId],
    queryFn: () => equipmentApi.getToolsNeeded(eqId).then(r => r.data),
    enabled: activeTab === 'tools',
  })

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await equipmentApi.uploadPhoto(eqId, file)
      toast.success('Foto actualizada')
      qc.invalidateQueries({ queryKey: ['equipment', eqId] })
    } catch {
      toast.error('Error al subir la foto')
    }
    e.target.value = ''
  }

  if (isLoading) return <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>
  if (!eq) return <div className="p-6 text-gray-500">Equipo no encontrado</div>

  const specs = eq.technical_specs ? JSON.parse(eq.technical_specs) : null
  const photoUrl = eq.image_url ? equipmentApi.getPhotoUrl(eq.image_url) : null

  return (
    <div className="p-6 space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-secondary p-2"><ArrowLeft className="w-4 h-4" /></button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{eq.name}</h1>
            <StatusBadge value={eq.status} size="md" />
            <StatusBadge value={eq.criticality} size="md" />
          </div>
          <p className="text-sm text-gray-500 font-mono">{eq.code}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.open(equipmentApi.getQR(eqId), '_blank')} className="btn-secondary flex items-center gap-2 text-sm">
            <QrCode className="w-4 h-4" /> QR
          </button>
          <button onClick={() => reportsApi.lifecycle(eqId)} className="btn-secondary flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" /> Hoja de Vida
          </button>
          <button onClick={() => navigate(`/lifecycle/${eqId}`)} className="btn-primary flex items-center gap-2 text-sm">
            <BookOpen className="w-4 h-4" /> Ver Historial
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'info' ? 'bg-white border border-b-white border-gray-200 text-blue-700 -mb-px' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Información General
        </button>
        <button
          onClick={() => setActiveTab('tools')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'tools' ? 'bg-white border border-b-white border-gray-200 text-blue-700 -mb-px' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Wrench className="w-4 h-4" /> Herramientas y Materiales
        </button>
      </div>

      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Info Card */}
          <div className="card lg:col-span-2 space-y-4">
            <h3 className="font-semibold text-gray-800">Información Técnica</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Marca', eq.brand], ['Modelo', eq.model], ['N° Serie', eq.serial_number],
                ['Ubicación', eq.location], ['Área', eq.area], ['Categoría', eq.category_obj?.name],
                ['F. Compra', eq.purchase_date], ['F. Instalación', eq.installation_date],
                ['Garantía', eq.warranty_expiry],
              ].map(([label, val]) => (
                <div key={label as string}>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">{label}</p>
                  <p className="font-medium text-gray-800">{val || '—'}</p>
                </div>
              ))}
            </div>
            {specs && (
              <>
                <hr className="border-gray-100" />
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Especificaciones</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(specs).map(([k, v]) => (
                      <div key={k} className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-400 capitalize">{k.replace(/_/g, ' ')}</p>
                        <p className="text-sm font-medium">{String(v)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            {eq.description && (
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Descripción</p>
                <p className="text-sm text-gray-700">{eq.description}</p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="space-y-4">
            {/* Equipment photo */}
            <div className="card p-0 overflow-hidden">
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              {photoUrl ? (
                <div className="relative group">
                  <img src={photoUrl} alt={eq.name} className="w-full h-48 object-cover" />
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-sm font-medium"
                  >
                    <Camera className="w-5 h-5" /> Cambiar foto
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => photoInputRef.current?.click()}
                  className="w-full h-40 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors border-2 border-dashed border-gray-200 rounded-xl"
                >
                  <Camera className="w-8 h-8" />
                  <span className="text-sm font-medium">Agregar foto del equipo</span>
                  <span className="text-xs text-gray-400">JPG, PNG o WebP</span>
                </button>
              )}
            </div>

            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-3">Resumen de Mantenimiento</h3>
              <div className="space-y-3">
                {[
                  { icon: Wrench, label: 'Total Intervenciones', value: summary?.total_maintenances || 0 },
                  { icon: DollarSign, label: 'Costo Total', value: `$${(summary?.total_cost || 0).toLocaleString()}` },
                  { icon: Calendar, label: 'Último Mant.', value: eq.last_maintenance || '—' },
                  { icon: Calendar, label: 'Próximo Mant.', value: eq.next_maintenance || '—' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Icon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="text-sm font-semibold text-gray-800">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">Últimas OTs</h3>
                <button onClick={() => navigate(`/work-orders?equipment_id=${eqId}`)} className="text-xs text-blue-600 hover:underline">Ver todas</button>
              </div>
              <div className="space-y-2">
                {wos.length === 0 && <p className="text-xs text-gray-400">Sin órdenes de trabajo</p>}
                {wos.slice(0, 4).map((wo: any) => (
                  <div key={wo.id} className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-mono text-blue-700">{wo.order_number}</p>
                      <p className="text-gray-400">{wo.scheduled_date}</p>
                    </div>
                    <div className="flex gap-1">
                      <StatusBadge value={wo.type} />
                      <StatusBadge value={wo.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tools' && (
        <div className="space-y-5">
          {!toolsNeeded ? (
            <div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full" /></div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="card text-center">
                  <p className="text-2xl font-bold text-blue-700">{toolsNeeded.total_plans}</p>
                  <p className="text-xs text-gray-500 mt-1">Planes activos</p>
                </div>
                <div className="card text-center">
                  <p className="text-2xl font-bold text-purple-700">{toolsNeeded.tools?.length || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Herramientas requeridas</p>
                </div>
                <div className="card text-center">
                  <p className="text-2xl font-bold text-green-700">{toolsNeeded.consumables?.length || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Insumos requeridos</p>
                </div>
              </div>

              {/* Tools Table */}
              <div className="card p-0 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-gray-800">Herramientas Necesarias</h3>
                </div>
                {toolsNeeded.tools?.length === 0 ? (
                  <p className="text-center py-8 text-gray-400 text-sm">No hay herramientas asignadas a los planes de mantenimiento</p>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="table-header">Herramienta</th>
                        <th className="table-header">Categoría</th>
                        <th className="table-header">Cantidad</th>
                        <th className="table-header">Condición</th>
                        <th className="table-header">Ubicación</th>
                        <th className="table-header">Calibración</th>
                        <th className="table-header">Planes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {toolsNeeded.tools?.map((t: any) => (
                        <tr key={t.tool_id} className="hover:bg-gray-50">
                          <td className="table-cell">
                            <p className="font-medium text-gray-800">{t.name}</p>
                            <p className="text-xs text-gray-400 font-mono">{t.code}</p>
                          </td>
                          <td className="table-cell text-gray-500 text-sm">{t.category}</td>
                          <td className="table-cell">
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold">{t.quantity}</span>
                          </td>
                          <td className="table-cell">
                            <span className={`badge ${t.condition === 'good' ? 'bg-green-100 text-green-700' : t.condition === 'fair' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                              {t.condition === 'good' ? 'Buena' : t.condition === 'fair' ? 'Regular' : t.condition === 'poor' ? 'Mala' : t.condition || '—'}
                            </span>
                          </td>
                          <td className="table-cell text-gray-500 text-sm">{t.location || '—'}</td>
                          <td className="table-cell">
                            {t.requires_calibration ? (
                              <span className="flex items-center gap-1 text-xs text-orange-600"><AlertTriangle className="w-3 h-3" /> Requiere</span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-gray-400"><CheckCircle className="w-3 h-3" /> No req.</span>
                            )}
                          </td>
                          <td className="table-cell">
                            <div className="flex flex-wrap gap-1">
                              {t.plans?.map((p: string) => (
                                <span key={p} className="bg-purple-50 text-purple-700 text-xs px-1.5 py-0.5 rounded">{p}</span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Consumables Table */}
              <div className="card p-0 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                  <Package className="w-4 h-4 text-green-600" />
                  <h3 className="font-semibold text-gray-800">Insumos y Materiales</h3>
                </div>
                {toolsNeeded.consumables?.length === 0 ? (
                  <p className="text-center py-8 text-gray-400 text-sm">No hay insumos asignados a los planes de mantenimiento</p>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="table-header">Insumo</th>
                        <th className="table-header">Categoría</th>
                        <th className="table-header">Cant. por Mant.</th>
                        <th className="table-header">Stock Actual</th>
                        <th className="table-header">Stock Mínimo</th>
                        <th className="table-header">Disponibilidad</th>
                        <th className="table-header">Planes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {toolsNeeded.consumables?.map((c: any) => (
                        <tr key={c.consumable_id} className="hover:bg-gray-50">
                          <td className="table-cell">
                            <p className="font-medium text-gray-800">{c.name}</p>
                            <p className="text-xs text-gray-400 font-mono">{c.code}</p>
                          </td>
                          <td className="table-cell text-gray-500 text-sm">{c.category}</td>
                          <td className="table-cell">
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold">{c.quantity_per_maintenance} {c.unit}</span>
                          </td>
                          <td className="table-cell">
                            <span className={`font-semibold text-sm ${c.stock_quantity <= c.min_stock ? 'text-red-600' : 'text-gray-800'}`}>
                              {c.stock_quantity} {c.unit}
                            </span>
                          </td>
                          <td className="table-cell text-gray-500 text-sm">{c.min_stock} {c.unit}</td>
                          <td className="table-cell">
                            {c.stock_ok ? (
                              <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full w-fit">
                                <CheckCircle className="w-3 h-3" /> Suficiente
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-red-700 bg-red-50 px-2 py-0.5 rounded-full w-fit">
                                <AlertTriangle className="w-3 h-3" /> Insuficiente
                              </span>
                            )}
                          </td>
                          <td className="table-cell">
                            <div className="flex flex-wrap gap-1">
                              {c.plans?.map((p: string) => (
                                <span key={p} className="bg-green-50 text-green-700 text-xs px-1.5 py-0.5 rounded">{p}</span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
