@echo off
echo ============================================
echo  CMMS - Iniciando Frontend (React + Vite)
echo ============================================
cd /d "%~dp0frontend"

echo.
echo [1/2] Instalando dependencias npm...
if not exist node_modules (
    npm install
) else (
    echo node_modules ya existe.
)

echo.
echo [2/2] Arrancando servidor de desarrollo...
echo.
echo ============================================
echo  Frontend corriendo en: http://localhost:5173
echo ============================================
echo.
npm run dev
pause
