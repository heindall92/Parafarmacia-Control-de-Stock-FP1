import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  actualizarEstante,
  crearEstante,
  eliminarEstante,
  getEstanteCounts,
  getEstantes,
  type Estante,
  type Producto,
} from "../lib/database";
import { ProductDetailCard } from "./ProductDetailCard";
import { ShelfMap } from "./ShelfMap";

type EstantesViewProps = {
  selectedProduct: Producto | null;
  onSelectProduct: (producto: Producto) => void;
  onEditProduct?: (producto: Producto) => void;
  refreshKey?: number;
  onChanged?: () => void;
};

export function EstantesView({
  selectedProduct,
  onSelectProduct,
  onEditProduct,
  refreshKey = 0,
  onChanged,
}: EstantesViewProps) {
  const [estantes, setEstantes] = useState<Estante[]>([]);
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState(0);

  const load = async () => {
    const [ests, estCounts] = await Promise.all([getEstantes(), getEstanteCounts()]);
    setEstantes(ests);
    setCounts(estCounts);
  };

  useEffect(() => {
    void load();
  }, [refreshKey]);

  const notifyChange = async () => {
    await load();
    setMapKey((key) => key + 1);
    onChanged?.();
  };

  const startNew = () => {
    setEditingId("new");
    setNombre("");
    setDescripcion("");
    setError(null);
  };

  const startEdit = (est: Estante) => {
    setEditingId(est.id);
    setNombre(est.nombre);
    setDescripcion(est.descripcion ?? "");
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!nombre.trim()) {
      setError("El nombre del estante es obligatorio.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (editingId === "new") {
        await crearEstante(nombre, descripcion);
      } else if (typeof editingId === "number") {
        await actualizarEstante(editingId, nombre, descripcion);
      }
      setEditingId(null);
      await notifyChange();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (est: Estante) => {
    const productos = counts[est.id] ?? 0;
    const msg =
      productos > 0
        ? `¿Eliminar "${est.nombre}"? ${productos} productos quedarán sin estante asignado.`
        : `¿Eliminar el estante "${est.nombre}"?`;
    if (!window.confirm(msg)) return;

    setSaving(true);
    try {
      await eliminarEstante(est.id);
      if (editingId === est.id) setEditingId(null);
      await notifyChange();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No se pudo eliminar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-up flex h-full flex-col gap-5">
      <ProductDetailCard producto={selectedProduct} onEdit={onEditProduct} />

      <div className="content-panel morph-content rounded-[var(--radius-xl)] p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Gestión de estantes</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Crea, renombra o elimina estantes de la parafarmacia.
            </p>
          </div>
          <button
            type="button"
            onClick={startNew}
            className="flex items-center gap-2 rounded-xl bg-[var(--green-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--text-on-green)]"
          >
            <Plus size={16} />
            Nuevo estante
          </button>
        </div>

        {editingId !== null && (
          <div className="surface-card mb-4 rounded-xl p-4">
            <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
              {editingId === "new" ? "Nuevo estante" : "Editar estante"}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                className="input-field rounded-xl px-4 py-3 text-sm"
                placeholder="Nombre del estante"
              />
              <input
                value={descripcion}
                onChange={(event) => setDescripcion(event.target.value)}
                className="input-field rounded-xl px-4 py-3 text-sm"
                placeholder="Descripción opcional"
              />
            </div>
            {error && <p className="mt-2 text-sm text-[var(--danger-text)]">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={cancelEdit} className="btn-icon rounded-xl px-4 py-2 text-sm">
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                className="rounded-xl bg-[var(--green-accent)] px-4 py-2 text-sm font-semibold text-[var(--text-on-green)]"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        )}

        <div className="mb-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {estantes.map((est) => (
            <div key={est.id} className="surface-card flex items-center gap-3 rounded-xl p-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-[var(--text-primary)]">
                  {est.nombre}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  {counts[est.id] ?? 0} productos
                </div>
              </div>
              <button
                type="button"
                onClick={() => startEdit(est)}
                className="btn-icon flex h-8 w-8 items-center justify-center rounded-lg"
              >
                <Pencil size={15} />
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(est)}
                className="btn-icon flex h-8 w-8 items-center justify-center rounded-lg text-[var(--danger-text)]"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <ShelfMap
          key={mapKey}
          refreshKey={refreshKey + mapKey}
          onSelectProduct={onSelectProduct}
          highlightProductId={selectedProduct?.id}
        />
      </div>
    </div>
  );
}
