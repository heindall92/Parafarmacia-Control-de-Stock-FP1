import { useEffect, useState } from "react";
import { FILTROS_UPDATED_EVENT, getNecesidadFiltros } from "../lib/necesidadFiltrosStore";
import type { NecesidadFiltro } from "../lib/search";

export function useNecesidadFiltros(): NecesidadFiltro[] {
  const [filtros, setFiltros] = useState<NecesidadFiltro[]>(() => getNecesidadFiltros());

  useEffect(() => {
    const refresh = () => setFiltros(getNecesidadFiltros());
    window.addEventListener(FILTROS_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(FILTROS_UPDATED_EVENT, refresh);
  }, []);

  return filtros;
}
