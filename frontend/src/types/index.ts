export type UserRole = 'admin' | 'supervisor' | 'technician' | 'viewer'
export type EquipmentStatus = 'active' | 'inactive' | 'in_maintenance' | 'decommissioned'
export type Criticality = 'high' | 'medium' | 'low'
export type MaintenanceType = 'preventive' | 'corrective' | 'predictive' | 'lubrication' | 'calibration' | 'inspection'
export type WorkOrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'
export type WorkOrderPriority = 'critical' | 'high' | 'medium' | 'low'
export type AlertType = 'maintenance_due' | 'low_stock' | 'warranty_expiry' | 'calibration_due' | 'equipment_down'
export type AlertStatus = 'pending' | 'acknowledged' | 'resolved'

export interface User {
  id: number
  username: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
}

export interface Category {
  id: number
  name: string
  description?: string
  icon?: string
}

export interface Equipment {
  id: number
  code: string
  name: string
  category_id?: number
  brand?: string
  model?: string
  serial_number?: string
  location?: string
  area?: string
  status: EquipmentStatus
  criticality: Criticality
  purchase_date?: string
  installation_date?: string
  warranty_expiry?: string
  last_maintenance?: string
  next_maintenance?: string
  description?: string
  technical_specs?: string
  image_url?: string
  qr_code_url?: string
  total_maintenance_cost: number
  created_at?: string
  category_obj?: Category
}

export interface Tool {
  id: number
  code?: string
  name: string
  description?: string
  category?: string
  quantity_available: number
  location?: string
  condition: string
  requires_calibration: boolean
  last_calibration?: string
  next_calibration?: string
}

export interface Consumable {
  id: number
  code?: string
  name: string
  description?: string
  category?: string
  unit: string
  stock_quantity: number
  min_stock: number
  max_stock: number
  unit_cost: number
  supplier?: string
  location?: string
  last_restocked?: string
}

export interface SparePart {
  id: number
  code?: string
  name: string
  description?: string
  part_number?: string
  brand?: string
  stock_quantity: number
  min_stock: number
  unit_cost: number
  supplier?: string
  location?: string
}

export interface ChecklistItem {
  id: number
  description: string
  is_required: boolean
  order: number
  category: string
}

export interface PlanTool {
  id: number
  tool_id: number
  quantity: number
  notes?: string
  tool: Tool
}

export interface PlanConsumable {
  id: number
  consumable_id: number
  quantity: number
  notes?: string
  consumable: Consumable
}

export interface MaintenancePlan {
  id: number
  equipment_id: number
  name: string
  type: MaintenanceType
  frequency_days?: number
  estimated_duration_hours: number
  description?: string
  procedure?: string
  safety_notes?: string
  is_active: boolean
  last_executed?: string
  next_scheduled?: string
  plan_tools: PlanTool[]
  plan_consumables: PlanConsumable[]
  checklist_items: ChecklistItem[]
}

export interface WorkOrder {
  id: number
  order_number: string
  equipment_id: number
  plan_id?: number
  type: MaintenanceType
  priority: WorkOrderPriority
  status: WorkOrderStatus
  scheduled_date?: string
  start_datetime?: string
  end_datetime?: string
  technician_id?: number
  supervisor_id?: number
  description?: string
  findings?: string
  actions_taken?: string
  labor_hours: number
  labor_cost: number
  materials_cost: number
  total_cost: number
  downtime_hours: number
  photos?: string
  checklist_completed?: string
  created_at?: string
  equipment?: Equipment
  technician?: User
}

export interface LifecycleEntry {
  id: number
  equipment_id: number
  work_order_id?: number
  date?: string
  event_type: MaintenanceType
  description?: string
  findings?: string
  actions_taken?: string
  technician_id?: number
  labor_hours: number
  total_cost: number
  equipment_status_before?: EquipmentStatus
  equipment_status_after?: EquipmentStatus
  next_maintenance_date?: string
  notes?: string
  technician?: User
}

export interface Alert {
  id: number
  type: AlertType
  equipment_id?: number
  consumable_id?: number
  message: string
  due_date?: string
  priority: WorkOrderPriority
  status: AlertStatus
  created_at?: string
  equipment?: Equipment
}

export interface DashboardStats {
  total_equipment: number
  active_equipment: number
  in_maintenance: number
  inactive: number
  pending_work_orders: number
  in_progress_work_orders: number
  completed_this_month: number
  overdue_maintenance: number
  pending_alerts: number
  low_stock_items: number
  total_cost_this_month: number
  avg_mtbf_days: number
  avg_mttr_hours: number
  availability_percent: number
}
