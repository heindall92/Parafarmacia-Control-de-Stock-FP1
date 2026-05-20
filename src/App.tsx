import { useEffect, useState } from "react";
import type { Categoria, Producto } from "./lib/database";
import { Header } from "./components/Header";
import { ProductDetailCard } from "./components/ProductDetailCard";
import { ProductList } from "./components/ProductList";
import { SearchView } from "./components/SearchView";
import { ShelfMap } from "./components/ShelfMap";
import { Sidebar } from "./components/Sidebar";
import { WidgetPanel } from "./components/WidgetPanel";
import { AuroraBackground } from "./components/AuroraBackground";
import { SplashScreen } from "./components/SplashScreen";
import { useAppBootstrap } from "./hooks/useAppBootstrap";
import { useMorphTransition, type AppView } from "./hooks/useMorphTransition";

export default function App() {
  const { morphUpdate } = useMorphTransition();
  const { showSplash, exiting, step, progress, data, onSplashExitComplete } = useAppBootstrap();

  const [activeView, setActiveView] = useState<AppView>("inventario");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [alertas, setAlertas] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);

  useEffect(() => {
    if (!data) return;
    setProductos(data.productos);
    setAlertas(data.alertas);
    setCategorias(data.categorias);
    setSelectedProduct(data.selectedProduct);
  }, [data]);

  const navigate = (view: AppView) => {
    if (view === activeView) return;
    morphUpdate(() => setActiveView(view));
  };

  const selectProduct = (p: Producto) => {
    morphUpdate(() => setSelectedProduct(p));
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

  return (
    <AuroraBackground>
      <div className="app-enter dashboard-frame">
        <div className="dashboard-card morph-dashboard flex overflow-hidden">
          <Sidebar
            activeView={activeView}
            onNavigate={navigate}
            alertCount={alertas.length}
          />

          <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[var(--bg-app)] p-4 sm:p-5 lg:p-6">
            <Header activeView={activeView} />

            <div className="flex min-h-0 flex-1 gap-4 lg:gap-5">
              <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-auto">
                {activeView === "inventario" && (
                  <div className="animate-fade-up flex flex-col gap-5">
                    <ProductDetailCard producto={selectedProduct} />
                    <div className="content-panel morph-content flex flex-1 flex-col overflow-hidden rounded-[var(--radius-xl)]">
                      <div className="content-panel-header px-5 py-4">
                        <h2 className="font-bold text-[var(--text-primary)]">Todos los productos</h2>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {productos.length} productos en parafarmacia
                        </p>
                      </div>
                      <div className="flex-1 overflow-auto p-2">
                        <ProductList
                          productos={productos}
                          selectedId={selectedProduct?.id}
                          onSelect={selectProduct}
                          showLocation
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeView === "busqueda" && (
                  <SearchView
                    selectedProduct={selectedProduct}
                    onSelectProduct={selectProduct}
                  />
                )}

                {activeView === "estantes" && (
                  <div className="animate-fade-up h-full">
                    <ProductDetailCard producto={selectedProduct} />
                    <div className="mt-5 h-[calc(100%-140px)]">
                      <ShelfMap
                        onSelectProduct={selectProduct}
                        highlightProductId={selectedProduct?.id}
                      />
                    </div>
                  </div>
                )}

                {activeView === "categorias" && (
                  <div className="content-panel morph-content animate-fade-up rounded-[var(--radius-xl)] p-6">
                    <h2 className="mb-4 text-lg font-bold text-[var(--text-primary)]">Categorías de productos</h2>
                    <div className="grid grid-cols-2 gap-3">
                      {categorias.map((cat) => {
                        const count = productos.filter((p) => p.categoria_id === cat.id).length;
                        return (
                          <div
                            key={cat.id}
                            className="surface-card flex items-center gap-3 rounded-xl p-4"
                          >
                            <div
                              className="h-12 w-12 rounded-xl"
                              style={{ background: cat.color + "33" }}
                            />
                            <div>
                              <div className="font-semibold text-[var(--text-primary)]">{cat.nombre}</div>
                              <div className="text-sm text-[var(--text-secondary)]">
                                {count} productos
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeView === "alertas" && (
                  <div className="content-panel morph-content animate-fade-up flex flex-col overflow-hidden rounded-[var(--radius-xl)]">
                    <div className="content-panel-header px-5 py-4">
                      <h2 className="font-bold text-[var(--danger-text)]">Productos con stock bajo</h2>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {alertas.length} productos por debajo del mínimo
                      </p>
                    </div>
                    <div className="flex-1 overflow-auto p-2">
                      <ProductList
                        productos={alertas}
                        selectedId={selectedProduct?.id}
                        onSelect={selectProduct}
                        showLocation
                      />
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
                        <strong>Productos registrados:</strong> {productos.length}
                      </div>
                      <div className="surface-muted rounded-xl px-4 py-3">
                        <strong>Estantes configurados:</strong> 3 (A, B, C)
                      </div>
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
    </AuroraBackground>
  );
}
