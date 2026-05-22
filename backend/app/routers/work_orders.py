from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Optional
from datetime import datetime, date, timezone
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user, require_admin_or_supervisor

router = APIRouter(prefix="/work-orders", tags=["work_orders"])


def generate_order_number(db: Session) -> str:
    year = datetime.now().year
    count = db.query(models.WorkOrder).filter(
        extract("year", models.WorkOrder.created_at) == year
    ).count()
    return f"OT-{year}-{str(count + 1).zfill(4)}"


def create_lifecycle_from_wo(db: Session, wo: models.WorkOrder):
    entry = models.EquipmentLifecycle(
        equipment_id=wo.equipment_id,
        work_order_id=wo.id,
        date=wo.end_datetime or datetime.now(timezone.utc),
        event_type=wo.type,
        description=wo.description,
        findings=wo.findings,
        actions_taken=wo.actions_taken,
        technician_id=wo.technician_id,
        labor_hours=wo.labor_hours,
        total_cost=wo.total_cost,
        equipment_status_before=models.EquipmentStatus.in_maintenance,
        equipment_status_after=models.EquipmentStatus.active,
        photos=wo.photos,
    )
    db.add(entry)

    eq = db.query(models.Equipment).filter(models.Equipment.id == wo.equipment_id).first()
    if eq:
        eq.last_maintenance = date.today()
        eq.total_maintenance_cost = (eq.total_maintenance_cost or 0) + (wo.total_cost or 0)
        eq.status = models.EquipmentStatus.active
        if wo.plan_id:
            plan = db.query(models.MaintenancePlan).filter(
                models.MaintenancePlan.id == wo.plan_id).first()
            if plan and plan.frequency_days:
                from datetime import timedelta
                plan.last_executed = date.today()
                plan.next_scheduled = date.today() + timedelta(days=plan.frequency_days)
                eq.next_maintenance = plan.next_scheduled


@router.get("/", response_model=List[schemas.WorkOrderOut])
async def list_work_orders(
    status: Optional[str] = Query(None),
    equipment_id: Optional[int] = Query(None),
    technician_id: Optional[int] = Query(None),
    type: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.WorkOrder)
    if status:
        q = q.filter(models.WorkOrder.status == status)
    if equipment_id:
        q = q.filter(models.WorkOrder.equipment_id == equipment_id)
    if technician_id:
        q = q.filter(models.WorkOrder.technician_id == technician_id)
    if type:
        q = q.filter(models.WorkOrder.type == type)
    if priority:
        q = q.filter(models.WorkOrder.priority == priority)
    if date_from:
        q = q.filter(models.WorkOrder.scheduled_date >= date_from)
    if date_to:
        q = q.filter(models.WorkOrder.scheduled_date <= date_to)
    return q.order_by(models.WorkOrder.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=schemas.WorkOrderOut)
async def create_work_order(
    data: schemas.WorkOrderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_supervisor),
):
    eq = db.query(models.Equipment).filter(models.Equipment.id == data.equipment_id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")

    wo = models.WorkOrder(
        order_number=generate_order_number(db),
        equipment_id=data.equipment_id,
        plan_id=data.plan_id,
        type=data.type,
        priority=data.priority,
        status=models.WorkOrderStatus.pending,
        scheduled_date=data.scheduled_date,
        technician_id=data.technician_id,
        supervisor_id=data.supervisor_id,
        description=data.description,
    )
    db.add(wo)
    eq.status = models.EquipmentStatus.in_maintenance
    db.commit()
    db.refresh(wo)
    return wo


@router.get("/{wo_id}", response_model=schemas.WorkOrderOut)
async def get_work_order(wo_id: int, db: Session = Depends(get_db),
                         current_user: models.User = Depends(get_current_user)):
    wo = db.query(models.WorkOrder).filter(models.WorkOrder.id == wo_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Orden de trabajo no encontrada")
    return wo


@router.put("/{wo_id}", response_model=schemas.WorkOrderOut)
async def update_work_order(
    wo_id: int,
    data: schemas.WorkOrderUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    wo = db.query(models.WorkOrder).filter(models.WorkOrder.id == wo_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Orden de trabajo no encontrada")

    old_status = wo.status
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(wo, field, value)

    if data.status == models.WorkOrderStatus.in_progress and old_status == models.WorkOrderStatus.pending:
        wo.start_datetime = datetime.now(timezone.utc)

    if data.status == models.WorkOrderStatus.completed and old_status != models.WorkOrderStatus.completed:
        wo.end_datetime = datetime.now(timezone.utc)
        wo.total_cost = (wo.labor_cost or 0) + (wo.materials_cost or 0)
        create_lifecycle_from_wo(db, wo)

    db.commit()
    db.refresh(wo)
    return wo


@router.delete("/{wo_id}")
async def delete_work_order(wo_id: int, db: Session = Depends(get_db),
                            current_user: models.User = Depends(require_admin_or_supervisor)):
    wo = db.query(models.WorkOrder).filter(models.WorkOrder.id == wo_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Orden de trabajo no encontrada")
    db.delete(wo)
    db.commit()
    return {"detail": "Orden eliminada"}


@router.post("/{wo_id}/start", response_model=schemas.WorkOrderOut)
async def start_work_order(wo_id: int, db: Session = Depends(get_db),
                           current_user: models.User = Depends(get_current_user)):
    wo = db.query(models.WorkOrder).filter(models.WorkOrder.id == wo_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    wo.status = models.WorkOrderStatus.in_progress
    wo.start_datetime = datetime.now(timezone.utc)
    db.commit()
    db.refresh(wo)
    return wo


@router.post("/{wo_id}/complete", response_model=schemas.WorkOrderOut)
async def complete_work_order(
    wo_id: int,
    data: schemas.WorkOrderUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    wo = db.query(models.WorkOrder).filter(models.WorkOrder.id == wo_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(wo, field, value)
    wo.status = models.WorkOrderStatus.completed
    wo.end_datetime = datetime.now(timezone.utc)
    wo.total_cost = (wo.labor_cost or 0) + (wo.materials_cost or 0)
    create_lifecycle_from_wo(db, wo)
    db.commit()
    db.refresh(wo)
    return wo
