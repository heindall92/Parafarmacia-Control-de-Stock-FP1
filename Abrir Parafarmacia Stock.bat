@echo off
setlocal
cd /d "%~dp0"

set "INSTALLER=%~dp0Instalar Parafarmacia Stock.exe"
set "APP_EXE=%~dp0Parafarmacia Stock.exe"

echo.
echo  Parafarmacia Stock
echo.

if exist "%INSTALLER%" (
  echo Abriendo instalador (Siguiente - Siguiente - Instalar)...
  start "" "%INSTALLER%"
  exit /b 0
)

if exist "%APP_EXE%" (
  echo Abriendo aplicacion...
  start "" "%APP_EXE%"
  exit /b 0
)

echo No se encontro el instalador. Ejecuta: npm run native:build
pause
