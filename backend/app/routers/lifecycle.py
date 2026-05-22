from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime, timezone
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user

router = APIRouter(prefix="/lifecycle", tags=["lifecycle"])


@router.get("/{equipment_id}", response_model=List[schemas.LifecycleOut])
async def get_equipment_lifecycle(
    equipment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    eq = db.query(models.Equipment).filter(models.Equipment.id == equipment_id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    return db.query(models.EquipmentLifecycle).filter(
        models.EquipmentLifecycle.equipment_id == equipment_id
    ).order_by(models.EquipmentLifecycle.date.desc()).all()


@router.get("/{equipment_id}/summary")
async def get_equipment_summary(
    equipment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    eq = db.query(models.Equipment).filter(models.Equipment.id == equipment_id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")

    entries = db.query(models.EquipmentLifecycle).filter(
        models.EquipmentLifecycle.equipment_id == equipment_id
    ).all()

    total_cost = sum(e.total_cost or 0 for e in entries)
    total_hours = sum(e.labor_hours or 0 for e in entries)
    total_maintenances = len(entries)

    completed_wos = db.query(models.WorkOrder).filter(
        models.WorkOrder.equipment_id == equipment_id,
        models.WorkOrder.status == models.WorkOrderStatus.completed,
        models.WorkOrder.start_datetime.isnot(None),
        models.WorkOrder.end_datetime.isnot(None),
    ).all()

    avg_repair_hours = 0
    if completed_wos:
        durations = [
            (wo.end_datetime - wo.start_datetime).total_seconds() / 3600
            for wo in completed_wos
            if wo.start_datetime and wo.end_datetime
        ]
        avg_repair_hours = sum(durations) / len(durations) if durations else 0

    by_type = {}
    for e in entries:
        t = str(e.event_type.value if hasattr(e.event_type, 'value') else e.event_type)
        by_type[t] = by_type.get(t, 0) + 1

    return {
        "equipment_id": equipment_id,
        "equipment_name": eq.name,
        "equipment_code": eq.code,
        "total_maintenances": total_maintenances,
        "total_cost": total_cost,
        "total_labor_hours": total_hours,
        "avg_repair_hours": round(avg_repair_hours, 2),
        "by_type": by_type,
        "last_maintenance": str(eq.last_maintenance) if eq.last_maintenance else None,
        "next_maintenance": str(eq.next_maintenance) if eq.next_maintenance else None,
        "status": str(eq.status.value if hasattr(eq.status, 'value') else eq.status),
        "criticality": str(eq.criticality.value if hasattr(eq.criticality, 'value') else eq.criticality),
    }


@router.post("/{equipment_id}/register")
async def register_activity(
    equipment_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    from datetime import date as date_type
    eq = db.query(models.Equipment).filter(models.Equipment.id == equipment_id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")

    now = datetime.now(timezone.utc)
    total_cost = float(data.get('labor_cost', 0)) + float(data.get('materials_cost', 0))

    # Map type string to enum
    event_type_str = data.get('type', 'preventive')
    try:
        event_type = models.MaintenanceType(event_type_str)
    except ValueError:
        event_type = models.MaintenanceType.preventive

    entry = models.EquipmentLifecycle(
        equipment_id=equipment_id,
        date=now,
        event_type=event_type,
        description=data.get('description', ''),
        findings=data.get('findings', ''),
        actions_taken=data.get('actions_taken', ''),
        technician_id=current_user.id,
        labor_hours=float(data.get('labor_hours', 0)),
        total_cost=total_cost,
        equipment_status_before=eq.status,
        equipment_status_after=models.EquipmentStatus.active,
    )
    db.add(entry)

    # Update equipment
    eq.last_maintenance = date_type.today()
    eq.total_maintenance_cost = (eq.total_maintenance_cost or 0) + total_cost
    eq.status = models.EquipmentStatus.active

    db.commit()
    db.refresh(entry)
    return {"detail": "Actividad registrada", "entry_id": entry.id, "equipment": eq.name}
