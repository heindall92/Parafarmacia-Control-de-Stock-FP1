# 📥 Descargas — Parafarmacia Stock

Los ejecutables ya compilados se publican como **GitHub Releases** (no dentro del
repositorio, para mantenerlo ligero).

➡️ **Descarga la última versión aquí:**
**https://github.com/heindall92/Parafarmacia-Control-de-Stock-FP1/releases/latest**

No necesitas instalar Node, npm ni compilar nada: descarga y ejecuta.

| Archivo | Tamaño | ¿Cómo se usa? | Recomendado para |
|---------|--------|----------------|------------------|
| **Parafarmacia-Stock-Portable.exe** | ~20 MB | Doble clic y la app abre. No instala nada. | Probar rápido / llevar en USB |
| **Parafarmacia-Stock-Instalador.exe** | ~18 MB | Asistente de instalación con acceso directo en el menú Inicio. | Uso permanente en un equipo |

Enlaces directos a la última versión:
- [Parafarmacia-Stock-Portable.exe](https://github.com/heindall92/Parafarmacia-Control-de-Stock-FP1/releases/latest/download/Parafarmacia-Stock-Portable.exe)
- [Parafarmacia-Stock-Instalador.exe](https://github.com/heindall92/Parafarmacia-Control-de-Stock-FP1/releases/latest/download/Parafarmacia-Stock-Instalador.exe)

## Notas

- La primera vez Windows SmartScreen puede avisar de un editor desconocido
  (la app no está firmada con certificado de pago). Pulsa **Más información →
  Ejecutar de todas formas**.
- Requiere **WebView2**, que ya viene preinstalado en Windows 10/11 actualizado.
- Los datos (productos, estantes, inventario) se guardan localmente en el
  equipo; la aplicación funciona **100 % sin conexión a internet**.

## ¿Cómo publicar una nueva versión? (para mantenedores)

Con [GitHub CLI](https://cli.github.com/) instalado y el catálogo compilado:

```powershell
# 1. Generar los binarios
npm run native:build

# 2. Copiar los ejecutables a descargas/ con los nombres esperados
#    (Portable / Instalador) — ver scripts/crear-portable-escritorio.ps1

# 3. Crear la Release y adjuntar los .exe
gh release create vX.Y.Z `
  "descargas/Parafarmacia-Stock-Portable.exe" `
  "descargas/Parafarmacia-Stock-Instalador.exe" `
  --title "Parafarmacia Stock vX.Y.Z" `
  --notes "Descripción de los cambios"
```

Los `.exe` están en `.gitignore`, así que no se suben al repositorio: solo viven
en las Releases.
