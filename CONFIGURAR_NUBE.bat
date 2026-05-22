@echo off
setlocal enabledelayedexpansion
title CMMS - Configurar URL de Railway
color 0A
cls

echo.
echo  ============================================================
echo   CMMS - Paso 1: Configurar la URL de Railway
echo  ============================================================
echo.
echo  Necesitas la URL de tu app en Railway.
echo  Ejemplo: https://cmms-production-abc.railway.app
echo.
echo  Si aun no la tienes, sigue estos pasos en railway.app:
echo   1. Crear cuenta gratuita en railway.app
echo   2. New Project ^> Deploy from GitHub ^> selecciona tu repo
echo      (o usar Railway CLI: npm install -g @railway/cli)
echo   3. En Settings ^> Domains ^> copiar la URL
echo.
set /p RAILWAY_URL="  Pega aqui tu URL de Railway: "

if "!RAILWAY_URL!"=="" (
    echo  [ERROR] No ingresaste una URL.
    pause & exit /b 1
)

:: Validar que empieze con https
echo !RAILWAY_URL! | findstr /i "https://" > nul
if errorlevel 1 (
    echo  [ERROR] La URL debe empezar con https://
    pause & exit /b 1
)

echo.
echo  [OK] URL configurada: !RAILWAY_URL!
echo.

:: Guardar en archivo de configuracion
echo RAILWAY_URL=!RAILWAY_URL!> "%~dp0config_nube.txt"

:: Actualizar electron/main.js con la URL real
set "MAIN_JS=C:\Users\bayro\mantenimiento-equipos\frontend\electron\main.js"
powershell -Command "(Get-Content '%MAIN_JS%') -replace 'https://PENDIENTE\.railway\.app', '!RAILWAY_URL!' | Set-Content '%MAIN_JS%'"
echo  [OK] App Windows configurada con la URL.

:: Crear archivo .env para builds del frontend
echo VITE_API_URL=!RAILWAY_URL!/api> "C:\Users\bayro\mantenimiento-equipos\frontend\.env.production"
echo  [OK] Frontend configurado.

echo.
echo  ============================================================
echo   Siguiente paso: ejecuta BUILD_APP_WINDOWS.bat
echo   para generar el instalador .exe
echo  ============================================================
echo.
pause
