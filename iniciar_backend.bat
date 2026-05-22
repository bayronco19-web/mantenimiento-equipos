@echo off
echo ============================================
echo  CMMS - Iniciando Backend (FastAPI)
echo ============================================
cd /d "%~dp0backend"

echo.
echo [1/3] Creando entorno virtual...
if not exist venv (
    python -m venv venv
    echo Entorno virtual creado.
) else (
    echo Entorno virtual ya existe.
)

echo.
echo [2/3] Instalando dependencias...
call venv\Scripts\activate
pip install -r requirements.txt --quiet

echo.
echo [3/3] Cargando datos iniciales y arrancando servidor...
python seed.py
echo.
echo ============================================
echo  Backend corriendo en: http://localhost:8000
echo  Documentacion API:    http://localhost:8000/docs
echo ============================================
echo.
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pause
