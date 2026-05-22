from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date, timedelta
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user, require_admin_or_supervisor

router = APIRouter(prefix="/alerts", tags=["alerts"])


def generate_system_alerts(db: Session):
    today = date.today()
    soon = today + timedelta(days=30)

    existing_types = {
        (a.equipment_id, str(a.type)): a
        for a in db.query(models.Alert).filter(
            models.Alert.status == models.AlertStatus.pending
        ).all()
    }

    # Mantenimientos vencidos o próximos
    for eq in db.query(models.Equipment).filter(
        models.Equipment.status == models.EquipmentStatus.active,
        models.Equipment.next_maintenance.isnot(None),
    ).all():
        key = (eq.id, "maintenance_due")
        if key not in existing_types:
            if eq.next_maintenance <= today:
                msg = f"VENCIDO: Mantenimiento de {eq.name} ({eq.code}) debió realizarse el {eq.next_maintenance}"
                priority = models.WorkOrderPriority.critical
            elif eq.next_maintenance <= soon:
                days = (eq.next_maintenance - today).days
                msg = f"Mantenimiento de {eq.name} ({eq.code}) programado en {days} días"
                priority = models.WorkOrderPriority.high if days <= 7 else models.WorkOrderPriority.medium
            else:
                continue
            db.add(models.Alert(
                type=models.AlertType.maintenance_due,
                equipment_id=eq.id,
                message=msg,
                due_date=eq.next_maintenance,
                priority=priority,
            ))

    # Garantías por vencer
    for eq in db.query(models.Equipment).filter(
        models.Equipment.warranty_expiry.isnot(None),
        models.Equipment.warranty_expiry >= today,
        models.Equipment.warranty_expiry <= soon,
    ).all():
        key = (eq.id, "warranty_expiry")
        if key not in existing_types:
            days = (eq.warranty_expiry - today).days
            db.add(models.Alert(
                type=models.AlertType.warranty_expiry,
                equipment_id=eq.id,
                message=f"Garantía de {eq.name} ({eq.code}) vence en {days} días",
                due_date=eq.warranty_expiry,
                priority=models.WorkOrderPriority.medium,
            ))

    # Stock bajo de insumos
    for c in db.query(models.Consumable).filter(
        models.Consumable.stock_quantity <= models.Consumable.min_stock
    ).all():
        key = (None, "low_stock")
        existing_for_c = db.query(models.Alert).filter(
            models.Alert.type == models.AlertType.low_stock,
            models.Alert.consumable_id == c.id,
            models.Alert.status == models.AlertStatus.pending,
        ).first()
        if not existing_for_c:
            db.add(models.Alert(
                type=models.AlertType.low_stock,
                consumable_id=c.id,
                message=f"Stock bajo: {c.name} ({c.stock_quantity} {c.unit} — mín: {c.min_stock})",
                priority=models.WorkOrderPriority.high,
            ))

    # Calibraciones vencidas o próximas
    for t in db.query(models.Tool).filter(
        models.Tool.requires_calibration == True,
        models.Tool.next_calibration.isnot(None),
        models.Tool.next_calibration <= soon,
    ).all():
        existing_for_t = db.query(models.Alert).filter(
            models.Alert.type == models.AlertType.calibration_due,
            models.Alert.status == models.AlertStatus.pending,
        ).filter(models.Alert.message.contains(t.name)).first()
        if not existing_for_t:
            db.add(models.Alert(
                type=models.AlertType.calibration_due,
                message=f"Calibración requerida: {t.name} — próxima: {t.next_calibration}",
                due_date=t.next_calibration,
                priority=models.WorkOrderPriority.medium,
            ))

    db.commit()


@router.get("/", response_model=List[schemas.AlertOut])
async def list_alerts(
    status: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    generate_system_alerts(db)
    q = db.query(models.Alert)
    if status:
        q = q.filter(models.Alert.status == status)
    return q.order_by(models.Alert.created_at.desc()).all()


@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    from datetime import datetime, timezone
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    alert.status = models.AlertStatus.acknowledged
    alert.acknowledged_at = datetime.now(timezone.utc)
    alert.acknowledged_by = current_user.id
    db.commit()
    return {"detail": "Alerta reconocida"}


@router.post("/{alert_id}/resolve")
async def resolve_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    alert.status = models.AlertStatus.resolved
    db.commit()
    return {"detail": "Alerta resuelta"}


@router.get("/count")
async def count_alerts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    generate_system_alerts(db)
    pending = db.query(models.Alert).filter(models.Alert.status == models.AlertStatus.pending).count()
    acknowledged = db.query(models.Alert).filter(models.Alert.status == models.AlertStatus.acknowledged).count()
    return {"pending": pending, "acknowledged": acknowledged}
