import {
  Database,
  Download,
  LayoutGrid,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { exportarBackup, importarBackup } from "../lib/backup";
import { useNecesidadFiltros } from "../hooks/useNecesidadFiltros";
import { NecesidadFiltrosModal } from "./NecesidadFiltrosModal";
import { ThemeToggle } from "./ThemeToggle";
import { Vista3DLayoutModal } from "./Vista3DLayoutModal";

type ConfiguracionViewProps = {
  productCount: number | null;
  totalEsperado: number;
  seedVersion: string | null;
  estantesCount: number;
  categoriasCount: number;
  reimporting: boolean;
  reimportMessage: string | null;
  onReimport: () => void;
  onDataChanged: () => void;
};

type Estado = { tipo: "ok" | "error"; texto: string } | null;

export function ConfiguracionView({
  productCount,
  totalEsperado,
  seedVersion,
  estantesCount,
  categoriasCount,
  reimporting,
  reimportMessage,
  onReimport,
  onDataChanged,
}: ConfiguracionViewProps) {
  const [busy, setBusy] = useState<"export" | "import" | null>(null);
  const [estado, setEstado] = useState<Estado>(null);
  const [filtrosOpen, setFiltrosOpen] = useState(false);
  const [layoutOpen, setLayoutOpen] = useState(false);
  const necesidadFiltros = useNecesidadFiltros();

  const handleExport = async () => {
    setBusy("export");
    setEstado(null);
    try {
      const result = await exportarBackup();
      if (!result.cancelled) setEstado({ tipo: "ok", texto: result.message });
    } catch (error) {
      setEstado({
        tipo: "error",
        texto: error instanceof Error ? error.message : "No se pudo exportar.",
      });
    } finally {
      setBusy(null);
    }
  };

  const handleImport = async () => {
    const confirmed = window.confirm(
      "Restaurar reemplazará todos los datos actuales por los del archivo. ¿Continuar?"
    );
    if (!confirmed) return;

    setBusy("import");
    setEstado(null);
    try {
      const result = await importarBackup();
      if (!result.cancelled) {
        setEstado({ tipo: "ok", texto: result.message });
        onDataChanged();
      }
    } catch (error) {
      setEstado({
        tipo: "error",
        texto: error instanceof Error ? error.message : "No se pudo restaurar.",
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <div className="content-panel morph-content animate-fade-up overflow-auto rounded-[var(--radius-xl)] p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Ajustes</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Opciones rápidas del mostrador. Todo funciona sin internet.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SettingsCard
            icon={<Search size={18} className="text-[var(--green-accent)]" />}
            title="Búsqueda por necesidad"
            description="Atajos como Tos, Garganta o Cuidado íntimo en la búsqueda."
          >
            <div className="flex flex-wrap gap-1.5">
              {necesidadFiltros.slice(0, 4).map((filtro) => (
                <span
                  key={filtro.id}
                  className="rounded-full bg-[var(--green-soft)]/60 px-2 py-0.5 text-[10px] font-semibold text-[var(--green-accent)]"
                >
                  {filtro.label}
                </span>
              ))}
              {necesidadFiltros.length > 4 && (
                <span className="text-[10px] text-[var(--text-muted)]">
                  +{necesidadFiltros.length - 4}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setFiltrosOpen(true)}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--green-accent)] px-3 py-2.5 text-sm font-semibold text-[var(--text-on-green)] transition hover:opacity-90"
            >
              <SlidersHorizontal size={16} />
              Personalizar filtros
            </button>
          </SettingsCard>

          <SettingsCard
            icon={<LayoutGrid size={18} className="text-[var(--green-accent)]" />}
            title="Plano del local · Vista 3D"
            description="Arrastra estantes al plano o edita posiciones en formulario."
          >
            <p className="mb-3 text-xs text-[var(--text-muted)]">
              Cuadrícula interactiva con puerta, mostrador y orientación hacia el centro.
            </p>
            <button
              type="button"
              onClick={() => setLayoutOpen(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--green-accent)] px-3 py-2.5 text-sm font-semibold text-[var(--text-on-green)] transition hover:opacity-90"
            >
              <LayoutGrid size={16} />
              Editar plano (formulario)
            </button>
          </SettingsCard>

          <SettingsCard
            icon={<Database size={18} className="text-[var(--green-accent)]" />}
            title="Copia de seguridad"
            description="Exporta o restaura el inventario al cambiar de PC."
          >
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void handleExport()}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-[var(--green-accent)] px-3 py-2.5 text-xs font-semibold text-[var(--text-on-green)] disabled:opacity-60 sm:text-sm"
              >
                <Download size={15} />
                {busy === "export" ? "…" : "Exportar"}
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void handleImport()}
                className="btn-icon flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold sm:text-sm"
              >
                <Upload size={15} />
                {busy === "import" ? "…" : "Restaurar"}
              </button>
            </div>
            {estado && (
              <p
                className={`mt-2 rounded-lg px-3 py-2 text-xs ${
                  estado.tipo === "error"
                    ? "bg-[var(--danger-bg)] text-[var(--danger-text)]"
                    : "bg-[var(--green-soft)] text-[var(--text-primary)]"
                }`}
              >
                {estado.texto}
              </p>
            )}
          </SettingsCard>

          <SettingsCard title="Apariencia" description="Modo claro u oscuro.">
            <div className="flex items-center justify-between rounded-xl bg-[var(--bg-app)]/50 px-3 py-2">
              <span className="text-sm text-[var(--text-secondary)]">Tema visual</span>
              <ThemeToggle compact />
            </div>
          </SettingsCard>

          <SettingsCard
            icon={<RefreshCw size={18} className="text-[var(--green-accent)]" />}
            title="Inventario y datos"
            description="Reimportar Excel o revisar el estado del catálogo."
          >
            <button
              type="button"
              disabled={reimporting}
              onClick={onReimport}
              className="btn-icon flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              <RefreshCw size={15} className={reimporting ? "animate-spin" : ""} />
              {reimporting ? "Reimportando…" : "Reimportar Excel"}
            </button>
            {reimportMessage && (
              <p className="mt-2 rounded-lg bg-[var(--green-soft)] px-3 py-2 text-xs">
                {reimportMessage}
              </p>
            )}
            {productCount !== null && productCount < totalEsperado * 0.9 && (
              <p className="mt-2 rounded-lg bg-[var(--danger-bg)] px-3 py-2 text-xs text-[var(--danger-text)]">
                Inventario incompleto ({productCount}/{totalEsperado}).
              </p>
            )}
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <MiniStat label="Productos" value={productCount?.toLocaleString("es-ES") ?? "…"} />
              <MiniStat label="Estantes" value={String(estantesCount)} />
              <MiniStat label="Categorías" value={String(categoriasCount)} />
              <MiniStat label="Versión" value={seedVersion ?? "—"} />
            </dl>
          </SettingsCard>
        </div>
      </div>

      <NecesidadFiltrosModal open={filtrosOpen} onClose={() => setFiltrosOpen(false)} />
      <Vista3DLayoutModal
        open={layoutOpen}
        onClose={() => setLayoutOpen(false)}
        onSaved={onDataChanged}
      />
    </>
  );
}

function SettingsCard({
  icon,
  title,
  description,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-card flex min-h-[11rem] flex-col rounded-[var(--radius-lg)] p-4">
      <div className="mb-1 flex items-center gap-2">
        {icon}
        <h3 className="font-bold text-[var(--text-primary)]">{title}</h3>
      </div>
      <p className="mb-3 text-xs text-[var(--text-secondary)]">{description}</p>
      <div className="mt-auto">{children}</div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[var(--bg-app)]/50 px-2 py-1.5">
      <dt className="text-[10px] text-[var(--text-muted)]">{label}</dt>
      <dd className="truncate font-semibold text-[var(--text-primary)]">{value}</dd>
    </div>
  );
}
