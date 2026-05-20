import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { buscarProductos, type Producto } from "../lib/database";
import { ProductDetailCard } from "./ProductDetailCard";
import { ProductList } from "./ProductList";

type SearchViewProps = {
  selectedProduct: Producto | null;
  onSelectProduct: (p: Producto) => void;
};

export function SearchView({ selectedProduct, onSelectProduct }: SearchViewProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      void buscarProductos(query)
        .then(setResults)
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="flex h-full flex-col gap-5">
      <ProductDetailCard producto={selectedProduct} />

      <div className="content-panel morph-content flex flex-1 flex-col overflow-hidden rounded-[var(--radius-xl)]">
        <div className="content-panel-header p-5">
          <div className="relative">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, código, laboratorio o cuadrante..."
              className="input-field w-full rounded-xl py-3.5 pl-12 pr-4 text-sm transition"
            />
          </div>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">
            Escribe el medicamento que te piden en mostrador — te mostramos el estante y cuadrante al instante.
          </p>
        </div>

        <div className="flex-1 overflow-auto p-2">
          {loading && (
            <p className="p-4 text-sm text-[var(--text-muted)]">Buscando...</p>
          )}
          {!loading && query && results.length === 0 && (
            <p className="p-4 text-sm text-[var(--text-muted)]">
              No se encontraron productos con &quot;{query}&quot;
            </p>
          )}
          {!loading && results.length > 0 && (
            <ProductList
              productos={results}
              selectedId={selectedProduct?.id}
              onSelect={onSelectProduct}
              showLocation
            />
          )}
        </div>
      </div>
    </div>
  );
}
