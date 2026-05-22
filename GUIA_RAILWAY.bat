@echo off
title CMMS - Guia Railway
color 0E
cls

echo.
echo  ════════════════════════════════════════════════════════════
echo   CMMS - Guia para publicar en Railway (nube gratuita)
echo  ════════════════════════════════════════════════════════════
echo.
echo  Railway es un servicio gratuito que mantiene tu servidor
echo  encendido 24/7 sin necesidad de tener el PC prendido.
echo.
echo  ─────────────────────────────────────────────────────────
echo   PASO 1: Crear cuenta en Railway (5 minutos)
echo  ─────────────────────────────────────────────────────────
echo.
echo   1. Abre: https://railway.app
echo   2. Clic en "Login" ^> "Login with GitHub"
echo      ^(Si no tienes GitHub, crealo gratis en github.com^)
echo   3. Autoriza Railway
echo.
echo   Presiona una tecla para abrir railway.app en el navegador...
pause > nul
start "" "https://railway.app"

echo.
echo  ─────────────────────────────────────────────────────────
echo   PASO 2: Instalar Railway CLI
echo  ─────────────────────────────────────────────────────────
echo.
echo   En la ventana que se abre a continuacion, ejecuta:
echo     npm install -g @railway/cli
echo.
echo   Luego inicia sesion:
echo     railway login
echo.
start "Railway CLI" cmd /k "set PATH=%PATH%;C:\Program Files\nodejs && echo. && echo Ejecuta: npm install -g @railway/cli && echo."

echo.
echo  ─────────────────────────────────────────────────────────
echo   PASO 3: Desplegar el backend
echo  ─────────────────────────────────────────────────────────
echo.
echo   En la misma ventana, navega al backend y despliega:
echo.
echo     cd C:\Users\bayro\mantenimiento-equipos\backend
echo     railway init        ^(crear nuevo proyecto^)
echo     railway up          ^(subir codigo^)
echo.
echo  ─────────────────────────────────────────────────────────
echo   PASO 4: Agregar PostgreSQL
echo  ─────────────────────────────────────────────────────────
echo.
echo   En railway.app ^> tu proyecto ^> "+ New" ^> "Database"
echo   ^> "Add PostgreSQL"
echo.
echo   Railway automaticamente crea la variable DATABASE_URL
echo.
echo  ─────────────────────────────────────────────────────────
echo   PASO 5: Obtener la URL publica
echo  ─────────────────────────────────────────────────────────
echo.
echo   En railway.app ^> tu proyecto ^> Settings ^> Networking
echo   ^> "Generate Domain" ^> copiar la URL
echo   Ejemplo: https://cmms-production-abc.railway.app
echo.
echo  ─────────────────────────────────────────────────────────
echo   PASO 6: Configurar la URL en las apps
echo  ─────────────────────────────────────────────────────────
echo.
echo   Ejecuta: CONFIGURAR_NUBE.bat
echo   Pega la URL de Railway cuando se la pida
echo.
echo   Luego:
echo   - BUILD_APP_WINDOWS.bat  ^> genera el instalador .exe
echo   - BUILD_APP_MOVIL.bat    ^> genera el PWA para celular
echo.
echo  ════════════════════════════════════════════════════════════
echo.
echo   COSTO: $0/mes (Railway da $5/mes gratis, el sistema
echo   usa aproximadamente $1-2/mes)
echo.
echo  ════════════════════════════════════════════════════════════
echo.
pause
