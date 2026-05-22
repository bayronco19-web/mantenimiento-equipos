@echo off
title CMMS - Sistema de Mantenimiento
color 0A
cls

echo.
echo  ==========================================
echo   CMMS - Sistema de Mantenimiento
echo  ==========================================
echo.
echo  Arrancando el sistema, por favor espere...
echo.

set "NODE=C:\Program Files\nodejs"
set "BACKEND=C:\Users\bayro\mantenimiento-equipos\backend"
set "FRONTEND=C:\Users\bayro\mantenimiento-equipos\frontend"
set "PYTHON=%BACKEND%\venv\Scripts\python.exe"

:: ── BACKEND ──────────────────────────────────────────────────────────────
echo  [1/2] Iniciando Backend (puerto 8000)...
start "CMMS Backend" /min "%PYTHON%" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --app-dir "%BACKEND%"
timeout /t 6 /nobreak >nul

:: Verificar backend
curl -s http://localhost:8000/docs >nul 2>&1
if %errorlevel% neq 0 (
    echo  [!] Backend tardando en iniciar, espere...
    timeout /t 5 /nobreak >nul
)
echo  [OK] Backend listo
echo.

:: ── FRONTEND ─────────────────────────────────────────────────────────────
echo  [2/2] Iniciando Frontend (puerto 5173)...
start "CMMS Frontend" cmd /k "set PATH=%PATH%;%NODE% && cd /d %FRONTEND% && npm run dev"
timeout /t 10 /nobreak >nul
echo  [OK] Frontend listo
echo.

:: ── ABRIR NAVEGADOR ──────────────────────────────────────────────────────
echo  ==========================================
echo.
echo   Abriendo en el navegador...
echo.
echo      http://localhost:5173
echo.
echo   Usuario:    admin
echo   Contrasena: admin123
echo.
echo  ==========================================
echo.

start "" "http://localhost:5173"

echo  Mantener abiertas las ventanas:
echo    - "CMMS Backend"
echo    - "CMMS Frontend"
echo.
echo  Puedes cerrar ESTA ventana.
echo.
pause
