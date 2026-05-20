import { Mail, Plus } from "lucide-react";
import type { AppView } from "../hooks/useMorphTransition";
import { VIEW_LABELS } from "../hooks/useMorphTransition";

type HeaderProps = {
  activeView: AppView;
  onNewProduct?: () => void;
};

export function Header({ activeView, onNewProduct }: HeaderProps) {
  return (
    <header className="morph-header mb-6 flex items-center justify-between">
      <h1 className="morph-title text-3xl font-bold tracking-tight text-[var(--text-primary)]">
        {VIEW_LABELS[activeView]}
      </h1>
      <div className="flex items-center gap-3">
        <button
          onClick={onNewProduct}
          className="morph-action-btn flex items-center gap-2 rounded-xl bg-[var(--green-accent)] px-5 py-3 text-sm font-semibold text-[var(--text-on-green)] shadow-lg shadow-[var(--green-accent)]/25 transition hover:opacity-90"
        >
          <Plus size={18} strokeWidth={2.5} />
          Nuevo producto
        </button>
        <button className="btn-icon morph-action-btn h-12 w-12 rounded-xl shadow-[var(--shadow-card)]">
          <Mail size={18} />
        </button>
      </div>
    </header>
  );
}
