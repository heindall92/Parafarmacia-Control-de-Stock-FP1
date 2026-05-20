import { Star, Users } from "lucide-react";
import type { Producto } from "../lib/database";
import { CalendarWidget } from "./CalendarWidget";

type WidgetPanelProps = {
  alertas: Producto[];
  onSelectProduct: (p: Producto) => void;
  onGoToSearch?: () => void;
};

export function WidgetPanel({ alertas, onSelectProduct, onGoToSearch }: WidgetPanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3 lg:gap-4">
      <div className="widget-green morph-widget relative overflow-hidden rounded-[var(--radius-lg)] p-5">
        <div className="relative z-10">
          <Star size={22} className="mb-3 text-[var(--green-accent)]" fill="currentColor" />
          <h3 className="text-base font-bold text-[var(--widget-green-title)]">
            ¿Te piden un producto?
          </h3>
          <p className="mt-1 text-sm text-[var(--widget-green-body)]">
            Usa la búsqueda rápida y encuentra el cuadrante en segundos.
          </p>
          <button
            type="button"
            onClick={onGoToSearch}
            className="mt-4 inline-flex rounded-xl bg-[var(--green-accent)] px-4 py-2 text-sm font-semibold text-[var(--text-on-green)] transition hover:opacity-90"
          >
            Ir a búsqueda →
          </button>
        </div>
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/20" />
      </div>

      <div className="widget-blue morph-widget relative overflow-hidden rounded-[var(--radius-lg)] p-5">
        <Users size={22} className="mb-3 text-[var(--widget-blue-icon)]" />
        <h3 className="text-base font-bold text-[var(--widget-blue-title)]">
          {alertas.length} productos con stock bajo
        </h3>
        <p className="mt-1 text-sm text-[var(--widget-blue-body)]">
          Revisa los que necesitan reposición pronto.
        </p>
        <div className="mt-3 space-y-1.5">
          {alertas.slice(0, 3).map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectProduct(p)}
              className="widget-chip flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium"
            >
              <span className="truncate">{p.nombre}</span>
              <span className="text-danger ml-2 shrink-0">{p.stock} uds.</span>
            </button>
          ))}
        </div>
      </div>

      <CalendarWidget />
    </div>
  );
}
