from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Date, DateTime, Text,
    ForeignKey, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum


class UserRole(str, enum.Enum):
    admin = "admin"
    supervisor = "supervisor"
    technician = "technician"
    viewer = "viewer"


class EquipmentStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    in_maintenance = "in_maintenance"
    decommissioned = "decommissioned"


class Criticality(str, enum.Enum):
    high = "high"
    medium = "medium"
    low = "low"


class MaintenanceType(str, enum.Enum):
    preventive = "preventive"
    corrective = "corrective"
    predictive = "predictive"
    lubrication = "lubrication"
    calibration = "calibration"
    inspection = "inspection"


class WorkOrderStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"
    on_hold = "on_hold"


class WorkOrderPriority(str, enum.Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class AlertType(str, enum.Enum):
    maintenance_due = "maintenance_due"
    low_stock = "low_stock"
    warranty_expiry = "warranty_expiry"
    calibration_due = "calibration_due"
    equipment_down = "equipment_down"


class AlertStatus(str, enum.Enum):
    pending = "pending"
    acknowledged = "acknowledged"
    resolved = "resolved"


# ─── USERS & TECHNICIANS ─────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False)
    full_name = Column(String(150), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.viewer)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    technician = relationship("Technician", back_populates="user", uselist=False)
    work_orders_assigned = relationship("WorkOrder", foreign_keys="WorkOrder.technician_id", back_populates="technician")
    work_orders_supervised = relationship("WorkOrder", foreign_keys="WorkOrder.supervisor_id", back_populates="supervisor")


class Technician(Base):
    __tablename__ = "technicians"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    employee_code = Column(String(30), unique=True)
    specialties = Column(Text)  # JSON array stored as string
    certifications = Column(Text)  # JSON array stored as string
    phone = Column(String(20))
    is_available = Column(Boolean, default=True)

    user = relationship("User", back_populates="technician")


# ─── EQUIPMENT ───────────────────────────────────────────────────────────────

class EquipmentCategory(Base):
    __tablename__ = "equipment_categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    icon = Column(String(50))
    equipment = relationship("Equipment", back_populates="category_obj")


class Equipment(Base):
    __tablename__ = "equipment"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(30), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    category_id = Column(Integer, ForeignKey("equipment_categories.id"))
    brand = Column(String(100))
    model = Column(String(100))
    serial_number = Column(String(100))
    location = Column(String(200))
    area = Column(String(100))
    status = Column(SAEnum(EquipmentStatus), default=EquipmentStatus.active)
    criticality = Column(SAEnum(Criticality), default=Criticality.medium)
    purchase_date = Column(Date)
    installation_date = Column(Date)
    warranty_expiry = Column(Date)
    last_maintenance = Column(Date)
    next_maintenance = Column(Date)
    description = Column(Text)
    technical_specs = Column(Text)  # JSON
    image_url = Column(String(500))
    manual_url = Column(String(500))
    qr_code_url = Column(String(500))
    total_maintenance_cost = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    category_obj = relationship("EquipmentCategory", back_populates="equipment")
    maintenance_plans = relationship("MaintenancePlan", back_populates="equipment", cascade="all, delete-orphan")
    work_orders = relationship("WorkOrder", back_populates="equipment", cascade="all, delete-orphan")
    lifecycle_entries = relationship("EquipmentLifecycle", back_populates="equipment", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="equipment", cascade="all, delete-orphan")
    spare_parts = relationship("EquipmentSparePart", back_populates="equipment", cascade="all, delete-orphan")


# ─── TOOLS & CONSUMABLES ─────────────────────────────────────────────────────

class Tool(Base):
    __tablename__ = "tools"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(30), unique=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    category = Column(String(100))
    quantity_available = Column(Integer, default=1)
    location = Column(String(200))
    condition = Column(String(50), default="good")
    requires_calibration = Column(Boolean, default=False)
    last_calibration = Column(Date)
    next_calibration = Column(Date)
    image_url = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    plan_tools = relationship("PlanTool", back_populates="tool")


class Consumable(Base):
    __tablename__ = "consumables"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(30), unique=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    category = Column(String(100))
    unit = Column(String(30))
    stock_quantity = Column(Float, default=0.0)
    min_stock = Column(Float, default=0.0)
    max_stock = Column(Float, default=0.0)
    unit_cost = Column(Float, default=0.0)
    supplier = Column(String(200))
    supplier_contact = Column(String(200))
    location = Column(String(200))
    last_restocked = Column(Date)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    plan_consumables = relationship("PlanConsumable", back_populates="consumable")
    alerts = relationship("Alert", back_populates="consumable")


class SparePart(Base):
    __tablename__ = "spare_parts"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(30), unique=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    part_number = Column(String(100))
    brand = Column(String(100))
    stock_quantity = Column(Integer, default=0)
    min_stock = Column(Integer, default=0)
    unit_cost = Column(Float, default=0.0)
    supplier = Column(String(200))
    location = Column(String(200))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    equipment_parts = relationship("EquipmentSparePart", back_populates="spare_part")


class EquipmentSparePart(Base):
    __tablename__ = "equipment_spare_parts"
    id = Column(Integer, primary_key=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"))
    spare_part_id = Column(Integer, ForeignKey("spare_parts.id"))
    notes = Column(Text)

    equipment = relationship("Equipment", back_populates="spare_parts")
    spare_part = relationship("SparePart", back_populates="equipment_parts")


# ─── MAINTENANCE PLANS ───────────────────────────────────────────────────────

class MaintenancePlan(Base):
    __tablename__ = "maintenance_plans"
    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=False)
    name = Column(String(200), nullable=False)
    type = Column(SAEnum(MaintenanceType), nullable=False)
    frequency_days = Column(Integer)
    estimated_duration_hours = Column(Float, default=1.0)
    description = Column(Text)
    procedure = Column(Text)
    safety_notes = Column(Text)
    is_active = Column(Boolean, default=True)
    last_executed = Column(Date)
    next_scheduled = Column(Date)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    equipment = relationship("Equipment", back_populates="maintenance_plans")
    plan_tools = relationship("PlanTool", back_populates="plan", cascade="all, delete-orphan")
    plan_consumables = relationship("PlanConsumable", back_populates="plan", cascade="all, delete-orphan")
    checklist_items = relationship("ChecklistItem", back_populates="plan", cascade="all, delete-orphan", order_by="ChecklistItem.order")
    work_orders = relationship("WorkOrder", back_populates="plan")


class PlanTool(Base):
    __tablename__ = "plan_tools"
    id = Column(Integer, primary_key=True)
    plan_id = Column(Integer, ForeignKey("maintenance_plans.id"))
    tool_id = Column(Integer, ForeignKey("tools.id"))
    quantity = Column(Integer, default=1)
    notes = Column(Text)

    plan = relationship("MaintenancePlan", back_populates="plan_tools")
    tool = relationship("Tool", back_populates="plan_tools")


class PlanConsumable(Base):
    __tablename__ = "plan_consumables"
    id = Column(Integer, primary_key=True)
    plan_id = Column(Integer, ForeignKey("maintenance_plans.id"))
    consumable_id = Column(Integer, ForeignKey("consumables.id"))
    quantity = Column(Float, default=1.0)
    notes = Column(Text)

    plan = relationship("MaintenancePlan", back_populates="plan_consumables")
    consumable = relationship("Consumable", back_populates="plan_consumables")


class ChecklistItem(Base):
    __tablename__ = "checklist_items"
    id = Column(Integer, primary_key=True)
    plan_id = Column(Integer, ForeignKey("maintenance_plans.id"))
    description = Column(Text, nullable=False)
    is_required = Column(Boolean, default=True)
    order = Column(Integer, default=0)
    category = Column(String(50), default="procedure")  # safety, procedure, quality

    plan = relationship("MaintenancePlan", back_populates="checklist_items")


# ─── WORK ORDERS ─────────────────────────────────────────────────────────────

class WorkOrder(Base):
    __tablename__ = "work_orders"
    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(30), unique=True, nullable=False, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("maintenance_plans.id"), nullable=True)
    type = Column(SAEnum(MaintenanceType), nullable=False)
    priority = Column(SAEnum(WorkOrderPriority), default=WorkOrderPriority.medium)
    status = Column(SAEnum(WorkOrderStatus), default=WorkOrderStatus.pending)
    scheduled_date = Column(Date)
    start_datetime = Column(DateTime(timezone=True))
    end_datetime = Column(DateTime(timezone=True))
    technician_id = Column(Integer, ForeignKey("users.id"))
    supervisor_id = Column(Integer, ForeignKey("users.id"))
    description = Column(Text)
    findings = Column(Text)
    actions_taken = Column(Text)
    labor_hours = Column(Float, default=0.0)
    labor_cost = Column(Float, default=0.0)
    materials_cost = Column(Float, default=0.0)
    total_cost = Column(Float, default=0.0)
    downtime_hours = Column(Float, default=0.0)
    photos = Column(Text)  # JSON array of URLs
    checklist_completed = Column(Text)  # JSON: {item_id: bool}
    signature_url = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    equipment = relationship("Equipment", back_populates="work_orders")
    plan = relationship("MaintenancePlan", back_populates="work_orders")
    technician = relationship("User", foreign_keys=[technician_id], back_populates="work_orders_assigned")
    supervisor = relationship("User", foreign_keys=[supervisor_id], back_populates="work_orders_supervised")
    lifecycle_entry = relationship("EquipmentLifecycle", back_populates="work_order", uselist=False)
    spare_parts_used = relationship("WorkOrderSparePart", back_populates="work_order", cascade="all, delete-orphan")


class WorkOrderSparePart(Base):
    __tablename__ = "work_order_spare_parts"
    id = Column(Integer, primary_key=True)
    work_order_id = Column(Integer, ForeignKey("work_orders.id"))
    spare_part_id = Column(Integer, ForeignKey("spare_parts.id"))
    quantity_used = Column(Integer, default=1)
    unit_cost = Column(Float, default=0.0)

    work_order = relationship("WorkOrder", back_populates="spare_parts_used")
    spare_part = relationship("SparePart")


# ─── EQUIPMENT LIFECYCLE ─────────────────────────────────────────────────────

class EquipmentLifecycle(Base):
    __tablename__ = "equipment_lifecycle"
    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=False)
    work_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=True, unique=True)
    date = Column(DateTime(timezone=True), server_default=func.now())
    event_type = Column(SAEnum(MaintenanceType), nullable=False)
    description = Column(Text)
    findings = Column(Text)
    actions_taken = Column(Text)
    technician_id = Column(Integer, ForeignKey("users.id"))
    labor_hours = Column(Float, default=0.0)
    total_cost = Column(Float, default=0.0)
    equipment_status_before = Column(SAEnum(EquipmentStatus))
    equipment_status_after = Column(SAEnum(EquipmentStatus))
    next_maintenance_date = Column(Date)
    notes = Column(Text)
    photos = Column(Text)  # JSON

    equipment = relationship("Equipment", back_populates="lifecycle_entries")
    work_order = relationship("WorkOrder", back_populates="lifecycle_entry")
    technician = relationship("User")


# ─── ALERTS ──────────────────────────────────────────────────────────────────

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(SAEnum(AlertType), nullable=False)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=True)
    consumable_id = Column(Integer, ForeignKey("consumables.id"), nullable=True)
    message = Column(Text, nullable=False)
    due_date = Column(Date)
    priority = Column(SAEnum(WorkOrderPriority), default=WorkOrderPriority.medium)
    status = Column(SAEnum(AlertStatus), default=AlertStatus.pending)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    acknowledged_at = Column(DateTime(timezone=True))
    acknowledged_by = Column(Integer, ForeignKey("users.id"))

    equipment = relationship("Equipment", back_populates="alerts")
    consumable = relationship("Consumable", back_populates="alerts")
