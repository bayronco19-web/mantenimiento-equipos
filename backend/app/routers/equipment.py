from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import date
import qrcode
import qrcode.image.svg
import os
import socket
import shutil
import uuid
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user, require_admin_or_supervisor

router = APIRouter(prefix="/equipment", tags=["equipment"])

# Ruta absoluta al directorio del backend
_BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
QR_DIR = os.path.join(_BASE_DIR, "static", "qr")
PHOTOS_DIR = os.path.join(_BASE_DIR, "static", "photos")
os.makedirs(QR_DIR, exist_ok=True)
os.makedirs(PHOTOS_DIR, exist_ok=True)


def get_local_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "localhost"


def generate_qr(equipment_id: int, code: str) -> str:
    local_ip = get_local_ip()
    url = f"http://{local_ip}:5173/scan/{equipment_id}"

    qr = qrcode.QRCode(version=1, box_size=8, border=4,
                        error_correction=qrcode.constants.ERROR_CORRECT_M)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    path = os.path.join(QR_DIR, f"eq_{equipment_id}.png")
    img.save(path)
    return path


@router.get("/", response_model=List[schemas.EquipmentOut])
async def list_equipment(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    criticality: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    area: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.Equipment)
    if search:
        q = q.filter(or_(
            models.Equipment.name.ilike(f"%{search}%"),
            models.Equipment.code.ilike(f"%{search}%"),
            models.Equipment.brand.ilike(f"%{search}%"),
            models.Equipment.serial_number.ilike(f"%{search}%"),
        ))
    if status:
        q = q.filter(models.Equipment.status == status)
    if criticality:
        q = q.filter(models.Equipment.criticality == criticality)
    if category_id:
        q = q.filter(models.Equipment.category_id == category_id)
    if area:
        q = q.filter(models.Equipment.area.ilike(f"%{area}%"))
    return q.offset(skip).limit(limit).all()


@router.post("/", response_model=schemas.EquipmentOut)
async def create_equipment(
    data: schemas.EquipmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_supervisor),
):
    if db.query(models.Equipment).filter(models.Equipment.code == data.code).first():
        raise HTTPException(status_code=400, detail="El código de equipo ya existe")
    equipment = models.Equipment(**data.model_dump())
    db.add(equipment)
    db.commit()
    db.refresh(equipment)
    qr_path = generate_qr(equipment.id, equipment.code)
    equipment.qr_code_url = qr_path
    db.commit()
    db.refresh(equipment)
    return equipment


@router.get("/{equipment_id}", response_model=schemas.EquipmentOut)
async def get_equipment(equipment_id: int, db: Session = Depends(get_db),
                        current_user: models.User = Depends(get_current_user)):
    eq = db.query(models.Equipment).filter(models.Equipment.id == equipment_id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    return eq


@router.put("/{equipment_id}", response_model=schemas.EquipmentOut)
async def update_equipment(
    equipment_id: int,
    data: schemas.EquipmentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_supervisor),
):
    eq = db.query(models.Equipment).filter(models.Equipment.id == equipment_id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(eq, field, value)
    db.commit()
    db.refresh(eq)
    return eq


@router.delete("/{equipment_id}")
async def delete_equipment(equipment_id: int, db: Session = Depends(get_db),
                           current_user: models.User = Depends(require_admin_or_supervisor)):
    eq = db.query(models.Equipment).filter(models.Equipment.id == equipment_id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    db.delete(eq)
    db.commit()
    return {"detail": "Equipo eliminado"}


@router.get("/{equipment_id}/qr")
async def get_qr_code(equipment_id: int, db: Session = Depends(get_db)):
    eq = db.query(models.Equipment).filter(models.Equipment.id == equipment_id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    if not eq.qr_code_url or not os.path.exists(eq.qr_code_url):
        qr_path = generate_qr(eq.id, eq.code)
        eq.qr_code_url = qr_path
        db.commit()
    return FileResponse(eq.qr_code_url, media_type="image/png")


@router.post("/{equipment_id}/photo")
async def upload_equipment_photo(
    equipment_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    eq = db.query(models.Equipment).filter(models.Equipment.id == equipment_id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    ext = os.path.splitext(file.filename or "photo.jpg")[1].lower() or ".jpg"
    if ext not in (".jpg", ".jpeg", ".png", ".webp"):
        raise HTTPException(status_code=400, detail="Formato no permitido. Use JPG, PNG o WebP.")
    filename = f"eq_{equipment_id}_{uuid.uuid4().hex[:8]}{ext}"
    save_path = os.path.join(PHOTOS_DIR, filename)
    with open(save_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    eq.image_url = f"/static/photos/{filename}"
    db.commit()
    return {"image_url": eq.image_url}


@router.get("/{equipment_id}/tools-needed")
async def get_equipment_tools(equipment_id: int, db: Session = Depends(get_db),
                              current_user: models.User = Depends(get_current_user)):
    """Devuelve todas las herramientas e insumos necesarios para los planes de mantenimiento del equipo."""
    eq = db.query(models.Equipment).filter(models.Equipment.id == equipment_id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")

    plans = db.query(models.MaintenancePlan).filter(
        models.MaintenancePlan.equipment_id == equipment_id,
        models.MaintenancePlan.is_active == True,
    ).all()

    tools_map: dict = {}
    consumables_map: dict = {}

    for plan in plans:
        for pt in plan.plan_tools:
            t = pt.tool
            if t.id not in tools_map:
                tools_map[t.id] = {
                    "tool_id": t.id, "name": t.name, "code": t.code,
                    "category": t.category, "quantity": pt.quantity,
                    "condition": t.condition, "location": t.location,
                    "requires_calibration": t.requires_calibration,
                    "plans": [plan.name],
                }
            else:
                tools_map[t.id]["quantity"] = max(tools_map[t.id]["quantity"], pt.quantity)
                if plan.name not in tools_map[t.id]["plans"]:
                    tools_map[t.id]["plans"].append(plan.name)

        for pc in plan.plan_consumables:
            c = pc.consumable
            if c.id not in consumables_map:
                consumables_map[c.id] = {
                    "consumable_id": c.id, "name": c.name, "code": c.code,
                    "category": c.category, "unit": c.unit,
                    "quantity_per_maintenance": pc.quantity,
                    "stock_quantity": c.stock_quantity, "min_stock": c.min_stock,
                    "stock_ok": c.stock_quantity >= pc.quantity,
                    "plans": [plan.name],
                }
            else:
                consumables_map[c.id]["quantity_per_maintenance"] += pc.quantity
                consumables_map[c.id]["stock_ok"] = (
                    c.stock_quantity >= consumables_map[c.id]["quantity_per_maintenance"]
                )
                if plan.name not in consumables_map[c.id]["plans"]:
                    consumables_map[c.id]["plans"].append(plan.name)

    return {
        "equipment_id": equipment_id,
        "equipment_name": eq.name,
        "equipment_code": eq.code,
        "total_plans": len(plans),
        "tools": list(tools_map.values()),
        "consumables": list(consumables_map.values()),
    }


@router.get("/categories/", response_model=List[schemas.CategoryOut])
async def list_categories(db: Session = Depends(get_db),
                          current_user: models.User = Depends(get_current_user)):
    return db.query(models.EquipmentCategory).all()


@router.post("/categories/", response_model=schemas.CategoryOut)
async def create_category(data: schemas.CategoryCreate, db: Session = Depends(get_db),
                          current_user: models.User = Depends(require_admin_or_supervisor)):
    cat = models.EquipmentCategory(**data.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat
