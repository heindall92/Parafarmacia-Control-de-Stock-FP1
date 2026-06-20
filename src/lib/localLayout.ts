import type { Estante } from "./database";

/** Dirección hacia la que mira la cara frontal del estante. */
export type Orientacion = "n" | "s" | "e" | "w";

export type LocalLayoutCellKind =
  | "puerta"
  | "mostrador"
  | "estante"
  | "frio"
  | "estante_redondo"
  | "bascula"
  | "buro";

export type BuroEquipamiento = {
  monitor: boolean;
  torre: boolean;
  teclado: boolean;
  mouse: boolean;
};

export const DEFAULT_BURO_EQUIP: BuroEquipamiento = {
  monitor: true,
  torre: true,
  teclado: true,
  mouse: true,
};

export type LocalLayoutCell = {
  col: number;
  row: number;
  kind: LocalLayoutCellKind;
  estanteId?: number;
  buroId?: string;
  basculaId?: string;
  /** false = vacío en maqueta; true/undefined = muestra productos si hay stock. */
  conStock?: boolean;
  buroEquip?: BuroEquipamiento;
  orientacion: Orientacion;
  /** Si true, la orientación se recalcula hacia el centro del local. */
  mirarCentro: boolean;
  spanCols?: number;
  spanRows?: number;
};

export type LocalLayout = {
  version: 1;
  cols: number;
  rows: number;
  /** Metros por celda en la escena 3D. */
  cellSizeM: number;
  cells: LocalLayoutCell[];
  updatedAt: string;
};

export const LOCAL_LAYOUT_META_KEY = "local-layout-v1";

export const ORIENTACION_LABELS: Record<Orientacion, string> = {
  n: "Arriba ↑",
  s: "Abajo ↓",
  e: "Derecha →",
  w: "Izquierda ←",
};

export function createEmptyLayout(cols = 12, rows = 10): LocalLayout {
  return {
    version: 1,
    cols,
    rows,
    cellSizeM: 1.15,
    cells: [{ col: Math.floor(cols / 2), row: 0, kind: "puerta", orientacion: "n", mirarCentro: false }],
    updatedAt: new Date().toISOString(),
  };
}

export function orientacionToRotY(orientacion: Orientacion): number {
  switch (orientacion) {
    case "n":
      return Math.PI;
    case "s":
      return 0;
    case "e":
      return Math.PI / 2;
    case "w":
      return -Math.PI / 2;
    default:
      return 0;
  }
}

export function rotYTowardCenter(col: number, row: number, cols: number, rows: number): number {
  const cx = (cols - 1) / 2;
  const cz = (rows - 1) / 2;
  const dx = cx - col;
  const dz = cz - row;
  if (Math.abs(dx) < 0.01 && Math.abs(dz) < 0.01) return 0;
  return Math.atan2(dx, dz);
}

export function cellToWorld(col: number, row: number, layout: LocalLayout): { x: number; z: number } {
  const originX = -(layout.cols * layout.cellSizeM) / 2;
  const originZ = -(layout.rows * layout.cellSizeM) / 2;
  return {
    x: originX + (col + 0.5) * layout.cellSizeM,
    z: originZ + (row + 0.5) * layout.cellSizeM,
  };
}

/** Rotación Y donde el eje +X local apunta hacia el cliente (mostrador / puerta). */
export function orientacionToFacingRotY(orientacion: Orientacion): number {
  switch (orientacion) {
    case "e":
      return Math.PI;
    case "w":
      return 0;
    case "n":
      return Math.PI / 2;
    case "s":
      return -Math.PI / 2;
    default:
      return 0;
  }
}

export function resolveFacingRotY(cell: LocalLayoutCell, layout: LocalLayout): number {
  if (cell.mirarCentro) {
    const cx = (layout.cols - 1) / 2;
    const cz = (layout.rows - 1) / 2;
    const dx = cx - cell.col;
    const dz = cz - cell.row;
    if (Math.abs(dx) < 0.01 && Math.abs(dz) < 0.01) return 0;
    return Math.atan2(dz, dx) - Math.PI / 2;
  }
  return orientacionToFacingRotY(cell.orientacion);
}

export function resolveCellRotation(cell: LocalLayoutCell, layout: LocalLayout): number {
  if (cell.kind === "mostrador" || cell.kind === "puerta") {
    return resolveFacingRotY(cell, layout);
  }
  if (cell.mirarCentro) {
    return rotYTowardCenter(cell.col, cell.row, layout.cols, layout.rows);
  }
  return orientacionToRotY(cell.orientacion);
}

export function cellToLayoutSlot(
  cell: LocalLayoutCell,
  layout: LocalLayout,
  label: string
): {
  x: number;
  z: number;
  rotY: number;
  zone: string;
  order: number;
  label: string;
  shelfWidth?: number;
  fromCustomLayout: boolean;
} {
  const { x, z } = cellToWorld(cell.col, cell.row, layout);
  const rotY = resolveCellRotation(cell, layout);
  const span = Math.max(cell.spanCols ?? 1, cell.spanRows ?? 1);
  const shelfWidth =
    cell.kind === "mostrador"
      ? layout.cellSizeM * (cell.spanCols ?? 3)
      : cell.kind === "frio"
        ? layout.cellSizeM * 1.78
        : cell.kind === "estante_redondo"
          ? layout.cellSizeM * 2.05
          : cell.kind === "bascula"
            ? layout.cellSizeM * 0.66
            : cell.kind === "buro"
              ? layout.cellSizeM * 1.22
              : layout.cellSizeM * span * 2.8;

  return {
    x,
    z,
    rotY,
    zone: cell.kind,
    order: cell.row * layout.cols + cell.col,
    label,
    shelfWidth,
    fromCustomLayout: true,
  };
}

export function getMostradorFromLayout(layout: LocalLayout | null) {
  if (!layout) return null;
  const cell = layout.cells.find((item) => item.kind === "mostrador");
  if (!cell) return null;
  const slot = cellToLayoutSlot(cell, layout, "Mostrador");
  return {
    x: slot.x,
    z: slot.z,
    length: layout.cellSizeM * (cell.spanCols ?? 3),
    depth: layout.cellSizeM * (cell.spanRows ?? 1.2),
    rotY: slot.rotY,
  };
}

export function getPuertaFromLayout(layout: LocalLayout | null) {
  if (!layout) return null;
  const cell = layout.cells.find((item) => item.kind === "puerta");
  if (!cell) return null;
  return cellToWorld(cell.col, cell.row, layout);
}

export function resolveEstanteFromLayout(
  layout: LocalLayout | null,
  estanteId: number,
  estanteNombre: string
): ReturnType<typeof cellToLayoutSlot> | null {
  if (!layout) return null;
  const cell = layout.cells.find(
    (item) =>
      (item.kind === "estante" ||
        item.kind === "frio" ||
        item.kind === "estante_redondo") &&
      item.estanteId === estanteId
  );
  if (!cell) return null;
  return cellToLayoutSlot(cell, layout, estanteNombre);
}

export function isFrioCellForEstante(
  layout: LocalLayout | null | undefined,
  estanteId: number
): boolean {
  return (
    layout?.cells.some((c) => c.kind === "frio" && c.estanteId === estanteId) ?? false
  );
}

export function isRedondoCellForEstante(
  layout: LocalLayout | null | undefined,
  estanteId: number
): boolean {
  return (
    layout?.cells.some((c) => c.kind === "estante_redondo" && c.estanteId === estanteId) ??
    false
  );
}

export function getCellForEstante(
  layout: LocalLayout | null | undefined,
  estanteId: number
): LocalLayoutCell | undefined {
  return layout?.cells.find(
    (c) =>
      (c.kind === "estante" || c.kind === "frio" || c.kind === "estante_redondo") &&
      c.estanteId === estanteId
  );
}

export function cellShowsStock(cell: LocalLayoutCell | undefined): boolean {
  return cell?.conStock !== false;
}

export function getBuroCells(layout: LocalLayout | null | undefined): LocalLayoutCell[] {
  return layout?.cells.filter((c) => c.kind === "buro") ?? [];
}

export function getBasculaCells(layout: LocalLayout | null | undefined): LocalLayoutCell[] {
  return layout?.cells.filter((c) => c.kind === "bascula") ?? [];
}

export function sortByLayoutOrder<T extends { estante_id: number }>(
  items: T[],
  layout: LocalLayout | null
): T[] {
  if (!layout) return items;
  const order = new Map<number, number>();
  for (const cell of layout.cells) {
    if (
      (cell.kind === "estante" ||
        cell.kind === "frio" ||
        cell.kind === "estante_redondo") &&
      cell.estanteId != null
    ) {
      order.set(cell.estanteId, cell.row * layout.cols + cell.col);
    }
  }
  return [...items].sort(
    (a, b) => (order.get(a.estante_id) ?? 999) - (order.get(b.estante_id) ?? 999)
  );
}

/** Plano inicial basado en la distribución típica de la parafarmacia. */
export function buildDefaultLocalLayout(estantes: Estante[]): LocalLayout {
  const layout = createEmptyLayout(12, 10);
  const byName = (fragment: string) =>
    estantes.find((e) => e.nombre.toLowerCase().includes(fragment))?.id;

  const placements: Array<Omit<LocalLayoutCell, "mirarCentro"> & { mirarCentro?: boolean }> = [
    { col: 5, row: 0, kind: "puerta", orientacion: "n" },
    { col: 9, row: 5, kind: "mostrador", orientacion: "w", spanCols: 3, spanRows: 1 },
    { col: 9, row: 8, kind: "estante", estanteId: byName("detr"), orientacion: "s", mirarCentro: true },
    { col: 2, row: 5, kind: "estante", estanteId: byName("2do"), orientacion: "e", mirarCentro: true },
    { col: 2, row: 1, kind: "estante", estanteId: byName("3er"), orientacion: "n", mirarCentro: true },
    { col: 5, row: 1, kind: "estante", estanteId: byName("4to"), orientacion: "n", mirarCentro: true },
    { col: 8, row: 1, kind: "estante", estanteId: byName("5to"), orientacion: "n", mirarCentro: true },
  ];

  layout.cells = placements
    .filter((item) => item.kind !== "estante" || item.estanteId != null)
    .map((item) => ({
      col: item.col,
      row: item.row,
      kind: item.kind,
      estanteId: item.estanteId,
      orientacion: item.orientacion,
      mirarCentro: item.mirarCentro ?? false,
      spanCols: item.spanCols,
      spanRows: item.spanRows,
    }));

  for (const estante of estantes) {
    if (layout.cells.some((c) => c.estanteId === estante.id)) continue;
    const free = findFreeCell(layout);
    if (!free) break;
    layout.cells.push({
      ...free,
      kind:
        estante.tipo === "frio"
          ? "frio"
          : estante.tipo === "redondo"
            ? "estante_redondo"
            : "estante",
      estanteId: estante.id,
      orientacion: "n",
      mirarCentro: true,
    });
  }

  layout.updatedAt = new Date().toISOString();
  return layout;
}

function findFreeCell(layout: LocalLayout): Pick<LocalLayoutCell, "col" | "row"> | null {
  const occupied = new Set(layout.cells.map((c) => `${c.col},${c.row}`));
  for (let row = 2; row < layout.rows - 1; row += 1) {
    for (let col = 1; col < layout.cols - 1; col += 1) {
      if (!occupied.has(`${col},${row}`)) return { col, row };
    }
  }
  return null;
}

export function parseLocalLayout(raw: string | null | undefined): LocalLayout | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as LocalLayout;
    if (parsed.version !== 1 || !Array.isArray(parsed.cells)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getUnplacedEstanteIds(layout: LocalLayout, estantes: Estante[]): Estante[] {
  const placed = new Set(
    layout.cells
      .filter((c) => c.kind === "estante" && c.estanteId)
      .map((c) => c.estanteId as number)
  );
  return estantes.filter(
    (e) => (e.tipo ?? "normal") === "normal" && !placed.has(e.id)
  );
}

export function getUnplacedRedondoIds(layout: LocalLayout, estantes: Estante[]): Estante[] {
  const placed = new Set(
    layout.cells
      .filter((c) => c.kind === "estante_redondo" && c.estanteId != null)
      .map((c) => c.estanteId as number)
  );
  return estantes.filter((e) => e.tipo === "redondo" && !placed.has(e.id));
}

export function getUnplacedFrioIds(layout: LocalLayout, estantes: Estante[]): Estante[] {
  const placed = new Set(
    layout.cells
      .filter((c) => c.kind === "frio" && c.estanteId != null)
      .map((c) => c.estanteId as number)
  );
  return estantes.filter((e) => e.tipo === "frio" && !placed.has(e.id));
}

export function getUnplacedLayoutKinds(
  layout: LocalLayout
): Array<Exclude<LocalLayoutCellKind, "estante" | "frio" | "estante_redondo">> {
  const missing: Array<Exclude<LocalLayoutCellKind, "estante" | "frio" | "estante_redondo">> =
    [];
  if (!layout.cells.some((c) => c.kind === "puerta")) missing.push("puerta");
  if (!layout.cells.some((c) => c.kind === "mostrador")) missing.push("mostrador");
  return missing;
}

export function getLayoutCellByKind(
  layout: LocalLayout,
  kind: Exclude<LocalLayoutCellKind, "estante" | "frio" | "estante_redondo">
): LocalLayoutCell | undefined {
  return layout.cells.find((c) => c.kind === kind);
}

export function getEstanteLayoutCell(
  layout: LocalLayout,
  estanteId: number
): LocalLayoutCell | undefined {
  return layout.cells.find((c) => c.kind === "estante" && c.estanteId === estanteId);
}

/** Convierte índice de formulario (1-based) a índice interno (0-based). */
export function formIndexToCell(value: number, max: number): number | null {
  if (!Number.isFinite(value) || value < 1) return null;
  const index = Math.floor(value) - 1;
  if (index >= max) return null;
  return index;
}

export function cellIndexToForm(index: number): number {
  return index + 1;
}

export function resizeLocalLayout(layout: LocalLayout, cols: number, rows: number): LocalLayout {
  const safeCols = Math.min(24, Math.max(4, cols));
  const safeRows = Math.min(20, Math.max(4, rows));
  return {
    ...layout,
    cols: safeCols,
    rows: safeRows,
    cells: layout.cells.filter((c) => c.col < safeCols && c.row < safeRows),
  };
}

export function setPuertaCell(
  layout: LocalLayout,
  col: number,
  row: number,
  orientacion: Orientacion = "s",
  mirarCentro = false
): LocalLayout {
  const others = layout.cells.filter((c) => c.kind !== "puerta");
  return {
    ...layout,
    cells: [...others, { col, row, kind: "puerta", orientacion, mirarCentro }],
  };
}

export function setMostradorCell(
  layout: LocalLayout,
  col: number,
  row: number,
  orientacion: Orientacion,
  mirarCentro: boolean,
  spanCols = 3
): LocalLayout {
  const others = layout.cells.filter((c) => c.kind !== "mostrador");
  return {
    ...layout,
    cells: [
      ...others,
      { col, row, kind: "mostrador", orientacion, mirarCentro, spanCols, spanRows: 1 },
    ],
  };
}

export function setFrioCell(
  layout: LocalLayout,
  estanteId: number,
  col: number,
  row: number,
  orientacion: Orientacion,
  mirarCentro: boolean,
  conStock = true
): LocalLayout {
  const others = layout.cells.filter(
    (c) =>
      !(c.kind === "frio" && c.estanteId === estanteId) && !(c.col === col && c.row === row)
  );
  return {
    ...layout,
    cells: [
      ...others,
      { col, row, kind: "frio", estanteId, orientacion, mirarCentro, conStock },
    ],
  };
}

export function setEstanteCell(
  layout: LocalLayout,
  estanteId: number,
  col: number,
  row: number,
  orientacion: Orientacion,
  mirarCentro: boolean,
  conStock = true
): LocalLayout {
  const others = layout.cells.filter(
    (c) => !(c.kind === "estante" && c.estanteId === estanteId) && !(c.col === col && c.row === row)
  );
  return {
    ...layout,
    cells: [
      ...others,
      { col, row, kind: "estante", estanteId, orientacion, mirarCentro, conStock },
    ],
  };
}

export function setBuroCell(
  layout: LocalLayout,
  col: number,
  row: number,
  orientacion: Orientacion,
  mirarCentro: boolean,
  buroEquip: BuroEquipamiento = DEFAULT_BURO_EQUIP,
  buroId?: string
): LocalLayout {
  const others = layout.cells.filter((c) => !(c.col === col && c.row === row));
  const id = buroId ?? `buro-${col}-${row}-${Date.now()}`;
  return {
    ...layout,
    cells: [
      ...others,
      { col, row, kind: "buro", buroId: id, orientacion, mirarCentro, buroEquip },
    ],
  };
}

export function setEstanteRedondoCell(
  layout: LocalLayout,
  estanteId: number,
  col: number,
  row: number,
  orientacion: Orientacion,
  mirarCentro: boolean,
  conStock = true
): LocalLayout {
  const others = layout.cells.filter(
    (c) =>
      !(c.kind === "estante_redondo" && c.estanteId === estanteId) &&
      !(c.col === col && c.row === row)
  );
  return {
    ...layout,
    cells: [
      ...others,
      { col, row, kind: "estante_redondo", estanteId, orientacion, mirarCentro, conStock },
    ],
  };
}

export function setBasculaCell(
  layout: LocalLayout,
  col: number,
  row: number,
  orientacion: Orientacion,
  mirarCentro: boolean,
  basculaId?: string
): LocalLayout {
  const others = layout.cells.filter((c) => !(c.col === col && c.row === row));
  const id = basculaId ?? `bascula-${col}-${row}-${Date.now()}`;
  return {
    ...layout,
    cells: [
      ...others,
      { col, row, kind: "bascula", basculaId: id, orientacion, mirarCentro },
    ],
  };
}

export function patchLayoutCell(
  layout: LocalLayout,
  col: number,
  row: number,
  patch: Partial<LocalLayoutCell>
): LocalLayout {
  return {
    ...layout,
    cells: layout.cells.map((c) =>
      c.col === col && c.row === row ? { ...c, ...patch } : c
    ),
  };
}

export function removeEstanteCell(layout: LocalLayout, estanteId: number): LocalLayout {
  return {
    ...layout,
    cells: layout.cells.filter((c) => !(c.kind === "estante" && c.estanteId === estanteId)),
  };
}

/** Quita del plano cualquier celda (estante, frío o redondo) vinculada al id. */
export function removeEstanteFromLayout(layout: LocalLayout, estanteId: number): LocalLayout {
  return {
    ...layout,
    cells: layout.cells.filter(
      (c) =>
        !(
          c.estanteId === estanteId &&
          (c.kind === "estante" || c.kind === "frio" || c.kind === "estante_redondo")
        )
    ),
  };
}

export function removeCellAt(layout: LocalLayout, col: number, row: number): LocalLayout {
  return {
    ...layout,
    cells: layout.cells.filter((c) => !(c.col === col && c.row === row)),
  };
}

export function moveLayoutCell(
  layout: LocalLayout,
  fromCol: number,
  fromRow: number,
  toCol: number,
  toRow: number
): LocalLayout {
  if (fromCol === toCol && fromRow === toRow) return layout;
  const cell = layout.cells.find((c) => c.col === fromCol && c.row === fromRow);
  if (!cell) return layout;

  let cells = layout.cells.filter((c) => !(c.col === fromCol && c.row === fromRow));
  cells = cells.filter((c) => !(c.col === toCol && c.row === toRow));

  if (cell.kind === "puerta") cells = cells.filter((c) => c.kind !== "puerta");
  if (cell.kind === "mostrador") cells = cells.filter((c) => c.kind !== "mostrador");
  if (cell.kind === "estante" && cell.estanteId != null) {
    cells = cells.filter((c) => !(c.kind === "estante" && c.estanteId === cell.estanteId));
  }
  if (cell.kind === "frio" && cell.estanteId != null) {
    cells = cells.filter((c) => !(c.kind === "frio" && c.estanteId === cell.estanteId));
  }
  if (cell.kind === "estante_redondo" && cell.estanteId != null) {
    cells = cells.filter(
      (c) => !(c.kind === "estante_redondo" && c.estanteId === cell.estanteId)
    );
  }

  cells.push({ ...cell, col: toCol, row: toRow });
  return { ...layout, cells };
}

/** Celdas centrales del local (imán visual en el plano). */
export function isRoomCenterCell(layout: LocalLayout, col: number, row: number): boolean {
  const cx = Math.floor((layout.cols - 1) / 2);
  const cz = Math.floor((layout.rows - 1) / 2);
  return (col === cx || col === cx + 1) && (row === cz || row === cz + 1);
}

export function orientacionToDegrees(orientacion: Orientacion): number {
  switch (orientacion) {
    case "n":
      return 0;
    case "e":
      return 270;
    case "s":
      return 180;
    case "w":
      return 90;
    default:
      return 0;
  }
}

export function displayColFromLayout(col: number, cols: number): number {
  return cols - 1 - col;
}

export function layoutColFromDisplay(displayCol: number, cols: number): number {
  return cols - 1 - displayCol;
}

export function cellFacingDegrees(cell: LocalLayoutCell, layout: LocalLayout): number {
  if (cell.kind === "mostrador" || cell.kind === "puerta") {
    const rotY = resolveFacingRotY(cell, layout);
    return (rotY * 180) / Math.PI + 90;
  }
  if (cell.mirarCentro) {
    const rotY = rotYTowardCenter(cell.col, cell.row, layout.cols, layout.rows);
    return -(rotY * 180) / Math.PI + 180;
  }
  return orientacionToDegrees(cell.orientacion);
}

/** Ángulo de flecha en plano 2D (espejado horizontal = misma vista que cámara 3D). */
export function cellFacingDegrees2D(cell: LocalLayoutCell, layout: LocalLayout): number {
  const deg = cellFacingDegrees(cell, layout);
  return (360 - deg) % 360;
}

export const LAYOUT_DND_MIME = "application/x-parma-layout-v1";

export type LayoutDragPayload =
  | { action: "place"; kind: LocalLayoutCellKind; estanteId?: number }
  | { action: "move"; col: number; row: number };

export function parseLayoutDragPayload(raw: string): LayoutDragPayload | null {
  try {
    const data = JSON.parse(raw) as LayoutDragPayload;
    if (data.action === "place" && data.kind) return data;
    if (data.action === "move" && Number.isFinite(data.col) && Number.isFinite(data.row)) return data;
    return null;
  } catch {
    return null;
  }
}

export type PlaceOnGridOptions = {
  estanteId?: number;
  conStock?: boolean;
  buroEquip?: BuroEquipamiento;
};

export function placeOnGrid(
  layout: LocalLayout,
  col: number,
  row: number,
  kind: LocalLayoutCellKind,
  orientacion: Orientacion,
  mirarCentro: boolean,
  options: PlaceOnGridOptions = {}
): LocalLayout {
  const { estanteId, conStock = true, buroEquip } = options;
  if (kind === "puerta") return setPuertaCell(layout, col, row, orientacion, mirarCentro);
  if (kind === "mostrador") return setMostradorCell(layout, col, row, orientacion, mirarCentro, 3);
  if (kind === "buro") return setBuroCell(layout, col, row, orientacion, mirarCentro, buroEquip);
  if (kind === "bascula") return setBasculaCell(layout, col, row, orientacion, mirarCentro);
  if (kind === "estante" && estanteId != null) {
    return setEstanteCell(layout, estanteId, col, row, orientacion, mirarCentro, conStock);
  }
  if (kind === "frio" && estanteId != null) {
    return setFrioCell(layout, estanteId, col, row, orientacion, mirarCentro, conStock);
  }
  if (kind === "estante_redondo" && estanteId != null) {
    return setEstanteRedondoCell(
      layout,
      estanteId,
      col,
      row,
      orientacion,
      mirarCentro,
      conStock
    );
  }
  return layout;
}
