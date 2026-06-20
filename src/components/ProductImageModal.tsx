import { ImageUp, Layers3, MapPin, Package, Pencil, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  actualizarProducto,
  eliminarProducto,
  getCategorias,
  getEstantes,
  type Categoria,
  type Estante,
  type Producto,
} from "../lib/database";

type ProductImageModalProps = {
  open: boolean;
  producto: Producto | null;
  onClose: () => void;
  onSaved: (producto: Producto) => void;
  onDeleted?: (productoId: number) => void;
  onLocateInMap?: (producto: Producto) => void;
};

const MAX_UPLOAD_SIZE = 1100;

function resolveImageSrc(imagen: string | null): string | null {
  if (!imagen) return null;
  if (imagen.startsWith("data:") || imagen.startsWith("http")) return imagen;
  return `/${imagen.replace(/^\/+/, "")}`;
}

async function fileToDownscaledDataUrl(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Imagen no válida."));
    image.src = dataUrl;
  });

  const scale = Math.min(1, MAX_UPLOAD_SIZE / Math.max(img.width, img.height));
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.8);
}

export function ProductImageModal({
  open,
  producto,
  onClose,
  onSaved,
  onDeleted,
  onLocateInMap,
}: ProductImageModalProps) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [estantes, setEstantes] = useState<Estante[]>([]);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [estanteId, setEstanteId] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [indicacion, setIndicacion] = useState("");
  const [advertencia, setAdvertencia] = useState("");
  const [stock, setStock] = useState("0");
  const [stockMinimo, setStockMinimo] = useState("0");
  const [requiereReceta, setRequiereReceta] = useState(false);
  const [imagen, setImagen] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    void Promise.all([getCategorias(), getEstantes()]).then(([cats, ests]) => {
      setCategorias(cats);
      setEstantes(ests);
    });
  }, [open]);

  useEffect(() => {
    if (!open || !producto) return;
    setNombre(producto.nombre);
    setCodigo(producto.codigo_interno ?? "");
    setCategoriaId(producto.categoria_id ? String(producto.categoria_id) : "");
    setEstanteId(producto.estante_id ? String(producto.estante_id) : "");
    setUbicacion(producto.ubicacion_detalle ?? "");
    setIndicacion(producto.indicacion ?? "");
    setAdvertencia(producto.advertencia ?? "");
    setStock(String(producto.stock));
    setStockMinimo(String(producto.stock_minimo));
    setRequiereReceta(Boolean(producto.requiere_receta));
    setImagen(producto.imagen ?? null);
    setEditing(false);
    setConfirmDelete(false);
    setError(null);
  }, [open, producto]);

  if (!open || !producto) return null;

  const imgSrc = resolveImageSrc(imagen);

  const handlePickPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const dataUrl = await fileToDownscaledDataUrl(file);
      setImagen(dataUrl);
      setEditing(true);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No se pudo cargar la foto.");
    }
  };

  const handleSave = async () => {
    if (!nombre.trim()) {
      setError("El nombre del producto es obligatorio.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saved = await actualizarProducto(producto.id, {
        nombre: nombre.trim(),
        codigo_interno: codigo.trim() || null,
        categoria_id: categoriaId ? Number(categoriaId) : null,
        estante_id: estanteId ? Number(estanteId) : null,
        ubicacion_detalle: ubicacion.trim() || null,
        indicacion: indicacion.trim() || null,
        advertencia: advertencia.trim() || null,
        imagen: imagen,
        stock: Number(stock) || 0,
        stock_minimo: Number(stockMinimo) || 0,
        requiere_receta: requiereReceta ? 1 : 0,
      });
      onSaved(saved);
      setEditing(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setSaving(true);
    try {
      await eliminarProducto(producto.id);
      onDeleted?.(producto.id);
      onClose();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No se pudo eliminar.");
    } finally {
      setSaving(false);
      setConfirmDelete(false);
    }
  };

  const fieldLabel = "mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]";
  const inputCls = "input-field w-full rounded-lg px-3 py-2 text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="surface-panel max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-[var(--radius-xl)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
          <h2 className="truncate pr-4 text-lg font-bold text-[var(--text-primary)]">
            {producto.nombre}
          </h2>
          <button type="button" onClick={onClose} className="btn-icon h-9 w-9 shrink-0 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="grid max-h-[calc(92vh-64px)] grid-cols-1 overflow-y-auto md:grid-cols-2">
          {/* IZQUIERDA: imagen */}
          <div className="flex flex-col gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-app)] p-6 md:border-b-0 md:border-r">
            <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-[var(--surface-2,var(--bg-sidebar))]">
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt={`Ubicación de ${producto.nombre}`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-[var(--text-muted)]">
                  <Package size={48} strokeWidth={1.5} />
                  <span className="text-sm">Sin foto de ubicación</span>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => void handlePickPhoto(event)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-icon flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium"
            >
              <ImageUp size={16} />
              {imgSrc ? "Cambiar foto" : "Subir foto"}
            </button>
            <p className="text-center text-xs text-[var(--text-muted)]">
              Foto de la sección del estante donde se encuentra el producto.
            </p>
          </div>

          {/* DERECHA: datos */}
          <div className="flex flex-col gap-4 p-6">
            {!editing ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 rounded-full bg-[var(--green-soft)]/40 px-3 py-1 text-xs font-semibold text-[var(--green-accent)]">
                    <MapPin size={13} />
                    {producto.estante_nombre ?? "Sin estante"}
                  </div>
                  {producto.cuadrante_codigo && (
                    <span className="shrink-0 rounded-full bg-[var(--green-soft)]/40 px-3 py-1 text-xs font-semibold text-[var(--green-accent)]">
                      {producto.cuadrante_codigo}
                    </span>
                  )}
                </div>

                <div className="inline-flex w-fit rounded-full bg-[var(--surface-2,var(--bg-sidebar))] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                  {producto.requiere_receta ? "Con receta médica" : "Venta libre (parafarmacia)"}
                </div>

                <div className="space-y-3 text-sm">
                  <Info label="Sección / Bloque" value={producto.categoria_nombre} />
                  <Info label="Cuadrante" value={producto.cuadrante_codigo} />
                  <Info label="Ubicación en estante" value={producto.ubicacion_detalle} />
                  <Info label="Indicación principal" value={producto.indicacion} />
                  <Info label="Advertencia / Contraindicación" value={producto.advertencia} danger />
                  <Info label="Código interno" value={producto.codigo_interno} />
                </div>

                <div className="mt-auto flex flex-col gap-2 pt-2">
                  {onLocateInMap && producto.estante_id && (
                    <button
                      type="button"
                      onClick={() => {
                        onLocateInMap(producto);
                        onClose();
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--green-accent)]/40 bg-[var(--green-soft)]/30 px-4 py-2.5 text-sm font-semibold text-[var(--green-accent)] transition hover:bg-[var(--green-accent)] hover:text-[var(--text-on-green)]"
                    >
                      <Layers3 size={16} />
                      Ver en Vista 3D
                    </button>
                  )}
                  <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--green-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--text-on-green)]"
                  >
                    <Pencil size={16} />
                    Editar datos
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleDelete()}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ${
                      confirmDelete
                        ? "bg-[var(--danger-bg)] text-[var(--danger-text)]"
                        : "btn-icon text-[var(--danger-text)]"
                    }`}
                  >
                    <Trash2 size={16} />
                    {confirmDelete ? "¿Confirmar?" : ""}
                  </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className={fieldLabel}>Nombre *</label>
                  <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputCls} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={fieldLabel}>Sección / Bloque</label>
                    <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} className={inputCls}>
                      <option value="">Sin sección</option>
                      {categorias.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={fieldLabel}>Estante</label>
                    <select value={estanteId} onChange={(e) => setEstanteId(e.target.value)} className={inputCls}>
                      <option value="">Sin estante</option>
                      {estantes.map((est) => (
                        <option key={est.id} value={est.id}>{est.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={fieldLabel}>Ubicación en estante</label>
                  <input value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} className={inputCls} placeholder="Extremo izquierdo..." />
                </div>

                <div>
                  <label className={fieldLabel}>Indicación principal</label>
                  <textarea value={indicacion} onChange={(e) => setIndicacion(e.target.value)} className={`${inputCls} min-h-[64px]`} />
                </div>

                <div>
                  <label className={fieldLabel}>Advertencia / Contraindicación</label>
                  <textarea value={advertencia} onChange={(e) => setAdvertencia(e.target.value)} className={`${inputCls} min-h-[64px]`} />
                </div>

                <div>
                  <label className={fieldLabel}>Código interno</label>
                  <input value={codigo} onChange={(e) => setCodigo(e.target.value)} className={inputCls} />
                </div>

                <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-primary)]">
                  <input
                    type="checkbox"
                    checked={requiereReceta}
                    onChange={(e) => setRequiereReceta(e.target.checked)}
                    className="h-4 w-4 rounded border-[var(--border-subtle)]"
                  />
                  Requiere receta médica
                </label>

                {error && <p className="text-sm text-[var(--danger-text)]">{error}</p>}

                <div className="mt-auto flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="btn-icon flex-1 rounded-xl px-4 py-2.5 text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleSave()}
                    className="flex-1 rounded-xl bg-[var(--green-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--text-on-green)] disabled:opacity-60"
                  >
                    {saving ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              </>
            )}

            {error && !editing && <p className="text-sm text-[var(--danger-text)]">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string | null | undefined;
  danger?: boolean;
}) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className={`mt-0.5 ${danger ? "text-[var(--danger-text)]" : "text-[var(--text-primary)]"}`}>
        {value}
      </p>
    </div>
  );
}
