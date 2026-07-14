from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user, require_admin_or_supervisor

router = APIRouter(prefix="/price-comparison", tags=["price-comparison"])


def _sort_offers(product: models.Product):
    product.offers.sort(key=lambda o: o.price)
    return product


def _best_price(product: models.Product) -> Optional[float]:
    prices = [o.price for o in product.offers]
    return min(prices) if prices else None


# ─── CATEGORIES ──────────────────────────────────────────────────────────────

@router.get("/categories/", response_model=List[schemas.PriceCategoryOut])
async def list_categories(db: Session = Depends(get_db),
                          current_user: models.User = Depends(get_current_user)):
    return db.query(models.PriceCategory).order_by(models.PriceCategory.name).all()


@router.post("/categories/", response_model=schemas.PriceCategoryOut)
async def create_category(data: schemas.PriceCategoryCreate, db: Session = Depends(get_db),
                          current_user: models.User = Depends(require_admin_or_supervisor)):
    cat = models.PriceCategory(**data.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/categories/{category_id}")
async def delete_category(category_id: int, db: Session = Depends(get_db),
                          current_user: models.User = Depends(require_admin_or_supervisor)):
    cat = db.query(models.PriceCategory).filter(models.PriceCategory.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    db.delete(cat)
    db.commit()
    return {"detail": "Categoría eliminada"}


# ─── STORES ──────────────────────────────────────────────────────────────────

@router.get("/stores/", response_model=List[schemas.StoreOut])
async def list_stores(db: Session = Depends(get_db),
                      current_user: models.User = Depends(get_current_user)):
    return db.query(models.Store).order_by(models.Store.name).all()


@router.post("/stores/", response_model=schemas.StoreOut)
async def create_store(data: schemas.StoreCreate, db: Session = Depends(get_db),
                       current_user: models.User = Depends(require_admin_or_supervisor)):
    if db.query(models.Store).filter(models.Store.name == data.name).first():
        raise HTTPException(status_code=400, detail="Ya existe una tienda con ese nombre")
    store = models.Store(**data.model_dump())
    db.add(store)
    db.commit()
    db.refresh(store)
    return store


@router.put("/stores/{store_id}", response_model=schemas.StoreOut)
async def update_store(store_id: int, data: schemas.StoreUpdate, db: Session = Depends(get_db),
                       current_user: models.User = Depends(require_admin_or_supervisor)):
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Tienda no encontrada")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(store, field, value)
    db.commit()
    db.refresh(store)
    return store


@router.delete("/stores/{store_id}")
async def delete_store(store_id: int, db: Session = Depends(get_db),
                       current_user: models.User = Depends(require_admin_or_supervisor)):
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Tienda no encontrada")
    db.delete(store)
    db.commit()
    return {"detail": "Tienda eliminada"}


# ─── PRODUCTS ────────────────────────────────────────────────────────────────

@router.get("/products/")
async def list_products(
    search: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    sort: str = Query("price_asc", pattern="^(price_asc|price_desc|name)$"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.Product).options(
        joinedload(models.Product.category),
        joinedload(models.Product.offers).joinedload(models.ProductOffer.store),
    )
    if search:
        q = q.filter(models.Product.name.ilike(f"%{search}%"))
    if category_id:
        q = q.filter(models.Product.category_id == category_id)
    products = q.all()

    results = []
    for p in products:
        _sort_offers(p)
        results.append({
            "id": p.id,
            "name": p.name,
            "category_id": p.category_id,
            "brand": p.brand,
            "sku": p.sku,
            "description": p.description,
            "image_url": p.image_url,
            "created_at": p.created_at,
            "category": schemas.PriceCategoryOut.model_validate(p.category) if p.category else None,
            "offers": [schemas.ProductOfferOut.model_validate(o) for o in p.offers],
            "best_price": _best_price(p),
        })

    if sort == "name":
        results.sort(key=lambda r: r["name"].lower())
    elif sort == "price_desc":
        results.sort(key=lambda r: (r["best_price"] is None, -(r["best_price"] or 0)))
    else:  # price_asc
        results.sort(key=lambda r: (r["best_price"] is None, r["best_price"] or 0))

    return results


@router.post("/products/", response_model=schemas.ProductOut)
async def create_product(data: schemas.ProductCreate, db: Session = Depends(get_db),
                         current_user: models.User = Depends(require_admin_or_supervisor)):
    product = models.Product(**data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/products/{product_id}", response_model=schemas.ProductOut)
async def get_product(product_id: int, db: Session = Depends(get_db),
                      current_user: models.User = Depends(get_current_user)):
    product = db.query(models.Product).options(
        joinedload(models.Product.category),
        joinedload(models.Product.offers).joinedload(models.ProductOffer.store),
    ).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return _sort_offers(product)


@router.put("/products/{product_id}", response_model=schemas.ProductOut)
async def update_product(product_id: int, data: schemas.ProductUpdate, db: Session = Depends(get_db),
                         current_user: models.User = Depends(require_admin_or_supervisor)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/products/{product_id}")
async def delete_product(product_id: int, db: Session = Depends(get_db),
                         current_user: models.User = Depends(require_admin_or_supervisor)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    db.delete(product)
    db.commit()
    return {"detail": "Producto eliminado"}


# ─── OFFERS (precios por tienda) ─────────────────────────────────────────────

@router.post("/products/{product_id}/offers", response_model=schemas.ProductOfferOut)
async def create_offer(product_id: int, data: schemas.ProductOfferCreate, db: Session = Depends(get_db),
                       current_user: models.User = Depends(require_admin_or_supervisor)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    store = db.query(models.Store).filter(models.Store.id == data.store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Tienda no encontrada")
    offer = models.ProductOffer(product_id=product_id, **data.model_dump())
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer


@router.put("/offers/{offer_id}", response_model=schemas.ProductOfferOut)
async def update_offer(offer_id: int, data: schemas.ProductOfferUpdate, db: Session = Depends(get_db),
                       current_user: models.User = Depends(require_admin_or_supervisor)):
    offer = db.query(models.ProductOffer).filter(models.ProductOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Precio no encontrado")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(offer, field, value)
    db.commit()
    db.refresh(offer)
    return offer


@router.delete("/offers/{offer_id}")
async def delete_offer(offer_id: int, db: Session = Depends(get_db),
                       current_user: models.User = Depends(require_admin_or_supervisor)):
    offer = db.query(models.ProductOffer).filter(models.ProductOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Precio no encontrado")
    db.delete(offer)
    db.commit()
    return {"detail": "Precio eliminado"}
