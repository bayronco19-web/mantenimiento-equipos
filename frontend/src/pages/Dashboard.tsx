import { useQuery } from '@tanstack/react-query'
import { dashboardApi, reportsApi } from '../api/client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  Wrench, ClipboardList, AlertTriangle, TrendingUp,
  CheckCircle, Clock, XCircle, Download, CalendarClock
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const STATUS_COLORS: Record<string, string> = {
  active: '#22c55e', in_maintenance: '#f59e0b', inactive: '#94a3b8', decommissioned: '#ef4444'
}
const STATUS_LABELS: Record<string, string> = {
  active: 'Activo', in_maintenance: 'En Mant.', inactive: 'Inactivo', decommissioned: 'Baja'
}
const CRIT_COLORS: Record<string, string> = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' }
const CRIT_LABELS: Record<string, string> = { high: 'Alta', medium: 'Media', low: 'Baja' }

function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: stats, isLoading } = useQuery({ queryKey: ['dashboard-stats'], queryFn: () => dashboardApi.stats().then(r => r.data) })
  const { data: woByMonth } = useQuery({ queryKey: ['wo-by-month'], queryFn: () => dashboardApi.woByMonth().then(r => r.data) })
  const { data: byStatus } = useQuery({ queryKey: ['eq-by-status'], queryFn: () => dashboardApi.equipmentByStatus().then(r => r.data) })
  const { data: byCrit } = useQuery({ queryKey: ['eq-by-crit'], queryFn: () => dashboardApi.equipmentByCriticality().then(r => r.data) })
  const { data: upcoming } = useQuery({ queryKey: ['upcoming'], queryFn: () => dashboardApi.upcomingMaintenance(14).then(r => r.data) })
  const { data: topCost } = useQuery({ queryKey: ['top-cost'], queryFn: () => dashboardApi.costByEquipment().then(r => r.data) })

  if (isLoading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
    </div>
  )

  const chartData = woByMonth?.map((m: any) => ({ name: MONTH_NAMES[m.month - 1], ...m })) || []
  const statusData = byStatus?.map((s: any) => ({ name: STATUS_LABELS[s.status] || s.status, value: s.count, color: STATUS_COLORS[s.status] || '#94a3b8' })) || []
  const critData = byCrit?.map((c: any) => ({ name: CRIT_LABELS[c.criticality] || c.criticality, value: c.count, color: CRIT_COLORS[c.criticality] || '#94a3b8' })) || []

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">{format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })}</p>
        </div>
        <button onClick={() => reportsApi.equipment()} className="btn-secondary flex items-center gap-2 text-sm">
          <Download className="w-4 h-4" /> Exportar Reporte
        </button>
      </div>

      {/* KPIs Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Wrench} label="Total Equipos" value={stats?.total_equipment || 0} sub={`${stats?.active_equipment} activos`} color="bg-blue-500" />
        <KpiCard icon={ClipboardList} label="OTs Pendientes" value={stats?.pending_work_orders || 0} sub={`${stats?.in_progress_work_orders} en progreso`} color="bg-amber-500" />
        <KpiCard icon={CheckCircle} label="Completadas (mes)" value={stats?.completed_this_month || 0} color="bg-green-500" />
        <KpiCard icon={AlertTriangle} label="Alertas Activas" value={stats?.pending_alerts || 0} sub={`${stats?.low_stock_items} stock bajo`} color="bg-red-500" />
      </div>

      {/* KPIs Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600">{stats?.availability_percent || 0}%</p>
          <p className="text-sm text-gray-500 mt-1">Disponibilidad</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-600">{stats?.avg_mtbf_days || 0}</p>
          <p className="text-sm text-gray-500 mt-1">MTBF (días)</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-amber-600">{stats?.avg_mttr_hours || 0}h</p>
          <p className="text-sm text-gray-500 mt-1">MTTR promedio</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-red-500">${(stats?.total_cost_this_month || 0).toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">Costo del mes</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* OTs por mes */}
        <div className="card lg:col-span-2">
          <h3 className="font-semibold text-gray-800 mb-4">Órdenes de Trabajo por Mes</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" name="Completadas" fill="#22c55e" radius={[4,4,0,0]} />
              <Bar dataKey="pending" name="Pendientes" fill="#3b82f6" radius={[4,4,0,0]} />
              <Bar dataKey="in_progress" name="En Progreso" fill="#f59e0b" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Equipos por estado */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Estado de Equipos</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                {statusData.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v: any, n: any) => [v, n]} />
              <Legend iconType="circle" iconSize={10} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming maintenance */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Mantenimientos Próximos (14 días)</h3>
            <CalendarClock className="w-4 h-4 text-gray-400" />
          </div>
          <div className="space-y-2">
            {upcoming?.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Sin mantenimientos próximos</p>}
            {upcoming?.map((item: any) => (
              <div key={item.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => navigate(`/equipment/${item.id}`)}>
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.code} · {item.next_maintenance}</p>
                </div>
                <span className={`badge text-xs ${item.days_until < 0 ? 'bg-red-100 text-red-700' : item.days_until <= 3 ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                  {item.days_until < 0 ? `Vencido ${Math.abs(item.days_until)}d` : `${item.days_until}d`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top cost */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Top Equipos por Costo de Mantenimiento</h3>
          <div className="space-y-3">
            {topCost?.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 w-5">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 truncate">{item.name}</span>
                    <span className="font-semibold text-gray-900">${(item.cost || 0).toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min((item.cost / (topCost[0]?.cost || 1)) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
            {(!topCost || topCost.length === 0) && <p className="text-sm text-gray-400 text-center py-4">Sin datos de costos</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
