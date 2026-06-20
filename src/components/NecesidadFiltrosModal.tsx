import { Plus, RotateCcw, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  createFiltroId,
  getNecesidadFiltros,
  parseTermsInput,
  resetNecesidadFiltros,
  saveNecesidadFiltros,
} from "../lib/necesidadFiltrosStore";
import type { NecesidadFiltro } from "../lib/search";

type NecesidadFiltrosModalProps = {
  open: boolean;
  onClose: () => void;
};

export function NecesidadFiltrosModal({ open, onClose }: NecesidadFiltrosModalProps) {
  const [draft, setDraft] = useState<NecesidadFiltro[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(getNecesidadFiltros().map((item) => ({ ...item, terms: [...item.terms] })));
    setError(null);
  }, [open]);

  if (!open) return null;

  const updateFiltro = (id: string, patch: Partial<NecesidadFiltro>) => {
    setDraft((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const removeFiltro = (id: string) => {
    setDraft((current) => current.filter((item) => item.id !== id));
  };

  const addFiltro = () => {
    setDraft((current) => [
      ...current,
      { id: createFiltroId("nuevo"), label: "Nuevo filtro", terms: [] },
    ]);
  };

  const handleSave = () => {
    const cleaned = draft
      .map((item) => ({
        id: item.id.trim(),
        label: item.label.trim(),
        terms: item.terms.map((term) => term.trim()).filter(Boolean),
      }))
      .filter((item) => item.label.length > 0);

    if (cleaned.length === 0) {
      setError("Debe quedar al menos un filtro con nombre.");
      return;
    }

    const invalid = cleaned.find((item) => item.terms.length === 0);
    if (invalid) {
      setError(`«${invalid.label}» necesita al menos una palabra clave.`);
      return;
    }

    saveNecesidadFiltros(cleaned);
    onClose();
  };

  const handleReset = () => {
    if (!window.confirm("¿Restaurar los filtros originales? Se perderán los cambios personalizados.")) {
      return;
    }
    resetNecesidadFiltros();
    onClose();
  };

  const inputCls = "input-field w-full rounded-lg px-3 py-2 text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="surface-panel flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[var(--radius-xl)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Filtros de búsqueda</h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Atajos del modo «Por necesidad» (tos, garganta, etc.)
            </p>
          </div>
          <button type="button" onClick={onClose} className="btn-icon h-9 w-9 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {draft.map((filtro) => (
            <div
              key={filtro.id}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)]/40 p-4"
            >
              <div className="mb-3 flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Nombre del botón
                  </label>
                  <input
                    value={filtro.label}
                    onChange={(event) => updateFiltro(filtro.id, { label: event.target.value })}
                    className={inputCls}
                    placeholder="Ej.: Tos"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeFiltro(filtro.id)}
                  className="btn-icon mt-6 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--danger-text)]"
                  aria-label={`Eliminar ${filtro.label}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Palabras clave (separadas por coma)
                </label>
                <textarea
                  value={filtro.terms.join(", ")}
                  onChange={(event) =>
                    updateFiltro(filtro.id, { terms: parseTermsInput(event.target.value) })
                  }
                  className={`${inputCls} min-h-[72px]`}
                  placeholder="tos, jarabe, carraspera"
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addFiltro}
            className="btn-icon flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium"
          >
            <Plus size={16} />
            Añadir filtro
          </button>

          {error && (
            <p className="rounded-xl bg-[var(--danger-bg)] px-4 py-3 text-sm text-[var(--danger-text)]">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] px-5 py-4">
          <button
            type="button"
            onClick={handleReset}
            className="btn-icon inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm"
          >
            <RotateCcw size={15} />
            Restaurar originales
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-icon rounded-xl px-4 py-2 text-sm">
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-[var(--green-accent)] px-4 py-2 text-sm font-semibold text-[var(--text-on-green)]"
            >
              Guardar filtros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
