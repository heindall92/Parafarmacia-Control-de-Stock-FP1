import { useCallback } from "react";
import { runMorphTransition } from "../lib/morphTransition";

export function useMorphTransition() {
  const morphUpdate = useCallback((update: () => void | Promise<void>) => {
    runMorphTransition(update);
  }, []);

  return { morphUpdate };
}

export type AppView =
  | "inventario"
  | "busqueda"
  | "estantes"
  | "categorias"
  | "alertas"
  | "configuracion";

export const VIEW_LABELS: Record<AppView, string> = {
  inventario: "Inventario",
  busqueda: "Búsqueda rápida",
  estantes: "Mapa de estantes",
  categorias: "Categorías",
  alertas: "Stock bajo",
  configuracion: "Configuración",
};
