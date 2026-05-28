import { useCallback, useEffect, useState } from "react";
import {
  getCategorias,
  getProductosPaginated,
  getProductosStockBajo,
  getProductosStockBajoCount,
  initDatabase,
  type Categoria,
  type Producto,
} from "../lib/database";

export type BootstrapData = {
  productos: Producto[];
  alertas: Producto[];
  alertCount: number;
  categorias: Categoria[];
  selectedProduct: Producto | null;
};

export const BOOTSTRAP_STEPS = [
  "Inicializando entorno local",
  "Importando inventario real desde Excel",
  "Preparando catálogo de productos",
  "Listo para trabajar offline",
] as const;

const MIN_SPLASH_MS = 6500;
const STEP_PAUSE_MS = 700;

export function useAppBootstrap() {
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [data, setData] = useState<BootstrapData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();

    async function boot() {
      try {
        setStep(1);
        await pause(STEP_PAUSE_MS);
        if (cancelled) return;

        setStep(2);
        await initDatabase();
        if (cancelled) return;

        setStep(3);
        const [prods, low, cats, alertCount] = await Promise.all([
          getProductosPaginated(50, 0),
          getProductosStockBajo(),
          getCategorias(),
          getProductosStockBajoCount(),
        ]);
        if (cancelled) return;

        setData({
          productos: prods,
          alertas: low,
          alertCount,
          categorias: cats,
          selectedProduct: prods[0] ?? null,
        });

        setStep(4);
        const elapsed = Date.now() - startedAt;
        await pause(Math.max(0, MIN_SPLASH_MS - elapsed));
        if (cancelled) return;

        setExiting(true);
      } catch (bootError) {
        console.error(bootError);
        setError(
          bootError instanceof Error
            ? bootError.message
            : "No se pudo cargar la base de datos local."
        );
        setData({
          productos: [],
          alertas: [],
          alertCount: 0,
          categorias: [],
          selectedProduct: null,
        });
        setStep(4);
        setExiting(true);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSplashExitComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  const progress = Math.min(100, (step / BOOTSTRAP_STEPS.length) * 100);

  return {
    showSplash,
    exiting,
    step,
    progress,
    data,
    error,
    onSplashExitComplete,
  };
}

function pause(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
