import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { inventoryApi } from '../api/client'
import { Plus, Search, AlertTriangle, Package, Wrench, RefreshCw, Pencil, X } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Consumable, Tool, SparePart } from '../types'

type Tab = 'consumables' | 'tools' | 'spare_parts'

const EMPTY_C = { name: '', code: '', category: '', unit: 'unidad', stock_quantity: '0', min_stock: '0', max_stock: '0', unit_cost: '0', supplier: '', supplier_contact: '', location: '' }
const EMPTY_T = { name: '', code: '', category: '', quantity_available: '1', location: '', condition: 'good', requires_calibration: false, description: '' }
const EMPTY_P = { name: '', code: '', part_number: '', brand: '', stock_quantity: '0', min_stock: '0', unit_cost: '0', supplier: '', location: '', description: '' }

export default function Inventory() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('consumables')
  const [search, setSearch] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)

  // Create/Edit state
  const [showCreate, setShowCreate] = useState(false)
  const [editItem, setEditItem] = useState<Consumable | Tool | SparePart | null>(null)
  const [restockId, setRestockId] = useState<number | null>(null)
  const [restockQty, setRestockQty] = useState('')

  const [cForm, setCForm] = useState({ ...EMPTY_C })
  const [tForm, setTForm] = useState({ ...EMPTY_T })
  const [pForm, setPForm] = useState({ ...EMPTY_P })

  const { data: consumables = [] } = useQuery({ queryKey: ['consumables', search, lowStockOnly], queryFn: () => inventoryApi.listConsumables({ search, low_stock: lowStockOnly }).then(r => r.data) })
  const { data: tools = [] } = useQuery({ queryKey: ['tools', search], queryFn: () => inventoryApi.listTools({ search }).then(r => r.data) })
  const { data: parts = [] } = useQuery({ queryKey: ['spare-parts', search], queryFn: () => inventoryApi.listSpareParts({ search }).then(r => r.data) })
  const { data: summary } = useQuery({ queryKey: ['inventory-summary'], queryFn: () => inventoryApi.summary().then(r => r.data) })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['consumables'] })
    qc.invalidateQueries({ queryKey: ['tools'] })
    qc.invalidateQueries({ queryKey: ['spare-parts'] })
    qc.invalidateQueries({ queryKey: ['inventory-summary'] })
  }

  // ─── OPEN EDIT ───────────────────────────────────────────────────────────
  const openEdit = (item: any) => {
    setEditItem(item)
    if (tab === 'consumables') {
      setCForm({
        name: item.name || '', code: item.code || '', category: item.category || '',
        unit: item.unit || 'unidad', stock_quantity: String(item.stock_quantity ?? 0),
        min_stock: String(item.min_stock ?? 0), max_stock: String(item.max_stock ?? 0),
        unit_cost: String(item.unit_cost ?? 0), supplier: item.supplier || '',
        supplier_contact: item.supplier_contact || '', location: item.location || '',
      })
    } else if (tab === 'tools') {
      setTForm({
        name: item.name || '', code: item.code || '', category: item.category || '',
        quantity_available: String(item.quantity_available ?? 1),
        location: item.location || '', condition: item.condition || 'good',
        requires_calibration: item.requires_calibration || false,
        description: item.description || '',
      })
    } else {
      setPForm({
        name: item.name || '', code: item.code || '', part_number: item.part_number || '',
        brand: item.brand || '', stock_quantity: String(item.stock_quantity ?? 0),
        min_stock: String(item.min_stock ?? 0), unit_cost: String(item.unit_cost ?? 0),
        supplier: item.supplier || '', location: item.location || '', description: item.description || '',
      })
    }
  }

  const clearForms = () => {
    setShowCreate(false); setEditItem(null)
    setCForm({ ...EMPTY_C }); setTForm({ ...EMPTY_T }); setPForm({ ...EMPTY_P })
  }

  // ─── SUBMIT HANDLERS ─────────────────────────────────────────────────────
  const handleConsumable = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = { ...cForm, stock_quantity: Number(cForm.stock_quantity), min_stock: Number(cForm.min_stock), max_stock: Number(cForm.max_stock), unit_cost: Number(cForm.unit_cost) }
    try {
      if (editItem) {
        await inventoryApi.updateConsumable((editItem as Consumable).id, data)
        toast.success('Insumo actualizado')
      } else {
        await inventoryApi.createConsumable(data)
        toast.success('Insumo creado')
      }
      invalidate(); clearForms()
    } catch { toast.error('Error al guardar') }
  }

  const handleTool = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = { ...tForm, quantity_available: Number(tForm.quantity_available) }
    try {
      if (editItem) {
        await inventoryApi.updateTool((editItem as Tool).id, data)
        toast.success('Herramienta actualizada')
      } else {
        await inventoryApi.createTool(data)
        toast.success('Herramienta creada')
      }
      invalidate(); clearForms()
    } catch { toast.error('Error al guardar') }
  }

  const handleSparePart = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = { ...pForm, stock_quantity: Number(pForm.stock_quantity), min_stock: Number(pForm.min_stock), unit_cost: Number(pForm.unit_cost) }
    try {
      if (editItem) {
        await inventoryApi.updateSparePart((editItem as SparePart).id, data)
        toast.success('Repuesto actualizado')
      } else {
        await inventoryApi.createSparePart(data)
        toast.success('Repuesto creado')
      }
      invalidate(); clearForms()
    } catch { toast.error('Error al guardar') }
  }

  const handleRestock = async () => {
    if (!restockId || !restockQty) return
    try {
      await inventoryApi.restock(restockId, Number(restockQty))
      toast.success('Stock actualizado')
      invalidate(); setRestockId(null); setRestockQty('')
    } catch { toast.error('Error al actualizar stock') }
  }

  const tabs: { key: Tab; label: string; icon: React.ElementType; count: number }[] = [
    { key: 'consumables', label: 'Insumos', icon: Package, count: summary?.total_consumables || 0 },
    { key: 'tools', label: 'Herramientas', icon: Wrench, count: summary?.total_tools || 0 },
    { key: 'spare_parts', label: 'Repuestos', icon: RefreshCw, count: summary?.total_spare_parts || 0 },
  ]

  const isEditing = !!editItem
  const showModal = showCreate || isEditing

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
          {(summary?.low_stock_consumables > 0 || summary?.low_stock_parts > 0) && (
            <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3 h-3" />
              {(summary?.low_stock_consumables || 0) + (summary?.low_stock_parts || 0)} ítems con stock bajo
            </p>
          )}
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {tab === 'consumables' ? 'Nuevo Insumo' : tab === 'tools' ? 'Nueva Herramienta' : 'Nuevo Repuesto'}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Herramientas', value: summary?.total_tools || 0, color: 'bg-blue-50 text-blue-700' },
          { label: 'Insumos', value: summary?.total_consumables || 0, color: 'bg-green-50 text-green-700' },
          { label: 'Stock Bajo Ins.', value: summary?.low_stock_consumables || 0, color: summary?.low_stock_consumables > 0 ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-500' },
          { label: 'Repuestos', value: summary?.total_spare_parts || 0, color: 'bg-purple-50 text-purple-700' },
          { label: 'Stock Bajo Rep.', value: summary?.low_stock_parts || 0, color: summary?.low_stock_parts > 0 ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-500' },
          { label: 'Calib. Vencida', value: summary?.calibration_due || 0, color: summary?.calibration_due > 0 ? 'bg-orange-50 text-orange-700' : 'bg-gray-50 text-gray-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl p-3 text-center ${color}`}>
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            <Icon className="w-4 h-4" /> {label}
            <span className="bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">{count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {tab === 'consumables' && (
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
            <input type="checkbox" checked={lowStockOnly} onChange={e => setLowStockOnly(e.target.checked)} className="rounded" />
            Solo stock bajo
          </label>
        )}
      </div>

      {/* ─── CONSUMABLES TABLE ─────────────────────────────────────────────── */}
      {tab === 'consumables' && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-header">Código</th>
                <th className="table-header">Nombre</th>
                <th className="table-header">Categoría</th>
                <th className="table-header">Stock</th>
                <th className="table-header">Mín.</th>
                <th className="table-header">Costo Unit.</th>
                <th className="table-header">Proveedor</th>
                <th className="table-header">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {consumables.map((c: Consumable) => {
                const isLow = c.stock_quantity <= c.min_stock
                return (
                  <tr key={c.id} className={isLow ? 'bg-red-50' : 'hover:bg-gray-50'}>
                    <td className="table-cell font-mono text-xs">{c.code || '—'}</td>
                    <td className="table-cell font-medium">
                      {c.name} {isLow && <AlertTriangle className="w-3 h-3 text-red-500 inline ml-1" />}
                    </td>
                    <td className="table-cell text-xs text-gray-500">{c.category}</td>
                    <td className="table-cell">
                      <span className={`font-semibold ${isLow ? 'text-red-600' : 'text-gray-800'}`}>
                        {c.stock_quantity} {c.unit}
                      </span>
                    </td>
                    <td className="table-cell text-gray-400 text-xs">{c.min_stock} {c.unit}</td>
                    <td className="table-cell">${c.unit_cost}</td>
                    <td className="table-cell text-xs text-gray-400">{c.supplier}</td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(c)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg">
                          <Pencil className="w-3 h-3" /> Editar
                        </button>
                        <button onClick={() => { setRestockId(c.id); setRestockQty('') }}
                          className="flex items-center gap-1 text-xs text-green-600 hover:bg-green-50 px-2 py-1 rounded-lg">
                          <Plus className="w-3 h-3" /> Stock
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {consumables.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-gray-400">Sin insumos</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── TOOLS TABLE ───────────────────────────────────────────────────── */}
      {tab === 'tools' && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-header">Código</th>
                <th className="table-header">Nombre</th>
                <th className="table-header">Categoría</th>
                <th className="table-header">Disponibles</th>
                <th className="table-header">Ubicación</th>
                <th className="table-header">Estado</th>
                <th className="table-header">Calibración</th>
                <th className="table-header">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tools.map((t: Tool) => {
                const calibDue = t.requires_calibration && t.next_calibration && new Date(t.next_calibration) <= new Date()
                return (
                  <tr key={t.id} className={calibDue ? 'bg-orange-50' : 'hover:bg-gray-50'}>
                    <td className="table-cell font-mono text-xs">{t.code || '—'}</td>
                    <td className="table-cell font-medium">{t.name}</td>
                    <td className="table-cell text-xs text-gray-500">{t.category}</td>
                    <td className="table-cell font-semibold">{t.quantity_available}</td>
                    <td className="table-cell text-xs text-gray-400">{t.location}</td>
                    <td className="table-cell">
                      <span className={`badge text-xs ${t.condition === 'good' ? 'bg-green-100 text-green-700' : t.condition === 'fair' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {t.condition === 'good' ? 'Bueno' : t.condition === 'fair' ? 'Regular' : 'Requiere reparación'}
                      </span>
                    </td>
                    <td className="table-cell text-xs">
                      {t.requires_calibration
                        ? <span className={calibDue ? 'text-red-600 font-medium' : 'text-gray-500'}>{calibDue ? '⚠ ' : ''}{t.next_calibration || 'N/A'}</span>
                        : <span className="text-gray-300">No requiere</span>}
                    </td>
                    <td className="table-cell">
                      <button onClick={() => openEdit(t)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg">
                        <Pencil className="w-3 h-3" /> Editar
                      </button>
                    </td>
                  </tr>
                )
              })}
              {tools.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-gray-400">Sin herramientas</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── SPARE PARTS TABLE ─────────────────────────────────────────────── */}
      {tab === 'spare_parts' && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-header">Código</th>
                <th className="table-header">Nombre</th>
                <th className="table-header">N° Parte</th>
                <th className="table-header">Marca</th>
                <th className="table-header">Stock</th>
                <th className="table-header">Mín.</th>
                <th className="table-header">Costo</th>
                <th className="table-header">Proveedor</th>
                <th className="table-header">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {parts.map((p: SparePart) => {
                const isLow = p.stock_quantity <= p.min_stock
                return (
                  <tr key={p.id} className={isLow ? 'bg-red-50' : 'hover:bg-gray-50'}>
                    <td className="table-cell font-mono text-xs">{p.code || '—'}</td>
                    <td className="table-cell font-medium">
                      {p.name} {isLow && <AlertTriangle className="w-3 h-3 text-red-500 inline ml-1" />}
                    </td>
                    <td className="table-cell text-xs font-mono">{p.part_number}</td>
                    <td className="table-cell text-xs">{p.brand}</td>
                    <td className="table-cell"><span className={`font-semibold ${isLow ? 'text-red-600' : ''}`}>{p.stock_quantity}</span></td>
                    <td className="table-cell text-xs text-gray-400">{p.min_stock}</td>
                    <td className="table-cell">${p.unit_cost}</td>
                    <td className="table-cell text-xs text-gray-400">{p.supplier}</td>
                    <td className="table-cell">
                      <button onClick={() => openEdit(p)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg">
                        <Pencil className="w-3 h-3" /> Editar
                      </button>
                    </td>
                  </tr>
                )
              })}
              {parts.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-gray-400">Sin repuestos</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── RESTOCK MODAL ─────────────────────────────────────────────────── */}
      {restockId !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Reabastecer Insumo</h3>
              <button onClick={() => { setRestockId(null); setRestockQty('') }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <label className="label">Cantidad a agregar</label>
            <input type="number" min="0" step="0.1" className="input mb-4" value={restockQty}
              onChange={e => setRestockQty(e.target.value)} placeholder="0" autoFocus />
            <div className="flex gap-3">
              <button onClick={handleRestock} className="btn-primary flex-1">Actualizar Stock</button>
              <button onClick={() => { setRestockId(null); setRestockQty('') }} className="btn-secondary flex-1">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CREATE / EDIT MODAL ───────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                {isEditing ? 'Editar' : 'Nuevo'} {tab === 'consumables' ? 'Insumo' : tab === 'tools' ? 'Herramienta' : 'Repuesto'}
              </h2>
              <button onClick={clearForms} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">

              {/* CONSUMABLE FORM */}
              {tab === 'consumables' && (
                <form onSubmit={handleConsumable} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="label">Nombre *</label><input className="input" value={cForm.name} onChange={e => setCForm({ ...cForm, name: e.target.value })} required /></div>
                    <div><label className="label">Código</label><input className="input" value={cForm.code} onChange={e => setCForm({ ...cForm, code: e.target.value })} /></div>
                    <div><label className="label">Categoría</label><input className="input" value={cForm.category} onChange={e => setCForm({ ...cForm, category: e.target.value })} placeholder="Lubricantes, Filtros..." /></div>
                    <div><label className="label">Unidad de Medida</label><input className="input" value={cForm.unit} onChange={e => setCForm({ ...cForm, unit: e.target.value })} /></div>
                    <div><label className="label">Stock Actual</label><input type="number" step="0.1" className="input" value={cForm.stock_quantity} onChange={e => setCForm({ ...cForm, stock_quantity: e.target.value })} /></div>
                    <div><label className="label">Stock Mínimo</label><input type="number" step="0.1" className="input" value={cForm.min_stock} onChange={e => setCForm({ ...cForm, min_stock: e.target.value })} /></div>
                    <div><label className="label">Stock Máximo</label><input type="number" step="0.1" className="input" value={cForm.max_stock} onChange={e => setCForm({ ...cForm, max_stock: e.target.value })} /></div>
                    <div><label className="label">Costo Unitario ($)</label><input type="number" step="0.01" className="input" value={cForm.unit_cost} onChange={e => setCForm({ ...cForm, unit_cost: e.target.value })} /></div>
                    <div><label className="label">Proveedor</label><input className="input" value={cForm.supplier} onChange={e => setCForm({ ...cForm, supplier: e.target.value })} /></div>
                    <div><label className="label">Contacto Proveedor</label><input className="input" value={cForm.supplier_contact} onChange={e => setCForm({ ...cForm, supplier_contact: e.target.value })} /></div>
                    <div className="col-span-2"><label className="label">Ubicación en Bodega</label><input className="input" value={cForm.location} onChange={e => setCForm({ ...cForm, location: e.target.value })} /></div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" className="btn-primary flex-1">{isEditing ? 'Guardar Cambios' : 'Crear Insumo'}</button>
                    <button type="button" className="btn-secondary flex-1" onClick={clearForms}>Cancelar</button>
                  </div>
                </form>
              )}

              {/* TOOL FORM */}
              {tab === 'tools' && (
                <form onSubmit={handleTool} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="label">Nombre *</label><input className="input" value={tForm.name} onChange={e => setTForm({ ...tForm, name: e.target.value })} required /></div>
                    <div><label className="label">Código</label><input className="input" value={tForm.code} onChange={e => setTForm({ ...tForm, code: e.target.value })} /></div>
                    <div><label className="label">Categoría</label><input className="input" value={tForm.category} onChange={e => setTForm({ ...tForm, category: e.target.value })} placeholder="Mecánica, Eléctrica..." /></div>
                    <div><label className="label">Cantidad Disponible</label><input type="number" className="input" value={tForm.quantity_available} onChange={e => setTForm({ ...tForm, quantity_available: e.target.value })} /></div>
                    <div><label className="label">Ubicación</label><input className="input" value={tForm.location} onChange={e => setTForm({ ...tForm, location: e.target.value })} /></div>
                    <div>
                      <label className="label">Estado</label>
                      <select className="input" value={tForm.condition} onChange={e => setTForm({ ...tForm, condition: e.target.value })}>
                        <option value="good">Bueno</option>
                        <option value="fair">Regular</option>
                        <option value="needs_repair">Requiere Reparación</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="label">Descripción</label>
                      <input className="input" value={tForm.description} onChange={e => setTForm({ ...tForm, description: e.target.value })} />
                    </div>
                    <div className="col-span-2 flex items-center gap-3">
                      <input type="checkbox" id="calibCheck" checked={tForm.requires_calibration}
                        onChange={e => setTForm({ ...tForm, requires_calibration: e.target.checked })} className="rounded" />
                      <label htmlFor="calibCheck" className="text-sm text-gray-700 cursor-pointer">Requiere calibración periódica</label>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" className="btn-primary flex-1">{isEditing ? 'Guardar Cambios' : 'Crear Herramienta'}</button>
                    <button type="button" className="btn-secondary flex-1" onClick={clearForms}>Cancelar</button>
                  </div>
                </form>
              )}

              {/* SPARE PART FORM */}
              {tab === 'spare_parts' && (
                <form onSubmit={handleSparePart} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="label">Nombre *</label><input className="input" value={pForm.name} onChange={e => setPForm({ ...pForm, name: e.target.value })} required /></div>
                    <div><label className="label">Código</label><input className="input" value={pForm.code} onChange={e => setPForm({ ...pForm, code: e.target.value })} /></div>
                    <div><label className="label">N° de Parte</label><input className="input" value={pForm.part_number} onChange={e => setPForm({ ...pForm, part_number: e.target.value })} /></div>
                    <div><label className="label">Marca</label><input className="input" value={pForm.brand} onChange={e => setPForm({ ...pForm, brand: e.target.value })} /></div>
                    <div><label className="label">Stock Actual</label><input type="number" className="input" value={pForm.stock_quantity} onChange={e => setPForm({ ...pForm, stock_quantity: e.target.value })} /></div>
                    <div><label className="label">Stock Mínimo</label><input type="number" className="input" value={pForm.min_stock} onChange={e => setPForm({ ...pForm, min_stock: e.target.value })} /></div>
                    <div><label className="label">Costo Unitario ($)</label><input type="number" step="0.01" className="input" value={pForm.unit_cost} onChange={e => setPForm({ ...pForm, unit_cost: e.target.value })} /></div>
                    <div><label className="label">Proveedor</label><input className="input" value={pForm.supplier} onChange={e => setPForm({ ...pForm, supplier: e.target.value })} /></div>
                    <div><label className="label">Ubicación</label><input className="input" value={pForm.location} onChange={e => setPForm({ ...pForm, location: e.target.value })} /></div>
                    <div className="col-span-2"><label className="label">Descripción</label><input className="input" value={pForm.description} onChange={e => setPForm({ ...pForm, description: e.target.value })} /></div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" className="btn-primary flex-1">{isEditing ? 'Guardar Cambios' : 'Crear Repuesto'}</button>
                    <button type="button" className="btn-secondary flex-1" onClick={clearForms}>Cancelar</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
