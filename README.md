# 🏥 Parafarmacia · Control de Stock

Aplicación de escritorio **nativa, rápida y 100 % offline** para la gestión integral
del inventario de una parafarmacia: control de productos, estantes, entradas/salidas,
caducidades y un **gemelo digital 3D** del local para localizar visualmente dónde
está cada artículo.

Sustituye el seguimiento manual en hojas de cálculo por una herramienta moderna que
previene roturas de stock, agiliza la reposición y hace que encontrar un producto en
la tienda sea cuestión de segundos.

> **Proyecto Final · FP Desarrollo de Aplicaciones** — desarrollado como aplicación
> de escritorio multiplataforma con Tauri.

---

## 🎥 Demo del proyecto

https://github.com/user-attachments/assets/70a9e34d-9f38-44b1-8d29-53a63cee578e

---

## ⬇️ Descarga directa (sin instalar nada)

¿No quieres compilar? Descarga el ejecutable ya listo desde la carpeta
[**`descargas/`**](./descargas):

| Archivo | Uso |
|---------|-----|
| **Parafarmacia-Stock-Portable.exe** (~20 MB) | Doble clic y funciona. No instala nada. |
| **Parafarmacia-Stock-Instalador.exe** (~18 MB) | Instalador con acceso directo en el menú Inicio. |

Compatible con **Windows 10/11 (64 bits)**. No requiere Node ni `npm install`.
Más detalles en [`descargas/README.md`](./descargas/README.md).

**Credenciales de demo:** `farmacia` / `stock2026` · o bien `admin` / `admin`.

---

## ✨ Características principales

- **Inventario completo (CRUD)** — alta, edición, baja y búsqueda de productos con
  categoría, laboratorio, precio, stock y ubicación.
- **Gestión de estantes** — estantes lineales, neveras de frío, **estantes redondos
  de 3 niveles** y básculas, cada uno con su capacidad y disposición.
- **Gemelo digital 3D** — vista tridimensional del local (Three.js). Buscas un
  producto y la app **lo señala con una baliza roja** sobre el estante donde está,
  mostrando su ficha completa al lado.
- **Editor de layout 2D** — configurador con *arrastrar y soltar* para colocar,
  mover y eliminar el mobiliario sobre una cuadrícula.
- **Búsqueda inteligente** — búsqueda instantánea por nombre con resultados
  enriquecidos (categoría, estante y ubicación).
- **Modo claro / oscuro** — la interfaz y la escena 3D se adaptan al tema.
- **Importación desde Excel** — script para cargar el catálogo real de la
  parafarmacia desde una hoja de cálculo.
- **100 % offline** — toda la información se guarda localmente en SQLite; no depende
  de servidores ni de conexión a internet.
- **Datos seguros** — copias de seguridad locales y validación de entradas.

---

## 🚀 Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Núcleo de escritorio | [**Tauri 2**](https://tauri.app/) (Rust) — binario nativo y ligero |
| Interfaz | [**React 19**](https://react.dev/) + **TypeScript** |
| Empaquetado / dev server | [**Vite 6**](https://vitejs.dev/) |
| Estilos | [**Tailwind CSS v4**](https://tailwindcss.com/) |
| 3D | [**Three.js**](https://threejs.org/) con **React Three Fiber** + **Drei** |
| Animaciones | **Framer Motion** |
| Iconos | **Lucide React** |
| Base de datos | **SQLite** (vía `@tauri-apps/plugin-sql`) |
| Importación de datos | **Python** (`openpyxl`) |

---

## 🛠️ Ejecutar desde el código fuente

### Requisitos previos
- [Node.js](https://nodejs.org/) 18 o superior
- [Rust](https://www.rust-lang.org/tools/install) (toolchain `stable`)
- Dependencias de Tauri para tu sistema operativo
  ([guía oficial](https://tauri.app/start/prerequisites/))

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/heindall92/Parafarmacia-Control-de-Stock-FP1.git
cd Parafarmacia-Control-de-Stock-FP1/farmacia-stock

# 2. Instalar dependencias del frontend
npm install

# 3. Arrancar la app en modo desarrollo (ventana nativa con recarga en caliente)
npm run tauri:dev
```

---

## 📦 Generar el ejecutable

```bash
# Compila e instala los bundles nativos (instalador .exe / .msi)
npm run native:build

# O genera una versión portable directamente en el Escritorio (Windows)
npm run portable:desktop
```

Los instaladores quedan en `src-tauri/target/release/bundle/`.

---

## 📥 Importar el catálogo desde Excel

```bash
npm run import:excel
```

Lee la hoja de cálculo de la parafarmacia y vuelca los productos a la base de datos
local. (El volcado temporal de imágenes del Excel se ignora en `.gitignore`.)

---

## 📂 Estructura del proyecto

```
farmacia-stock/
├── descargas/          → Ejecutables listos para descargar (.exe)
├── public/             → Imágenes de productos y assets estáticos
├── scripts/            → Utilidades (importador Excel, portable Windows)
├── src/
│   ├── components/     → Componentes de UI y vistas (3D, inventario, estantes…)
│   ├── hooks/          → Hooks de React (bootstrap, auth, transiciones…)
│   ├── lib/            → Lógica: base de datos, layout, búsqueda, auth…
│   └── data/           → Datos estáticos de la interfaz
└── src-tauri/          → Backend nativo en Rust (Tauri)
```

---

## 🔮 Roadmap

- Roles de usuario (administrador / empleado) con contraseñas cifradas.
- Reportes exportables a PDF/CSV (caducidades, stock mínimo).
- Publicación de los binarios como *GitHub Releases* y autoactualización.
- Sincronización opcional multi-dispositivo.

---

## 📄 Licencia

Proyecto académico de FP. Uso educativo y de demostración.
