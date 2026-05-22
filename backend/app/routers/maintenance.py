from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date, timedelta
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user, require_admin_or_supervisor

router = APIRouter(prefix="/maintenance-plans", tags=["maintenance"])


@router.get("/", response_model=List[schemas.MaintenancePlanOut])
async def list_plans(
    equipment_id: int = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.MaintenancePlan)
    if equipment_id:
        q = q.filter(models.MaintenancePlan.equipment_id == equipment_id)
    return q.all()


@router.post("/", response_model=schemas.MaintenancePlanOut)
async def create_plan(
    data: schemas.MaintenancePlanCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_supervisor),
):
    plan = models.MaintenancePlan(
        equipment_id=data.equipment_id,
        name=data.name,
        type=data.type,
        frequency_days=data.frequency_days,
        estimated_duration_hours=data.estimated_duration_hours,
        description=data.description,
        procedure=data.procedure,
        safety_notes=data.safety_notes,
        next_scheduled=data.next_scheduled,
    )
    db.add(plan)
    db.flush()

    for t in data.tools:
        plan.plan_tools.append(models.PlanTool(tool_id=t.tool_id, quantity=t.quantity, notes=t.notes))
    for c in data.consumables:
        plan.plan_consumables.append(models.PlanConsumable(
            consumable_id=c.consumable_id, quantity=c.quantity, notes=c.notes))
    for idx, item in enumerate(data.checklist):
        plan.checklist_items.append(models.ChecklistItem(
            description=item.description, is_required=item.is_required,
            order=item.order or idx, category=item.category))

    db.commit()
    db.refresh(plan)
    return plan


@router.get("/{plan_id}", response_model=schemas.MaintenancePlanOut)
async def get_plan(plan_id: int, db: Session = Depends(get_db),
                   current_user: models.User = Depends(get_current_user)):
    plan = db.query(models.MaintenancePlan).filter(models.MaintenancePlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    return plan


@router.put("/{plan_id}", response_model=schemas.MaintenancePlanOut)
async def update_plan(
    plan_id: int,
    data: schemas.MaintenancePlanCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_supervisor),
):
    plan = db.query(models.MaintenancePlan).filter(models.MaintenancePlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    plan.name = data.name
    plan.type = data.type
    plan.frequency_days = data.frequency_days
    plan.estimated_duration_hours = data.estimated_duration_hours
    plan.description = data.description
    plan.procedure = data.procedure
    plan.safety_notes = data.safety_notes
    plan.next_scheduled = data.next_scheduled

    for pt in list(plan.plan_tools):
        db.delete(pt)
    for pc in list(plan.plan_consumables):
        db.delete(pc)
    for ci in list(plan.checklist_items):
        db.delete(ci)
    db.flush()

    for t in data.tools:
        plan.plan_tools.append(models.PlanTool(tool_id=t.tool_id, quantity=t.quantity, notes=t.notes))
    for c in data.consumables:
        plan.plan_consumables.append(models.PlanConsumable(
            consumable_id=c.consumable_id, quantity=c.quantity, notes=c.notes))
    for idx, item in enumerate(data.checklist):
        plan.checklist_items.append(models.ChecklistItem(
            description=item.description, is_required=item.is_required,
            order=item.order or idx, category=item.category))

    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/{plan_id}")
async def delete_plan(plan_id: int, db: Session = Depends(get_db),
                      current_user: models.User = Depends(require_admin_or_supervisor)):
    plan = db.query(models.MaintenancePlan).filter(models.MaintenancePlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    db.delete(plan)
    db.commit()
    return {"detail": "Plan eliminado"}


@router.get("/schedule/upcoming")
async def get_upcoming_schedule(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    today = date.today()
    end = today + timedelta(days=days)
    plans = db.query(models.MaintenancePlan).filter(
        models.MaintenancePlan.is_active == True,
        models.MaintenancePlan.next_scheduled >= today,
        models.MaintenancePlan.next_scheduled <= end,
    ).all()
    result = []
    for p in plans:
        eq = db.query(models.Equipment).filter(models.Equipment.id == p.equipment_id).first()
        result.append({
            "plan_id": p.id,
            "plan_name": p.name,
            "equipment_id": p.equipment_id,
            "equipment_name": eq.name if eq else "N/A",
            "equipment_code": eq.code if eq else "N/A",
            "type": p.type,
            "scheduled_date": str(p.next_scheduled),
            "estimated_hours": p.estimated_duration_hours,
            "days_until": (p.next_scheduled - today).days,
        })
    return sorted(result, key=lambda x: x["days_until"])
