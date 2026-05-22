import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../api/client'
import { Plus, Shield, Pencil, X } from 'lucide-react'
import toast from 'react-hot-toast'
import type { User } from '../types'

const ROLE_BADGES: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  supervisor: 'bg-blue-100 text-blue-700',
  technician: 'bg-green-100 text-green-700',
  viewer: 'bg-gray-100 text-gray-600',
}
const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador', supervisor: 'Supervisor', technician: 'Técnico', viewer: 'Visor',
}

interface UserForm {
  username: string; email: string; full_name: string; password: string; role: string
}
interface EditForm {
  full_name: string; email: string; role: string; is_active: boolean
}

const emptyCreate: UserForm = { username: '', email: '', full_name: '', password: '', role: 'technician' }

export default function Users() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [createForm, setCreateForm] = useState<UserForm>(emptyCreate)
  const [editForm, setEditForm] = useState<EditForm>({ full_name: '', email: '', role: '', is_active: true })

  const currentUserStr = localStorage.getItem('user')
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => authApi.getUsers().then(r => r.data),
  })

  const openEdit = (user: User) => {
    setEditUser(user)
    setEditForm({ full_name: user.full_name, email: user.email, role: user.role, is_active: user.is_active })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await authApi.createUser(createForm)
      toast.success('Usuario creado exitosamente')
      qc.invalidateQueries({ queryKey: ['users'] })
      setShowCreate(false)
      setCreateForm(emptyCreate)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error al crear usuario')
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUser) return
    try {
      await authApi.updateUser(editUser.id, editForm)
      toast.success('Usuario actualizado')
      qc.invalidateQueries({ queryKey: ['users'] })
      setEditUser(null)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error al actualizar')
    }
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-6 flex flex-col items-center justify-center py-24">
        <Shield className="w-16 h-16 text-gray-200 mb-4" />
        <p className="text-gray-500 font-medium">Acceso restringido</p>
        <p className="text-sm text-gray-400">Solo los administradores pueden gestionar usuarios.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios del Sistema</h1>
          <p className="text-sm text-gray-500">{users.length} usuarios registrados</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo Usuario
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-header">Usuario</th>
                <th className="table-header">Nombre Completo</th>
                <th className="table-header">Email</th>
                <th className="table-header">Rol</th>
                <th className="table-header">Estado</th>
                <th className="table-header">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user: User) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="table-cell font-mono text-sm font-semibold text-blue-700">@{user.username}</td>
                  <td className="table-cell font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                        {user.full_name.charAt(0)}
                      </div>
                      {user.full_name}
                    </div>
                  </td>
                  <td className="table-cell text-gray-500 text-sm">{user.email}</td>
                  <td className="table-cell">
                    <span className={`badge ${ROLE_BADGES[user.role] || 'bg-gray-100 text-gray-600'}`}>
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {user.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="table-cell">
                    {user.id !== currentUser?.id && (
                      <button
                        onClick={() => openEdit(user)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:bg-blue-50 px-2 py-1.5 rounded-lg transition-colors"
                      >
                        <Pencil className="w-3 h-3" /> Editar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Crear */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Nuevo Usuario</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="label">Nombre Completo *</label>
                <input className="input" value={createForm.full_name}
                  onChange={e => setCreateForm({ ...createForm, full_name: e.target.value })} required />
              </div>
              <div>
                <label className="label">Usuario *</label>
                <input className="input" value={createForm.username}
                  onChange={e => setCreateForm({ ...createForm, username: e.target.value })} required />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" className="input" value={createForm.email}
                  onChange={e => setCreateForm({ ...createForm, email: e.target.value })} required />
              </div>
              <div>
                <label className="label">Contraseña *</label>
                <input type="password" className="input" value={createForm.password}
                  onChange={e => setCreateForm({ ...createForm, password: e.target.value })} required minLength={6} />
              </div>
              <div>
                <label className="label">Rol</label>
                <select className="input" value={createForm.role}
                  onChange={e => setCreateForm({ ...createForm, role: e.target.value })}>
                  <option value="admin">Administrador</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="technician">Técnico</option>
                  <option value="viewer">Visor</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">Crear Usuario</button>
                <button type="button" className="btn-secondary flex-1" onClick={() => setShowCreate(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">Editar Usuario</h2>
                <p className="text-sm text-gray-400 font-mono">@{editUser.username}</p>
              </div>
              <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div>
                <label className="label">Nombre Completo *</label>
                <input className="input" value={editForm.full_name}
                  onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} required />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" className="input" value={editForm.email}
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })} required />
              </div>
              <div>
                <label className="label">Rol</label>
                <select className="input" value={editForm.role}
                  onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
                  <option value="admin">Administrador</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="technician">Técnico</option>
                  <option value="viewer">Visor</option>
                </select>
              </div>
              <div>
                <label className="label">Estado</label>
                <select className="input" value={editForm.is_active ? 'true' : 'false'}
                  onChange={e => setEditForm({ ...editForm, is_active: e.target.value === 'true' })}>
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">Guardar Cambios</button>
                <button type="button" className="btn-secondary flex-1" onClick={() => setEditUser(null)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
