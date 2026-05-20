import { MapPin } from "lucide-react";
import type { Producto } from "../lib/database";

type ProductListProps = {
  productos: Producto[];
  selectedId?: number;
  onSelect: (p: Producto) => void;
  showLocation?: boolean;
};

export function ProductList({
  productos,
  selectedId,
  onSelect,
  showLocation = false,
}: ProductListProps) {
  return (
    <ul className="space-y-1">
      {productos.map((p) => {
        const isSelected = selectedId === p.id;
        const lowStock = p.stock <= p.stock_minimo;

        return (
          <li key={p.id}>
            <button
              onClick={() => onSelect(p)}
              className={`flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left transition ${
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
                <div className="truncate text-sm font-semibold text-[var(--text-primary)]">{p.nombre}</div>
                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <span>{p.codigo_interno}</span>
                  <span>·</span>
                  <span>{p.categoria_nombre}</span>
                </div>
              </div>
              {showLocation && (
                <div className="flex items-center gap-1 text-xs font-medium text-[var(--green-accent)]">
                  <MapPin size={12} />
                  {p.cuadrante_codigo ?? "—"}
                </div>
              )}
              <div
                className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold ${
                  lowStock ? "badge-danger" : "badge-success"
                }`}
              >
                {p.stock} uds.
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
