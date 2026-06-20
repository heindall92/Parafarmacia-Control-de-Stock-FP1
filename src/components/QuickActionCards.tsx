import {
  Box,
  DatabaseBackup,
  LayoutGrid,
  Search,
  Tags,
} from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

type QuickActionCardsProps = {
  totalProductos: number;
  onSearch: () => void;
  onShelves: () => void;
  onCategories: () => void;
  onSettings: () => void;
  onVista3D?: () => void;
};

type CardDef = {
  id: string;
  icon: React.ReactNode;
  accentClass: string;
  tag: string;
  title: string;
  detail: string;
  action: string;
  onClick: () => void;
};

const CARD_IDS = ["search", "vista3d", "shelves", "categories", "backup"] as const;
const AUTO_MS = 5200;
const MORPH_SETTLE_MS = 520;

/** Spring morph — un poco más lento y suave. */
const MORPH_SPRING = {
  type: "spring" as const,
  stiffness: 152,
  damping: 34,
  mass: 1.12,
};

const CONTENT_EASE = [0.22, 1, 0.36, 1] as const;

/** Misma bola decorativa que el widget «¿Te piden un producto?» */
function CardDecorOrb() {
  return (
    <div
      className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/20"
      aria-hidden
    />
  );
}

function CardBackground({
  accentClass,
  isLead,
}: {
  accentClass: string;
  isLead: boolean;
}) {
  const className = `expanding-card-bg${isLead ? " expanding-card-bg--morph" : ""} ${accentClass}`;

  if (isLead) {
    return (
      <motion.div
        layoutId="expanding-ppt-morph"
        aria-hidden
        style={{ originX: 1, originY: 0.5, boxShadow: "none" }}
        transition={MORPH_SPRING}
        className={className}
      >
        <CardDecorOrb />
      </motion.div>
    );
  }

  return (
    <div aria-hidden className={className}>
      <CardDecorOrb />
    </div>
  );
}

function getVisualSlots(activeId: string): Record<string, number> {
  const idx = CARD_IDS.indexOf(activeId as (typeof CARD_IDS)[number]);
  const ring: string[] = [activeId];
  for (let step = 1; step < CARD_IDS.length; step += 1) {
    ring.push(CARD_IDS[(idx - step + CARD_IDS.length) % CARD_IDS.length]);
  }
  const leftToRight = [...ring].reverse();
  return Object.fromEntries(leftToRight.map((id, slot) => [id, slot]));
}

function CardInner({
  card,
  isLead,
  showExpandedContent,
  onAction,
}: {
  card: CardDef;
  isLead: boolean;
  showExpandedContent: boolean;
  onAction: () => void;
}) {
  return (
    <>
      <div
        className="expanding-card-header"
        style={{
          flexDirection: isLead ? "row" : "column",
          alignItems: isLead ? "flex-start" : "center",
          justifyContent: isLead ? "space-between" : "center",
        }}
      >
        <div className="expanding-card-title-group">
          <h3>{card.title}</h3>
          <AnimatePresence initial={false}>
            {isLead && showExpandedContent && (
              <motion.span
                key={`tag-${card.id}`}
                className="expanding-card-subtitle"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 0.78, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.48, ease: CONTENT_EASE, delay: 0.06 }}
              >
                {card.tag}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className="expanding-card-icon">{card.icon}</div>
      </div>

      <AnimatePresence initial={false}>
        {isLead && showExpandedContent && (
          <motion.div
            key={`body-${card.id}`}
            className="expanding-card-content"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.48, ease: CONTENT_EASE, delay: 0.08 }}
          >
            <p>{card.detail}</p>
            <button
              type="button"
              className="expanding-card-action"
              onClick={(event) => {
                event.stopPropagation();
                onAction();
              }}
            >
              {card.action} →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function QuickActionCards({
  totalProductos,
  onSearch,
  onShelves,
  onCategories,
  onSettings,
  onVista3D,
}: QuickActionCardsProps) {
  const [activeCard, setActiveCard] = useState<string>(CARD_IDS[0]);
  const [paused, setPaused] = useState(false);
  const [showExpandedContent, setShowExpandedContent] = useState(true);
  const morphTimerRef = useRef<number | null>(null);
  const isFirstActiveRef = useRef(true);

  const cardMap = useMemo<Record<string, CardDef>>(
    () => ({
      search: {
        id: "search",
        icon: <Search size={26} strokeWidth={1.75} />,
        accentClass: "expanding-card--green",
        tag: "Acceso rápido",
        title: "Localizar producto",
        detail: `Busca por nombre con tolerancia a errores. ${totalProductos.toLocaleString("es-ES")} productos indexados con ubicación en estante.`,
        action: "Ir a búsqueda",
        onClick: onSearch,
      },
      vista3d: {
        id: "vista3d",
        icon: <Box size={26} strokeWidth={1.75} />,
        accentClass: "expanding-card--blue",
        tag: "Mapa visual",
        title: "Vista 3D",
        detail:
          "Gemelo digital 3D: estantes góndola con módulos por categoría. Clic en un módulo para filtrar productos.",
        action: "Abrir Vista 3D",
        onClick: () => onVista3D?.(),
      },
      shelves: {
        id: "shelves",
        icon: <LayoutGrid size={26} strokeWidth={1.75} />,
        accentClass: "expanding-card--teal",
        tag: "Plano",
        title: "Estantes",
        detail: "Mapa clásico de estantes y secciones. Edita cuadrantes y asigna productos a cada ubicación.",
        action: "Ver estantes",
        onClick: onShelves,
      },
      categories: {
        id: "categories",
        icon: <Tags size={26} strokeWidth={1.75} />,
        accentClass: "expanding-card--slate",
        tag: "Organización",
        title: "Categorías",
        detail: "Agrupa familias de productos por color y bloque para el mapa 3D y los filtros de búsqueda.",
        action: "Gestionar",
        onClick: onCategories,
      },
      backup: {
        id: "backup",
        icon: <DatabaseBackup size={26} strokeWidth={1.75} />,
        accentClass: "expanding-card--rose",
        tag: "Datos",
        title: "Backup",
        detail: "Exporta o restaura el inventario completo en JSON para migrar a otro ordenador sin perder cambios.",
        action: "Ir a ajustes",
        onClick: onSettings,
      },
    }),
    [onCategories, onSearch, onSettings, onShelves, onVista3D, totalProductos]
  );

  const slots = useMemo(() => getVisualSlots(activeCard), [activeCard]);

  const sortedCards = useMemo(
    () =>
      [...CARD_IDS]
        .sort((a, b) => (slots[a] ?? 0) - (slots[b] ?? 0))
        .map((id) => cardMap[id]),
    [cardMap, slots]
  );

  useEffect(() => {
    if (isFirstActiveRef.current) {
      isFirstActiveRef.current = false;
      return;
    }

    setShowExpandedContent(false);
    if (morphTimerRef.current !== null) {
      window.clearTimeout(morphTimerRef.current);
    }
    morphTimerRef.current = window.setTimeout(() => {
      setShowExpandedContent(true);
      morphTimerRef.current = null;
    }, MORPH_SETTLE_MS);

    return () => {
      if (morphTimerRef.current !== null) {
        window.clearTimeout(morphTimerRef.current);
      }
    };
  }, [activeCard]);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setActiveCard((current) => {
        const idx = CARD_IDS.indexOf(current as (typeof CARD_IDS)[number]);
        return CARD_IDS[(idx + 1) % CARD_IDS.length];
      });
    }, AUTO_MS);
    return () => window.clearInterval(timer);
  }, [paused]);

  const selectCard = (id: string) => {
    if (id !== activeCard) setActiveCard(id);
  };

  return (
    <div
      className="expanding-cards"
      role="tablist"
      aria-label="Acciones rápidas"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="expanding-cards-viewport">
        <LayoutGroup id="quick-action-cards">
          <div className="expanding-cards-track">
            {sortedCards.map((card) => {
              const isLead = card.id === activeCard;

              return (
                <motion.div
                  key={card.id}
                  layout
                  className={`expanding-card-slot${isLead ? " expanding-card-slot--lead" : ""}`}
                  style={{ originX: 1 }}
                  animate={{
                    flexGrow: isLead ? 1 : 0,
                    flexShrink: 0,
                    flexBasis: isLead ? "0%" : "var(--card-collapsed)",
                  }}
                  transition={{ layout: MORPH_SPRING, ...MORPH_SPRING }}
                  onClick={() => selectCard(card.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      selectCard(card.id);
                    }
                  }}
                >
                  <div
                    role="tab"
                    aria-selected={isLead}
                    tabIndex={isLead ? 0 : -1}
                    className={`expanding-card${isLead ? " expanding-card--lead" : ""}${isLead && showExpandedContent ? " expanding-card--lead-settled" : ""}`}
                  >
                    {isLead ? (
                      <CardBackground accentClass={card.accentClass} isLead />
                    ) : (
                      <CardBackground accentClass={card.accentClass} isLead={false} />
                    )}

                    <div className="expanding-card-body">
                      <CardInner
                        card={card}
                        isLead={isLead}
                        showExpandedContent={isLead && showExpandedContent}
                        onAction={card.onClick}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </LayoutGroup>
      </div>
    </div>
  );
}
