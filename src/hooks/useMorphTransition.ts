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
  | "vista-3d"
  | "estantes"
  | "categorias"
  | "configuracion";

export const VIEW_LABELS: Record<AppView, string> = {
  inventario: "Inventario",
  busqueda: "Búsqueda rápida",
  "vista-3d": "Vista 3D",
  estantes: "Mapa de estantes",
  categorias: "Categorías",
  configuracion: "Configuración",
};
