import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getProductosCount,
  getProductosPaginated,
  type Producto,
} from "../lib/database";
import { ProductList } from "./ProductList";
import { ProductImageModal } from "./ProductImageModal";
import { QuickActionCards } from "./QuickActionCards";

const PAGE_SIZE = 50;

type InventarioViewProps = {
  selectedProduct: Producto | null;
  onSelectProduct: (producto: Producto) => void;
  refreshKey?: number;
  onChanged?: () => void;
  onGoSearch?: () => void;
  onGoShelves?: () => void;
  onGoCategories?: () => void;
  onGoSettings?: () => void;
  onGoVista3D?: () => void;
};

export function InventarioView({
  selectedProduct,
  onSelectProduct,
  refreshKey = 0,
  onChanged,
  onGoSearch,
  onGoShelves,
  onGoCategories,
  onGoSettings,
  onGoVista3D,
}: InventarioViewProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [popupProduct, setPopupProduct] = useState<Producto | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      void Promise.all([
        getProductosPaginated(PAGE_SIZE, page * PAGE_SIZE, query),
        query.trim() ? Promise.resolve(null) : getProductosCount(),
      ])
        .then(([rows, count]) => {
          setProductos(rows);
          if (count !== null) setTotal(count);
          else setTotal(rows.length);
        })
        .finally(() => setLoading(false));
    }, query ? 250 : 0);

    return () => clearTimeout(timer);
  }, [query, page, refreshKey]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleSelect = (producto: Producto) => {
    onSelectProduct(producto);
    setPopupProduct(producto);
    setPopupOpen(true);
  };

  const handleSaved = (saved: Producto) => {
    setProductos((prev) => prev.map((item) => (item.id === saved.id ? saved : item)));
    setPopupProduct(saved);
    onSelectProduct(saved);
    onChanged?.();
  };

  const handleDeleted = (id: number) => {
    setProductos((prev) => prev.filter((item) => item.id !== id));
    setPopupOpen(false);
    onChanged?.();
  };

  return (
    <div className="animate-fade-up flex h-full flex-col gap-4 lg:gap-5">
      <QuickActionCards
        totalProductos={total}
        onSearch={() => onGoSearch?.()}
        onShelves={() => onGoShelves?.()}
        onCategories={() => onGoCategories?.()}
        onSettings={() => onGoSettings?.()}
        onVista3D={() => onGoVista3D?.()}
      />

      <div className="content-panel morph-content flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--radius-xl)]">
        <div className="content-panel-header px-5 py-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-[var(--text-primary)]">Todos los productos</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                {total.toLocaleString("es-ES")} productos en parafarmacia
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <button
                type="button"
                disabled={page <= 0}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                className="btn-icon flex h-9 w-9 items-center justify-center rounded-lg disabled:opacity-30"
              >
                <ChevronLeft size={18} />
              </button>
              <span>
                Página {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="btn-icon flex h-9 w-9 items-center justify-center rounded-lg disabled:opacity-30"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(0);
              }}
              placeholder="Filtrar por nombre (tolera errores al escribir)..."
              className="input-field w-full rounded-xl py-3 pl-11 pr-4 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-2">
          {loading ? (
            <p className="p-4 text-sm text-[var(--text-muted)]">Cargando productos...</p>
          ) : productos.length === 0 ? (
            <p className="p-4 text-sm text-[var(--text-muted)]">
              No hay productos que coincidan con la búsqueda.
            </p>
          ) : (
            <ProductList
              productos={productos}
              selectedId={selectedProduct?.id}
              onSelect={handleSelect}
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
      />
    </div>
  );
}
