from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user, require_admin_or_supervisor

router = APIRouter(prefix="/inventory", tags=["inventory"])


# ─── TOOLS ───────────────────────────────────────────────────────────────────

@router.get("/tools", response_model=List[schemas.ToolOut])
async def list_tools(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.Tool)
    if search:
        q = q.filter(models.Tool.name.ilike(f"%{search}%"))
    if category:
        q = q.filter(models.Tool.category == category)
    return q.all()


@router.post("/tools", response_model=schemas.ToolOut)
async def create_tool(
    data: schemas.ToolCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_supervisor),
):
    tool = models.Tool(**data.model_dump())
    db.add(tool)
    db.commit()
    db.refresh(tool)
    return tool


@router.put("/tools/{tool_id}", response_model=schemas.ToolOut)
async def update_tool(
    tool_id: int,
    data: schemas.ToolCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_supervisor),
):
    tool = db.query(models.Tool).filter(models.Tool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Herramienta no encontrada")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(tool, field, value)
    db.commit()
    db.refresh(tool)
    return tool


@router.delete("/tools/{tool_id}")
async def delete_tool(tool_id: int, db: Session = Depends(get_db),
                      current_user: models.User = Depends(require_admin_or_supervisor)):
    tool = db.query(models.Tool).filter(models.Tool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Herramienta no encontrada")
    db.delete(tool)
    db.commit()
    return {"detail": "Herramienta eliminada"}


# ─── CONSUMABLES ─────────────────────────────────────────────────────────────

@router.get("/consumables", response_model=List[schemas.ConsumableOut])
async def list_consumables(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    low_stock: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.Consumable)
    if search:
        q = q.filter(models.Consumable.name.ilike(f"%{search}%"))
    if category:
        q = q.filter(models.Consumable.category == category)
    if low_stock:
        q = q.filter(models.Consumable.stock_quantity <= models.Consumable.min_stock)
    return q.all()


@router.post("/consumables", response_model=schemas.ConsumableOut)
async def create_consumable(
    data: schemas.ConsumableCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_supervisor),
):
    consumable = models.Consumable(**data.model_dump())
    db.add(consumable)
    db.commit()
    db.refresh(consumable)
    return consumable


@router.put("/consumables/{consumable_id}", response_model=schemas.ConsumableOut)
async def update_consumable(
    consumable_id: int,
    data: schemas.ConsumableUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_supervisor),
):
    c = db.query(models.Consumable).filter(models.Consumable.id == consumable_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(c, field, value)
    db.commit()
    db.refresh(c)
    return c


@router.post("/consumables/{consumable_id}/restock")
async def restock_consumable(
    consumable_id: int,
    quantity: float,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_supervisor),
):
    c = db.query(models.Consumable).filter(models.Consumable.id == consumable_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    c.stock_quantity += quantity
    c.last_restocked = date.today()
    db.commit()
    return {"detail": f"Stock actualizado: {c.stock_quantity} {c.unit}"}


# ─── SPARE PARTS ─────────────────────────────────────────────────────────────

@router.get("/spare-parts", response_model=List[schemas.SparePartOut])
async def list_spare_parts(
    search: Optional[str] = Query(None),
    low_stock: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.SparePart)
    if search:
        q = q.filter(models.SparePart.name.ilike(f"%{search}%"))
    if low_stock:
        q = q.filter(models.SparePart.stock_quantity <= models.SparePart.min_stock)
    return q.all()


@router.post("/spare-parts", response_model=schemas.SparePartOut)
async def create_spare_part(
    data: schemas.SparePartCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_supervisor),
):
    part = models.SparePart(**data.model_dump())
    db.add(part)
    db.commit()
    db.refresh(part)
    return part


@router.put("/spare-parts/{part_id}", response_model=schemas.SparePartOut)
async def update_spare_part(
    part_id: int,
    data: schemas.SparePartCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_supervisor),
):
    part = db.query(models.SparePart).filter(models.SparePart.id == part_id).first()
    if not part:
        raise HTTPException(status_code=404, detail="Repuesto no encontrado")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(part, field, value)
    db.commit()
    db.refresh(part)
    return part


@router.get("/summary")
async def inventory_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    total_tools = db.query(models.Tool).count()
    total_consumables = db.query(models.Consumable).count()
    low_stock_consumables = db.query(models.Consumable).filter(
        models.Consumable.stock_quantity <= models.Consumable.min_stock
    ).count()
    total_spare_parts = db.query(models.SparePart).count()
    low_stock_parts = db.query(models.SparePart).filter(
        models.SparePart.stock_quantity <= models.SparePart.min_stock
    ).count()
    calibration_due = db.query(models.Tool).filter(
        models.Tool.requires_calibration == True,
        models.Tool.next_calibration <= date.today()
    ).count()
    return {
        "total_tools": total_tools,
        "total_consumables": total_consumables,
        "low_stock_consumables": low_stock_consumables,
        "total_spare_parts": total_spare_parts,
        "low_stock_parts": low_stock_parts,
        "calibration_due": calibration_due,
    }
