import { Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  actualizarProducto,
  crearProducto,
  eliminarProducto,
  getCategorias,
  getEstantes,
  type Categoria,
  type Estante,
  type Producto,
} from "../lib/database";

type ProductFormModalProps = {
  open: boolean;
  producto?: Producto | null;
  onClose: () => void;
  onSaved: (producto: Producto) => void;
  onDeleted?: (productoId: number) => void;
};

export function ProductFormModal({
  open,
  producto,
  onClose,
  onSaved,
  onDeleted,
}: ProductFormModalProps) {
  const isEditing = Boolean(producto);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [estantes, setEstantes] = useState<Estante[]>([]);
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [estanteId, setEstanteId] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [stock, setStock] = useState("0");
  const [stockMinimo, setStockMinimo] = useState("0");
  const [precio, setPrecio] = useState("");
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    void Promise.all([getCategorias(), getEstantes()]).then(([cats, ests]) => {
      setCategorias(cats);
      setEstantes(ests);
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (producto) {
      setNombre(producto.nombre);
      setCodigo(producto.codigo_interno ?? "");
      setCategoriaId(producto.categoria_id ? String(producto.categoria_id) : "");
      setEstanteId(producto.estante_id ? String(producto.estante_id) : "");
      setUbicacion(producto.ubicacion_detalle ?? "");
      setStock(String(producto.stock));
      setStockMinimo(String(producto.stock_minimo));
      setPrecio(producto.precio != null ? String(producto.precio) : "");
      setNotas(producto.notas ?? "");
    } else {
      setNombre("");
      setCodigo("");
      setCategoriaId("");
      setEstanteId("");
      setUbicacion("");
      setStock("0");
      setStockMinimo("0");
      setPrecio("");
      setNotas("");
    }
    setConfirmDelete(false);
    setError(null);
  }, [open, producto]);

  if (!open) return null;

  const payload = {
    nombre: nombre.trim(),
    codigo_interno: codigo.trim() || null,
    categoria_id: categoriaId ? Number(categoriaId) : null,
    estante_id: estanteId ? Number(estanteId) : null,
    ubicacion_detalle: ubicacion.trim() || null,
    stock: Number(stock) || 0,
    stock_minimo: Number(stockMinimo) || 0,
    precio: precio.trim() ? Number(precio) : null,
    notas: notas.trim() || null,
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre del producto es obligatorio.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const saved = producto
        ? await actualizarProducto(producto.id, payload)
        : await crearProducto(payload);
      onSaved(saved);
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "No se pudo guardar el producto."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!producto) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      await eliminarProducto(producto.id);
      onDeleted?.(producto.id);
      onClose();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "No se pudo eliminar el producto."
      );
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="surface-panel max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[var(--radius-xl)] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            {isEditing ? "Editar producto" : "Nuevo producto"}
          </h2>
          <button type="button" onClick={onClose} className="btn-icon h-10 w-10 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
              Nombre *
            </label>
            <input
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              className="input-field w-full rounded-xl px-4 py-3 text-sm"
              placeholder="Ej. Nebianax 3% (Viales)"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
                Código interno
              </label>
              <input
                value={codigo}
                onChange={(event) => setCodigo(event.target.value)}
                className="input-field w-full rounded-xl px-4 py-3 text-sm"
                placeholder="PF-1200"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
                Ubicación en estante
              </label>
              <input
                value={ubicacion}
                onChange={(event) => setUbicacion(event.target.value)}
                className="input-field w-full rounded-xl px-4 py-3 text-sm"
                placeholder="Extremo izquierdo..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
                Categoría
              </label>
              <select
                value={categoriaId}
                onChange={(event) => setCategoriaId(event.target.value)}
                className="input-field w-full rounded-xl px-4 py-3 text-sm"
              >
                <option value="">Sin categoría</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
                Estante
              </label>
              <select
                value={estanteId}
                onChange={(event) => setEstanteId(event.target.value)}
                className="input-field w-full rounded-xl px-4 py-3 text-sm"
              >
                <option value="">Sin estante</option>
                {estantes.map((est) => (
                  <option key={est.id} value={est.id}>
                    {est.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
                Precio (€)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={precio}
                onChange={(event) => setPrecio(event.target.value)}
                className="input-field w-full rounded-xl px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
                Código interno
              </label>
              <input
                value={codigo}
                onChange={(event) => setCodigo(event.target.value)}
                className="input-field w-full rounded-xl px-4 py-3 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
              Notas
            </label>
            <textarea
              value={notas}
              onChange={(event) => setNotas(event.target.value)}
              className="input-field min-h-[88px] w-full rounded-xl px-4 py-3 text-sm"
              placeholder="Indicación, advertencias, observaciones..."
            />
          </div>

          {error && <p className="text-sm text-[var(--danger-text)]">{error}</p>}

          <div className="flex items-center justify-between gap-3 pt-2">
            {isEditing ? (
              <button
                type="button"
                disabled={deleting || saving}
                onClick={() => void handleDelete()}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ${
                  confirmDelete
                    ? "bg-[var(--danger-bg)] text-[var(--danger-text)]"
                    : "btn-icon text-[var(--danger-text)]"
                }`}
              >
                <Trash2 size={16} />
                {confirmDelete ? "¿Confirmar eliminación?" : "Eliminar"}
              </button>
            ) : (
              <span />
            )}

            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn-icon rounded-xl px-4 py-2 text-sm">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || deleting}
                className="rounded-xl bg-[var(--green-accent)] px-5 py-2 text-sm font-semibold text-[var(--text-on-green)] disabled:opacity-60"
              >
                {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Guardar producto"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
