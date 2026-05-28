import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  actualizarCategoria,
  crearCategoria,
  eliminarCategoria,
  getCategoriaCounts,
  getCategorias,
  type Categoria,
} from "../lib/database";

const COLOR_PRESETS = [
  "#2D6A4F",
  "#40916C",
  "#1B4332",
  "#52B788",
  "#74C69D",
  "#0077B6",
  "#023E8A",
  "#7209B7",
  "#9D0208",
  "#E85D04",
  "#F48C06",
  "#6C757D",
];

type CategoriasViewProps = {
  refreshKey?: number;
  onChanged?: () => void;
};

export function CategoriasView({ refreshKey = 0, onChanged }: CategoriasViewProps) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [nombre, setNombre] = useState("");
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const [cats, catCounts] = await Promise.all([getCategorias(), getCategoriaCounts()]);
    setCategorias(cats);
    setCounts(catCounts);
  };

  useEffect(() => {
    void load();
  }, [refreshKey]);

  const startNew = () => {
    setEditingId("new");
    setNombre("");
    setColor(COLOR_PRESETS[0]);
    setError(null);
  };

  const startEdit = (cat: Categoria) => {
    setEditingId(cat.id);
    setNombre(cat.nombre);
    setColor(cat.color);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!nombre.trim()) {
      setError("El nombre de la categoría es obligatorio.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (editingId === "new") {
        await crearCategoria(nombre, color);
      } else if (typeof editingId === "number") {
        await actualizarCategoria(editingId, nombre, color);
      }
      setEditingId(null);
      await load();
      onChanged?.();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Categoria) => {
    const productos = counts[cat.id] ?? 0;
    const msg =
      productos > 0
        ? `¿Eliminar "${cat.nombre}"? ${productos} productos quedarán sin categoría.`
        : `¿Eliminar la categoría "${cat.nombre}"?`;
    if (!window.confirm(msg)) return;

    setSaving(true);
    try {
      await eliminarCategoria(cat.id);
      if (editingId === cat.id) setEditingId(null);
      await load();
      onChanged?.();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No se pudo eliminar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="content-panel morph-content animate-fade-up rounded-[var(--radius-xl)] p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Categorías de productos</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Crea, edita o elimina bloques para organizar el inventario.
          </p>
        </div>
        <button
          type="button"
          onClick={startNew}
          className="flex items-center gap-2 rounded-xl bg-[var(--green-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--text-on-green)]"
        >
          <Plus size={16} />
          Nueva categoría
        </button>
      </div>

      {editingId !== null && (
        <div className="surface-card mb-5 rounded-xl p-4">
          <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
            {editingId === "new" ? "Nueva categoría" : "Editar categoría"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <input
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              className="input-field rounded-xl px-4 py-3 text-sm"
              placeholder="Nombre de la categoría"
            />
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setColor(preset)}
                  className={`h-9 w-9 rounded-lg border-2 transition ${
                    color === preset ? "border-[var(--green-accent)] scale-110" : "border-transparent"
                  }`}
                  style={{ background: preset }}
                  aria-label={`Color ${preset}`}
                />
              ))}
            </div>
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

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {categorias.map((cat) => (
          <div key={cat.id} className="surface-card flex items-center gap-3 rounded-xl p-4">
            <div className="h-12 w-12 shrink-0 rounded-xl" style={{ background: cat.color + "33" }} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-[var(--text-primary)]">{cat.nombre}</div>
              <div className="text-sm text-[var(--text-secondary)]">
                {counts[cat.id] ?? 0} productos
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => startEdit(cat)}
                className="btn-icon flex h-9 w-9 items-center justify-center rounded-lg"
                aria-label={`Editar ${cat.nombre}`}
              >
                <Pencil size={16} />
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(cat)}
                className="btn-icon flex h-9 w-9 items-center justify-center rounded-lg text-[var(--danger-text)]"
                aria-label={`Eliminar ${cat.nombre}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {categorias.length === 0 && (
        <p className="py-8 text-center text-sm text-[var(--text-secondary)]">
          No hay categorías. Crea la primera con el botón de arriba.
        </p>
      )}
    </div>
  );
}
