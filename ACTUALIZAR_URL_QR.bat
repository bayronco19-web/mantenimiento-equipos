@echo off
title CMMS - Actualizar URL de codigos QR
color 0E
cls

echo.
echo  ============================================================
echo   Actualizar URL publica en los codigos QR
echo  ============================================================
echo.
echo  Ingresa la URL publica que te dio ngrok.
echo  Ejemplo: https://abc123.ngrok-free.app
echo.
set /p PUBLIC_URL="  URL publica: "

if "%PUBLIC_URL%"=="" (
    echo  [ERROR] No ingresaste una URL.
    pause
    exit /b 1
)

echo.
echo  Regenerando QR con URL: %PUBLIC_URL%
echo.

set "PYTHON=C:\Users\bayro\mantenimiento-equipos\backend\venv\Scripts\python.exe"
set "DB=C:\Users\bayro\mantenimiento-equipos\backend\cmms.db"
set "QR_DIR=C:\Users\bayro\mantenimiento-equipos\backend\static\qr"

"%PYTHON%" -c "
import sqlite3, os, qrcode

PUBLIC_URL = r'%PUBLIC_URL%'
DB_PATH = r'%DB%'
QR_DIR = r'%QR_DIR%'

os.makedirs(QR_DIR, exist_ok=True)

db = sqlite3.connect(DB_PATH)
equips = db.execute('SELECT id, code FROM equipment').fetchall()

for eq_id, code in equips:
    url = f'{PUBLIC_URL}/scan/{eq_id}'
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color='black', back_color='white')
    path = os.path.join(QR_DIR, f'eq_{eq_id}.png')
    img.save(path)
    db.execute('UPDATE equipment SET qr_code_url=? WHERE id=?', (path, eq_id))
    print(f'  QR actualizado: {code} -> {url}')

db.commit()
db.close()
print('Listo.')
"

echo.
echo  [OK] Codigos QR actualizados con la URL publica.
echo  Ahora los tecnicos pueden escanear desde cualquier lugar.
echo.
pause
