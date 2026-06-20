import type { CSSProperties, ReactElement } from "react";

export type GraphicName =
  | "bottle"
  | "capsule"
  | "blister"
  | "syringe"
  | "thermometer"
  | "calendar"
  | "receipt"
  | "chart"
  | "box"
  | "shield"
  | "alert"
  | "barcode"
  | "cross"
  | "truck"
  | "heart";

type GraphicProps = {
  name: GraphicName;
  className?: string;
  style?: CSSProperties;
};

/**
 * Flat, multi-color pharmacy illustrations rendered as inline SVG so they stay
 * crisp at any size and never depend on missing image assets. Mirrors the
 * "small thumbnail" look of the Google Chrome ad carousel.
 */
const PHOTO_ASSETS: Partial<Record<GraphicName, string>> = {
  capsule: "/assets/login/capsule.png",
  cross: "/assets/login/cross.png",
  thermometer: "/assets/login/thermometer.png",
};

export function Graphic({ name, className, style }: GraphicProps) {
  const photoSrc = PHOTO_ASSETS[name];

  if (photoSrc) {
    return (
      <img
        src={photoSrc}
        alt=""
        className={className}
        style={style}
        aria-hidden="true"
        draggable={false}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      style={style}
      role="img"
      aria-hidden="true"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {GRAPHICS[name]}
    </svg>
  );
}

const GRAPHICS: Record<GraphicName, ReactElement> = {
  bottle: (
    <>
      {/* tapón */}
      <rect x="16" y="4" width="16" height="6" rx="2" fill="#0f766e" />
      {/* cuerpo blanco: contrasta sobre el panel verde */}
      <rect x="13" y="10" width="22" height="34" rx="5" fill="#ffffff" />
      {/* base con un verde muy suave para dar profundidad */}
      <rect x="13" y="27" width="22" height="17" rx="5" fill="#dcfce7" />
      {/* cruz médica verde sobre la etiqueta */}
      <rect x="22.3" y="14" width="3.4" height="9" rx="1.7" fill="#15803d" />
      <rect x="19" y="17.3" width="10" height="3.4" rx="1.7" fill="#15803d" />
      {/* líneas de etiqueta */}
      <path d="M18.5 31h11v2.4H18.5zM18.5 36h7.5v2.2h-7.5z" fill="#94a3b8" />
    </>
  ),
  capsule: (
    <>
      <rect
        x="8"
        y="18"
        width="32"
        height="14"
        rx="7"
        transform="rotate(-32 24 25)"
        fill="#fb7185"
      />
      <path
        d="M24 25 36.9 16.9a7 7 0 0 0-9.6-2.4L17 21.6a7 7 0 0 0-2 9.7L24 25Z"
        fill="#fda4af"
      />
      <circle cx="20" cy="29" r="1.6" fill="#ffffff" opacity="0.85" />
      <circle cx="24" cy="26.5" r="1.3" fill="#ffffff" opacity="0.7" />
    </>
  ),
  blister: (
    <>
      <rect x="7" y="11" width="34" height="26" rx="5" fill="#c7d2fe" />
      <rect x="7" y="11" width="34" height="26" rx="5" fill="#a5b4fc" opacity="0.5" />
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3].map((c) => (
          <circle
            key={`${r}-${c}`}
            cx={13 + c * 7.5}
            cy={17 + r * 7}
            r="2.6"
            fill="#4f46e5"
          />
        )),
      )}
    </>
  ),
  syringe: (
    <>
      <rect x="11" y="20" width="24" height="8" rx="2" transform="rotate(-45 23 24)" fill="#bae6fd" />
      <rect x="14" y="21.5" width="14" height="5" transform="rotate(-45 21 24)" fill="#38bdf8" />
      <path d="M33 11l4 4" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />
      <path d="M9 35l6-6" stroke="#0284c7" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M7 41l4-4" stroke="#64748b" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="37" cy="11" r="2.4" fill="#0ea5e9" />
    </>
  ),
  thermometer: (
    <>
      <rect x="20" y="6" width="8" height="26" rx="4" fill="#fecaca" />
      <rect x="22" y="9" width="4" height="20" rx="2" fill="#f87171" />
      <circle cx="24" cy="36" r="8" fill="#ef4444" />
      <rect x="22" y="18" width="4" height="18" fill="#ef4444" />
      <circle cx="24" cy="36" r="3.4" fill="#fee2e2" opacity="0.6" />
    </>
  ),
  calendar: (
    <>
      <rect x="7" y="9" width="34" height="32" rx="5" fill="#fde68a" />
      <rect x="7" y="9" width="34" height="9" rx="5" fill="#f59e0b" />
      <rect x="14" y="5" width="4" height="8" rx="2" fill="#b45309" />
      <rect x="30" y="5" width="4" height="8" rx="2" fill="#b45309" />
      <rect x="13" y="23" width="6" height="5" rx="1.4" fill="#f59e0b" />
      <rect x="22" y="23" width="6" height="5" rx="1.4" fill="#fbbf24" />
      <rect x="31" y="23" width="5" height="5" rx="1.4" fill="#ef4444" />
      <rect x="13" y="31" width="6" height="5" rx="1.4" fill="#fbbf24" />
      <rect x="22" y="31" width="6" height="5" rx="1.4" fill="#f59e0b" />
    </>
  ),
  receipt: (
    <>
      <path
        d="M11 6h26v36l-4-2.6-4 2.6-4-2.6-4 2.6-4-2.6L11 42V6Z"
        fill="#fbcfe8"
      />
      <path d="M16 14h16M16 20h16M16 26h10" stroke="#db2777" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="31" cy="26" r="3" fill="#ec4899" />
    </>
  ),
  chart: (
    <>
      <rect x="6" y="7" width="36" height="34" rx="5" fill="#bae6fd" />
      <rect x="12" y="26" width="5" height="9" rx="2" fill="#0ea5e9" />
      <rect x="21" y="20" width="5" height="15" rx="2" fill="#0284c7" />
      <rect x="30" y="14" width="5" height="21" rx="2" fill="#38bdf8" />
      <path d="M12 22l9-6 8 4 6-7" stroke="#0c4a6e" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="35" cy="13" r="2.4" fill="#0c4a6e" />
    </>
  ),
  box: (
    <>
      <path d="M24 6 41 14v20L24 42 7 34V14L24 6Z" fill="#fcd34d" />
      <path d="M24 24 41 14v20L24 42V24Z" fill="#f59e0b" />
      <path d="M24 24 7 14v20l17 8V24Z" fill="#fbbf24" />
      <path d="M15.5 10 33 18.5" stroke="#b45309" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M28 28h8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
    </>
  ),
  shield: (
    <>
      <path d="M24 5 39 10v11c0 9-6.4 16-15 19-8.6-3-15-10-15-19V10l15-5Z" fill="#86efac" />
      <path d="M24 5 39 10v11c0 9-6.4 16-15 19V5Z" fill="#4ade80" />
      <path d="M17 24l5 5 9-10" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  alert: (
    <>
      <path d="M24 6 44 40H4L24 6Z" fill="#fca5a5" />
      <path d="M24 6 44 40H24V6Z" fill="#f87171" />
      <rect x="22" y="18" width="4" height="12" rx="2" fill="#fff" />
      <circle cx="24" cy="34" r="2.4" fill="#fff" />
    </>
  ),
  barcode: (
    <>
      <rect x="6" y="9" width="36" height="30" rx="4" fill="#e2e8f0" />
      {[
        [11, 2],
        [15, 3],
        [20, 1.6],
        [23, 3],
        [28, 1.6],
        [31, 2.4],
        [35, 3],
      ].map(([x, w], i) => (
        <rect key={i} x={x} y="14" width={w} height="20" fill="#0f172a" />
      ))}
    </>
  ),
  cross: (
    <>
      <rect x="6" y="6" width="36" height="36" rx="10" fill="#34d399" />
      <rect x="6" y="6" width="36" height="36" rx="10" fill="#10b981" opacity="0.4" />
      <rect x="20.5" y="13" width="7" height="22" rx="2.5" fill="#fff" />
      <rect x="13" y="20.5" width="22" height="7" rx="2.5" fill="#fff" />
    </>
  ),
  truck: (
    <>
      <rect x="4" y="14" width="24" height="16" rx="3" fill="#93c5fd" />
      <path d="M28 19h7l5 6v5H28V19Z" fill="#3b82f6" />
      <circle cx="13" cy="33" r="4.5" fill="#1e293b" />
      <circle cx="33" cy="33" r="4.5" fill="#1e293b" />
      <circle cx="13" cy="33" r="1.8" fill="#cbd5e1" />
      <circle cx="33" cy="33" r="1.8" fill="#cbd5e1" />
    </>
  ),
  heart: (
    <>
      <path
        d="M24 41C10 31 6 23 6 16.5 6 11 10 7 15 7c3.4 0 5.8 1.7 9 5 3.2-3.3 5.6-5 9-5 5 0 9 4 9 9.5C42 23 38 31 24 41Z"
        fill="#fb7185"
      />
      <path d="M24 12c3.2-3.3 5.6-5 9-5 5 0 9 4 9 9.5C42 23 38 31 24 41V12Z" fill="#f43f5e" />
    </>
  ),
};
