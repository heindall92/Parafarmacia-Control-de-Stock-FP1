<p align="center">
  <iframe
    src="https://raw.githack.com/heindall92/Parafarmacia-Control-de-Stock-FP1/main/docs/demo.html"
    title="Demo Parafarmacia Stock"
    width="960"
    height="540"
    frameborder="0"
    allow="autoplay; fullscreen; encrypted-media"
    allowfullscreen
    style="max-width:100%; border-radius:14px; border:1px solid #2d6a4f; box-shadow:0 18px 60px rgba(45,106,79,0.25);">
  </iframe>
</p>

# Parafarmacia Stock

Aplicación **nativa de Windows** (Tauri 2 + Rust + SQLite) para control de inventario de parafarmacia por estante y cuadrante. Funciona **100% offline**.

## Características

- Inventario con ubicación exacta (estante + cuadrante)
- Búsqueda rápida en mostrador
- Mapa visual de estantes
- Alertas de stock bajo
- Modo claro / oscuro
- Pantalla de arranque profesional
- Base de datos SQLite local

## Instalación (farmacia)

1. Compilar el instalador (solo cuando haya cambios):

```powershell
npm run native:build
```

2. Ejecutar el instalador generado:

```
src-tauri\target\release\bundle\nsis\Parafarmacia Stock_0.1.0_x64-setup.exe
```

3. Abrir **Parafarmacia Stock** desde el menú Inicio.

El asistente es tipo **Siguiente → Siguiente → Instalar**. No requiere navegador ni `localhost`.

## Desarrollo

| Comando | Para qué |
|---------|----------|
| `npm run tauri:dev` | Desarrollo con recarga en caliente |
| `npm run native:run` | Probar build nativo sin instalador |
| `npm run native:build` | Generar instalador `.exe` para Windows |

`npm run tauri:dev` depende de un servidor local en `http://localhost:1420` — **solo para programadores**, no para uso en la farmacia.

## Stack

- **Frontend:** React 19 + TypeScript + Tailwind CSS v4
- **Desktop:** Tauri 2 + Rust
- **Base de datos:** SQLite (`tauri-plugin-sql`)

## Licencia

Proyecto privado — uso interno en parafarmacia.
