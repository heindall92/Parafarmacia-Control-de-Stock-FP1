import type { Producto } from "./database";

/** Texto corto de ubicación para listas y widgets (sin stock). */
export function formatUbicacionCorta(p: Producto): string {
  if (p.ubicacion_detalle?.trim()) return p.ubicacion_detalle.trim();
  const estante = p.estante_nombre?.trim();
  const cuadrante = p.cuadrante_codigo?.trim();
  if (estante && cuadrante) return `${estante} · ${cuadrante}`;
  return estante ?? cuadrante ?? "Sin ubicación";
}

/** Línea secundaria: estante + sección. */
export function formatUbicacionMeta(p: Producto): string {
  const parts = [p.estante_nombre, p.categoria_nombre].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "—";
}
