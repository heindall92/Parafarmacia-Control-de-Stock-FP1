# Compila Parafarmacia Stock (Tauri) y deja un lanzador portable en el Escritorio.
param(
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Desktop = [Environment]::GetFolderPath("Desktop")
$PortableDir = Join-Path $Desktop "Parafarmacia Stock"
$LauncherExe = Join-Path $Desktop "Parafarmacia Stock.exe"
$ReleaseExe = Join-Path $ProjectRoot "src-tauri\target\release\farmacia-stock.exe"

Set-Location $ProjectRoot

if (-not $SkipBuild) {
  Write-Host "Compilando aplicacion nativa (puede tardar varios minutos)..." -ForegroundColor Cyan
  npm run tauri:build
  if ($LASTEXITCODE -ne 0) { throw "Fallo tauri:build" }
} elseif (-not (Test-Path $ReleaseExe)) {
  throw "No hay build previo. Ejecuta sin -SkipBuild primero."
}

$NsisDir = Join-Path $ProjectRoot "src-tauri\target\release\bundle\nsis"
$NsisSetup = Get-ChildItem -Path $NsisDir -Filter "*-setup.exe" -ErrorAction SilentlyContinue | Select-Object -First 1

if (-not (Test-Path $ReleaseExe)) {
  throw "No se encontro $ReleaseExe tras la compilacion."
}

New-Item -ItemType Directory -Force -Path $PortableDir | Out-Null
Copy-Item -Path $ReleaseExe -Destination (Join-Path $PortableDir "Parafarmacia Stock.exe") -Force

# Recursos junto al exe (WebView2 / assets embebidos si existen en release)
$ReleaseDir = Split-Path $ReleaseExe -Parent
Get-ChildItem -Path $ReleaseDir -Filter "*.dll" -ErrorAction SilentlyContinue | ForEach-Object {
  Copy-Item $_.FullName -Destination $PortableDir -Force
}

# Lanzador directo en el Escritorio (misma carpeta portable)
$PortableExe = Join-Path $PortableDir "Parafarmacia Stock.exe"
try {
  Copy-Item -Path $PortableExe -Destination $LauncherExe -Force
} catch {
  if (Test-Path $LauncherExe) {
    Write-Host "Aviso: no se pudo sobrescribir $LauncherExe (app abierta). Se mantiene la copia actual." -ForegroundColor Yellow
  } else {
    throw
  }
}

if (-not (Test-Path $LauncherExe)) {
  throw "No se pudo crear el lanzador en el Escritorio: $LauncherExe"
}

# DLLs junto al lanzador del Escritorio (por si el exe las necesita fuera de la carpeta)
Get-ChildItem -Path $PortableDir -Filter "*.dll" -ErrorAction SilentlyContinue | ForEach-Object {
  Copy-Item $_.FullName -Destination $Desktop -Force
}

# Copia opcional del instalador NSIS por si hace falta reinstalar en otro PC
if ($NsisSetup) {
  Copy-Item -Path $NsisSetup.FullName -Destination (Join-Path $PortableDir "Instalador-Parafarmacia-Stock.exe") -Force
}

Write-Host ""
Write-Host "Listo." -ForegroundColor Green
Write-Host "  Escritorio: $LauncherExe"
Write-Host "  Carpeta:    $PortableDir"
Write-Host "Abre Parafarmacia Stock.exe del Escritorio (no usa localhost)." -ForegroundColor Green
