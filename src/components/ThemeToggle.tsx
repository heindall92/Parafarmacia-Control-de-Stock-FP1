import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

type ThemeToggleProps = {
  compact?: boolean;
};

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { isDark, setThemeMode } = useTheme();

  return (
    <div
      className={`flex items-center ${compact ? "gap-2" : "justify-between gap-3 rounded-xl px-4 py-3"}`}
    >
      {!compact && (
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
          {isDark ? <Moon size={18} strokeWidth={1.75} /> : <Sun size={18} strokeWidth={1.75} />}
          <span>{isDark ? "Modo oscuro" : "Modo claro"}</span>
        </div>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        onClick={(event) => setThemeMode(isDark ? "light" : "dark", event)}
        className={`theme-switch morph-theme-toggle relative shrink-0 rounded-full transition-colors ${
          isDark ? "bg-[var(--green-accent)]" : "bg-[var(--border-medium)]"
        } ${compact ? "h-8 w-14" : "h-9 w-[3.25rem]"}`}
      >
        <span
          className={`absolute top-1 left-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[var(--green-accent)] shadow-md transition-transform duration-200 ${
            isDark ? "translate-x-[1.35rem]" : "translate-x-0"
          }`}
        >
          {isDark ? <Moon size={14} /> : <Sun size={14} />}
        </span>
      </button>
    </div>
  );
}
