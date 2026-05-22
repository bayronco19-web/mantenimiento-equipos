@echo off
setlocal enabledelayedexpansion
title CMMS - Guia completa Railway
color 0A
cls

:MENU
cls
echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║      GUIA COMPLETA: Publicar CMMS en Railway (nube)         ║
echo  ╠══════════════════════════════════════════════════════════════╣
echo  ║                                                              ║
echo  ║  1 - Paso 1: Crear cuenta GitHub ^(si no tienes^)             ║
echo  ║  2 - Paso 2: Crear cuenta Railway                            ║
echo  ║  3 - Paso 3: Instalar Railway CLI                            ║
echo  ║  4 - Paso 4: Conectar CLI con tu cuenta                      ║
echo  ║  5 - Paso 5: Subir el backend a Railway                      ║
echo  ║  6 - Paso 6: Agregar base de datos PostgreSQL                ║
echo  ║  7 - Paso 7: Configurar variables de entorno                 ║
echo  ║  8 - Paso 8: Crear datos iniciales en la nube                ║
echo  ║  9 - Paso 9: Obtener URL publica y finalizar                 ║
echo  ║  0 - Salir                                                   ║
echo  ║                                                              ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
set /p PASO="  Elige el paso (1-9): "
if "%PASO%"=="1" goto PASO1
if "%PASO%"=="2" goto PASO2
if "%PASO%"=="3" goto PASO3
if "%PASO%"=="4" goto PASO4
if "%PASO%"=="5" goto PASO5
if "%PASO%"=="6" goto PASO6
if "%PASO%"=="7" goto PASO7
if "%PASO%"=="8" goto PASO8
if "%PASO%"=="9" goto PASO9
if "%PASO%"=="0" exit /b
goto MENU

:: ══════════════════════════════════════════════════════════════════
:PASO1
cls
echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║  PASO 1: Crear cuenta en GitHub                             ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
echo  Railway usa GitHub para autenticarse. Si ya tienes cuenta,
echo  salta al Paso 2.
echo.
echo  1. Se abrira github.com en el navegador
echo  2. Clic en "Sign up" (esquina superior derecha)
echo  3. Ingresa tu email, crea una contrasena
echo  4. Verifica tu email
echo  5. Elige el plan gratuito (Free)
echo.
echo  ───────────────────────────────────────────────────────────────
echo  IMPORTANTE: Guarda tu usuario y contrasena de GitHub.
echo  Los vas a necesitar en el siguiente paso.
echo  ───────────────────────────────────────────────────────────────
echo.
echo  Presiona una tecla para abrir GitHub...
pause > nul
start "" "https://github.com/signup"
echo.
echo  Cuando termines de crear la cuenta, vuelve aqui y presiona
echo  una tecla para continuar al Paso 2.
pause > nul
goto MENU

:: ══════════════════════════════════════════════════════════════════
:PASO2
cls
echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║  PASO 2: Crear cuenta en Railway                            ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
echo  1. Se abrira railway.app en el navegador
echo  2. Clic en "Login"
echo  3. Clic en "Login with GitHub"
echo  4. GitHub te pide autorizar Railway - clic en "Authorize Railway"
echo  5. Railway te pide verificar con numero de telefono
echo     (solo la primera vez, es gratis)
echo  6. Ya tienes cuenta en Railway
echo.
echo  ───────────────────────────────────────────────────────────────
echo  Railway da $5 dolares gratis cada mes.
echo  El CMMS usa aproximadamente $1-2/mes = GRATIS en la practica.
echo  No requiere tarjeta de credito.
echo  ───────────────────────────────────────────────────────────────
echo.
echo  Presiona una tecla para abrir Railway...
pause > nul
start "" "https://railway.app/login"
echo.
echo  Cuando termines de crear la cuenta, presiona una tecla
echo  para continuar al Paso 3.
pause > nul
goto MENU

:: ══════════════════════════════════════════════════════════════════
:PASO3
cls
echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║  PASO 3: Instalar Railway CLI                               ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
echo  El CLI es una herramienta que permite subir el codigo desde
echo  esta computadora a Railway con un solo comando.
echo.
echo  Se va a abrir una ventana de comandos. En esa ventana escribe:
echo.
echo      npm install -g @railway/cli
echo.
echo  Y presiona Enter. Espera que termine (1-2 minutos).
echo  Cuando termine, el cursor vuelve a aparecer.
echo.
echo  ───────────────────────────────────────────────────────────────
echo  VERIFICAR: Escribe   railway --version   y presiona Enter.
echo  Debe mostrar algo como: @railway/cli/3.x.x
echo  ───────────────────────────────────────────────────────────────
echo.
echo  Presiona una tecla para abrir la ventana de comandos...
pause > nul
start "Railway CLI - Instalacion" cmd /k "set PATH=%PATH%;C:\Program Files\nodejs && echo. && echo == Copia y pega este comando: == && echo. && echo npm install -g @railway/cli && echo. && echo Presiona Enter para instalar... && echo."
echo.
echo  Cuando veas que termino la instalacion (vuelve el cursor),
echo  NO cierres esa ventana. La necesitas para el Paso 4.
echo.
echo  Presiona una tecla para continuar...
pause > nul
goto MENU

:: ══════════════════════════════════════════════════════════════════
:PASO4
cls
echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║  PASO 4: Conectar el CLI con tu cuenta Railway              ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
echo  En la ventana de comandos del Paso 3, escribe:
echo.
echo      railway login
echo.
echo  Y presiona Enter. Esto abrira el navegador para confirmar
echo  tu identidad. Sigue estos pasos:
echo.
echo  1. Se abre el navegador con Railway
echo  2. Clic en "Approve" o "Autorizar"
echo  3. Vuelve a la ventana de comandos
echo  4. Debe mostrar: "Logged in as tu@email.com"
echo.
echo  ───────────────────────────────────────────────────────────────
echo  Si no se abre el navegador: copia la URL que muestra el CLI
echo  y pegala manualmente en el navegador.
echo  ───────────────────────────────────────────────────────────────
echo.
echo  Presiona una tecla cuando hayas iniciado sesion...
pause > nul
goto MENU

:: ══════════════════════════════════════════════════════════════════
:PASO5
cls
echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║  PASO 5: Subir el backend a Railway                         ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
echo  En la ventana de comandos, copia y pega EXACTAMENTE esto:
echo.
echo  ┌──────────────────────────────────────────────────────────┐
echo  │                                                          │
echo  │  cd C:\Users\bayro\mantenimiento-equipos\backend         │
echo  │                                                          │
echo  └──────────────────────────────────────────────────────────┘
echo.
echo  Presiona Enter. Luego copia y pega esto:
echo.
echo  ┌──────────────────────────────────────────────────────────┐
echo  │                                                          │
echo  │  railway init                                            │
echo  │                                                          │
echo  └──────────────────────────────────────────────────────────┘
echo.
echo  Te preguntara:
echo    - "Project name": escribe  cmms-mantenimiento  y Enter
echo    - "Environment": elige "production" y Enter
echo.
echo  Luego sube el codigo con:
echo.
echo  ┌──────────────────────────────────────────────────────────┐
echo  │                                                          │
echo  │  railway up                                              │
echo  │                                                          │
echo  └──────────────────────────────────────────────────────────┘
echo.
echo  Esto puede tardar 3-5 minutos. Cuando termine mostrara:
echo  "Build successful" o "Deployment successful"
echo.
echo  ───────────────────────────────────────────────────────────────
echo  Si pide que hagas "railway link": ejecuta  railway link
echo  y elige el proyecto que creaste.
echo  ───────────────────────────────────────────────────────────────
echo.
echo  Presiona una tecla para COPIAR automaticamente los comandos...
pause > nul
echo cd C:\Users\bayro\mantenimiento-equipos\backend | clip
echo  [OK] Comando copiado. Pegalo en la ventana de comandos con Ctrl+V
echo.
pause
goto MENU

:: ══════════════════════════════════════════════════════════════════
:PASO6
cls
echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║  PASO 6: Agregar base de datos PostgreSQL                   ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
echo  En la ventana de comandos (en la carpeta backend), escribe:
echo.
echo  ┌──────────────────────────────────────────────────────────┐
echo  │                                                          │
echo  │  railway add --plugin postgresql                         │
echo  │                                                          │
echo  └──────────────────────────────────────────────────────────┘
echo.
echo  Esto crea automaticamente una base de datos PostgreSQL y
echo  configura la variable DATABASE_URL para que el backend
echo  la use automaticamente.
echo.
echo  Debe mostrar algo como:
echo    "PostgreSQL Plugin added successfully"
echo.
echo  ───────────────────────────────────────────────────────────────
echo  ALTERNATIVA si el comando falla:
echo    1. Abre railway.app en el navegador
echo    2. Entra a tu proyecto "cmms-mantenimiento"
echo    3. Clic en "+ New" (boton azul)
echo    4. Clic en "Database"
echo    5. Clic en "Add PostgreSQL"
echo    6. Listo
echo  ───────────────────────────────────────────────────────────────
echo.
echo  Presiona una tecla para continuar...
pause > nul
goto MENU

:: ══════════════════════════════════════════════════════════════════
:PASO7
cls
echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║  PASO 7: Configurar variables de entorno (seguridad)        ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
echo  Necesitas agregar una clave secreta para la seguridad.
echo  Primero, genera una clave segura:
echo.
echo  En la ventana de comandos, escribe:
echo.
echo  ┌──────────────────────────────────────────────────────────┐
echo  │                                                          │
echo  │  python -c "import secrets; print(secrets.token_hex(32))│
echo  │                                                          │
echo  └──────────────────────────────────────────────────────────┘

set "PYTHON=C:\Users\bayro\mantenimiento-equipos\backend\venv\Scripts\python.exe"
echo.
echo  Generando clave secreta automaticamente...
for /f %%K in ('"%PYTHON%" -c "import secrets; print(secrets.token_hex(32))"') do set SECRET=%%K
echo.
echo  ┌──────────────────────────────────────────────────────────┐
echo  ║  TU CLAVE SECRETA (guarda esto):                         ║
echo  ║                                                          ║
echo  ║  !SECRET!
echo  ║                                                          ║
echo  └──────────────────────────────────────────────────────────┘
echo.
echo !SECRET! | clip
echo  [OK] Clave copiada al portapapeles.
echo.
echo  Ahora en la ventana de comandos ejecuta (reemplazando TU_CLAVE):
echo.
echo  railway variables set SECRET_KEY=!SECRET!
echo.
echo  O manualmente en railway.app:
echo    Tu proyecto ^> Variables ^> "+ New Variable"
echo    Nombre: SECRET_KEY
echo    Valor: ^(la clave que copiaste^)
echo.
echo  Presiona una tecla para abrir Railway Variables en el navegador...
pause > nul
start "" "https://railway.app/dashboard"
echo.
echo  Presiona una tecla cuando hayas configurado la variable...
pause > nul
goto MENU

:: ══════════════════════════════════════════════════════════════════
:PASO8
cls
echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║  PASO 8: Crear datos iniciales en la nube                   ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
echo  La base de datos en la nube esta vacia. Necesitas crear:
echo    - El usuario administrador
echo    - Los equipos (caldera, quemador, etc.)
echo    - Los planes de mantenimiento
echo.
echo  En la ventana de comandos escribe:
echo.
echo  ┌──────────────────────────────────────────────────────────┐
echo  │                                                          │
echo  │  railway run python seed.py --force                      │
echo  │                                                          │
echo  └──────────────────────────────────────────────────────────┘
echo.
echo  Esto ejecuta el script de datos iniciales DIRECTAMENTE en
echo  la nube. Tarda 1-2 minutos.
echo.
echo  Cuando termine mostrara:
echo    "Seed completado exitosamente"
echo.
echo  ───────────────────────────────────────────────────────────────
echo  Usuario admin creado:
echo    Usuario:    admin
echo    Contrasena: admin123
echo  ───────────────────────────────────────────────────────────────
echo.
echo  Presiona una tecla cuando hayas ejecutado el seed...
pause > nul
goto MENU

:: ══════════════════════════════════════════════════════════════════
:PASO9
cls
echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║  PASO 9: Obtener la URL publica y finalizar                 ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
echo  En la ventana de comandos escribe:
echo.
echo  ┌──────────────────────────────────────────────────────────┐
echo  │                                                          │
echo  │  railway domain                                          │
echo  │                                                          │
echo  └──────────────────────────────────────────────────────────┘
echo.
echo  Mostrara algo como:
echo    https://cmms-mantenimiento-production.up.railway.app
echo.
echo  COPIA ESA URL. La necesitas para el siguiente paso.
echo.
echo  ───────────────────────────────────────────────────────────────
echo  Si no tiene dominio aun, crealo en:
echo  railway.app ^> Tu proyecto ^> Settings ^> Networking
echo  ^> "Generate Domain" ^> copiar la URL
echo  ───────────────────────────────────────────────────────────────
echo.

set /p CONFIRM="  ^(y^) Ya tengo la URL, continuar: "
if /i not "%CONFIRM%"=="y" goto MENU

echo.
echo  ─────────────────────────────────────────────────────────────
echo   Ahora ejecuta CONFIGURAR_NUBE.bat y pega esa URL.
echo   Luego BUILD_APP_WINDOWS.bat para el instalador Windows.
echo   Luego BUILD_APP_MOVIL.bat para el PWA del celular.
echo  ─────────────────────────────────────────────────────────────
echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                                                              ║
echo  ║   FELICITACIONES - Tu CMMS esta en la nube                  ║
echo  ║                                                              ║
echo  ║   La app funciona 24/7 sin necesidad de tener               ║
echo  ║   el PC encendido.                                           ║
echo  ║                                                              ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
pause
goto MENU
