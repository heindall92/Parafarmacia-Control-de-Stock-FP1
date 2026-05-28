import { useEffect, useState } from "react";
import type { Categoria, Producto } from "./lib/database";
import {
  getCategorias,
  getProductosCount,
  getProductosPaginated,
  getProductosStockBajo,
  getProductosStockBajoCount,
  getSeedStats,
  getSeedVersion,
  reimportarInventario,
} from "./lib/database";
import { Header } from "./components/Header";
import { ProductFormModal } from "./components/ProductFormModal";
import { CategoriasView } from "./components/CategoriasView";
import { EstantesView } from "./components/EstantesView";
import { ThemeToggle } from "./components/ThemeToggle";
import { InventarioView } from "./components/InventarioView";
import { SearchView } from "./components/SearchView";
import { ProductList } from "./components/ProductList";
import { Sidebar } from "./components/Sidebar";
import { WidgetPanel } from "./components/WidgetPanel";
import { AuroraBackground } from "./components/AuroraBackground";
import { SplashScreen } from "./components/SplashScreen";
import { useAppBootstrap } from "./hooks/useAppBootstrap";
import { useMorphTransition, type AppView } from "./hooks/useMorphTransition";

export default function App() {
  const { morphUpdate } = useMorphTransition();
  const { showSplash, exiting, step, progress, data, error, onSplashExitComplete } = useAppBootstrap();

  const [activeView, setActiveView] = useState<AppView>("inventario");
  const [alertas, setAlertas] = useState<Producto[]>([]);
  const [alertCount, setAlertCount] = useState(0);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const stored = localStorage.getItem("farma-sidebar-open");
    return stored !== "false";
  });
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null | undefined>(undefined);
  const [inventoryRefreshKey, setInventoryRefreshKey] = useState(0);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [seedVersion, setSeedVersion] = useState<string | null>(null);
  const [reimporting, setReimporting] = useState(false);
  const [reimportMessage, setReimportMessage] = useState<string | null>(null);

  const seedStats = getSeedStats();

  useEffect(() => {
    if (!data) return;
    setAlertas(data.alertas);
    setAlertCount(data.alertCount);
    setCategorias(data.categorias);
    setSelectedProduct(data.selectedProduct);
    void getProductosCount().then(setProductCount);
    void getSeedVersion().then(setSeedVersion);
  }, [data]);

  useEffect(() => {
    if (activeView !== "configuracion") return;
    void Promise.all([getProductosCount(), getSeedVersion()]).then(([count, version]) => {
      setProductCount(count);
      setSeedVersion(version);
    });
  }, [activeView, inventoryRefreshKey]);

  const navigate = (view: AppView) => {
    if (view === activeView) return;
    morphUpdate(() => {
      setActiveView(view);
      if (window.innerWidth < 1024) setSidebarOpen(false);
    });
  };

  const toggleSidebar = () => {
    setSidebarOpen((open) => {
      const next = !open;
      localStorage.setItem("farma-sidebar-open", String(next));
      return next;
    });
  };

  const openNewProduct = () => {
    setEditingProduct(null);
    setProductFormOpen(true);
  };

  const openEditProduct = (producto: Producto) => {
    setEditingProduct(producto);
    setProductFormOpen(true);
  };

  const closeProductForm = () => {
    setProductFormOpen(false);
    setEditingProduct(undefined);
  };

  const selectProduct = (p: Producto) => {
    morphUpdate(() => setSelectedProduct(p));
  };

  const refreshInventoryData = async () => {
    const [count, cats, low, lowCount, prods] = await Promise.all([
      getProductosCount(),
      getCategorias(),
      getProductosStockBajo(),
      getProductosStockBajoCount(),
      getProductosPaginated(50, 0),
    ]);
    setProductCount(count);
    setCategorias(cats);
    setAlertas(low);
    setAlertCount(lowCount);
    setSelectedProduct((current) => prods.find((item) => item.id === current?.id) ?? prods[0] ?? null);
    setInventoryRefreshKey((key) => key + 1);
  };

  const handleReimport = async () => {
    setReimporting(true);
    setReimportMessage(null);
    try {
      const count = await reimportarInventario();
      await refreshInventoryData();
      setSeedVersion(await getSeedVersion());
      setReimportMessage(`Inventario actualizado: ${count.toLocaleString("es-ES")} productos cargados.`);
    } catch (reimportError) {
      setReimportMessage(
        reimportError instanceof Error
          ? reimportError.message
          : "No se pudo reimportar el inventario."
      );
    } finally {
      setReimporting(false);
    }
  };

  const handleProductSaved = (producto: Producto) => {
    void refreshInventoryData().then(() => selectProduct(producto));
  };

  const handleProductDeleted = (productoId: number) => {
    void refreshInventoryData().then(() => {
      setSelectedProduct((current) => (current?.id === productoId ? null : current));
    });
  };

  if (showSplash || !data) {
    return (
      <SplashScreen
        step={step}
        progress={progress}
        exiting={exiting}
        onExitComplete={onSplashExitComplete}
      />
    );
  }

  if (error) {
    return (
      <AuroraBackground>
        <div className="flex h-full items-center justify-center p-6">
          <div className="surface-panel max-w-lg rounded-[var(--radius-xl)] p-6 text-center">
            <h1 className="mb-2 text-xl font-bold text-[var(--danger-text)]">Error al cargar datos</h1>
            <p className="text-sm text-[var(--text-secondary)]">{error}</p>
            <p className="mt-4 text-xs text-[var(--text-muted)]">
              Cierra la app completamente y vuelve a abrirla. Si persiste, reinstala desde el instalador actualizado.
            </p>
          </div>
        </div>
      </AuroraBackground>
    );
  }

  return (
    <AuroraBackground>
      <div className="app-enter dashboard-frame">
        <div className="dashboard-card morph-dashboard flex overflow-hidden">
          <Sidebar
            activeView={activeView}
            onNavigate={navigate}
            alertCount={alertCount}
            open={sidebarOpen}
            onClose={() => {
              setSidebarOpen(false);
              localStorage.setItem("farma-sidebar-open", "false");
            }}
          />

          <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[var(--bg-app)] p-4 sm:p-5 lg:p-6">
            <Header
              activeView={activeView}
              onNewProduct={openNewProduct}
              sidebarOpen={sidebarOpen}
              onToggleSidebar={toggleSidebar}
            />

            <div className="flex min-h-0 flex-1 gap-4 lg:gap-5">
              <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-auto">
                {activeView === "inventario" && (
                  <InventarioView
                    selectedProduct={selectedProduct}
                    onSelectProduct={selectProduct}
                    onEditProduct={openEditProduct}
                    refreshKey={inventoryRefreshKey}
                  />
                )}

                {activeView === "busqueda" && (
                  <SearchView
                    selectedProduct={selectedProduct}
                    onSelectProduct={selectProduct}
                    onEditProduct={openEditProduct}
                  />
                )}

                {activeView === "estantes" && (
                  <EstantesView
                    selectedProduct={selectedProduct}
                    onSelectProduct={selectProduct}
                    onEditProduct={openEditProduct}
                    refreshKey={inventoryRefreshKey}
                    onChanged={() => void refreshInventoryData()}
                  />
                )}

                {activeView === "categorias" && (
                  <CategoriasView
                    refreshKey={inventoryRefreshKey}
                    onChanged={() => void refreshInventoryData()}
                  />
                )}

                {activeView === "alertas" && (
                  <div className="content-panel morph-content animate-fade-up flex flex-col overflow-hidden rounded-[var(--radius-xl)]">
                    <div className="content-panel-header px-5 py-4">
                      <h2 className="font-bold text-[var(--danger-text)]">Productos con stock bajo</h2>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {alertCount} productos por debajo del mínimo
                      </p>
                    </div>
                    <div className="flex-1 overflow-auto p-2">
                      {alertas.length === 0 ? (
                        <p className="p-4 text-sm text-[var(--text-secondary)]">
                          No hay alertas de stock. Cuando registres stock mínimo en los productos, aparecerán aquí.
                        </p>
                      ) : (
                        <ProductList
                          productos={alertas}
                          selectedId={selectedProduct?.id}
                          onSelect={selectProduct}
                          showLocation
                        />
                      )}
                    </div>
                  </div>
                )}

                {activeView === "configuracion" && (
                  <div className="content-panel morph-content animate-fade-up rounded-[var(--radius-xl)] p-6">
                    <h2 className="mb-2 text-lg font-bold text-[var(--text-primary)]">Configuración</h2>
                    <p className="mb-6 text-sm text-[var(--text-secondary)]">
                      Aplicación 100% offline. Los datos se guardan en SQLite en tu equipo.
                    </p>
                    <div className="space-y-3 text-sm text-[var(--text-primary)]">
                      <div className="rounded-xl bg-[var(--green-soft)] px-4 py-3">
                        <strong>Base de datos:</strong> farmacia.db (local)
                      </div>
                      <div className="surface-muted rounded-xl px-4 py-3">
                        <strong>Productos en base de datos:</strong>{" "}
                        {productCount !== null
                          ? productCount.toLocaleString("es-ES")
                          : "…"}{" "}
                        / {seedStats.productos.toLocaleString("es-ES")} del Excel
                      </div>
                      <div className="surface-muted rounded-xl px-4 py-3">
                        <strong>Versión del inventario:</strong> {seedVersion ?? "Sin importar"}
                      </div>
                      <div className="surface-muted rounded-xl px-4 py-3">
                        <strong>Estantes configurados:</strong> {seedStats.estantes}
                      </div>
                      <div className="surface-muted rounded-xl px-4 py-3">
                        <strong>Bloques / categorías:</strong> {categorias.length}
                      </div>
                      <div className="surface-card flex items-center justify-between rounded-xl px-4 py-3">
                        <span><strong>Apariencia</strong></span>
                        <ThemeToggle compact />
                      </div>
                      <button
                        type="button"
                        disabled={reimporting}
                        onClick={() => void handleReimport()}
                        className="w-full rounded-xl bg-[var(--green-accent)] px-4 py-3 font-semibold text-[var(--text-on-green)] disabled:opacity-60"
                      >
                        {reimporting ? "Reimportando inventario..." : "Reimportar inventario desde Excel"}
                      </button>
                      {reimportMessage && (
                        <p className="rounded-xl bg-[var(--green-soft)] px-4 py-3 text-sm">{reimportMessage}</p>
                      )}
                      {productCount !== null && productCount < seedStats.productos * 0.9 && (
                        <p className="rounded-xl bg-[var(--danger-bg)] px-4 py-3 text-sm text-[var(--danger-text)]">
                          El inventario parece incompleto. Pulsa reimportar para cargar los{" "}
                          {seedStats.productos.toLocaleString("es-ES")} productos del Excel.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {(activeView === "inventario" || activeView === "busqueda") && (
                <div className="widget-rail hidden min-h-0 shrink-0 lg:flex lg:flex-col">
                  <WidgetPanel
                    alertas={alertas}
                    onSelectProduct={selectProduct}
                    onGoToSearch={() => navigate("busqueda")}
                  />
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      <ProductFormModal
        open={productFormOpen}
        producto={editingProduct ?? null}
        onClose={closeProductForm}
        onSaved={handleProductSaved}
        onDeleted={handleProductDeleted}
      />
    </AuroraBackground>
  );
}
