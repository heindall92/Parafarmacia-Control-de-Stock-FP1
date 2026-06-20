import { Layers3, MapPin } from "lucide-react";
import type { Producto } from "../lib/database";
import { formatUbicacionCorta, formatUbicacionMeta } from "../lib/ubicacion";

type ProductListProps = {
  productos: Producto[];
  selectedId?: number;
  onSelect: (p: Producto) => void;
  onLocate?: (p: Producto) => void;
  showLocation?: boolean;
};

function RecetaBadge({ producto }: { producto: Producto }) {
  const conReceta = Boolean(producto.requiere_receta);
  return (
    <span
      className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
        conReceta
          ? "bg-[var(--danger-bg)] text-[var(--danger-text)]"
          : "bg-[var(--green-soft)] text-[var(--green-accent)]"
      }`}
      title={conReceta ? "Requiere receta médica" : "Venta libre / parafarmacia"}
    >
      {conReceta ? "Con receta" : "Venta libre"}
    </span>
  );
}

export function ProductList({
  productos,
  selectedId,
  onSelect,
  onLocate,
  showLocation = true,
}: ProductListProps) {
  return (
    <ul className="space-y-1">
      {productos.map((p) => {
        const isSelected = selectedId === p.id;
        const ubicacion = formatUbicacionCorta(p);

        return (
          <li key={p.id}>
            <button
              onClick={() => onSelect(p)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
                isSelected
                  ? "bg-[var(--green-soft)] ring-1 ring-[var(--green-accent)]/40"
                  : "list-row"
              }`}
            >
              <div
                className="h-10 w-1 shrink-0 rounded-full"
                style={{ background: p.categoria_color ?? "var(--green-accent)" }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-[var(--text-primary)]">
                    {p.nombre}
                  </span>
                  <RecetaBadge producto={p} />
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <span>{p.codigo_interno ?? "—"}</span>
                  <span>·</span>
                  <span className="truncate">{formatUbicacionMeta(p)}</span>
                </div>
              </div>
              {showLocation && (
                <div className="flex shrink-0 items-center gap-1">
                  {onLocate && p.estante_id && (
                    <button
                      type="button"
                      title="Ver en Vista 3D"
                      onClick={(event) => {
                        event.stopPropagation();
                        onLocate(p);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--green-soft)]/50 text-[var(--green-accent)] transition hover:bg-[var(--green-accent)] hover:text-[var(--text-on-green)]"
                    >
                      <Layers3 size={14} />
                    </button>
                  )}
                  <div
                    className="max-w-[180px] truncate text-right text-xs font-medium text-[var(--green-accent)]"
                    title={ubicacion}
                  >
                    <MapPin size={12} className="mr-1 inline shrink-0" />
                    {ubicacion}
                  </div>
                </div>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
