@echo off
setlocal enabledelayedexpansion
title CMMS - Construir PWA Movil
color 0B
cls

echo.
echo  ============================================================
echo   CMMS - Generar app movil (PWA) apuntando a Railway
echo  ============================================================
echo.

set "FRONTEND=C:\Users\bayro\mantenimiento-equipos\frontend"
set "BACKEND=C:\Users\bayro\mantenimiento-equipos\backend"
set "PATH=%PATH%;C:\Program Files\nodejs"

:: Verificar configuracion
if not exist "%~dp0config_nube.txt" (
    echo  [ERROR] Primero ejecuta CONFIGURAR_NUBE.bat
    pause & exit /b 1
)
for /f "tokens=2 delims==" %%A in ('type "%~dp0config_nube.txt"') do set RAILWAY_URL=%%A
echo  URL: !RAILWAY_URL!
echo.

:: Build con URL de Railway
echo  Compilando PWA con URL de produccion...
cd /d "%FRONTEND%"
call npm run build
if errorlevel 1 ( echo [ERROR] & pause & exit /b 1 )

:: Copiar al backend para servir localmente si se necesita
if exist "%BACKEND%\static\dist" rmdir /s /q "%BACKEND%\static\dist"
xcopy /e /i /q "%FRONTEND%\dist" "%BACKEND%\static\dist" > nul

echo  [OK] PWA generada.
echo.
echo  Los tecnicos instalan la app desde:
echo    !RAILWAY_URL!
echo.
echo  1. Abrir en Chrome del celular
echo  2. Chrome muestra "Instalar app CMMS"
echo  3. Tocar Instalar
echo.
pause
