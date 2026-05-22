import clsx from 'clsx'
import type { EquipmentStatus, Criticality, WorkOrderStatus, WorkOrderPriority, MaintenanceType } from '../types'

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-600',
  in_maintenance: 'bg-yellow-100 text-yellow-800',
  decommissioned: 'bg-red-100 text-red-700',
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
  critical: 'bg-red-200 text-red-900 font-semibold',
  pending: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-500',
  on_hold: 'bg-orange-100 text-orange-700',
  preventive: 'bg-blue-100 text-blue-700',
  corrective: 'bg-red-100 text-red-700',
  predictive: 'bg-purple-100 text-purple-700',
  lubrication: 'bg-amber-100 text-amber-700',
  calibration: 'bg-cyan-100 text-cyan-700',
  inspection: 'bg-indigo-100 text-indigo-700',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo', inactive: 'Inactivo', in_maintenance: 'En Mantenimiento',
  decommissioned: 'Dado de Baja', high: 'Alto', medium: 'Medio', low: 'Bajo',
  critical: 'Crítico', pending: 'Pendiente', in_progress: 'En Progreso',
  completed: 'Completado', cancelled: 'Cancelado', on_hold: 'En Espera',
  preventive: 'Preventivo', corrective: 'Correctivo', predictive: 'Predictivo',
  lubrication: 'Lubricación', calibration: 'Calibración', inspection: 'Inspección',
}

interface Props {
  value: string
  size?: 'sm' | 'md'
}

export default function StatusBadge({ value, size = 'sm' }: Props) {
  return (
    <span className={clsx(
      'badge',
      STATUS_STYLES[value] || 'bg-gray-100 text-gray-600',
      size === 'md' ? 'text-sm px-3 py-1' : ''
    )}>
      {STATUS_LABELS[value] || value}
    </span>
  )
}
