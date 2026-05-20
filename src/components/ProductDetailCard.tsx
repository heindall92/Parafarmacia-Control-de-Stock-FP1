import {
  ChevronDown,
  MapPin,
  Package,
  Tag,
  Wallet,
} from "lucide-react";
import type { Producto } from "../lib/database";

type ProductDetailCardProps = {
  producto: Producto | null;
};

export function ProductDetailCard({ producto }: ProductDetailCardProps) {
  if (!producto) {
    return (
      <div className="surface-panel morph-main-card rounded-[var(--radius-xl)] p-6">
        <p className="text-[var(--text-secondary)]">
          Selecciona un producto para ver su ubicación exacta en el estante.
        </p>
      </div>
    );
  }

  const ubicacion = producto.estante_nombre
    ? `${producto.estante_nombre} · Cuadrante ${producto.cuadrante_codigo ?? "—"}`
    : "Sin ubicación asignada";

  const stockStatus =
    producto.stock <= producto.stock_minimo
      ? `Stock bajo: ${producto.stock} uds.`
      : `En stock: ${producto.stock} uds.`;

  return (
    <div className="surface-panel morph-main-card rounded-[var(--radius-xl)]">
      <div className="divider-subtle flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <Tag size={16} className="text-[var(--green-accent)]" />
          <span>
            ID: <strong className="text-[var(--text-primary)]">{producto.codigo_interno ?? producto.id}</strong>
          </span>
        </div>
        <button className="flex items-center gap-1 text-sm font-medium text-[var(--green-accent)]">
          Editar producto
          <ChevronDown size={16} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6 px-6 py-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--green-soft)] text-[var(--green-accent)]">
            <Wallet size={18} />
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Stock
            </div>
            <div className="mt-0.5 text-sm font-semibold text-[var(--text-primary)]">{stockStatus}</div>
            {producto.precio && (
              <div className="text-xs text-[var(--text-secondary)]">
                Precio: {producto.precio.toFixed(2)} €
              </div>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--green-soft)] text-[var(--green-accent)]">
            <Package size={18} />
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Categoría
            </div>
            <div className="mt-0.5 text-sm font-semibold text-[var(--text-primary)]">
              {producto.categoria_nombre ?? "Sin categoría"}
            </div>
            <div className="text-xs text-[var(--text-secondary)]">{producto.laboratorio}</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--green-soft)] text-[var(--green-accent)]">
            <MapPin size={18} />
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Ubicación
            </div>
            <div className="mt-0.5 text-sm font-semibold leading-snug text-[var(--text-primary)]">{ubicacion}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
