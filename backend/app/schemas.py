from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime
from .models import (
    UserRole, EquipmentStatus, Criticality, MaintenanceType,
    WorkOrderStatus, WorkOrderPriority, AlertType, AlertStatus
)


# ─── AUTH ────────────────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str
    user: "UserOut"


class UserCreate(BaseModel):
    username: str
    email: str
    full_name: str
    password: str
    role: UserRole = UserRole.viewer


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


# ─── TECHNICIAN ──────────────────────────────────────────────────────────────

class TechnicianCreate(BaseModel):
    user_id: int
    employee_code: str
    specialties: Optional[List[str]] = []
    certifications: Optional[List[str]] = []
    phone: Optional[str] = None


class TechnicianOut(BaseModel):
    id: int
    user_id: int
    employee_code: str
    specialties: Optional[str] = None
    certifications: Optional[str] = None
    phone: Optional[str] = None
    is_available: bool
    user: UserOut
    model_config = {"from_attributes": True}


# ─── EQUIPMENT CATEGORY ──────────────────────────────────────────────────────

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None


class CategoryOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    model_config = {"from_attributes": True}


# ─── EQUIPMENT ───────────────────────────────────────────────────────────────

class EquipmentCreate(BaseModel):
    code: str
    name: str
    category_id: Optional[int] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    location: Optional[str] = None
    area: Optional[str] = None
    status: EquipmentStatus = EquipmentStatus.active
    criticality: Criticality = Criticality.medium
    purchase_date: Optional[date] = None
    installation_date: Optional[date] = None
    warranty_expiry: Optional[date] = None
    description: Optional[str] = None
    technical_specs: Optional[str] = None


class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[int] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    location: Optional[str] = None
    area: Optional[str] = None
    status: Optional[EquipmentStatus] = None
    criticality: Optional[Criticality] = None
    purchase_date: Optional[date] = None
    installation_date: Optional[date] = None
    warranty_expiry: Optional[date] = None
    description: Optional[str] = None
    technical_specs: Optional[str] = None


class EquipmentOut(BaseModel):
    id: int
    code: str
    name: str
    category_id: Optional[int] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    location: Optional[str] = None
    area: Optional[str] = None
    status: EquipmentStatus
    criticality: Criticality
    purchase_date: Optional[date] = None
    installation_date: Optional[date] = None
    warranty_expiry: Optional[date] = None
    last_maintenance: Optional[date] = None
    next_maintenance: Optional[date] = None
    description: Optional[str] = None
    technical_specs: Optional[str] = None
    image_url: Optional[str] = None
    qr_code_url: Optional[str] = None
    total_maintenance_cost: float = 0.0
    created_at: Optional[datetime] = None
    category_obj: Optional[CategoryOut] = None
    model_config = {"from_attributes": True}


# ─── TOOL ────────────────────────────────────────────────────────────────────

class ToolCreate(BaseModel):
    code: Optional[str] = None
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    quantity_available: int = 1
    location: Optional[str] = None
    condition: str = "good"
    requires_calibration: bool = False
    last_calibration: Optional[date] = None
    next_calibration: Optional[date] = None


class ToolOut(BaseModel):
    id: int
    code: Optional[str] = None
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    quantity_available: int
    location: Optional[str] = None
    condition: str
    requires_calibration: bool
    last_calibration: Optional[date] = None
    next_calibration: Optional[date] = None
    model_config = {"from_attributes": True}


# ─── CONSUMABLE ──────────────────────────────────────────────────────────────

class ConsumableCreate(BaseModel):
    code: Optional[str] = None
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    unit: str = "unit"
    stock_quantity: float = 0.0
    min_stock: float = 0.0
    max_stock: float = 0.0
    unit_cost: float = 0.0
    supplier: Optional[str] = None
    supplier_contact: Optional[str] = None
    location: Optional[str] = None


class ConsumableUpdate(BaseModel):
    stock_quantity: Optional[float] = None
    min_stock: Optional[float] = None
    max_stock: Optional[float] = None
    unit_cost: Optional[float] = None
    supplier: Optional[str] = None
    location: Optional[str] = None


class ConsumableOut(BaseModel):
    id: int
    code: Optional[str] = None
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    unit: str
    stock_quantity: float
    min_stock: float
    max_stock: float
    unit_cost: float
    supplier: Optional[str] = None
    location: Optional[str] = None
    last_restocked: Optional[date] = None
    model_config = {"from_attributes": True}


# ─── SPARE PART ──────────────────────────────────────────────────────────────

class SparePartCreate(BaseModel):
    code: Optional[str] = None
    name: str
    description: Optional[str] = None
    part_number: Optional[str] = None
    brand: Optional[str] = None
    stock_quantity: int = 0
    min_stock: int = 0
    unit_cost: float = 0.0
    supplier: Optional[str] = None
    location: Optional[str] = None


class SparePartOut(BaseModel):
    id: int
    code: Optional[str] = None
    name: str
    description: Optional[str] = None
    part_number: Optional[str] = None
    brand: Optional[str] = None
    stock_quantity: int
    min_stock: int
    unit_cost: float
    supplier: Optional[str] = None
    location: Optional[str] = None
    model_config = {"from_attributes": True}


# ─── MAINTENANCE PLAN ────────────────────────────────────────────────────────

class ChecklistItemCreate(BaseModel):
    description: str
    is_required: bool = True
    order: int = 0
    category: str = "procedure"


class ChecklistItemOut(BaseModel):
    id: int
    description: str
    is_required: bool
    order: int
    category: str
    model_config = {"from_attributes": True}


class PlanToolCreate(BaseModel):
    tool_id: int
    quantity: int = 1
    notes: Optional[str] = None


class PlanToolOut(BaseModel):
    id: int
    tool_id: int
    quantity: int
    notes: Optional[str] = None
    tool: ToolOut
    model_config = {"from_attributes": True}


class PlanConsumableCreate(BaseModel):
    consumable_id: int
    quantity: float = 1.0
    notes: Optional[str] = None


class PlanConsumableOut(BaseModel):
    id: int
    consumable_id: int
    quantity: float
    notes: Optional[str] = None
    consumable: ConsumableOut
    model_config = {"from_attributes": True}


class MaintenancePlanCreate(BaseModel):
    equipment_id: int
    name: str
    type: MaintenanceType
    frequency_days: Optional[int] = None
    estimated_duration_hours: float = 1.0
    description: Optional[str] = None
    procedure: Optional[str] = None
    safety_notes: Optional[str] = None
    next_scheduled: Optional[date] = None
    tools: List[PlanToolCreate] = []
    consumables: List[PlanConsumableCreate] = []
    checklist: List[ChecklistItemCreate] = []


class MaintenancePlanOut(BaseModel):
    id: int
    equipment_id: int
    name: str
    type: MaintenanceType
    frequency_days: Optional[int] = None
    estimated_duration_hours: float
    description: Optional[str] = None
    procedure: Optional[str] = None
    safety_notes: Optional[str] = None
    is_active: bool
    last_executed: Optional[date] = None
    next_scheduled: Optional[date] = None
    plan_tools: List[PlanToolOut] = []
    plan_consumables: List[PlanConsumableOut] = []
    checklist_items: List[ChecklistItemOut] = []
    model_config = {"from_attributes": True}


# ─── WORK ORDER ──────────────────────────────────────────────────────────────

class WorkOrderCreate(BaseModel):
    equipment_id: int
    plan_id: Optional[int] = None
    type: MaintenanceType
    priority: WorkOrderPriority = WorkOrderPriority.medium
    scheduled_date: Optional[date] = None
    technician_id: Optional[int] = None
    supervisor_id: Optional[int] = None
    description: Optional[str] = None


class WorkOrderUpdate(BaseModel):
    status: Optional[WorkOrderStatus] = None
    priority: Optional[WorkOrderPriority] = None
    technician_id: Optional[int] = None
    supervisor_id: Optional[int] = None
    scheduled_date: Optional[date] = None
    findings: Optional[str] = None
    actions_taken: Optional[str] = None
    labor_hours: Optional[float] = None
    labor_cost: Optional[float] = None
    materials_cost: Optional[float] = None
    downtime_hours: Optional[float] = None
    checklist_completed: Optional[str] = None


class WorkOrderOut(BaseModel):
    id: int
    order_number: str
    equipment_id: int
    plan_id: Optional[int] = None
    type: MaintenanceType
    priority: WorkOrderPriority
    status: WorkOrderStatus
    scheduled_date: Optional[date] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    technician_id: Optional[int] = None
    supervisor_id: Optional[int] = None
    description: Optional[str] = None
    findings: Optional[str] = None
    actions_taken: Optional[str] = None
    labor_hours: float
    labor_cost: float
    materials_cost: float
    total_cost: float
    downtime_hours: float
    photos: Optional[str] = None
    checklist_completed: Optional[str] = None
    created_at: Optional[datetime] = None
    equipment: Optional[EquipmentOut] = None
    technician: Optional[UserOut] = None
    model_config = {"from_attributes": True}


# ─── LIFECYCLE ───────────────────────────────────────────────────────────────

class LifecycleOut(BaseModel):
    id: int
    equipment_id: int
    work_order_id: Optional[int] = None
    date: Optional[datetime] = None
    event_type: MaintenanceType
    description: Optional[str] = None
    findings: Optional[str] = None
    actions_taken: Optional[str] = None
    technician_id: Optional[int] = None
    labor_hours: float
    total_cost: float
    equipment_status_before: Optional[EquipmentStatus] = None
    equipment_status_after: Optional[EquipmentStatus] = None
    next_maintenance_date: Optional[date] = None
    notes: Optional[str] = None
    technician: Optional[UserOut] = None
    model_config = {"from_attributes": True}


# ─── ALERT ───────────────────────────────────────────────────────────────────

class AlertOut(BaseModel):
    id: int
    type: AlertType
    equipment_id: Optional[int] = None
    consumable_id: Optional[int] = None
    message: str
    due_date: Optional[date] = None
    priority: WorkOrderPriority
    status: AlertStatus
    created_at: Optional[datetime] = None
    equipment: Optional[EquipmentOut] = None
    model_config = {"from_attributes": True}


# ─── DASHBOARD ───────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_equipment: int
    active_equipment: int
    in_maintenance: int
    inactive: int
    pending_work_orders: int
    in_progress_work_orders: int
    completed_this_month: int
    overdue_maintenance: int
    pending_alerts: int
    low_stock_items: int
    total_cost_this_month: float
    avg_mtbf_days: float
    avg_mttr_hours: float
    availability_percent: float
