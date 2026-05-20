# 🏥 Parafarmacia - Control de Stock

Este proyecto es un sistema de gestión integral diseñado para optimizar el control de inventario en una parafarmacia. Resuelve el problema del seguimiento manual de productos, previniendo rupturas de stock y facilitando la gestión de entradas y salidas de mercancía de manera eficiente y moderna.

## 🎥 Demo del Proyecto

<video src="./demo.mp4" controls width="100%">
  Tu navegador no soporta el elemento de video.
</video>

## 🚀 Tecnologías Utilizadas

Este proyecto ha sido desarrollado con un stack moderno y estructurado:
- **Frontend & Backend**: [Next.js](https://nextjs.org/) (React) con **TypeScript** para un tipado estricto y mayor robustez.
- **Estilos**: **Tailwind CSS v4** para una interfaz limpia, responsive y profesional.
- **Iconos**: **Lucide React**.
- **Base de Datos & ORM**: **Prisma** para el modelado, migraciones y persistencia de datos segura.

## 🛠️ Instalación y Despliegue

Sigue estos pasos para correr el proyecto en tu entorno local:

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/heindall92/Parafarmacia-Control-de-Stock-FP1.git
   cd parafarmacia-stock
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar la base de datos**:
   - Crea un archivo `.env` en la raíz del proyecto basándote en el ejemplo de configuración.
   - Genera el cliente de Prisma y corre las migraciones:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Ejecutar en desarrollo**:
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver el resultado.

## ✨ Características Principales

- **Control de Excepciones Robusto**: El sistema cuenta con validaciones limpias mediante bloques `try-catch` para manejar fallos de red, caídas de la base de datos y errores de entrada de usuario (por ejemplo, evitando que se introduzcan letras en los campos numéricos de cantidad).
- **Gestión Intuitiva**: Interfaz amigable para llevar el control del stock de forma ágil y precisa.

## 🔮 Próximas Mejoras (Roadmap)
- **Seguridad**: Implementación de autenticación y roles de usuario (Administrador vs. Empleado) usando contraseñas encriptadas (Bcrypt).
- **Reportes**: Generación de reportes exportables a PDF o CSV para productos próximos a caducar o por debajo del stock mínimo.
