import { useCallback, useEffect, useState } from "react";
import {
  getCategorias,
  getProductos,
  getProductosStockBajo,
  type Categoria,
  type Producto,
} from "../lib/database";

export type BootstrapData = {
  productos: Producto[];
  alertas: Producto[];
  categorias: Categoria[];
  selectedProduct: Producto | null;
};

export const BOOTSTRAP_STEPS = [
  "Inicializando entorno local",
  "Preparando base de datos SQLite",
  "Sincronizando inventario y estantes",
  "Listo para trabajar offline",
] as const;

const MIN_SPLASH_MS = 6500;
const STEP_PAUSE_MS = 700;

export function useAppBootstrap() {
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [data, setData] = useState<BootstrapData | null>(null);

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();

    async function boot() {
      setStep(1);
      await pause(STEP_PAUSE_MS);
      if (cancelled) return;

      setStep(2);
      const [prods, low, cats] = await Promise.all([
        getProductos(),
        getProductosStockBajo(),
        getCategorias(),
      ]);
      if (cancelled) return;

      setStep(3);
      await pause(STEP_PAUSE_MS);
      if (cancelled) return;

      setData({
        productos: prods,
        alertas: low,
        categorias: cats,
        selectedProduct: prods[0] ?? null,
      });

      setStep(4);
      const elapsed = Date.now() - startedAt;
      await pause(Math.max(0, MIN_SPLASH_MS - elapsed));
      if (cancelled) return;

      setExiting(true);
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
    onSplashExitComplete,
  };
}

function pause(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
