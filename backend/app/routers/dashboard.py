from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import date, datetime
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=schemas.DashboardStats)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    today = date.today()
    month = today.month
    year = today.year

    total_equipment = db.query(models.Equipment).count()
    active_equipment = db.query(models.Equipment).filter(
        models.Equipment.status == models.EquipmentStatus.active).count()
    in_maintenance = db.query(models.Equipment).filter(
        models.Equipment.status == models.EquipmentStatus.in_maintenance).count()
    inactive = db.query(models.Equipment).filter(
        models.Equipment.status == models.EquipmentStatus.inactive).count()

    pending_wo = db.query(models.WorkOrder).filter(
        models.WorkOrder.status == models.WorkOrderStatus.pending).count()
    in_progress_wo = db.query(models.WorkOrder).filter(
        models.WorkOrder.status == models.WorkOrderStatus.in_progress).count()
    completed_month = db.query(models.WorkOrder).filter(
        models.WorkOrder.status == models.WorkOrderStatus.completed,
        extract("month", models.WorkOrder.updated_at) == month,
        extract("year", models.WorkOrder.updated_at) == year,
    ).count()

    overdue = db.query(models.Equipment).filter(
        models.Equipment.next_maintenance.isnot(None),
        models.Equipment.next_maintenance < today,
        models.Equipment.status == models.EquipmentStatus.active,
    ).count()

    pending_alerts = db.query(models.Alert).filter(
        models.Alert.status == models.AlertStatus.pending).count()
    low_stock = db.query(models.Consumable).filter(
        models.Consumable.stock_quantity <= models.Consumable.min_stock).count()

    cost_result = db.query(func.sum(models.WorkOrder.total_cost)).filter(
        models.WorkOrder.status == models.WorkOrderStatus.completed,
        extract("month", models.WorkOrder.updated_at) == month,
        extract("year", models.WorkOrder.updated_at) == year,
    ).scalar()
    total_cost_month = float(cost_result or 0)

    # MTTR: mean time to repair (average labor hours of completed WOs)
    mttr_result = db.query(func.avg(models.WorkOrder.labor_hours)).filter(
        models.WorkOrder.status == models.WorkOrderStatus.completed,
        models.WorkOrder.labor_hours > 0,
    ).scalar()
    avg_mttr = float(mttr_result or 0)

    # Availability: active / total * 100
    availability = (active_equipment / total_equipment * 100) if total_equipment > 0 else 100

    # MTBF simplified: avg days between maintenances
    completed_wos = db.query(models.WorkOrder).filter(
        models.WorkOrder.status == models.WorkOrderStatus.completed
    ).count()
    avg_mtbf = (365 / (completed_wos / max(active_equipment, 1))) if completed_wos > 0 else 0

    return schemas.DashboardStats(
        total_equipment=total_equipment,
        active_equipment=active_equipment,
        in_maintenance=in_maintenance,
        inactive=inactive,
        pending_work_orders=pending_wo,
        in_progress_work_orders=in_progress_wo,
        completed_this_month=completed_month,
        overdue_maintenance=overdue,
        pending_alerts=pending_alerts,
        low_stock_items=low_stock,
        total_cost_this_month=total_cost_month,
        avg_mtbf_days=round(avg_mtbf, 1),
        avg_mttr_hours=round(avg_mttr, 1),
        availability_percent=round(availability, 1),
    )


@router.get("/cost-by-equipment")
async def cost_by_equipment(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    results = db.query(
        models.Equipment.name,
        models.Equipment.code,
        models.Equipment.total_maintenance_cost,
        models.Equipment.criticality,
    ).order_by(models.Equipment.total_maintenance_cost.desc()).limit(limit).all()
    return [{"name": r[0], "code": r[1], "cost": r[2] or 0, "criticality": str(r[3].value if r[3] else "")} for r in results]


@router.get("/wo-by-month")
async def wo_by_month(
    year: int = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    year = year or date.today().year
    results = db.query(
        extract("month", models.WorkOrder.created_at).label("month"),
        models.WorkOrder.status,
        func.count(models.WorkOrder.id).label("count"),
    ).filter(
        extract("year", models.WorkOrder.created_at) == year
    ).group_by("month", models.WorkOrder.status).all()

    months = {i: {"month": i, "pending": 0, "in_progress": 0, "completed": 0, "cancelled": 0} for i in range(1, 13)}
    for row in results:
        m = int(row[0]) if row[0] else 0
        if m in months:
            status_key = str(row[1].value if hasattr(row[1], 'value') else row[1])
            if status_key in months[m]:
                months[m][status_key] = row[2]
    return list(months.values())


@router.get("/equipment-by-status")
async def equipment_by_status(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    results = db.query(
        models.Equipment.status,
        func.count(models.Equipment.id)
    ).group_by(models.Equipment.status).all()
    return [{"status": str(r[0].value if hasattr(r[0], 'value') else r[0]), "count": r[1]} for r in results]


@router.get("/equipment-by-criticality")
async def equipment_by_criticality(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    results = db.query(
        models.Equipment.criticality,
        func.count(models.Equipment.id)
    ).group_by(models.Equipment.criticality).all()
    return [{"criticality": str(r[0].value if hasattr(r[0], 'value') else r[0]), "count": r[1]} for r in results]


@router.get("/upcoming-maintenance")
async def upcoming_maintenance(
    days: int = 14,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    from datetime import timedelta
    today = date.today()
    end = today + timedelta(days=days)
    equipment = db.query(models.Equipment).filter(
        models.Equipment.next_maintenance.isnot(None),
        models.Equipment.next_maintenance <= end,
        models.Equipment.status == models.EquipmentStatus.active,
    ).order_by(models.Equipment.next_maintenance).limit(10).all()
    return [{
        "id": eq.id,
        "name": eq.name,
        "code": eq.code,
        "next_maintenance": str(eq.next_maintenance),
        "criticality": str(eq.criticality.value if hasattr(eq.criticality, 'value') else eq.criticality),
        "days_until": (eq.next_maintenance - today).days,
    } for eq in equipment]
