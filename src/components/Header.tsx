import { Mail, Menu, Plus } from "lucide-react";
import type { AppView } from "../hooks/useMorphTransition";
import { VIEW_LABELS } from "../hooks/useMorphTransition";
import { ThemeToggle } from "./ThemeToggle";

type HeaderProps = {
  activeView: AppView;
  onNewProduct?: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
};

export function Header({ activeView, onNewProduct, sidebarOpen, onToggleSidebar }: HeaderProps) {
  return (
    <header className="morph-header mb-6 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="btn-icon morph-action-btn flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-[var(--shadow-card)]"
          aria-label={sidebarOpen ? "Ocultar menú" : "Mostrar menú"}
        >
          <Menu size={20} />
        </button>
        <h1 className="morph-title truncate text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          {VIEW_LABELS[activeView]}
        </h1>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <ThemeToggle compact />
        {(activeView === "inventario" || activeView === "busqueda") && (
          <button
            type="button"
            onClick={onNewProduct}
            className="morph-action-btn flex items-center gap-2 rounded-xl bg-[var(--green-accent)] px-5 py-3 text-sm font-semibold text-[var(--text-on-green)] shadow-lg shadow-[var(--green-accent)]/25 transition hover:opacity-90"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span className="hidden sm:inline">Nuevo producto</span>
          </button>
        )}
        <button className="btn-icon morph-action-btn hidden h-12 w-12 rounded-xl shadow-[var(--shadow-card)] sm:flex">
          <Mail size={18} />
        </button>
      </div>
    </header>
  );
}
