import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getWaveOriginFromClick, runMorphTransition } from "../lib/morphTransition";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  isDark: boolean;
  toggleTheme: (event: React.MouseEvent<HTMLElement>) => void;
  setThemeMode: (mode: Theme, event?: React.MouseEvent<HTMLElement>) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialTheme(): Theme {
  const stored = localStorage.getItem("farma-theme");
  if (stored === "light" || stored === "dark") return stored;
  return "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("farma-theme", theme);
  }, [theme]);

  const setThemeMode = useCallback(
    (mode: Theme, event?: React.MouseEvent<HTMLElement>) => {
      if (mode === theme) return;
      const wave = event ? getWaveOriginFromClick(event) : undefined;
      runMorphTransition(() => setTheme(mode), wave);
    },
    [theme]
  );

  const toggleTheme = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setThemeMode(theme === "light" ? "dark" : "light", event);
    },
    [theme, setThemeMode]
  );

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      toggleTheme,
      setThemeMode,
    }),
    [theme, toggleTheme, setThemeMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de ThemeProvider");
  return ctx;
}
