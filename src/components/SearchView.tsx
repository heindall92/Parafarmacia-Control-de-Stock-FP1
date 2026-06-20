import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { buscarProductos, type Producto } from "../lib/database";
import { useNecesidadFiltros } from "../hooks/useNecesidadFiltros";
import { terminosDeNecesidad, type SearchMode } from "../lib/search";
import { ProductList } from "./ProductList";
import { ProductImageModal } from "./ProductImageModal";

type SearchViewProps = {
  selectedProduct: Producto | null;
  onSelectProduct: (p: Producto) => void;
  onLocateInMap?: (producto: Producto) => void;
  onEditProduct?: (producto: Producto) => void;
  onChanged?: () => void;
};

export function SearchView({
  selectedProduct,
  onSelectProduct,
  onLocateInMap,
  onChanged,
}: SearchViewProps) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("nombre");
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [results, setResults] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [popupProduct, setPopupProduct] = useState<Producto | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const necesidadFiltros = useNecesidadFiltros();

  useEffect(() => {
    const chip = necesidadFiltros.find((item) => item.id === activeChip);
    const extraTerms = chip ? terminosDeNecesidad(chip) : [];
    const hasQuery = query.trim().length > 0 || extraTerms.length > 0;

    if (!hasQuery) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      void buscarProductos(query, mode, mode === "necesidad" ? extraTerms : [])
        .then(setResults)
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query, mode, activeChip, necesidadFiltros]);

  const handleLocate = (producto: Producto) => {
    if (!producto.estante_id) return;
    onLocateInMap?.(producto);
  };

  const handleSelect = (producto: Producto) => {
    onSelectProduct(producto);
    setPopupProduct(producto);
    setPopupOpen(true);
  };

  const handleSaved = (saved: Producto) => {
    setResults((prev) => prev.map((item) => (item.id === saved.id ? saved : item)));
    setPopupProduct(saved);
    onSelectProduct(saved);
    onChanged?.();
  };

  const handleDeleted = (id: number) => {
    setResults((prev) => prev.filter((item) => item.id !== id));
    setPopupOpen(false);
    onChanged?.();
  };

  const switchMode = (next: SearchMode) => {
    setMode(next);
    if (next === "nombre") {
      setActiveChip(null);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="content-panel morph-content flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--radius-xl)]">
        <div className="content-panel-header p-5">
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => switchMode("nombre")}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                mode === "nombre"
                  ? "bg-[var(--green-accent)] text-[var(--text-on-green)]"
                  : "bg-[var(--green-soft)]/50 text-[var(--text-secondary)]"
              }`}
            >
              Por nombre
            </button>
            <button
              type="button"
              onClick={() => switchMode("necesidad")}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                mode === "necesidad"
                  ? "bg-[var(--green-accent)] text-[var(--text-on-green)]"
                  : "bg-[var(--green-soft)]/50 text-[var(--text-secondary)]"
              }`}
            >
              Por necesidad
            </button>
          </div>

          <div className="relative">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                mode === "nombre"
                  ? "Ej.: angileptol, nebianax… (tolera errores de escritura)"
                  : "Ej.: tos, garganta, cuidado íntimo, resfriado…"
              }
              className="input-field w-full rounded-xl py-3.5 pl-12 pr-4 text-sm transition"
            />
          </div>

          {mode === "necesidad" && (
            <div className="mt-3 flex flex-wrap gap-2">
              {necesidadFiltros.map((filtro) => (
                <button
                  key={filtro.id}
                  type="button"
                  onClick={() =>
                    setActiveChip((current) => (current === filtro.id ? null : filtro.id))
                  }
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    activeChip === filtro.id
                      ? "border-[var(--green-accent)] bg-[var(--green-soft)] text-[var(--green-accent)]"
                      : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--green-accent)]/40"
                  }`}
                >
                  {filtro.label}
                </button>
              ))}
            </div>
          )}

          <p className="mt-2 text-xs text-[var(--text-secondary)]">
            {mode === "nombre" ? (
              <>
                Buscamos por <strong>nombre</strong> aunque haya pequeños errores al escribir. Te
                mostramos estante y ubicación.
              </>
            ) : (
              <>
                Filtramos por <strong>indicación y categoría</strong> (tos, garganta, etc.). También
                puedes escribir libremente.
              </>
            )}
          </p>
        </div>

        <div className="flex-1 overflow-auto p-2">
          {loading && <p className="p-4 text-sm text-[var(--text-muted)]">Buscando...</p>}
          {!loading && (query.trim() || activeChip) && results.length === 0 && (
            <p className="p-4 text-sm text-[var(--text-muted)]">
              No se encontraron productos para esta búsqueda.
            </p>
          )}
          {!loading && results.length > 0 && (
            <ProductList
              productos={results}
              selectedId={selectedProduct?.id}
              onSelect={handleSelect}
              onLocate={onLocateInMap ? handleLocate : undefined}
              showLocation
            />
          )}
        </div>
      </div>

      <ProductImageModal
        open={popupOpen}
        producto={popupProduct}
        onClose={() => setPopupOpen(false)}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
        onLocateInMap={onLocateInMap ? handleLocate : undefined}
      />
    </div>
  );
}
