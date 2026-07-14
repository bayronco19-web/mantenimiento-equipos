from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from .database import engine, Base
from .routers import auth, equipment, maintenance, work_orders, inventory, lifecycle, alerts, dashboard, reports, price_comparison

Base.metadata.create_all(bind=engine)

_BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(os.path.join(_BASE_DIR, "static", "qr"), exist_ok=True)
os.makedirs(os.path.join(_BASE_DIR, "static", "photos"), exist_ok=True)

FRONTEND_DIST = os.path.join(_BASE_DIR, "static", "dist")

app = FastAPI(
    title="CMMS - Sistema de Gestión de Mantenimiento",
    description="Sistema completo para mantenimiento de equipos industriales",
    version="1.0.0",
)

_ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=os.path.join(_BASE_DIR, "static")), name="static")

API_PREFIX = "/api"
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(equipment.router, prefix=API_PREFIX)
app.include_router(maintenance.router, prefix=API_PREFIX)
app.include_router(work_orders.router, prefix=API_PREFIX)
app.include_router(inventory.router, prefix=API_PREFIX)
app.include_router(lifecycle.router, prefix=API_PREFIX)
app.include_router(alerts.router, prefix=API_PREFIX)
app.include_router(dashboard.router, prefix=API_PREFIX)
app.include_router(reports.router, prefix=API_PREFIX)
app.include_router(price_comparison.router, prefix=API_PREFIX)


@app.get("/health")
async def health():
    return {"status": "ok"}


# Serve React build (production mode) — must be LAST
if os.path.isdir(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Serve static files from dist if they exist
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        # Fallback: always return index.html so React Router handles routing
        index = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.isfile(index):
            return FileResponse(index)
        return {"message": "CMMS API funcionando. Frontend no compilado."}
else:
    @app.get("/")
    async def root():
        return {"message": "CMMS API - Sistema de Mantenimiento", "docs": "/docs"}
