import { useEffect, useMemo, useState } from "react";
import { PharmacyTwinCanvas } from "./PharmacyTwinCanvas";
import { setActiveLocalLayout } from "../lib/estanteLayout";
import { cellShowsStock, type LocalLayout } from "../lib/localLayout";
import {
  getEstanteCounts,
  getVista3DEstantes,
  type Estante,
  type Vista3DEstante,
} from "../lib/database";

type LayoutEditorPreview3DProps = {
  layout: LocalLayout;
  estantes: Estante[];
  selectedEstanteId: number | null;
};

export function LayoutEditorPreview3D({
  layout,
  estantes,
  selectedEstanteId,
}: LayoutEditorPreview3DProps) {
  const [vista3d, setVista3d] = useState<Vista3DEstante[]>([]);
  const [counts, setCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    setActiveLocalLayout(layout);
  }, [layout]);

  useEffect(() => {
    void Promise.all([getVista3DEstantes(), getEstanteCounts()]).then(([data, c]) => {
      setVista3d(data);
      setCounts(c);
    });
  }, [layout]);

  const estantes3d = useMemo<Vista3DEstante[]>(() => {
    const ids = new Set<number>();
    for (const cell of layout.cells) {
      if ((cell.kind === "estante" || cell.kind === "frio" || cell.kind === "estante_redondo") && cell.estanteId != null) {
        ids.add(cell.estanteId);
      }
    }

    return [...ids].map((id) => {
      const cell = layout.cells.find(
        (c) =>
          (c.kind === "estante" || c.kind === "frio" || c.kind === "estante_redondo") &&
          c.estanteId === id
      );
      const nombre = estantes.find((e) => e.id === id)?.nombre ?? "Estante";
      const dbCount = counts[id] ?? 0;
      const stocked = cellShowsStock(cell) && dbCount > 0;
      const fromDb = vista3d.find((v) => v.estante_id === id);

      if (stocked && fromDb) {
        return fromDb;
      }

      if (stocked) {
        return {
          estante_id: id,
          estante_nombre: nombre,
          total_productos: dbCount,
          modulos: [
            {
              categoria_id: id,
              categoria_nombre: "Stock",
              categoria_color: "#40916c",
              productos: dbCount,
            },
          ],
        };
      }

      return {
        estante_id: id,
        estante_nombre: nombre,
        total_productos: 0,
        modulos: [],
      };
    });
  }, [layout, estantes, vista3d, counts]);

  return (
    <div className="layout-editor-preview-3d">
      <PharmacyTwinCanvas
        estantes={estantes3d}
        localLayout={layout}
        selectedCategoryId={null}
        selectedEstanteId={selectedEstanteId}
        highlight={null}
        onSelectCategory={() => {}}
        onSelectEstante={() => {}}
      />
    </div>
  );
}
