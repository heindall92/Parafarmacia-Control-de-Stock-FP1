import {
  Boxes,
  Layers3,
  MapPin,
  PackageSearch,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  buscarProductos,
  ensureLocalLayout,
  getProductoById,
  getProductosPorCategoria,
  getVista3DCategorias,
  getVista3DEstantes,
  type Producto,
  type Vista3DCategoria,
  type Vista3DEstante,
} from "../lib/database";
import { PharmacyTwinCanvas } from "./PharmacyTwinCanvas";
import { ProductImageModal } from "./ProductImageModal";
import { ProductList } from "./ProductList";
import { setActiveLocalLayout } from "../lib/estanteLayout";
import type { LocalLayout } from "../lib/localLayout";
import type { Vista3DHighlight } from "../lib/estanteLayout";

type Vista3DViewProps = {
  selectedProduct: Producto | null;
  onSelectProduct: (producto: Producto) => void;
  refreshKey?: number;
  onChanged?: () => void;
  mapHighlight?: Vista3DHighlight | null;
  onClearMapHighlight?: () => void;
};

export function Vista3DView({
  selectedProduct,
  onSelectProduct,
  refreshKey = 0,
  onChanged,
  mapHighlight = null,
  onClearMapHighlight,
}: Vista3DViewProps) {
  const [layout, setLayout] = useState<Vista3DCategoria[]>([]);
  const [estantes3d, setEstantes3d] = useState<Vista3DEstante[]>([]);
  const [localLayout, setLocalLayout] = useState<LocalLayout | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedEstanteId, setSelectedEstanteId] = useState<number | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [popupProduct, setPopupProduct] = useState<Producto | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);

  // Búsqueda de productos + localización
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Producto[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [locatedProduct, setLocatedProduct] = useState<Producto | null>(null);
  const [localHighlight, setLocalHighlight] = useState<Vista3DHighlight | null>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  const activeHighlight = mapHighlight ?? localHighlight;

  // Carga de datos del gemelo 3D
  useEffect(() => {
    setLoading(true);
    void Promise.all([getVista3DCategorias(), getVista3DEstantes(), ensureLocalLayout()])
      .then(([cats, ests, plano]) => {
        setLayout(cats);
        setEstantes3d(ests);
        setLocalLayout(plano);
        setActiveLocalLayout(plano);
      })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  // Si el padre pide localizar un producto (desde Búsqueda global)
  useEffect(() => {
    if (!mapHighlight) return;
    if (mapHighlight.categoriaId) setSelectedCategoryId(mapHighlight.categoriaId);
    if (mapHighlight.estanteId) setSelectedEstanteId(mapHighlight.estanteId);
    void getProductoById(mapHighlight.productoId).then((p) => {
      if (p) setLocatedProduct(p);
    });
  }, [mapHighlight]);

  // Búsqueda en vivo de productos
  useEffect(() => {
    const q = searchTerm.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const handle = setTimeout(() => {
      void buscarProductos(q, "nombre")
        .then((res) => {
          if (!cancelled) setSearchResults(res.slice(0, 12));
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [searchTerm]);

  // Cerrar resultados al hacer clic fuera
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selectedCategory = useMemo(
    () => layout.find((item) => item.categoria_id === selectedCategoryId) ?? null,
    [layout, selectedCategoryId]
  );

  useEffect(() => {
    if (!selectedCategoryId) {
      setProductos([]);
      return;
    }
    void getProductosPorCategoria(selectedCategoryId, selectedEstanteId ?? undefined).then(
      setProductos
    );
  }, [selectedCategoryId, selectedEstanteId, refreshKey]);

  const totals = useMemo(
    () => ({
      categorias: layout.length,
      productos: layout.reduce((sum, item) => sum + item.total_productos, 0),
      estantes: estantes3d.length,
    }),
    [layout, estantes3d]
  );

  const locateProducto = (producto: Producto) => {
    onSelectProduct(producto);
    setLocatedProduct(producto);
    setSelectedCategoryId(producto.categoria_id ?? null);
    setSelectedEstanteId(producto.estante_id ?? null);
    setSearchTerm(producto.nombre);
    setSearchOpen(false);
    if (producto.estante_id) {
      setLocalHighlight({
        estanteId: producto.estante_id,
        categoriaId: producto.categoria_id,
        productoId: producto.id,
        productoNombre: producto.nombre,
      });
    } else {
      setLocalHighlight(null);
    }
  };

  const clearLocated = () => {
    setLocatedProduct(null);
    setLocalHighlight(null);
    setSearchTerm("");
    setSearchResults([]);
    onClearMapHighlight?.();
  };

  const handleSelectProduct = (producto: Producto) => {
    onSelectProduct(producto);
    setPopupProduct(producto);
    setPopupOpen(true);
  };

  const handleSaved = (saved: Producto) => {
    setPopupProduct(saved);
    onSelectProduct(saved);
    onChanged?.();
  };

  const estanteNombre =
    locatedProduct?.estante_nombre ??
    estantes3d.find((e) => e.estante_id === locatedProduct?.estante_id)?.estante_nombre ??
    null;

  return (
    <div className="vista-3d-root animate-fade-up flex h-full min-h-[640px] flex-col">
      <header className="vista-3d-header content-panel morph-content rounded-[var(--radius-xl)] px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <Layers3 size={20} className="text-[var(--green-accent)]" />
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Vista 3D</h2>
              <span className="rounded-full bg-[#42e695]/20 px-2 py-0.5 text-[10px] font-semibold text-[#2d6a4f]">
                Gemelo digital
              </span>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              Busca un medicamento y te mostramos dónde está, señalándolo en el plano 3D.
            </p>
          </div>

          <div ref={searchWrapRef} className="vista-3d-search-wrap">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && searchResults[0]) {
                    locateProducto(searchResults[0]);
                  }
                  if (event.key === "Escape") setSearchOpen(false);
                }}
                placeholder="Buscar medicamento por nombre…"
                className="input-field w-full rounded-xl py-2.5 pl-9 pr-9 text-sm"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={clearLocated}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  aria-label="Limpiar búsqueda"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {searchOpen && searchTerm.trim().length >= 2 && (
              <div className="vista-3d-search-results">
                {searching ? (
                  <div className="vista-3d-search-empty">Buscando…</div>
                ) : searchResults.length === 0 ? (
                  <div className="vista-3d-search-empty">Sin coincidencias</div>
                ) : (
                  searchResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="vista-3d-search-item"
                      onClick={() => locateProducto(p)}
                    >
                      <span
                        className="vista-3d-search-dot"
                        style={{ backgroundColor: p.categoria_color ?? "#42e695" }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="vista-3d-search-name">{p.nombre}</span>
                        <span className="vista-3d-search-meta">
                          {p.estante_nombre ?? "Sin estante"}
                          {p.ubicacion_detalle ? ` · ${p.ubicacion_detalle}` : ""}
                        </span>
                      </span>
                      <MapPin size={14} className="shrink-0 text-[var(--green-accent)]" />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="vista-3d-body vista-3d-body--wide mt-4 min-h-0 flex-1">
        <div className="vista-3d-canvas content-panel morph-content relative overflow-hidden rounded-[var(--radius-xl)]">
          {activeHighlight && (
            <div className="vista-3d-locate-banner">
              <span>
                <MapPin size={15} /> <strong>{activeHighlight.productoNombre}</strong> señalado en
                el plano
              </span>
              <button type="button" onClick={clearLocated}>
                Quitar señal
              </button>
            </div>
          )}
          {loading ? (
            <p className="p-8 text-sm text-[var(--text-muted)]">Construyendo gemelo 3D…</p>
          ) : estantes3d.length === 0 ? (
            <p className="p-8 text-sm text-[var(--text-muted)]">
              Aún no hay estantes con productos.
            </p>
          ) : (
            <PharmacyTwinCanvas
              estantes={estantes3d}
              localLayout={localLayout}
              selectedCategoryId={selectedCategoryId}
              selectedEstanteId={selectedEstanteId}
              highlight={activeHighlight}
              onSelectCategory={(categoriaId, estanteId) => {
                setSelectedCategoryId(categoriaId);
                setSelectedEstanteId(estanteId);
              }}
              onSelectEstante={(estanteId) => {
                setSelectedEstanteId(estanteId);
                const est = estantes3d.find((e) => e.estante_id === estanteId);
                if (est?.modulos[0]) {
                  setSelectedCategoryId(est.modulos[0].categoria_id);
                }
              }}
            />
          )}
          <div className="vista-3d-footer vista-3d-footer--twin">
            <span>{totals.estantes} estantes físicos</span>
            <span>·</span>
            <span>{totals.categorias} categorías</span>
            <span>·</span>
            <span>{totals.productos.toLocaleString("es-ES")} productos</span>
          </div>
        </div>

        <aside className="vista-3d-panel-right content-panel morph-content flex min-h-0 flex-col overflow-hidden rounded-[var(--radius-xl)]">
          {locatedProduct ? (
            <LocatedProductCard
              producto={locatedProduct}
              estanteNombre={estanteNombre}
              onOpenFicha={() => handleSelectProduct(locatedProduct)}
              onClear={clearLocated}
            />
          ) : selectedCategory ? (
            <div className="border-b border-[var(--border-subtle)] px-4 py-3">
              <div className="flex items-center gap-2">
                <Boxes size={16} className="text-[var(--green-accent)]" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  {selectedCategory.categoria_nombre}
                </h3>
              </div>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                {selectedCategory.total_productos.toLocaleString("es-ES")} productos
                {selectedEstanteId ? " · filtrado por estante" : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedEstanteId(null)}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    selectedEstanteId === null
                      ? "bg-[var(--green-accent)] text-[var(--text-on-green)]"
                      : "bg-[var(--green-soft)]/40 text-[var(--text-secondary)]"
                  }`}
                >
                  Todos los estantes
                </button>
                {selectedCategory.estantes.map((est) => (
                  <button
                    key={est.estante_id}
                    type="button"
                    onClick={() => setSelectedEstanteId(est.estante_id)}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      selectedEstanteId === est.estante_id
                        ? "bg-[var(--green-accent)] text-[var(--text-on-green)]"
                        : "bg-[var(--green-soft)]/40 text-[var(--text-secondary)]"
                    }`}
                  >
                    {est.estante_nombre}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="vista-3d-empty-panel">
              <PackageSearch size={34} className="text-[var(--green-accent)]" />
              <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                Busca o haz clic en un estante
              </p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Escribe el nombre de un medicamento arriba para localizarlo, o haz clic en un módulo
                de color del plano 3D para ver sus productos.
              </p>
            </div>
          )}

          {(locatedProduct || selectedCategory) && (
            <div className="min-h-0 flex-1 overflow-auto p-2">
              {locatedProduct && (
                <p className="px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                  Otros productos del mismo estante
                </p>
              )}
              <ProductList
                productos={productos}
                selectedId={locatedProduct?.id ?? selectedProduct?.id}
                onSelect={handleSelectProduct}
                showLocation
              />
            </div>
          )}
        </aside>
      </div>

      <ProductImageModal
        open={popupOpen}
        producto={popupProduct}
        onClose={() => setPopupOpen(false)}
        onSaved={handleSaved}
        onDeleted={() => {
          setPopupOpen(false);
          onChanged?.();
        }}
      />
    </div>
  );
}

function LocatedProductCard({
  producto,
  estanteNombre,
  onOpenFicha,
  onClear,
}: {
  producto: Producto;
  estanteNombre: string | null;
  onOpenFicha: () => void;
  onClear: () => void;
}) {
  const sinUbicacion = !producto.estante_id;
  return (
    <div className="vista-3d-located-card">
      <div className="vista-3d-located-top">
        <span className="vista-3d-located-badge">
          <MapPin size={13} /> Producto localizado
        </span>
        <button
          type="button"
          onClick={onClear}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          aria-label="Quitar señal"
        >
          <X size={16} />
        </button>
      </div>

      <h3 className="vista-3d-located-name">{producto.nombre}</h3>
      {producto.laboratorio && (
        <p className="vista-3d-located-lab">{producto.laboratorio}</p>
      )}

      <div className="vista-3d-located-rows">
        <div className="vista-3d-located-row">
          <span>Estante</span>
          <strong className={sinUbicacion ? "text-[var(--danger-text)]" : ""}>
            {estanteNombre ?? "Sin ubicación asignada"}
          </strong>
        </div>
        {producto.ubicacion_detalle && (
          <div className="vista-3d-located-row">
            <span>Ubicación</span>
            <strong>{producto.ubicacion_detalle}</strong>
          </div>
        )}
        {producto.categoria_nombre && (
          <div className="vista-3d-located-row">
            <span>Categoría</span>
            <strong>
              <span
                className="mr-1 inline-block h-2 w-2 rounded-sm align-middle"
                style={{ backgroundColor: producto.categoria_color ?? "#42e695" }}
              />
              {producto.categoria_nombre}
            </strong>
          </div>
        )}
        <div className="vista-3d-located-row">
          <span>Stock</span>
          <strong className={producto.stock <= producto.stock_minimo ? "text-amber-500" : ""}>
            {producto.stock} uds
          </strong>
        </div>
        {producto.precio != null && (
          <div className="vista-3d-located-row">
            <span>Precio</span>
            <strong>{producto.precio.toLocaleString("es-ES")} €</strong>
          </div>
        )}
      </div>

      {sinUbicacion ? (
        <p className="vista-3d-located-warn">
          Este producto no tiene estante asignado, por eso no aparece señalado en el plano.
        </p>
      ) : (
        <p className="vista-3d-located-hint">
          <MapPin size={12} /> Mira el plano: el estante está marcado en rojo.
        </p>
      )}

      <button type="button" className="vista-3d-located-btn" onClick={onOpenFicha}>
        Ver ficha completa
      </button>
    </div>
  );
}
