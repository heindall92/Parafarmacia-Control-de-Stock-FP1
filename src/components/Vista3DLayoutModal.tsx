import {
  Box,
  CircleDot,
  DoorOpen,
  Eraser,
  GripVertical,
  LayoutGrid,
  Laptop,
  Map as MapIcon,
  Move,
  Plus,
  RotateCcw,
  Save,
  Scale,
  Snowflake,
  Sparkles,
  Store,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import {
  ensureLocalLayout,
  getEstanteCounts,
  getEstantes,
  resetLocalLayout,
  saveLocalLayout,
  crearEstante,
  crearFrio,
  crearEstanteRedondo,
  eliminarEstante,
  type Estante,
} from "../lib/database";
import { setActiveLocalLayout } from "../lib/estanteLayout";
import {
  LAYOUT_DND_MIME,
  cellFacingDegrees2D,
  cellIndexToForm,
  getUnplacedEstanteIds,
  getUnplacedFrioIds,
  getUnplacedRedondoIds,
  getUnplacedLayoutKinds,
  isRoomCenterCell,
  layoutColFromDisplay,
  moveLayoutCell,
  parseLayoutDragPayload,
  patchLayoutCell,
  placeOnGrid,
  removeCellAt,
  removeEstanteFromLayout,
  resizeLocalLayout,
  setEstanteRedondoCell,
  setBasculaCell,
  setBuroCell,
  setEstanteCell,
  setFrioCell,
  setMostradorCell,
  setPuertaCell,
  DEFAULT_BURO_EQUIP,
  type BuroEquipamiento,
  type LayoutDragPayload,
  type LocalLayout,
  type LocalLayoutCell,
  type LocalLayoutCellKind,
  type Orientacion,
} from "../lib/localLayout";
import { LayoutEditorPreview3D } from "./LayoutEditorPreview3D";

type Vista3DLayoutModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

type ActiveTool = LocalLayoutCellKind | "erase";
type EditorView = "2d" | "3d";

type CreateElementType =
  | "estante"
  | "frio"
  | "estante_redondo"
  | "bascula"
  | "mostrador"
  | "puerta"
  | "buro";

const CREATE_TYPE_OPTIONS: Array<{
  value: CreateElementType;
  label: string;
  placeholder: string;
  needsName: boolean;
}> = [
  { value: "estante", label: "Estante", placeholder: "Ej. Estante pasillo central", needsName: true },
  { value: "frio", label: "Frío / nevera", placeholder: "Ej. Nevera medicamentos", needsName: true },
  {
    value: "estante_redondo",
    label: "Estante redondo",
    placeholder: "Ej. Estante redondo central",
    needsName: true,
  },
  { value: "bascula", label: "Báscula / pesa", placeholder: "", needsName: false },
  { value: "mostrador", label: "Mostrador", placeholder: "", needsName: false },
  { value: "puerta", label: "Puerta", placeholder: "", needsName: false },
  { value: "buro", label: "Buró / mesa PC", placeholder: "", needsName: false },
];

const PALETTE: Array<{
  tool: ActiveTool;
  title: string;
  desc: string;
  icon: React.ReactNode;
  shortcut: string;
}> = [
  {
    tool: "estante",
    title: "Estante",
    desc: "Orientación manual o hacia el centro",
    icon: <Box size={20} />,
    shortcut: "1",
  },
  {
    tool: "frio",
    title: "Frío / nevera",
    desc: "Vitrina o armario refrigerado",
    icon: <Snowflake size={20} />,
    shortcut: "2",
  },
  {
    tool: "estante_redondo",
    title: "Estante redondo",
    desc: "3 pisos: grande, medio y pequeño",
    icon: <CircleDot size={20} />,
    shortcut: "3",
  },
  {
    tool: "bascula",
    title: "Báscula / pesa",
    desc: "Pesa fina, más estrecha que la puerta",
    icon: <Scale size={20} />,
    shortcut: "4",
  },
  {
    tool: "mostrador",
    title: "Mostrador",
    desc: "Bloque de atención al cliente",
    icon: <Store size={20} />,
    shortcut: "5",
  },
  {
    tool: "puerta",
    title: "Puerta",
    desc: "Entrada al local",
    icon: <DoorOpen size={20} />,
    shortcut: "6",
  },
  {
    tool: "buro",
    title: "Buró",
    desc: "Mesa de ordenador configurable",
    icon: <Laptop size={20} />,
    shortcut: "7",
  },
  {
    tool: "erase",
    title: "Borrar",
    desc: "Quita el objeto de la casilla",
    icon: <Eraser size={20} />,
    shortcut: "8",
  },
];

export function Vista3DLayoutModal({ open, onClose, onSaved }: Vista3DLayoutModalProps) {
  const [layout, setLayout] = useState<LocalLayout | null>(null);
  const [estantes, setEstantes] = useState<Estante[]>([]);
  const [activeTool, setActiveTool] = useState<ActiveTool>("estante");
  const [view, setView] = useState<EditorView>("2d");
  const [selectedEstanteId, setSelectedEstanteId] = useState<number | null>(null);
  const [selectedCellKey, setSelectedCellKey] = useState<string | null>(null);
  const [orientacion, setOrientacion] = useState<Orientacion>("n");
  const [mirarCentro, setMirarCentro] = useState(true);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [draggingTool, setDraggingTool] = useState<ActiveTool | "move" | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const gridViewportRef = useRef<HTMLDivElement>(null);
  const dragPayloadRef = useRef<LayoutDragPayload | null>(null);
  const [viewportSize, setViewportSize] = useState({ w: 960, h: 640 });
  const [newElementName, setNewElementName] = useState("");
  const [createElementType, setCreateElementType] = useState<CreateElementType>("estante");
  const [creatingElement, setCreatingElement] = useState(false);
  const [selectedFrioId, setSelectedFrioId] = useState<number | null>(null);
  const [selectedRedondoId, setSelectedRedondoId] = useState<number | null>(null);
  const [estanteCounts, setEstanteCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "1") setActiveTool("estante");
      if (event.key === "2") setActiveTool("frio");
      if (event.key === "3") setActiveTool("estante_redondo");
      if (event.key === "4") setActiveTool("bascula");
      if (event.key === "5") setActiveTool("mostrador");
      if (event.key === "6") setActiveTool("puerta");
      if (event.key === "7") setActiveTool("buro");
      if (event.key === "8") setActiveTool("erase");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    const node = gridViewportRef.current;
    if (!node || !open || view !== "2d") return;
    const observer = new ResizeObserver(([entry]) => {
      setViewportSize({
        w: Math.max(320, entry.contentRect.width - 24),
        h: Math.max(280, entry.contentRect.height - 24),
      });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [open, view, layout?.cols, layout?.rows]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    void Promise.all([ensureLocalLayout(), getEstantes(), getEstanteCounts()])
      .then(([loaded, ests, counts]) => {
        setLayout(loaded);
        setEstantes(ests);
        setEstanteCounts(counts);
        setActiveLocalLayout(loaded);
        const firstUnplaced = getUnplacedEstanteIds(loaded, ests)[0];
        const firstUnplacedFrio = getUnplacedFrioIds(loaded, ests)[0];
        const firstUnplacedRedondo = getUnplacedRedondoIds(loaded, ests)[0];
        setSelectedEstanteId(firstUnplaced?.id ?? ests.find((e) => e.tipo === "normal")?.id ?? ests[0]?.id ?? null);
        setSelectedFrioId(firstUnplacedFrio?.id ?? ests.find((e) => e.tipo === "frio")?.id ?? null);
        setSelectedRedondoId(
          firstUnplacedRedondo?.id ?? ests.find((e) => e.tipo === "redondo")?.id ?? null
        );
      })
      .finally(() => setLoading(false));
  }, [open]);

  const cellMap = useMemo(() => {
    const map = new Map<string, LocalLayoutCell>();
    if (!layout) return map;
    for (const cell of layout.cells) map.set(`${cell.col},${cell.row}`, cell);
    return map;
  }, [layout]);

  const unplaced = useMemo(
    () => (layout ? getUnplacedEstanteIds(layout, estantes) : []),
    [layout, estantes]
  );

  const unplacedFrios = useMemo(
    () => (layout ? getUnplacedFrioIds(layout, estantes) : []),
    [layout, estantes]
  );

  const unplacedRedondos = useMemo(
    () => (layout ? getUnplacedRedondoIds(layout, estantes) : []),
    [layout, estantes]
  );

  const unplacedLayoutKinds = useMemo(
    () => (layout ? getUnplacedLayoutKinds(layout) : []),
    [layout]
  );

  const estantesNormales = useMemo(
    () => estantes.filter((e) => (e.tipo ?? "normal") === "normal"),
    [estantes]
  );

  const estantesFrio = useMemo(() => estantes.filter((e) => e.tipo === "frio"), [estantes]);

  const estantesRedondo = useMemo(
    () => estantes.filter((e) => e.tipo === "redondo"),
    [estantes]
  );

  const selectedCell = selectedCellKey ? cellMap.get(selectedCellKey) ?? null : null;
  const objectCount = layout?.cells.length ?? 0;

  const cellSizePx = useMemo(() => {
    if (!layout) return 52;
    const gap = 3;
    const byWidth = (viewportSize.w - gap * (layout.cols - 1)) / layout.cols;
    const byHeight = (viewportSize.h - gap * (layout.rows - 1)) / layout.rows;
    return Math.max(44, Math.floor(Math.min(byWidth, byHeight, 96)));
  }, [layout, viewportSize]);

  if (!open) return null;

  const activePalette = PALETTE.find((p) => p.tool === activeTool);

  const resolveConStock = (estanteId: number | undefined) =>
    estanteId != null ? (estanteCounts[estanteId] ?? 0) > 0 : true;

  const placeItem = (
    col: number,
    row: number,
    kind: LocalLayoutCellKind,
    estanteId?: number
  ) =>
    placeOnGrid(layout!, col, row, kind, orientacion, mirarCentro, {
      estanteId,
      conStock: estanteId != null ? resolveConStock(estanteId) : true,
      buroEquip: DEFAULT_BURO_EQUIP,
    });

  const bumpGrid = (field: "cols" | "rows", delta: number) => {
    if (!layout) return;
    const next = Math.min(field === "cols" ? 24 : 20, Math.max(4, layout[field] + delta));
    setLayout(
      resizeLocalLayout(
        layout,
        field === "cols" ? next : layout.cols,
        field === "rows" ? next : layout.rows
      )
    );
  };

  const handleSave = async () => {
    if (!layout) return;
    setSaving(true);
    try {
      const saved = await saveLocalLayout(layout);
      setActiveLocalLayout(saved);
      onSaved?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("¿Restaurar el plano automático? Se perderán los cambios manuales.")) return;
    const reset = await resetLocalLayout();
    setLayout(reset);
    setActiveLocalLayout(reset);
    setSelectedCellKey(null);
  };

  const handleDeleteEstante = async (est: Estante) => {
    const productos = estanteCounts[est.id] ?? 0;
    const tipoLabel =
      est.tipo === "frio" ? "nevera" : est.tipo === "redondo" ? "estante redondo" : "estante";
    const msg =
      productos > 0
        ? `¿Eliminar "${est.nombre}"? ${productos} productos quedarán sin estante asignado.`
        : `¿Eliminar el ${tipoLabel} "${est.nombre}"? Se quitará del plano si estaba colocado.`;
    if (!window.confirm(msg)) return;

    try {
      if (layout) setLayout(removeEstanteFromLayout(layout, est.id));
      await eliminarEstante(est.id);
      const [ests, counts] = await Promise.all([getEstantes(), getEstanteCounts()]);
      setEstantes(ests);
      setEstanteCounts(counts);
      if (selectedEstanteId === est.id) setSelectedEstanteId(null);
      if (selectedFrioId === est.id) setSelectedFrioId(null);
      if (selectedRedondoId === est.id) setSelectedRedondoId(null);
      if (selectedCell?.estanteId === est.id) setSelectedCellKey(null);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "No se pudo eliminar.");
    }
  };

  const selectCell = (col: number, row: number, cell?: LocalLayoutCell) => {
    const key = `${col},${row}`;
    setSelectedCellKey(key);
    if (cell) {
      setOrientacion(cell.orientacion);
      setMirarCentro(cell.mirarCentro);
      setActiveTool(cell.kind);
      if (cell.estanteId) {
        if (cell.kind === "frio") setSelectedFrioId(cell.estanteId);
        else if (cell.kind === "estante_redondo") setSelectedRedondoId(cell.estanteId);
        else setSelectedEstanteId(cell.estanteId);
      }
    }
  };

  const dropOnCell = (
    col: number,
    row: number,
    payload: ReturnType<typeof parseLayoutDragPayload>
  ) => {
    if (!layout || !payload) return;
    if (payload.action === "move") {
      setLayout(moveLayoutCell(layout, payload.col, payload.row, col, row));
      setSelectedCellKey(`${col},${row}`);
      return;
    }
    const estanteId =
      payload.kind === "estante"
        ? (payload.estanteId ?? selectedEstanteId ?? undefined)
        : payload.kind === "frio"
          ? (payload.estanteId ?? selectedFrioId ?? undefined)
          : payload.kind === "estante_redondo"
            ? (payload.estanteId ?? selectedRedondoId ?? undefined)
            : undefined;
    if (payload.kind === "estante" && !estanteId) return;
    if (payload.kind === "frio" && !estanteId) return;
    if (payload.kind === "estante_redondo" && !estanteId) return;
    setLayout(placeItem(col, row, payload.kind, estanteId));
    setSelectedCellKey(`${col},${row}`);
    setActiveTool(payload.kind);
    if (payload.kind === "estante" && estanteId) setSelectedEstanteId(estanteId);
    if (payload.kind === "frio" && estanteId) setSelectedFrioId(estanteId);
    if (payload.kind === "estante_redondo" && estanteId) setSelectedRedondoId(estanteId);
  };

  const handleCellClick = (col: number, row: number) => {
    if (!layout) return;
    const cell = cellMap.get(`${col},${row}`);

    if (activeTool === "erase") {
      if (cell) {
        setLayout(removeCellAt(layout, col, row));
        if (selectedCellKey === `${col},${row}`) setSelectedCellKey(null);
      }
      return;
    }

    if (cell) {
      selectCell(col, row, cell);
      return;
    }

    const estanteId =
      activeTool === "estante"
        ? selectedEstanteId ?? undefined
        : activeTool === "frio"
          ? selectedFrioId ?? undefined
          : activeTool === "estante_redondo"
            ? selectedRedondoId ?? undefined
            : undefined;
    if (activeTool === "estante" && !estanteId) return;
    if (activeTool === "frio" && !estanteId) return;
    if (activeTool === "estante_redondo" && !estanteId) return;

    setLayout(placeItem(col, row, activeTool, estanteId));
    selectCell(col, row);
  };

  const patchSelectedCell = (patch: Partial<{ orientacion: Orientacion; mirarCentro: boolean }>) => {
    if (!layout || !selectedCell) return;
    const nextOrient = patch.orientacion ?? selectedCell.orientacion;
    const nextCenter = patch.mirarCentro ?? selectedCell.mirarCentro;
    setOrientacion(nextOrient);
    setMirarCentro(nextCenter);

    if (selectedCell.kind === "mostrador") {
      setLayout(
        setMostradorCell(
          layout,
          selectedCell.col,
          selectedCell.row,
          nextOrient,
          nextCenter,
          selectedCell.spanCols ?? 3
        )
      );
      return;
    }
    if (selectedCell.kind === "puerta") {
      setLayout(
        setPuertaCell(
          layout,
          selectedCell.col,
          selectedCell.row,
          nextOrient,
          nextCenter
        )
      );
      return;
    }
    if (selectedCell.kind === "estante" && selectedCell.estanteId != null) {
      setLayout(
        setEstanteCell(
          layout,
          selectedCell.estanteId,
          selectedCell.col,
          selectedCell.row,
          nextOrient,
          nextCenter,
          selectedCell.conStock !== false
        )
      );
      return;
    }
    if (selectedCell.kind === "frio" && selectedCell.estanteId != null) {
      setLayout(
        setFrioCell(
          layout,
          selectedCell.estanteId,
          selectedCell.col,
          selectedCell.row,
          nextOrient,
          nextCenter,
          selectedCell.conStock !== false
        )
      );
      return;
    }
    if (selectedCell.kind === "estante_redondo" && selectedCell.estanteId != null) {
      setLayout(
        setEstanteRedondoCell(
          layout,
          selectedCell.estanteId,
          selectedCell.col,
          selectedCell.row,
          nextOrient,
          nextCenter,
          selectedCell.conStock !== false
        )
      );
      return;
    }
    if (selectedCell.kind === "buro") {
      setLayout(
        setBuroCell(
          layout,
          selectedCell.col,
          selectedCell.row,
          nextOrient,
          nextCenter,
          selectedCell.buroEquip ?? DEFAULT_BURO_EQUIP,
          selectedCell.buroId
        )
      );
      return;
    }
    if (selectedCell.kind === "bascula") {
      setLayout(
        setBasculaCell(
          layout,
          selectedCell.col,
          selectedCell.row,
          nextOrient,
          nextCenter,
          selectedCell.basculaId
        )
      );
    }
  };

  const patchCellMeta = (patch: Partial<LocalLayoutCell>) => {
    if (!layout || !selectedCell) return;
    setLayout(patchLayoutCell(layout, selectedCell.col, selectedCell.row, patch));
  };

  const toggleBuroEquip = (key: keyof BuroEquipamiento) => {
    if (!selectedCell || selectedCell.kind !== "buro") return;
    const current = selectedCell.buroEquip ?? DEFAULT_BURO_EQUIP;
    patchCellMeta({ buroEquip: { ...current, [key]: !current[key] } });
  };

  const startDrag = (event: DragEvent, payload: LayoutDragPayload) => {
    const json = JSON.stringify(payload);
    event.dataTransfer.setData(LAYOUT_DND_MIME, json);
    event.dataTransfer.setData("text/plain", json);
    event.dataTransfer.effectAllowed = payload.action === "move" ? "move" : "copy";
    dragPayloadRef.current = payload;
    // Evitar re-render síncrono en dragStart: cancela el arrastre en React.
    requestAnimationFrame(() => {
      setDraggingTool(payload.action === "move" ? "move" : payload.kind);
    });
  };

  const endDrag = () => {
    dragPayloadRef.current = null;
    setDraggingTool(null);
  };

  const readDragPayload = (event: DragEvent): LayoutDragPayload | null => {
    const raw =
      event.dataTransfer.getData(LAYOUT_DND_MIME) ||
      event.dataTransfer.getData("text/plain");
    return parseLayoutDragPayload(raw) ?? dragPayloadRef.current;
  };

  const handleCreateElement = async () => {
    setCreatingElement(true);
    try {
      if (createElementType === "estante") {
        const name = newElementName.trim() || `Estante ${estantesNormales.length + 1}`;
        const created = await crearEstante(name, null, "normal");
        const next = await getEstantes();
        setEstantes(next);
        setSelectedEstanteId(created.id);
        setActiveTool("estante");
        setNewElementName("");
        return;
      }

      if (createElementType === "frio") {
        const name = newElementName.trim() || `Nevera ${estantesFrio.length + 1}`;
        const created = await crearFrio(name);
        const next = await getEstantes();
        setEstantes(next);
        setSelectedFrioId(created.id);
        setActiveTool("frio");
        setNewElementName("");
        return;
      }

      if (createElementType === "estante_redondo") {
        const name = newElementName.trim() || `Estante redondo ${estantesRedondo.length + 1}`;
        const created = await crearEstanteRedondo(name);
        const next = await getEstantes();
        setEstantes(next);
        setSelectedRedondoId(created.id);
        setActiveTool("estante_redondo");
        setNewElementName("");
        return;
      }

      if (createElementType === "bascula") {
        setActiveTool("bascula");
        return;
      }

      if (createElementType === "puerta") {
        if (!layout?.cells.some((c) => c.kind === "puerta")) {
          setActiveTool("puerta");
        }
        return;
      }

      if (createElementType === "mostrador") {
        if (!layout?.cells.some((c) => c.kind === "mostrador")) {
          setActiveTool("mostrador");
        }
        return;
      }

      if (createElementType === "buro") {
        setActiveTool("buro");
      }
    } finally {
      setCreatingElement(false);
    }
  };

  const createOption = CREATE_TYPE_OPTIONS.find((o) => o.value === createElementType)!;

  return (
    <div className="layout-editor-overlay" role="dialog" aria-modal="true">
      <div className="layout-editor-shell">
        <header className="layout-editor-header">
          <div className="layout-editor-brand">
            <div className="layout-editor-logo">
              <LayoutGrid size={18} />
            </div>
            <div>
              <strong>Configurador Vista 3D</strong>
              <small>Arrastra objetos al plano · clic para colocar · teclas 1–8</small>
            </div>
          </div>
          <div className="layout-editor-dnd-banner">
            <Move size={16} />
            <span>Arrastra estantes, neveras, báscula, mostrador o puerta desde la izquierda al cuadrante</span>
          </div>
          <div className="layout-editor-stats">
            <div>
              <strong>{layout ? `${layout.cols} × ${layout.rows}` : "—"}</strong>
              <span>cuadrícula</span>
            </div>
            <div>
              <strong>{objectCount}</strong>
              <span>objetos</span>
            </div>
          </div>
          <div className="layout-editor-header-actions">
            <button type="button" className="btn-icon layout-editor-btn-ghost" onClick={() => void handleReset()}>
              <RotateCcw size={16} />
              Restaurar
            </button>
            <button type="button" className="layout-editor-btn-primary layout-editor-btn-primary--sm" onClick={() => setView("3d")}>
              <Sparkles size={16} />
              Vista 3D
            </button>
            <button type="button" className="layout-editor-close" onClick={onClose} aria-label="Cerrar">
              <X size={20} />
            </button>
          </div>
        </header>

        {loading || !layout ? (
          <div className="layout-editor-loading">Cargando configurador…</div>
        ) : (
          <div className="layout-editor-workspace">
            <aside className="layout-editor-col">
              <section className="layout-editor-panel">
                <h3 className="layout-editor-panel-title">Dimensiones del local</h3>
                <div className="layout-editor-stepper-row">
                  <StepperField
                    label="Cuadrados de ancho"
                    value={layout.cols}
                    onDec={() => bumpGrid("cols", -1)}
                    onInc={() => bumpGrid("cols", 1)}
                    onChange={(v) => setLayout(resizeLocalLayout(layout, v, layout.rows))}
                  />
                  <StepperField
                    label="Cuadrados de largo"
                    value={layout.rows}
                    onDec={() => bumpGrid("rows", -1)}
                    onInc={() => bumpGrid("rows", 1)}
                    onChange={(v) => setLayout(resizeLocalLayout(layout, layout.cols, v))}
                  />
                </div>
                <p className="layout-editor-hint">
                  Cada cuadrado es una zona del local. Fila 1 abajo = entrada.
                </p>
              </section>

              <section className="layout-editor-panel">
                <h3 className="layout-editor-panel-title">Arrastrar y soltar</h3>
                <p className="layout-editor-dnd-tip">
                  <GripVertical size={14} />
                  Suelta sobre una casilla vacía o mueve objetos ya colocados.
                </p>
                <div className="layout-editor-palette">
                  {PALETTE.map((item) => (
                    <div
                      key={item.tool}
                      className={`layout-editor-palette-item ${activeTool === item.tool ? "layout-editor-palette-item--active" : ""} ${draggingTool === item.tool ? "layout-editor-palette-item--dragging" : ""}`}
                      draggable={item.tool !== "erase"}
                      onDragStart={(e) => {
                        if (item.tool === "erase") return;
                        startDrag(e, {
                          action: "place",
                          kind: item.tool,
                          estanteId:
                            item.tool === "estante"
                              ? selectedEstanteId ?? undefined
                              : item.tool === "frio"
                                ? selectedFrioId ?? undefined
                                : item.tool === "estante_redondo"
                                  ? selectedRedondoId ?? undefined
                                  : undefined,
                        });
                      }}
                      onDragEnd={endDrag}
                      onClick={() => setActiveTool(item.tool)}
                      role="button"
                      tabIndex={0}
                    >
                      <span className="layout-editor-palette-grip" aria-hidden>
                        <GripVertical size={14} />
                      </span>
                      <span className="layout-editor-palette-icon">{item.icon}</span>
                      <div>
                        <strong>{item.title}</strong>
                        <small>{item.desc}</small>
                      </div>
                      <kbd>{item.shortcut}</kbd>
                    </div>
                  ))}
                </div>
              </section>

              <section className="layout-editor-panel layout-editor-panel--create">
                <h3 className="layout-editor-panel-title">Añadir elementos</h3>
                <p className="layout-editor-hint">
                  Crea estantes, neveras, estante redondo, báscula, puerta o mostrador y arrástralos al plano.
                </p>
                <label className="layout-editor-field-label" htmlFor="layout-create-type">
                  Tipo de elemento
                </label>
                <select
                  id="layout-create-type"
                  className="layout-editor-select"
                  value={createElementType}
                  onChange={(e) => setCreateElementType(e.target.value as CreateElementType)}
                >
                  {CREATE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {createOption.needsName && (
                  <div className="layout-editor-create-shelf">
                    <input
                      type="text"
                      className="layout-editor-select"
                      placeholder={createOption.placeholder}
                      value={newElementName}
                      onChange={(e) => setNewElementName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void handleCreateElement();
                      }}
                    />
                  </div>
                )}
                <button
                  type="button"
                  className="layout-editor-btn-primary layout-editor-btn-primary--sm layout-editor-btn-primary--full"
                  disabled={creatingElement}
                  onClick={() => void handleCreateElement()}
                >
                  <Plus size={14} />
                  {creatingElement
                    ? "Creando…"
                    : createElementType === "estante"
                      ? "Crear estante"
                      : createElementType === "frio"
                        ? "Crear nevera / frío"
                        : createElementType === "estante_redondo"
                          ? "Crear estante redondo"
                          : createElementType === "bascula"
                            ? "Preparar báscula"
                            : createElementType === "mostrador"
                          ? "Preparar mostrador"
                          : createElementType === "buro"
                            ? "Preparar buró"
                            : "Preparar puerta"}
                </button>

                {(createElementType === "estante" || activeTool === "estante") && (
                  <>
                    <label className="layout-editor-field-label" htmlFor="layout-estante-select">
                      Estante activo
                    </label>
                    <select
                      id="layout-estante-select"
                      className="layout-editor-select"
                      value={selectedEstanteId ?? ""}
                      onChange={(e) => {
                        setSelectedEstanteId(Number(e.target.value));
                        setActiveTool("estante");
                      }}
                    >
                      {estantesNormales.length === 0 ? (
                        <option value="">Sin estantes — créalo arriba</option>
                      ) : (
                        estantesNormales.map((est) => (
                          <option key={est.id} value={est.id}>
                            {est.nombre}
                          </option>
                        ))
                      )}
                    </select>
                  </>
                )}

                {(createElementType === "frio" || activeTool === "frio") && (
                  <>
                    <label className="layout-editor-field-label" htmlFor="layout-frio-select">
                      Nevera activa
                    </label>
                    <select
                      id="layout-frio-select"
                      className="layout-editor-select"
                      value={selectedFrioId ?? ""}
                      onChange={(e) => {
                        setSelectedFrioId(Number(e.target.value));
                        setActiveTool("frio");
                      }}
                    >
                      {estantesFrio.length === 0 ? (
                        <option value="">Sin neveras — créala arriba</option>
                      ) : (
                        estantesFrio.map((est) => (
                          <option key={est.id} value={est.id}>
                            {est.nombre}
                          </option>
                        ))
                      )}
                    </select>
                  </>
                )}

                {(createElementType === "estante_redondo" || activeTool === "estante_redondo") && (
                  <>
                    <label className="layout-editor-field-label" htmlFor="layout-redondo-select">
                      Estante redondo activo
                    </label>
                    <select
                      id="layout-redondo-select"
                      className="layout-editor-select"
                      value={selectedRedondoId ?? ""}
                      onChange={(e) => {
                        setSelectedRedondoId(Number(e.target.value));
                        setActiveTool("estante_redondo");
                      }}
                    >
                      {estantesRedondo.length === 0 ? (
                        <option value="">Sin estantes redondos — créalo arriba</option>
                      ) : (
                        estantesRedondo.map((est) => (
                          <option key={est.id} value={est.id}>
                            {est.nombre}
                          </option>
                        ))
                      )}
                    </select>
                  </>
                )}

                {(unplaced.length > 0 ||
                  unplacedFrios.length > 0 ||
                  unplacedRedondos.length > 0 ||
                  unplacedLayoutKinds.length > 0) && (
                  <div className="layout-editor-unplaced">
                    <p className="layout-editor-warn">Sin colocar — arrastra al plano:</p>
                    {unplacedLayoutKinds.map((kind) => (
                      <div
                        key={kind}
                        className="layout-editor-unplaced-chip"
                        draggable
                        onDragStart={(e) => startDrag(e, { action: "place", kind })}
                        onDragEnd={endDrag}
                      >
                        <GripVertical size={12} />
                        {kind === "puerta" ? <DoorOpen size={14} /> : <Store size={14} />}
                        {kind === "puerta" ? "Puerta" : "Mostrador"}
                      </div>
                    ))}
                    {unplaced.map((est) => (
                      <div
                        key={est.id}
                        className="layout-editor-unplaced-chip"
                        draggable
                        onDragStart={(e) =>
                          startDrag(e, { action: "place", kind: "estante", estanteId: est.id })
                        }
                        onDragEnd={endDrag}
                      >
                        <GripVertical size={12} />
                        <Box size={14} />
                        <span className="layout-editor-unplaced-chip-label">{est.nombre}</span>
                        <button
                          type="button"
                          className="layout-editor-unplaced-chip-delete"
                          title="Eliminar estante"
                          draggable={false}
                          onDragStart={(e) => e.preventDefault()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDeleteEstante(est);
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    {unplacedFrios.map((est) => (
                      <div
                        key={est.id}
                        className="layout-editor-unplaced-chip layout-editor-unplaced-chip--frio"
                        draggable
                        onDragStart={(e) =>
                          startDrag(e, { action: "place", kind: "frio", estanteId: est.id })
                        }
                        onDragEnd={endDrag}
                      >
                        <GripVertical size={12} />
                        <Snowflake size={14} />
                        <span className="layout-editor-unplaced-chip-label">{est.nombre}</span>
                        <button
                          type="button"
                          className="layout-editor-unplaced-chip-delete"
                          title="Eliminar nevera"
                          draggable={false}
                          onDragStart={(e) => e.preventDefault()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDeleteEstante(est);
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    {unplacedRedondos.map((est) => (
                      <div
                        key={est.id}
                        className="layout-editor-unplaced-chip layout-editor-unplaced-chip--redondo"
                        draggable
                        onDragStart={(e) =>
                          startDrag(e, {
                            action: "place",
                            kind: "estante_redondo",
                            estanteId: est.id,
                          })
                        }
                        onDragEnd={endDrag}
                      >
                        <GripVertical size={12} />
                        <CircleDot size={14} />
                        <span className="layout-editor-unplaced-chip-label">{est.nombre}</span>
                        <button
                          type="button"
                          className="layout-editor-unplaced-chip-delete"
                          title="Eliminar estante redondo"
                          draggable={false}
                          onDragStart={(e) => e.preventDefault()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDeleteEstante(est);
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="layout-editor-panel">
                <h3 className="layout-editor-panel-title">Leyenda</h3>
                <div className="layout-editor-legend">
                  <span>
                    <i className="swatch swatch--estante" /> Estante
                  </span>
                  <span>
                    <i className="swatch swatch--frio" /> Frío / nevera
                  </span>
                  <span>
                    <i className="swatch swatch--redondo" /> Estante redondo
                  </span>
                  <span>
                    <i className="swatch swatch--bascula" /> Báscula
                  </span>
                  <span>
                    <i className="swatch swatch--mostrador" /> Mostrador
                  </span>
                  <span>
                    <i className="swatch swatch--puerta" /> Puerta
                  </span>
                  <span>
                    <i className="swatch swatch--buro" /> Buró
                  </span>
                  <span className="layout-editor-legend-mint">▲ Frente del estante</span>
                </div>
              </section>
            </aside>

            <section className="layout-editor-stage-wrap">
              <div className="layout-editor-tabs">
                <button
                  type="button"
                  className={view === "2d" ? "layout-editor-tab layout-editor-tab--active" : "layout-editor-tab"}
                  onClick={() => setView("2d")}
                >
                  <MapIcon size={15} />
                  Plano (2D)
                </button>
                <button
                  type="button"
                  className={view === "3d" ? "layout-editor-tab layout-editor-tab--active" : "layout-editor-tab"}
                  onClick={() => setView("3d")}
                >
                  <Box size={15} />
                  Vista 3D real
                </button>
              </div>

              <div className={`layout-editor-stage ${draggingTool ? "layout-editor-stage--dropping" : ""}`}>
                <div className="layout-editor-stage-hud">
                  <span>
                    Objeto: <b>{activePalette?.title ?? "—"}</b>
                  </span>
                  <span>
                    {draggingTool
                      ? "Suelta sobre una casilla…"
                      : activeTool === "erase"
                        ? "Clic en un objeto para borrarlo"
                        : "Arrastra desde la izquierda o haz clic en una casilla"}
                  </span>
                </div>

                {view === "2d" ? (
                  <div ref={gridViewportRef} className="layout-editor-grid-viewport">
                    <div
                      className="layout-editor-grid"
                      style={{
                        gridTemplateColumns: `repeat(${layout.cols}, ${cellSizePx}px)`,
                        gridTemplateRows: `repeat(${layout.rows}, ${cellSizePx}px)`,
                      }}
                    >
                    {Array.from({ length: layout.rows }, (_, displayIndex) => {
                      const row = layout.rows - 1 - displayIndex;
                      return Array.from({ length: layout.cols }, (_, displayCol) => {
                        const col = layoutColFromDisplay(displayCol, layout.cols);
                        const key = `${col},${row}`;
                        const cell = cellMap.get(key);
                        const isSelected = selectedCellKey === key;
                        const isCenter = isRoomCenterCell(layout, col, row);
                        const isDrop = dragOverKey === key;

                        return (
                          <div
                            key={key}
                            className={`layout-editor-cell ${cell ? "layout-editor-cell--has" : ""} ${isSelected ? "layout-editor-cell--sel" : ""} ${isCenter ? "layout-editor-cell--center" : ""} ${isDrop ? "layout-editor-cell--drop" : ""}`}
                            onClick={() => handleCellClick(col, row)}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = draggingTool === "move" ? "move" : "copy";
                              setDragOverKey(key);
                            }}
                            onDragLeave={() => setDragOverKey((k) => (k === key ? null : k))}
                            onDrop={(e) => {
                              e.preventDefault();
                              setDragOverKey(null);
                              dropOnCell(col, row, readDragPayload(e));
                              endDrag();
                            }}
                          >
                            {cell ? (
                              <div
                                className={`layout-editor-shelf layout-editor-shelf--${cell.kind} ${isSelected ? "layout-editor-shelf--sel" : ""}`}
                                draggable
                                style={{
                                  transform: `translate(-50%,-50%) rotate(${cellFacingDegrees2D(cell, layout)}deg)`,
                                }}
                                onDragStart={(e) => {
                                  e.stopPropagation();
                                  startDrag(e, { action: "move", col, row });
                                }}
                                onDragEnd={endDrag}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  selectCell(col, row, cell);
                                }}
                              >
                                <>
                                  <span className="layout-editor-shelf-front" />
                                  <span className="layout-editor-shelf-arrow" />
                                </>
                                <span className="layout-editor-shelf-icon">
                                  {cell.kind === "puerta" ? (
                                    <DoorOpen size={16} />
                                  ) : cell.kind === "mostrador" ? (
                                    <Store size={16} />
                                  ) : cell.kind === "frio" ? (
                                    <Snowflake size={16} />
                                  ) : cell.kind === "estante_redondo" ? (
                                    <CircleDot size={16} />
                                  ) : cell.kind === "bascula" ? (
                                    <Scale size={16} />
                                  ) : cell.kind === "buro" ? (
                                    <Laptop size={16} />
                                  ) : (
                                    <Box size={16} />
                                  )}
                                </span>
                                {cellSizePx >= 36 &&
                                  (cell.kind === "estante" ||
                                    cell.kind === "frio" ||
                                    cell.kind === "estante_redondo") &&
                                  cell.conStock !== false &&
                                  (estanteCounts[cell.estanteId ?? -1] ?? 0) > 0 && (
                                    <span className="layout-editor-shelf-stock" title="Con productos">
                                      ●
                                    </span>
                                  )}
                                {cellSizePx >= 40 && (
                                  <span className="layout-editor-shelf-lbl">
                                    {cell.kind === "puerta"
                                      ? "Puerta"
                                      : cell.kind === "mostrador"
                                        ? "Mostrador"
                                        : cell.kind === "buro"
                                          ? "Buró"
                                          : cell.kind === "bascula"
                                            ? "Báscula"
                                            : cell.kind === "estante_redondo"
                                              ? estantes
                                                  .find((e) => e.id === cell.estanteId)
                                                  ?.nombre.slice(0, 8) ?? "Redondo"
                                              : cell.kind === "frio"
                                                ? estantes
                                                    .find((e) => e.id === cell.estanteId)
                                                    ?.nombre.slice(0, 8) ?? "Frío"
                                                : estantes
                                                    .find((e) => e.id === cell.estanteId)
                                                    ?.nombre.slice(0, 8) ?? "Estante"}
                                  </span>
                                )}
                              </div>
                            ) : null}
                          </div>
                        );
                      });
                    })}
                    </div>
                  </div>
                ) : (
                  <LayoutEditorPreview3D
                    layout={layout}
                    estantes={estantes}
                    selectedEstanteId={
                      selectedCell?.kind === "estante" ||
                      selectedCell?.kind === "frio" ||
                      selectedCell?.kind === "estante_redondo"
                        ? selectedCell.estanteId ?? null
                        : null
                    }
                  />
                )}
              </div>
            </section>

            <aside className="layout-editor-col">
              <section className="layout-editor-panel layout-editor-panel--props">
                <h3 className="layout-editor-panel-title">Propiedades</h3>
                {!selectedCell ? (
                  <div className="layout-editor-empty-props">
                    <span>👆</span>
                    <p>Selecciona un objeto en el plano para editar su orientación y opciones.</p>
                  </div>
                ) : (
                  <>
                    <div className="layout-editor-prop-head">
                      <div className="layout-editor-prop-pic">
                        {selectedCell.kind === "puerta" ? (
                          <DoorOpen size={22} />
                        ) : selectedCell.kind === "mostrador" ? (
                          <Store size={22} />
                        ) : selectedCell.kind === "frio" ? (
                          <Snowflake size={22} />
                        ) : selectedCell.kind === "estante_redondo" ? (
                          <CircleDot size={22} />
                        ) : selectedCell.kind === "bascula" ? (
                          <Scale size={22} />
                        ) : selectedCell.kind === "buro" ? (
                          <Laptop size={22} />
                        ) : (
                          <Box size={22} />
                        )}
                      </div>
                      <div>
                        <h4>
                          {selectedCell.kind === "puerta"
                            ? "Puerta"
                            : selectedCell.kind === "mostrador"
                              ? "Mostrador"
                              : selectedCell.kind === "bascula"
                                ? "Báscula / pesa"
                                : selectedCell.kind === "buro"
                                  ? "Buró / mesa PC"
                                  : selectedCell.kind === "frio"
                                    ? estantes.find((e) => e.id === selectedCell.estanteId)
                                        ?.nombre ?? "Frío / nevera"
                                    : selectedCell.kind === "estante_redondo"
                                      ? estantes.find((e) => e.id === selectedCell.estanteId)
                                          ?.nombre ?? "Estante redondo"
                                      : estantes.find((e) => e.id === selectedCell.estanteId)
                                          ?.nombre ?? "Estante"}
                        </h4>
                        <span>
                          Fila {cellIndexToForm(selectedCell.row)}, col{" "}
                          {cellIndexToForm(selectedCell.col)}
                        </span>
                      </div>
                    </div>

                    {(selectedCell.kind === "estante" ||
                      selectedCell.kind === "frio" ||
                      selectedCell.kind === "estante_redondo" ||
                      selectedCell.kind === "mostrador" ||
                      selectedCell.kind === "puerta" ||
                      selectedCell.kind === "buro" ||
                      selectedCell.kind === "bascula") && (
                      <>
                        <p className="layout-editor-field-label">
                          {selectedCell.kind === "mostrador"
                            ? "Hacia dónde mira el mostrador"
                            : selectedCell.kind === "puerta"
                              ? "Hacia dónde abre la puerta"
                              : selectedCell.kind === "frio"
                                ? "Orientación de la nevera"
                                : selectedCell.kind === "estante_redondo"
                                  ? "Orientación del estante redondo"
                                  : selectedCell.kind === "bascula"
                                    ? "Orientación de la báscula"
                                    : selectedCell.kind === "buro"
                                      ? "Orientación del buró"
                                      : "Orientación del frente"}
                        </p>
                        {selectedCell.kind === "mostrador" && (
                          <p className="layout-editor-hint layout-editor-hint--inline">
                            Los 2 PC se colocan en el lado de atención al cliente (flecha verde).
                          </p>
                        )}
                        <OrientationPad
                          mirarCentro={mirarCentro}
                          orientacion={orientacion}
                          onPick={(dir) => patchSelectedCell({ orientacion: dir })}
                        />
                        <label className="layout-editor-switch-row">
                          <div>
                            Mirar al centro
                            <small>
                              {selectedCell.kind === "mostrador"
                                ? "El frente de atención apunta al centro del local"
                                : selectedCell.kind === "puerta"
                                  ? "La puerta abre hacia el centro del local"
                                  : selectedCell.kind === "frio"
                                    ? "La nevera mira hacia el centro del local"
                                    : selectedCell.kind === "estante_redondo"
                                      ? "El frente del estante apunta al centro"
                                      : selectedCell.kind === "bascula"
                                        ? "La pantalla de la báscula mira al centro"
                                        : selectedCell.kind === "buro"
                                          ? "El buró mira hacia el centro del local"
                                          : "El frente apunta hacia el centro del local"}
                            </small>
                          </div>
                          <input
                            type="checkbox"
                            className="layout-editor-switch"
                            checked={mirarCentro}
                            onChange={(e) => patchSelectedCell({ mirarCentro: e.target.checked })}
                          />
                        </label>
                      </>
                    )}

                    {(selectedCell.kind === "estante" ||
                      selectedCell.kind === "frio" ||
                      selectedCell.kind === "estante_redondo") && (
                      <label className="layout-editor-switch-row">
                        <div>
                          Mostrar con stock
                          <small>
                            Si hay productos en el programa, se verán cajas en la maqueta 3D
                          </small>
                        </div>
                        <input
                          type="checkbox"
                          className="layout-editor-switch"
                          checked={selectedCell.conStock !== false}
                          onChange={(e) => patchCellMeta({ conStock: e.target.checked })}
                        />
                      </label>
                    )}

                    {selectedCell.kind === "buro" && (
                      <div className="layout-editor-buro-equip">
                        <p className="layout-editor-field-label">Equipamiento del buró</p>
                        {(
                          [
                            ["monitor", "Monitor"],
                            ["torre", "Torre PC"],
                            ["teclado", "Teclado"],
                            ["mouse", "Ratón"],
                          ] as const
                        ).map(([key, label]) => (
                          <label key={key} className="layout-editor-switch-row">
                            <div>{label}</div>
                            <input
                              type="checkbox"
                              className="layout-editor-switch"
                              checked={(selectedCell.buroEquip ?? DEFAULT_BURO_EQUIP)[key]}
                              onChange={() => toggleBuroEquip(key)}
                            />
                          </label>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      className="layout-editor-btn-danger"
                      onClick={() => {
                        setLayout(removeCellAt(layout, selectedCell.col, selectedCell.row));
                        setSelectedCellKey(null);
                      }}
                    >
                      <Trash2 size={15} />
                      Quitar de la cuadrícula
                    </button>

                    {(selectedCell.kind === "estante" ||
                      selectedCell.kind === "frio" ||
                      selectedCell.kind === "estante_redondo") &&
                      selectedCell.estanteId != null && (
                        <button
                          type="button"
                          className="layout-editor-btn-danger"
                          onClick={() => {
                            const est = estantes.find((e) => e.id === selectedCell.estanteId);
                            if (est) void handleDeleteEstante(est);
                          }}
                        >
                          <Trash2 size={15} />
                          Eliminar del programa
                        </button>
                      )}
                  </>
                )}
              </section>
            </aside>
          </div>
        )}

        <footer className="layout-editor-footer">
          <button type="button" className="btn-icon layout-editor-btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="layout-editor-btn-primary"
            disabled={saving || !layout}
            onClick={() => void handleSave()}
          >
            <Save size={16} />
            {saving ? "Guardando…" : "Guardar y aplicar en Vista 3D"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function OrientationPad({
  mirarCentro,
  orientacion,
  onPick,
}: {
  mirarCentro: boolean;
  orientacion: Orientacion;
  onPick: (dir: Orientacion) => void;
}) {
  const dirs = [
    ["↑", "n"],
    ["→", "e"],
    ["↓", "s"],
    ["←", "w"],
  ] as Array<[string, Orientacion]>;

  return (
    <div className="layout-editor-quick layout-editor-quick--4">
      {dirs.map(([label, dir]) => (
        <button
          key={dir}
          type="button"
          className={
            !mirarCentro && orientacion === dir
              ? "layout-editor-quick-btn layout-editor-quick-btn--on"
              : "layout-editor-quick-btn"
          }
          disabled={mirarCentro}
          onClick={() => onPick(dir)}
          aria-label={ORIENT_LABELS[dir]}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

const ORIENT_LABELS: Record<Orientacion, string> = {
  n: "Arriba (fondo)",
  s: "Abajo (entrada)",
  e: "Derecha",
  w: "Izquierda",
};

function StepperField({
  label,
  value,
  onDec,
  onInc,
  onChange,
}: {
  label: string;
  value: number;
  onDec: () => void;
  onInc: () => void;
  onChange: (value: number) => void;
}) {
  return (
    <label className="layout-editor-field">
      <span>{label}</span>
      <div className="layout-editor-stepper">
        <button type="button" onClick={onDec} aria-label={`Reducir ${label}`}>
          −
        </button>
        <input
          type="number"
          min={4}
          max={24}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <button type="button" onClick={onInc} aria-label={`Aumentar ${label}`}>
          +
        </button>
      </div>
    </label>
  );
}
