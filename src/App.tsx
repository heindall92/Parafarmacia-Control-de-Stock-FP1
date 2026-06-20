import { useEffect, useState } from "react";
import type { Categoria, Producto } from "./lib/database";
import {
  getCategorias,
  getProductosCount,
  getProductosPaginated,
  getSeedStats,
  getSeedVersion,
  reimportarInventario,
} from "./lib/database";
import { Header } from "./components/Header";
import { ProductFormModal } from "./components/ProductFormModal";
import { CategoriasView } from "./components/CategoriasView";
import { EstantesView } from "./components/EstantesView";
import { Vista3DView } from "./components/Vista3DView";
import { ConfiguracionView } from "./components/ConfiguracionView";
import { InventarioView } from "./components/InventarioView";
import { SearchView } from "./components/SearchView";
import { Sidebar } from "./components/Sidebar";
import { WidgetPanel } from "./components/WidgetPanel";
import { AuroraBackground } from "./components/AuroraBackground";
import { LoginScreen } from "./components/LoginScreen";
import { SplashScreen } from "./components/SplashScreen";
import { useAppBootstrap } from "./hooks/useAppBootstrap";
import { useAuth } from "./hooks/useAuth";
import { useMorphTransition, type AppView } from "./hooks/useMorphTransition";
import type { Vista3DHighlight } from "./lib/estanteLayout";

export default function App() {
  const { morphUpdate } = useMorphTransition();
  const { showSplash, exiting, step, progress, data, error, onSplashExitComplete } = useAppBootstrap();
  const { isAuthenticated, signIn, signOut } = useAuth();

  const [activeView, setActiveView] = useState<AppView>("inventario");
  const [destacados, setDestacados] = useState<Producto[]>([]);
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
  const [mapHighlight, setMapHighlight] = useState<Vista3DHighlight | null>(null);

  const seedStats = getSeedStats();

  useEffect(() => {
    if (!data) return;
    setDestacados(data.destacados);
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

  const locateProductIn3D = (producto: Producto) => {
    if (!producto.estante_id) return;
    selectProduct(producto);
    setMapHighlight({
      estanteId: producto.estante_id,
      categoriaId: producto.categoria_id,
      productoId: producto.id,
      productoNombre: producto.nombre,
    });
    navigate("vista-3d");
  };

  const clearMapHighlight = () => setMapHighlight(null);

  const refreshInventoryData = async () => {
    const [count, cats, prods] = await Promise.all([
      getProductosCount(),
      getCategorias(),
      getProductosPaginated(50, 0),
    ]);
    setProductCount(count);
    setCategorias(cats);
    setDestacados(prods.slice(0, 3));
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

  if (!isAuthenticated) {
    return <LoginScreen onSuccess={signIn} />;
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
            open={sidebarOpen}
            onClose={() => {
              setSidebarOpen(false);
              localStorage.setItem("farma-sidebar-open", "false");
            }}
            onSignOut={signOut}
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
                    refreshKey={inventoryRefreshKey}
                    onChanged={() => void refreshInventoryData()}
                    onGoSearch={() => navigate("busqueda")}
                    onGoShelves={() => navigate("estantes")}
                    onGoCategories={() => navigate("categorias")}
                    onGoSettings={() => navigate("configuracion")}
        onGoVista3D={() => navigate("vista-3d")}
                  />
                )}

                {activeView === "busqueda" && (
                  <SearchView
                    selectedProduct={selectedProduct}
                    onSelectProduct={selectProduct}
                    onLocateInMap={locateProductIn3D}
                    onEditProduct={openEditProduct}
                    onChanged={() => void refreshInventoryData()}
                  />
                )}

                {activeView === "vista-3d" && (
                  <Vista3DView
                    selectedProduct={selectedProduct}
                    onSelectProduct={selectProduct}
                    refreshKey={inventoryRefreshKey}
                    onChanged={() => void refreshInventoryData()}
                    mapHighlight={mapHighlight}
                    onClearMapHighlight={clearMapHighlight}
                  />
                )}

                {activeView === "estantes" && (
                  <EstantesView
                    selectedProduct={selectedProduct}
                    onSelectProduct={selectProduct}
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

                {activeView === "configuracion" && (
                  <ConfiguracionView
                    productCount={productCount}
                    totalEsperado={seedStats.productos}
                    seedVersion={seedVersion}
                    estantesCount={seedStats.estantes}
                    categoriasCount={categorias.length}
                    reimporting={reimporting}
                    reimportMessage={reimportMessage}
                    onReimport={() => void handleReimport()}
                    onDataChanged={() => void refreshInventoryData()}
                  />
                )}
              </div>

              {(activeView === "inventario" || activeView === "busqueda") && (
                <div className="widget-rail hidden min-h-0 shrink-0 overflow-y-auto lg:flex lg:flex-col">
                  <WidgetPanel
                    destacados={destacados}
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
