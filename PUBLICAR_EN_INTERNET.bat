@echo off
setlocal enabledelayedexpansion
title CMMS - Publicar en Internet
color 0B
cls

echo.
echo  ============================================================
echo   CMMS - Publicar para acceso desde celular con datos moviles
echo  ============================================================
echo.

set "FRONTEND=C:\Users\bayro\mantenimiento-equipos\frontend"
set "BACKEND=C:\Users\bayro\mantenimiento-equipos\backend"
set "PYTHON=%BACKEND%\venv\Scripts\python.exe"
set "CLOUDFLARED=%~dp0cloudflared.exe"
set "PATH=%PATH%;C:\Program Files\nodejs"

:: ── PASO 1: Descargar cloudflared si no existe ────────────────────────────
if not exist "%CLOUDFLARED%" (
    echo  [1/4] Descargando herramienta de tunel ^(primera vez, ~30 MB^)...
    powershell -Command "try { Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '%CLOUDFLARED%' -UseBasicParsing; Write-Host '[OK] Descarga completa.' } catch { Write-Host '[ERROR]' $_.Exception.Message }"
    if not exist "%CLOUDFLARED%" (
        echo  [ERROR] No se pudo descargar. Verifica tu conexion a internet.
        pause & exit /b 1
    )
) else (
    echo  [1/4] Herramienta de tunel: lista
)

:: ── PASO 2: Construir el frontend ─────────────────────────────────────────
echo  [2/4] Construyendo la app...
cd /d "%FRONTEND%"
call npm run build > "%TEMP%\cmms_build.log" 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Fallo el build. Log: %TEMP%\cmms_build.log
    pause & exit /b 1
)
if exist "%BACKEND%\static\dist" rmdir /s /q "%BACKEND%\static\dist"
xcopy /e /i /q "%FRONTEND%\dist" "%BACKEND%\static\dist" > nul
echo  [OK] App compilada.

:: ── PASO 3: Iniciar backend ───────────────────────────────────────────────
echo  [3/4] Iniciando servidor...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":8000 "') do taskkill /PID %%a /F >nul 2>&1
start "CMMS Backend" /min "%PYTHON%" -m uvicorn app.main:app --host 0.0.0.0 --port 8000
timeout /t 5 /nobreak > nul
echo  [OK] Servidor corriendo.

:: ── PASO 4: Tunel y URL ───────────────────────────────────────────────────
echo  [4/4] Abriendo tunel a internet...
echo.

set "LOG=%TEMP%\cmms_tunnel.log"
if exist "%LOG%" del "%LOG%"

:: Iniciar cloudflared - guarda su output en el log
start "Tunel CMMS" /min "%CLOUDFLARED%" tunnel --url http://localhost:8000 --no-autoupdate --logfile "%LOG%" --loglevel info

:: Esperar y buscar la URL en el log (hasta 60 segundos)
set "PUBLIC_URL="
set /a TRIES=0
:BUSCAR_URL
timeout /t 3 /nobreak > nul
set /a TRIES+=1
powershell -Command "$log = '%LOG%'; if (Test-Path $log) { $c = Get-Content $log -Raw; $m = [regex]::Match($c,'https://[a-z0-9\-]+\.trycloudflare\.com'); if ($m.Success) { Write-Host $m.Value } }" > "%TEMP%\cmms_parsed_url.txt" 2>nul
set /p PUBLIC_URL= < "%TEMP%\cmms_parsed_url.txt"
if "!PUBLIC_URL!"=="" (
    if %TRIES% lss 20 (
        echo  Conectando con Cloudflare... ^(%TRIES%/20^)
        goto BUSCAR_URL
    )
    echo.
    echo  No se pudo obtener la URL automaticamente.
    echo  Abre la ventana "Tunel CMMS" y copia la URL https://....trycloudflare.com
    echo  Luego ejecuta ACTUALIZAR_URL_QR.bat con esa URL.
    goto FIN
)

:: Esperar a que el tunel este completamente listo
echo  Tunel listo. Esperando conexion estable...
timeout /t 10 /nobreak > nul

:: ── Mostrar URL ───────────────────────────────────────────────────────────
echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║  LINK PARA LOS TECNICOS:                                 ║
echo  ║                                                          ║
echo  ║  !PUBLIC_URL!
echo  ║                                                          ║
echo  ║  Enviar por WhatsApp - Abrir en Chrome - Instalar app    ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

:: ── Actualizar QR automaticamente ────────────────────────────────────────
echo  Actualizando codigos QR con el link publico...
"%PYTHON%" -c "
import sqlite3, os, qrcode
PUBLIC_URL = '!PUBLIC_URL!'
DB = r'%BACKEND%\cmms.db'
QR_DIR = r'%BACKEND%\static\qr'
os.makedirs(QR_DIR, exist_ok=True)
db = sqlite3.connect(DB)
for eq_id, code in db.execute('SELECT id, code FROM equipment').fetchall():
    url = f'{PUBLIC_URL}/scan/{eq_id}'
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M)
    qr.add_data(url); qr.make(fit=True)
    db.execute('UPDATE equipment SET qr_code_url=? WHERE id=?', (os.path.join(QR_DIR, f'eq_{eq_id}.png'), eq_id))
    qr.make_image(fill_color='black', back_color='white').save(os.path.join(QR_DIR, f'eq_{eq_id}.png'))
    print(f'  QR {code}: {url}')
db.commit(); db.close()
"
echo.
start "" "!PUBLIC_URL!"

:FIN
echo.
echo  ┌─────────────────────────────────────────────────────────┐
echo  │  IMPORTANTE: No cierres esta ventana.                   │
echo  │  El servidor se detiene cuando cierras esta ventana.    │
echo  └─────────────────────────────────────────────────────────┘
echo.
pause
