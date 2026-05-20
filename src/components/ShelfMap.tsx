import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  getCuadrantes,
  getEstantes,
  getProductosPorCuadrante,
  type Cuadrante,
  type Estante,
  type Producto,
} from "../lib/database";

type ShelfMapProps = {
  onSelectProduct: (producto: Producto) => void;
  highlightProductId?: number;
};

export function ShelfMap({ onSelectProduct, highlightProductId }: ShelfMapProps) {
  const [estantes, setEstantes] = useState<Estante[]>([]);
  const [estanteActivo, setEstanteActivo] = useState<number>(1);
  const [cuadrantes, setCuadrantes] = useState<Cuadrante[]>([]);
  const [ocupacion, setOcupacion] = useState<Record<number, number>>({});
  const [selectedCuadrante, setSelectedCuadrante] = useState<number | null>(null);
  const [productosCuadrante, setProductosCuadrante] = useState<Producto[]>([]);

  useEffect(() => {
    void getEstantes().then((data) => {
      setEstantes(data);
      if (data[0]) setEstanteActivo(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!estanteActivo) return;
    void getCuadrantes(estanteActivo).then(async (cuads) => {
      setCuadrantes(cuads);
      const counts: Record<number, number> = {};
      for (const c of cuads) {
        const prods = await getProductosPorCuadrante(c.id);
        counts[c.id] = prods.length;
      }
      setOcupacion(counts);
    });
  }, [estanteActivo]);

  const estanteIndex = estantes.findIndex((e) => e.id === estanteActivo);
  const estante = estantes[estanteIndex];

  const prevEstante = () => {
    if (estanteIndex > 0) setEstanteActivo(estantes[estanteIndex - 1].id);
  };
  const nextEstante = () => {
    if (estanteIndex < estantes.length - 1) setEstanteActivo(estantes[estanteIndex + 1].id);
  };

  const handleCuadranteClick = async (cuadrante: Cuadrante) => {
    setSelectedCuadrante(cuadrante.id);
    const prods = await getProductosPorCuadrante(cuadrante.id);
    setProductosCuadrante(prods);
    if (prods[0]) onSelectProduct(prods[0]);
  };

  const filas = [...new Set(cuadrantes.map((c) => c.fila))].sort();
  const columnas = [...new Set(cuadrantes.map((c) => c.columna))].sort();

  return (
    <div className="content-panel morph-content flex h-full flex-col rounded-[var(--radius-xl)] p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Mapa de estantes</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {estante?.nombre ?? "Cargando..."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prevEstante}
            disabled={estanteIndex <= 0}
            className="btn-icon flex h-9 w-9 items-center justify-center rounded-lg disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="min-w-[120px] text-center text-sm font-medium text-[var(--text-primary)]">
            Estante {estanteIndex + 1} / {estantes.length}
          </span>
          <button
            onClick={nextEstante}
            disabled={estanteIndex >= estantes.length - 1}
            className="btn-icon flex h-9 w-9 items-center justify-center rounded-lg disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-[2rem_repeat(6,1fr)] gap-2 text-center text-xs font-semibold text-[var(--text-muted)]">
        <div />
        {columnas.map((col) => (
          <div key={col}>{col}</div>
        ))}
      </div>

      <div className="flex-1 space-y-2 overflow-auto">
        {filas.map((fila) => (
          <div key={fila} className="grid grid-cols-[2rem_repeat(6,1fr)] gap-2">
            <div className="flex items-center justify-center text-xs font-semibold text-[var(--text-muted)]">
              {String.fromCharCode(64 + fila)}
            </div>
            {columnas.map((col) => {
              const cuadrante = cuadrantes.find((c) => c.fila === fila && c.columna === col);
              if (!cuadrante) return <div key={col} />;

              const count = ocupacion[cuadrante.id] ?? 0;
              const isSelected = selectedCuadrante === cuadrante.id;
              const isHighlighted = productosCuadrante.some((p) => p.id === highlightProductId);

              return (
                <button
                  key={cuadrante.id}
                  onClick={() => void handleCuadranteClick(cuadrante)}
                  className={`flex min-h-[52px] flex-col items-center justify-center rounded-xl border text-xs font-medium transition-all ${
                    isSelected
                      ? "border-[var(--green-accent)] bg-[var(--green-accent)] text-[var(--text-on-green)] shadow-lg shadow-[var(--green-accent)]/30"
                      : count > 0
                        ? "border-[var(--green-muted)] bg-[var(--green-soft)] text-[var(--green-primary)] hover:border-[var(--green-accent)]"
                        : "border-[var(--border-medium)] bg-[var(--surface-muted)] text-[var(--text-muted)] hover:border-[var(--green-muted)]"
                  } ${isSelected && isHighlighted ? "scale-[1.02]" : ""}`}
                >
                  <span className="font-bold">{cuadrante.codigo}</span>
                  {count > 0 && (
                    <span className={`text-[10px] ${isSelected ? "opacity-80" : "text-[var(--text-secondary)]"}`}>
                      {count} prod.
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {productosCuadrante.length > 0 && (
        <div className="mt-4 rounded-xl bg-[var(--green-soft)] p-3">
          <div className="mb-2 text-xs font-semibold uppercase text-[var(--green-accent)]">
            Productos en cuadrante
          </div>
          <div className="flex flex-wrap gap-2">
            {productosCuadrante.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelectProduct(p)}
                className="surface-card rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] shadow-sm transition hover:bg-[var(--surface-hover)]"
              >
                {p.nombre}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
