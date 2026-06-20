import { useCallback, useEffect, useState } from "react";
import {
  getCategorias,
  getProductosPaginated,
  initDatabase,
  type Categoria,
  type Producto,
} from "../lib/database";

export type BootstrapData = {
  productos: Producto[];
  destacados: Producto[];
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
/** Tiempo máximo que esperamos a la base de datos antes de continuar igualmente. */
const DB_TIMEOUT_MS = 9000;
/** Tope absoluto del splash: pasado esto, se muestra el login sí o sí. */
const MAX_SPLASH_MS = 13000;

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
        await withTimeout(initDatabase(), DB_TIMEOUT_MS, "initDatabase");
        if (cancelled) return;

        setStep(3);
        const [prods, cats] = await withTimeout(
          Promise.all([getProductosPaginated(50, 0), getCategorias()]),
          DB_TIMEOUT_MS,
          "cargar datos"
        );
        if (cancelled) return;

        setData({
          productos: prods,
          destacados: prods.slice(0, 3),
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
          destacados: [],
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

  /*
   * Failsafe absoluto: pase lo que pase con la base de datos (cuelgue, lentitud
   * en el primer arranque, plugin no disponible…), el splash NUNCA debe quedarse
   * colgado. Tras un máximo de tiempo forzamos datos vacíos + salida, de modo que
   * el login siempre aparezca. Si el arranque normal ya terminó, esto no hace nada.
   */
  useEffect(() => {
    const failsafe = window.setTimeout(() => {
      setData((prev) =>
        prev ?? { productos: [], destacados: [], categorias: [], selectedProduct: null }
      );
      setStep(BOOTSTRAP_STEPS.length);
      setExiting(true);
    }, MAX_SPLASH_MS);
    return () => window.clearTimeout(failsafe);
  }, []);

  /*
   * Respaldo de la animación de salida: si `onAnimationEnd` no dispara en el
   * bundle de producción (puede ocurrir con animaciones CSS), ocultamos el splash
   * igualmente poco después de iniciar la salida.
   */
  useEffect(() => {
    if (!exiting) return;
    const backup = window.setTimeout(() => setShowSplash(false), 1100);
    return () => window.clearTimeout(backup);
  }, [exiting]);

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

/**
 * Resuelve la promesa o la rechaza si tarda más de `ms`. Evita que una llamada a
 * la base de datos que se cuelgue deje el arranque (y el splash) bloqueados para
 * siempre: el rechazo cae en el `catch` del bootstrap, que muestra el login.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`Tiempo de espera agotado en: ${label}`));
    }, ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      }
    );
  });
}
