import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { priceComparisonApi } from '../api/client'
import {
  Plus, Search, ExternalLink, Star, Store as StoreIcon, X, Pencil,
  Trash2, PackageX, Tag,
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { Product, ProductOffer, PriceCategory, Store, StoreType } from '../types'

const EMPTY_PRODUCT = { name: '', category_id: '', brand: '', sku: '', description: '', image_url: '' }
const EMPTY_STORE = { name: '', store_type: 'online' as StoreType, website_url: '', logo_url: '', reputation_rating: '4.0', reputation_reviews_count: '0', notes: '' }
const EMPTY_OFFER = { store_id: '', seller_name: '', price: '', currency: 'USD', product_url: '', in_stock: true, reputation_rating: '', reputation_reviews_count: '' }
const EMPTY_CATEGORY = { name: '', description: '', icon: '' }

const STORE_TYPE_LABEL: Record<StoreType, string> = { online: 'En línea', hybrid: 'Híbrida', physical: 'Física' }
const STORE_TYPE_COLOR: Record<StoreType, string> = {
  online: 'bg-blue-100 text-blue-700',
  hybrid: 'bg-purple-100 text-purple-700',
  physical: 'bg-gray-100 text-gray-700',
}

function Stars({ rating, count }: { rating?: number; count?: number }) {
  if (rating === undefined || rating === null) return <span className="text-xs text-gray-300">Sin datos</span>
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
        ))}
      </div>
      <span className="text-xs text-gray-500">{rating.toFixed(1)}{count ? ` (${count.toLocaleString()})` : ''}</span>
    </div>
  )
}

export default function PriceComparison() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [sort, setSort] = useState<'price_asc' | 'price_desc' | 'name'>('price_asc')

  const [showProductModal, setShowProductModal] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState({ ...EMPTY_PRODUCT })

  const [showStoreModal, setShowStoreModal] = useState(false)
  const [storeForm, setStoreForm] = useState({ ...EMPTY_STORE })

  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [categoryForm, setCategoryForm] = useState({ ...EMPTY_CATEGORY })

  const [offerProductId, setOfferProductId] = useState<number | null>(null)
  const [editOffer, setEditOffer] = useState<ProductOffer | null>(null)
  const [offerForm, setOfferForm] = useState({ ...EMPTY_OFFER })

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['pc-products', search, categoryId, sort],
    queryFn: () => priceComparisonApi.listProducts({ search: search || undefined, category_id: categoryId || undefined, sort }).then(r => r.data as Product[]),
  })
  const { data: categories = [] } = useQuery({ queryKey: ['pc-categories'], queryFn: () => priceComparisonApi.listCategories().then(r => r.data as PriceCategory[]) })
  const { data: stores = [] } = useQuery({ queryKey: ['pc-stores'], queryFn: () => priceComparisonApi.listStores().then(r => r.data as Store[]) })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['pc-products'] })
    qc.invalidateQueries({ queryKey: ['pc-categories'] })
    qc.invalidateQueries({ queryKey: ['pc-stores'] })
  }

  // ─── PRODUCT ────────────────────────────────────────────────────────────
  const openEditProduct = (p: Product) => {
    setEditProduct(p)
    setProductForm({
      name: p.name, category_id: p.category_id ? String(p.category_id) : '',
      brand: p.brand || '', sku: p.sku || '', description: p.description || '', image_url: p.image_url || '',
    })
  }

  const closeProductModal = () => {
    setShowProductModal(false); setEditProduct(null); setProductForm({ ...EMPTY_PRODUCT })
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = { ...productForm, category_id: productForm.category_id ? Number(productForm.category_id) : null }
    try {
      if (editProduct) {
        await priceComparisonApi.updateProduct(editProduct.id, data)
        toast.success('Producto actualizado')
      } else {
        await priceComparisonApi.createProduct(data)
        toast.success('Producto creado')
      }
      invalidate(); closeProductModal()
    } catch { toast.error('Error al guardar el producto') }
  }

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('¿Eliminar este producto y todos sus precios?')) return
    try {
      await priceComparisonApi.deleteProduct(id)
      toast.success('Producto eliminado')
      invalidate()
    } catch { toast.error('Error al eliminar') }
  }

  // ─── STORE ──────────────────────────────────────────────────────────────
  const handleStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      ...storeForm,
      reputation_rating: Number(storeForm.reputation_rating),
      reputation_reviews_count: Number(storeForm.reputation_reviews_count),
    }
    try {
      await priceComparisonApi.createStore(data)
      toast.success('Tienda creada')
      invalidate()
      setShowStoreModal(false); setStoreForm({ ...EMPTY_STORE })
    } catch { toast.error('Error al crear la tienda') }
  }

  // ─── CATEGORY ───────────────────────────────────────────────────────────
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await priceComparisonApi.createCategory(categoryForm)
      toast.success('Categoría creada')
      invalidate()
      setShowCategoryModal(false); setCategoryForm({ ...EMPTY_CATEGORY })
    } catch { toast.error('Error al crear la categoría') }
  }

  // ─── OFFER ──────────────────────────────────────────────────────────────
  const openAddOffer = (productId: number) => {
    setOfferProductId(productId); setEditOffer(null); setOfferForm({ ...EMPTY_OFFER })
  }

  const openEditOffer = (productId: number, o: ProductOffer) => {
    setOfferProductId(productId); setEditOffer(o)
    setOfferForm({
      store_id: String(o.store_id), seller_name: o.seller_name || '', price: String(o.price),
      currency: o.currency, product_url: o.product_url, in_stock: o.in_stock,
      reputation_rating: o.reputation_rating != null ? String(o.reputation_rating) : '',
      reputation_reviews_count: o.reputation_reviews_count != null ? String(o.reputation_reviews_count) : '',
    })
  }

  const closeOfferModal = () => {
    setOfferProductId(null); setEditOffer(null); setOfferForm({ ...EMPTY_OFFER })
  }

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!offerProductId) return
    const data = {
      ...offerForm,
      store_id: Number(offerForm.store_id),
      price: Number(offerForm.price),
      reputation_rating: offerForm.reputation_rating ? Number(offerForm.reputation_rating) : null,
      reputation_reviews_count: offerForm.reputation_reviews_count ? Number(offerForm.reputation_reviews_count) : null,
    }
    try {
      if (editOffer) {
        await priceComparisonApi.updateOffer(editOffer.id, data)
        toast.success('Precio actualizado')
      } else {
        await priceComparisonApi.createOffer(offerProductId, data)
        toast.success('Precio agregado')
      }
      invalidate(); closeOfferModal()
    } catch { toast.error('Error al guardar el precio') }
  }

  const handleDeleteOffer = async (id: number) => {
    if (!confirm('¿Eliminar este precio?')) return
    try {
      await priceComparisonApi.deleteOffer(id)
      toast.success('Precio eliminado')
      invalidate()
    } catch { toast.error('Error al eliminar') }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comparador de Precios</h1>
          <p className="text-sm text-gray-500 mt-0.5">Compara precios de productos entre tiendas virtuales e híbridas</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCategoryModal(true)} className="btn-secondary flex items-center gap-2 text-sm">
            <Tag className="w-4 h-4" /> Nueva Categoría
          </button>
          <button onClick={() => setShowStoreModal(true)} className="btn-secondary flex items-center gap-2 text-sm">
            <StoreIcon className="w-4 h-4" /> Nueva Tienda
          </button>
          <button onClick={() => setShowProductModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nuevo Producto
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Buscar producto..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
          <option value="">Todas las categorías</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="input w-auto" value={sort} onChange={e => setSort(e.target.value as any)}>
          <option value="price_asc">Precio: menor a mayor</option>
          <option value="price_desc">Precio: mayor a menor</option>
          <option value="name">Nombre A-Z</option>
        </select>
      </div>

      {/* Products */}
      {isLoading ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : products.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <PackageX className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          Sin productos. Crea uno para empezar a comparar precios.
        </div>
      ) : (
        <div className="space-y-4">
          {products.map(p => (
            <div key={p.id} className="card p-0 overflow-hidden">
              <div className="p-5 flex gap-4 border-b border-gray-100">
                {p.image_url && (
                  <img src={p.image_url} alt={p.name} className="w-20 h-20 rounded-lg object-cover flex-shrink-0 bg-gray-100" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{p.name}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {p.category && <span className="badge bg-slate-100 text-slate-600">{p.category.name}</span>}
                        {p.brand && <span className="text-xs text-gray-400">{p.brand}</span>}
                        {p.sku && <span className="text-xs text-gray-300 font-mono">{p.sku}</span>}
                      </div>
                      {p.description && <p className="text-xs text-gray-500 mt-1.5 max-w-2xl">{p.description}</p>}
                    </div>
                    <div className="flex items-start gap-1 flex-shrink-0">
                      <button onClick={() => openEditProduct(p)} className="text-gray-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteProduct(p.id)} className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {p.best_price != null && (
                    <p className="text-sm mt-2">
                      Mejor precio: <span className="text-lg font-bold text-green-600">${p.best_price.toFixed(2)}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Offers table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="table-header">Tienda</th>
                      <th className="table-header">Vendedor</th>
                      <th className="table-header">Precio</th>
                      <th className="table-header">Reputación</th>
                      <th className="table-header">Stock</th>
                      <th className="table-header">Enlace</th>
                      <th className="table-header">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {p.offers.map((o, idx) => (
                      <tr key={o.id} className={idx === 0 ? 'bg-green-50/60' : 'hover:bg-gray-50'}>
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{o.store.name}</span>
                            <span className={`badge text-[10px] ${STORE_TYPE_COLOR[o.store.store_type]}`}>{STORE_TYPE_LABEL[o.store.store_type]}</span>
                          </div>
                        </td>
                        <td className="table-cell text-xs text-gray-500">{o.seller_name || '—'}</td>
                        <td className="table-cell">
                          <span className={`font-semibold ${idx === 0 ? 'text-green-700' : 'text-gray-800'}`}>
                            {o.currency} {o.price.toFixed(2)}
                          </span>
                          {idx === 0 && <span className="ml-2 badge bg-green-100 text-green-700 text-[10px]">Mejor precio</span>}
                        </td>
                        <td className="table-cell">
                          <Stars rating={o.reputation_rating ?? o.store.reputation_rating} count={o.reputation_reviews_count ?? o.store.reputation_reviews_count} />
                        </td>
                        <td className="table-cell">
                          {o.in_stock
                            ? <span className="badge bg-green-100 text-green-700 text-xs">Disponible</span>
                            : <span className="badge bg-red-100 text-red-700 text-xs">Agotado</span>}
                        </td>
                        <td className="table-cell">
                          <a href={o.product_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-600 hover:underline w-fit">
                            Ver producto <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="table-cell">
                          <div className="flex gap-1">
                            <button onClick={() => openEditOffer(p.id, o)} className="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeleteOffer(o.id)} className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {p.offers.length === 0 && (
                      <tr><td colSpan={7} className="text-center py-6 text-gray-400 text-sm">Sin precios registrados aún</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                <button onClick={() => openAddOffer(p.id)} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
                  <Plus className="w-3.5 h-3.5" /> Agregar precio de otra tienda
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── PRODUCT MODAL ───────────────────────────────────────────────── */}
      {(showProductModal || editProduct) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold">{editProduct ? 'Editar' : 'Nuevo'} Producto</h2>
              <button onClick={closeProductModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleProductSubmit} className="p-6 space-y-3">
              <div><label className="label">Nombre *</label><input className="input" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Categoría</label>
                  <select className="input" value={productForm.category_id} onChange={e => setProductForm({ ...productForm, category_id: e.target.value })}>
                    <option value="">Sin categoría</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div><label className="label">Marca</label><input className="input" value={productForm.brand} onChange={e => setProductForm({ ...productForm, brand: e.target.value })} /></div>
              </div>
              <div><label className="label">SKU / Código</label><input className="input" value={productForm.sku} onChange={e => setProductForm({ ...productForm, sku: e.target.value })} /></div>
              <div><label className="label">Imagen (URL)</label><input className="input" value={productForm.image_url} onChange={e => setProductForm({ ...productForm, image_url: e.target.value })} /></div>
              <div><label className="label">Descripción</label><textarea className="input" rows={3} value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} /></div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">{editProduct ? 'Guardar Cambios' : 'Crear Producto'}</button>
                <button type="button" className="btn-secondary flex-1" onClick={closeProductModal}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── STORE MODAL ─────────────────────────────────────────────────── */}
      {showStoreModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Nueva Tienda</h2>
              <button onClick={() => { setShowStoreModal(false); setStoreForm({ ...EMPTY_STORE }) }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleStoreSubmit} className="p-6 space-y-3">
              <div><label className="label">Nombre *</label><input className="input" value={storeForm.name} onChange={e => setStoreForm({ ...storeForm, name: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Tipo de tienda</label>
                  <select className="input" value={storeForm.store_type} onChange={e => setStoreForm({ ...storeForm, store_type: e.target.value as StoreType })}>
                    <option value="online">En línea</option>
                    <option value="hybrid">Híbrida</option>
                    <option value="physical">Física</option>
                  </select>
                </div>
                <div><label className="label">Sitio web</label><input className="input" value={storeForm.website_url} onChange={e => setStoreForm({ ...storeForm, website_url: e.target.value })} placeholder="https://..." /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Reputación (0-5)</label><input type="number" min="0" max="5" step="0.1" className="input" value={storeForm.reputation_rating} onChange={e => setStoreForm({ ...storeForm, reputation_rating: e.target.value })} /></div>
                <div><label className="label">N° de reseñas</label><input type="number" min="0" className="input" value={storeForm.reputation_reviews_count} onChange={e => setStoreForm({ ...storeForm, reputation_reviews_count: e.target.value })} /></div>
              </div>
              <div><label className="label">Notas</label><input className="input" value={storeForm.notes} onChange={e => setStoreForm({ ...storeForm, notes: e.target.value })} /></div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">Crear Tienda</button>
                <button type="button" className="btn-secondary flex-1" onClick={() => { setShowStoreModal(false); setStoreForm({ ...EMPTY_STORE }) }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── CATEGORY MODAL ──────────────────────────────────────────────── */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Nueva Categoría</h2>
              <button onClick={() => { setShowCategoryModal(false); setCategoryForm({ ...EMPTY_CATEGORY }) }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCategorySubmit} className="p-6 space-y-3">
              <div><label className="label">Nombre *</label><input className="input" value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} required /></div>
              <div><label className="label">Descripción</label><input className="input" value={categoryForm.description} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} /></div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">Crear Categoría</button>
                <button type="button" className="btn-secondary flex-1" onClick={() => { setShowCategoryModal(false); setCategoryForm({ ...EMPTY_CATEGORY }) }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── OFFER MODAL ──────────────────────────────────────────────────── */}
      {offerProductId !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold">{editOffer ? 'Editar' : 'Agregar'} Precio</h2>
              <button onClick={closeOfferModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleOfferSubmit} className="p-6 space-y-3">
              <div>
                <label className="label">Tienda *</label>
                <select className="input" value={offerForm.store_id} onChange={e => setOfferForm({ ...offerForm, store_id: e.target.value })} required>
                  <option value="">Selecciona una tienda</option>
                  {stores.map(s => <option key={s.id} value={s.id}>{s.name} ({STORE_TYPE_LABEL[s.store_type]})</option>)}
                </select>
                {stores.length === 0 && <p className="text-xs text-gray-400 mt-1">No hay tiendas aún. Crea una con "Nueva Tienda".</p>}
              </div>
              <div><label className="label">Vendedor (opcional, si es un marketplace)</label><input className="input" value={offerForm.seller_name} onChange={e => setOfferForm({ ...offerForm, seller_name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Precio *</label><input type="number" step="0.01" min="0" className="input" value={offerForm.price} onChange={e => setOfferForm({ ...offerForm, price: e.target.value })} required /></div>
                <div><label className="label">Moneda</label><input className="input" value={offerForm.currency} onChange={e => setOfferForm({ ...offerForm, currency: e.target.value })} /></div>
              </div>
              <div><label className="label">Link directo al producto *</label><input className="input" value={offerForm.product_url} onChange={e => setOfferForm({ ...offerForm, product_url: e.target.value })} placeholder="https://..." required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Reputación vendedor (0-5, opcional)</label><input type="number" min="0" max="5" step="0.1" className="input" value={offerForm.reputation_rating} onChange={e => setOfferForm({ ...offerForm, reputation_rating: e.target.value })} placeholder="Usa la de la tienda" /></div>
                <div><label className="label">N° reseñas vendedor</label><input type="number" min="0" className="input" value={offerForm.reputation_reviews_count} onChange={e => setOfferForm({ ...offerForm, reputation_reviews_count: e.target.value })} /></div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                <input type="checkbox" checked={offerForm.in_stock} onChange={e => setOfferForm({ ...offerForm, in_stock: e.target.checked })} className="rounded" />
                Disponible en stock
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">{editOffer ? 'Guardar Cambios' : 'Agregar Precio'}</button>
                <button type="button" className="btn-secondary flex-1" onClick={closeOfferModal}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
