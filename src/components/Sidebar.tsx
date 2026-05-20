import {
  AlertTriangle,
  Grid3X3,
  HelpCircle,
  LayoutGrid,
  Moon,
  Package,
  Search,
  Settings,
  Sun,
  Tags,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import type { AppView } from "../hooks/useMorphTransition";

type NavItem = {
  id: AppView;
  label: string;
  icon: React.ReactNode;
  badge?: string;
};

const mainNav: NavItem[] = [
  { id: "inventario", label: "Inventario", icon: <Package size={18} strokeWidth={1.75} /> },
  { id: "busqueda", label: "Búsqueda", icon: <Search size={18} strokeWidth={1.75} /> },
  { id: "estantes", label: "Estantes", icon: <Grid3X3 size={18} strokeWidth={1.75} /> },
  { id: "categorias", label: "Categorías", icon: <Tags size={18} strokeWidth={1.75} /> },
  { id: "alertas", label: "Stock bajo", icon: <AlertTriangle size={18} strokeWidth={1.75} /> },
];

const settingsNav: NavItem[] = [
  { id: "configuracion", label: "Ajustes", icon: <Settings size={18} strokeWidth={1.75} /> },
];

type SidebarProps = {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  alertCount: number;
};

export function Sidebar({ activeView, onNavigate, alertCount }: SidebarProps) {
  const { isDark, toggleTheme } = useTheme();

  const renderItem = (item: NavItem) => {
    const isActive = activeView === item.id;
    const badge =
      item.id === "alertas" && alertCount > 0 ? String(alertCount) : item.badge;

    return (
      <button
        key={item.id}
        onClick={() => onNavigate(item.id)}
        className={`relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors ${
          isActive
            ? "text-[var(--green-accent)]"
            : "text-[var(--text-secondary)] hover:bg-[var(--green-soft)]/35 hover:text-[var(--text-primary)]"
        }`}
      >
        {isActive && (
          <span className="morph-sidebar-active absolute inset-0 rounded-xl bg-[var(--green-soft)]" />
        )}
        <span className="relative z-10 flex w-full items-center gap-3">
          <span className={isActive ? "text-[var(--green-accent)]" : ""}>{item.icon}</span>
          <span>{item.label}</span>
          {badge && (
            <span className="ml-auto rounded-full bg-[var(--green-accent)] px-2 py-0.5 text-xs font-semibold text-white">
              {badge}
            </span>
          )}
        </span>
        {isActive && (
          <span className="absolute left-0 top-1/2 z-10 h-8 w-1 -translate-y-1/2 rounded-r-full bg-[var(--green-accent)]" />
        )}
      </button>
    );
  };

  return (
    <aside className="flex h-full w-[clamp(220px,18vw,260px)] shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-sidebar)]/80 px-4 py-5 backdrop-blur-sm lg:px-5 lg:py-6">
      <div className="mb-10 flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--green-accent)] text-white">
          <LayoutGrid size={18} />
        </div>
        <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
          farma<span className="text-[var(--green-accent)]">.</span>
        </span>
      </div>

      <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        Mi panel
      </div>
      <nav className="flex flex-col gap-1">{mainNav.map(renderItem)}</nav>

      <div className="mb-2 mt-8 px-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        Sistema
      </div>
      <nav className="flex flex-col gap-1">
        {settingsNav.map(renderItem)}
        <button
          type="button"
          onClick={toggleTheme}
          className="theme-toggle-btn morph-theme-toggle flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--green-soft)]/35 hover:text-[var(--text-primary)]"
          aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
        >
          {isDark ? <Sun size={18} strokeWidth={1.75} /> : <Moon size={18} strokeWidth={1.75} />}
          {isDark ? "Modo claro" : "Modo oscuro"}
        </button>
        <button className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--green-soft)]/35">
          <HelpCircle size={18} strokeWidth={1.75} />
          Centro de ayuda
        </button>
      </nav>

      <div className="surface-card mt-auto rounded-2xl p-4 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--green-accent)] text-sm font-bold text-white">
            FP
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">Parafarmacia</div>
            <div className="text-xs text-[var(--text-secondary)]">Modo offline · Local</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
