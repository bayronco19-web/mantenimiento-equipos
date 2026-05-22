@echo off
setlocal enabledelayedexpansion
title CMMS - Construir App Windows (.exe)
color 0B
cls

echo.
echo  ============================================================
echo   CMMS - Construir instalador Windows (.exe)
echo  ============================================================
echo.

set "FRONTEND=C:\Users\bayro\mantenimiento-equipos\frontend"
set "PATH=%PATH%;C:\Program Files\nodejs"

:: Verificar configuracion
if not exist "%~dp0config_nube.txt" (
    echo  [ERROR] Primero ejecuta CONFIGURAR_NUBE.bat
    pause & exit /b 1
)
for /f "tokens=2 delims==" %%A in ('type "%~dp0config_nube.txt"') do set RAILWAY_URL=%%A
echo  URL configurada: !RAILWAY_URL!
echo.

:: Limpiar compilacion anterior
if exist "%FRONTEND%\dist-electron" (
    echo  [0/4] Limpiando compilacion anterior...
    rd /s /q "%FRONTEND%\dist-electron" 2>nul
    echo  [OK] Listo.
    echo.
)

:: Instalar dependencias si falta electron
if not exist "%FRONTEND%\node_modules\electron" (
    echo  [1/4] Instalando Electron (primera vez, ~200 MB, espera)...
    cd /d "%FRONTEND%"
    call npm install
    if errorlevel 1 ( echo [ERROR] npm install fallo. & pause & exit /b 1 )
    echo  [OK] Dependencias instaladas.
) else (
    echo  [1/4] Dependencias: OK
)

:: Build del frontend
echo  [2/4] Compilando app con URL de Railway...
cd /d "%FRONTEND%"
call npm run build
if errorlevel 1 ( echo [ERROR] Build fallo. & pause & exit /b 1 )
echo  [OK] App compilada.

:: Build del directorio de Electron (siempre funciona, sin permisos admin)
echo  [3/4] Generando archivos de la app...
cd /d "%FRONTEND%"
set CSC_IDENTITY_AUTO_DISCOVERY=false
set WIN_CSC_LINK=
set CSC_LINK=
call node "%FRONTEND%\node_modules\electron-builder\out\cli\cli.js" --win dir --x64 --publish=never
if errorlevel 1 ( echo [ERROR] Electron build fallo. & pause & exit /b 1 )
echo  [OK] App generada.

:: Crear ZIP portable con PowerShell
echo  [4/4] Creando archivo ZIP portable...
set "ZIPOUT=%FRONTEND%\dist-electron\CMMS-Mantenimiento-Portable.zip"
if exist "%ZIPOUT%" del /f /q "%ZIPOUT%"
powershell -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('%FRONTEND%\dist-electron\win-unpacked', '%ZIPOUT%')"
if errorlevel 1 ( echo [ERROR] No se pudo crear el ZIP. & pause & exit /b 1 )
echo  [OK] ZIP creado.

echo.
echo  ============================================================
echo   LISTO^^! Archivos generados en: frontend\dist-electron\
echo.
echo   CMMS-Mantenimiento-Portable.zip  ^<-- Enviar a los usuarios
echo.
echo   INSTRUCCIONES PARA EL USUARIO:
echo   1. Descomprimir el ZIP en cualquier carpeta
echo   2. Abrir la carpeta y ejecutar "CMMS Mantenimiento.exe"
echo   3. El programa abrira la app conectada a Railway
echo.
echo   (Si quieres un instalador .exe formal, ejecuta este
echo    script con clic derecho - Ejecutar como administrador)
echo  ============================================================
echo.

:: Intentar crear instalador NSIS si hay permisos de admin
net session >nul 2>&1
if %errorLevel% == 0 (
    echo  Detectado: Ejecutando como Administrador.
    echo  Generando instalador .exe NSIS adicional...
    cd /d "%FRONTEND%"
    call node "%FRONTEND%\node_modules\electron-builder\out\cli\cli.js" --win nsis --x64 --publish=never
    if not errorlevel 1 (
        echo  [OK] Instalador .exe generado tambien^^!
        echo  Archivo: CMMS Mantenimiento Setup 1.0.0.exe
    )
    echo.
)

start "" "%FRONTEND%\dist-electron"
pause
