import type { LocalLayout } from "./localLayout";
import { resolveEstanteFromLayout } from "./localLayout";

/** Geometría compartida con PharmacyTwinCanvas (góndola + mostrador). */
export const SHELF_DEPTH = 0.85;
export const GONDOLA_WIDTH = 3.2;
/** Mostrador corto (2 PC): eje largo a 90° de los estantes de entrada */
export const MOSTRADOR_LENGTH = 3.8;
export const MOSTRADOR_DEPTH = 1.35;
const PARED_DER_INNER_X = 9.55 - 0.06;
const PARED_FONDO_Z = 8.85;
const PARED_ENTRADA_Z = -8.0;

/** Pasillo clientes: estantes entrada → frente del mostrador */
export const PASILLO_CLIENTES = 3.0;
/** Pasillo tipo puerta entre mostrador y estante lateral izquierdo */
export const PASILLO_PUERTA = 0.9;
/** Pasillo farmacéuticos: mostrador → estante «Detrás mostrador» */
export const PASILLO_FARMACEUTICO = 1.25;

/** Cara frontal de los estantes de entrada (mirando hacia +Z / interior) */
export const entradaShelfFrontZ = PARED_ENTRADA_Z + SHELF_DEPTH / 2;

/** Estante «Detrás mostrador» pegado a pared fondo, mirando al interior (−Z) */
export const detrasMostradorCenterZ = PARED_FONDO_Z - SHELF_DEPTH / 2;
export const detrasMostradorFrontZ = detrasMostradorCenterZ - SHELF_DEPTH / 2;

/** Mostrador a 90°: eje largo en Z; cara trasera + pasillo + estante fondo */
export const mostradorBackZ = detrasMostradorFrontZ - PASILLO_FARMACEUTICO;
export const mostradorFrontZ = mostradorBackZ - MOSTRADOR_LENGTH;
export const mostradorCenterZ = (mostradorFrontZ + mostradorBackZ) / 2;

/** Pegado a pared derecha; cara izquierda (−X) deja hueco tipo puerta */
export const mostradorCenterX = PARED_DER_INNER_X - MOSTRADOR_DEPTH / 2;
export const mostradorLeftX = mostradorCenterX - MOSTRADOR_DEPTH / 2;

/** Estante lateral izquierdo del mostrador (paralelo, separado por pasillo puerta) */
export const estanteLateralCenterX =
  mostradorLeftX - PASILLO_PUERTA - SHELF_DEPTH / 2;

/** Distancia real frente estantes entrada → frente mostrador (≈ 3 m vía pasillo derecho) */
export const pasilloClientesEntradaZ = entradaShelfFrontZ + PASILLO_CLIENTES;

/** Plano físico de la parafarmacia (vista desde arriba). */
export type EstanteLayoutSlot = {
  x: number;
  z: number;
  rotY: number;
  zone: "mostrador" | "pared-izq" | "pared-der" | "frente-mostrad" | "detras-mostrad" | "lateral-mostrad" | "default";
  order: number;
  label: string;
  shelfWidth?: number;
};

export type Vista3DHighlight = {
  estanteId: number | null;
  categoriaId: number | null;
  productoId: number;
  productoNombre: string;
};

/**
 * Vista cenital (+Z = pared fondo):
 *
 *   [puerta][3er][4to][5to]  → mirando al interior (+Z)
 *          ↕ pasillo clientes 3 m (hasta línea de acceso al mostrador)
 *   [est.2do] |puerta| [mostrador 90°] | pared der.
 *                        ↕ pasillo farmacéutico 1,25 m
 *              [== Detrás mostrador ==] pegado pared fondo, mira −Z
 */
let activeLocalLayout: LocalLayout | null = null;

export function setActiveLocalLayout(layout: LocalLayout | null) {
  activeLocalLayout = layout;
}

export function getActiveLocalLayout(): LocalLayout | null {
  return activeLocalLayout;
}

export function resolveEstanteLayout(nombre: string, estanteId?: number): EstanteLayoutSlot {
  if (estanteId != null && activeLocalLayout) {
    const custom = resolveEstanteFromLayout(activeLocalLayout, estanteId, nombre);
    if (custom) {
      return {
        ...custom,
        zone: (custom.zone === "mostrador" ? "mostrador" : "default") as EstanteLayoutSlot["zone"],
      };
    }
  }

  const n = nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

  if (n.includes("detras") || (n.includes("mostrador") && !n.includes("2do"))) {
    return {
      x: mostradorCenterX,
      z: detrasMostradorCenterZ,
      rotY: Math.PI,
      zone: "detras-mostrad",
      order: 5,
      label: "Detrás mostrador (pared fondo)",
      shelfWidth: MOSTRADOR_LENGTH,
    };
  }
  if (n.includes("2do")) {
    return {
      x: estanteLateralCenterX,
      z: mostradorCenterZ,
      rotY: Math.PI / 2,
      zone: "lateral-mostrad",
      order: 1,
      label: "2.º estante (izq. mostrador · pasillo puerta)",
      shelfWidth: MOSTRADOR_LENGTH,
    };
  }
  if (n.includes("3er")) {
    return {
      x: -0.8,
      z: PARED_ENTRADA_Z,
      rotY: 0,
      zone: "frente-mostrad",
      order: 2,
      label: "3.er estante (mira al interior)",
    };
  }
  if (n.includes("4to")) {
    return {
      x: 2.6,
      z: PARED_ENTRADA_Z,
      rotY: 0,
      zone: "frente-mostrad",
      order: 3,
      label: "4.º estante (mira al interior)",
    };
  }
  if (n.includes("5to")) {
    return {
      x: 6.0,
      z: PARED_ENTRADA_Z,
      rotY: 0,
      zone: "frente-mostrad",
      order: 4,
      label: "5.º estante (mira al interior)",
    };
  }

  return { x: 0, z: 0, rotY: 0, zone: "default", order: 99, label: nombre };
}

export const MOSTRADOR_LAYOUT = {
  x: mostradorCenterX,
  z: mostradorCenterZ,
  length: MOSTRADOR_LENGTH,
  depth: MOSTRADOR_DEPTH,
  rotY: 0,
} as const;

export function sortEstantesByLayout<T extends { estante_id: number; estante_nombre: string }>(
  items: T[]
): T[] {
  if (activeLocalLayout) {
    const order = new Map<number, number>();
    for (const cell of activeLocalLayout.cells) {
      if (cell.kind === "estante" && cell.estanteId != null) {
        order.set(cell.estanteId, cell.row * activeLocalLayout.cols + cell.col);
      }
      if (cell.kind === "frio" && cell.estanteId != null) {
        order.set(cell.estanteId, cell.row * activeLocalLayout.cols + cell.col);
      }
    }
    return [...items].sort(
      (a, b) =>
        (order.get(a.estante_id) ?? 999) - (order.get(b.estante_id) ?? 999)
    );
  }
  return [...items].sort(
    (a, b) =>
      resolveEstanteLayout(a.estante_nombre, a.estante_id).order -
      resolveEstanteLayout(b.estante_nombre, b.estante_id).order
  );
}
