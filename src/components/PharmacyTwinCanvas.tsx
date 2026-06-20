import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  resolveEstanteLayout,
  sortEstantesByLayout,
  MOSTRADOR_LAYOUT,
  PASILLO_CLIENTES,
  PASILLO_FARMACEUTICO,
  PASILLO_PUERTA,
  detrasMostradorCenterZ,
  detrasMostradorFrontZ,
  mostradorBackZ,
  mostradorCenterX,
  mostradorLeftX,
  pasilloClientesEntradaZ,
  entradaShelfFrontZ,
  type Vista3DHighlight,
} from "../lib/estanteLayout";
import {
  cellShowsStock,
  cellToLayoutSlot,
  DEFAULT_BURO_EQUIP,
  getBuroCells,
  getBasculaCells,
  getCellForEstante,
  getMostradorFromLayout,
  getPuertaFromLayout,
  isFrioCellForEstante,
  isRedondoCellForEstante,
  resolveFacingRotY,
  type LocalLayout,
  type LocalLayoutCell,
} from "../lib/localLayout";
import type { Vista3DEstante } from "../lib/database";
import { useTheme } from "../context/ThemeContext";

type SceneVariant = "light" | "dark";

const SCENE_PALETTE: Record<
  SceneVariant,
  {
    background: string;
    fog: [string, number, number];
    floor: string;
    grid: [string, string];
    ambient: number;
    hemisphere: [string, string, number];
    directionalMain: number;
    directionalFill: number;
    point: number;
  }
> = {
  dark: {
    background: "#1c2420",
    fog: ["#1c2420", 24, 48],
    floor: "#2a3330",
    grid: ["#1e3d2f", "#162820"],
    ambient: 0.88,
    hemisphere: ["#eef6f0", "#1a211e", 0.55],
    directionalMain: 1.35,
    directionalFill: 0.5,
    point: 0.4,
  },
  light: {
    background: "#d8e4de",
    fog: ["#d8e4de", 28, 52],
    floor: "#b8c9c0",
    grid: ["#7a9a8a", "#94b0a2"],
    ambient: 1.15,
    hemisphere: ["#ffffff", "#9eb5a8", 0.72],
    directionalMain: 1.55,
    directionalFill: 0.65,
    point: 0.22,
  },
};

type PharmacyTwinCanvasProps = {
  estantes: Vista3DEstante[];
  localLayout: LocalLayout | null;
  selectedCategoryId: number | null;
  selectedEstanteId: number | null;
  highlight: Vista3DHighlight | null;
  onSelectCategory: (categoriaId: number, estanteId: number) => void;
  onSelectEstante: (estanteId: number) => void;
};

type TooltipState = {
  x: number;
  y: number;
  title: string;
  subtitle: string;
} | null;

const SHELF_W = 3.2;
const SHELF_D = 0.85;
const SHELF_H = 3.6;
const SHELF_LEVELS = 4;
/** Puerta de acceso (~1 m), más estrecha que un estante. */
const DOOR_W = 1.06;
/** Nevera / vitrina fría, más estrecha que la góndola. */
const FRIO_W = 2.05;
const FRIO_D = 0.72;
/** Buró / mesa de ordenador (~1,4 × 0,72 m). */
const BURO_W = 1.4;
const BURO_D = 0.72;
const BURO_H = 0.74;
/** Báscula / pesa fina, claramente más estrecha que la puerta (~1,06 m). */
const BASCULA_W = 0.76;
const BASCULA_D = 0.38;
const BASCULA_H = 0.88;
/** Estante redondo: 3 pisos decrecientes. */
const REDONDO_TIERS = [
  { y: 0.52, radius: 1.08, thickness: 0.07 },
  { y: 1.42, radius: 0.78, thickness: 0.06 },
  { y: 2.28, radius: 0.52, thickness: 0.05 },
] as const;

function ShelfProductBoxes({
  shelfW,
  color,
  productCount,
  z = 0.12,
  scale = 1,
}: {
  shelfW: number;
  color: string;
  productCount: number;
  z?: number;
  scale?: number;
}) {
  const density = Math.min(1, Math.max(0.2, productCount / 45));
  const boxesPerLevel = Math.max(4, Math.min(9, Math.round(3 + density * 5)));
  const palette = [color, "#6eb5ff", "#f5b54b", "#e07a5f"];

  return (
    <>
      {Array.from({ length: SHELF_LEVELS }, (_, level) => {
        const y = 0.35 + level * (SHELF_H / SHELF_LEVELS) + 0.12;
        return Array.from({ length: boxesPerLevel }, (_, b) => {
          const bx = -shelfW / 2 + (shelfW / (boxesPerLevel + 1)) * (b + 1);
          const c = palette[(b + level) % palette.length];
          const w = 0.15 * scale;
          const h = 0.19 * scale;
          const d = 0.11 * scale;
          return (
            <mesh key={`${level}-${b}`} position={[bx, y, z]} castShadow>
              <boxGeometry args={[w, h, d]} />
              <meshStandardMaterial color={c} roughness={0.42} metalness={0.08} />
            </mesh>
          );
        });
      })}
    </>
  );
}

function hexToThree(hex: string): string {
  return hex.startsWith("#") ? hex : `#${hex}`;
}

function shortName(value: string, max = 22): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

function MostradorPc({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0.12, 1.08, 0]} castShadow>
        <boxGeometry args={[0.05, 0.05, 0.3]} />
        <meshStandardMaterial color="#22262b" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[0.12, 1.28, 0]} castShadow>
        <boxGeometry args={[0.025, 0.3, 0.44]} />
        <meshStandardMaterial
          color="#1e2830"
          emissive="#5a9fd4"
          emissiveIntensity={0.22}
          metalness={0.35}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[0.1, 1.14, 0]}>
        <boxGeometry args={[0.04, 0.12, 0.06]} />
        <meshStandardMaterial color="#3a4249" metalness={0.5} roughness={0.45} />
      </mesh>
    </group>
  );
}

function MostradorMesh({ layout }: { layout: LocalLayout | null }) {
  const custom = getMostradorFromLayout(layout);
  const cfg = custom ?? {
    x: MOSTRADOR_LAYOUT.x,
    z: MOSTRADOR_LAYOUT.z,
    length: MOSTRADOR_LAYOUT.length,
    depth: MOSTRADOR_LAYOUT.depth,
    rotY: MOSTRADOR_LAYOUT.rotY,
  };
  const pcOffset = cfg.length * 0.16;
  return (
    <group position={[cfg.x, 0, cfg.z]} rotation={[0, cfg.rotY, 0]}>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[cfg.depth, 1.1, cfg.length]} />
        <meshStandardMaterial color="#4a5560" metalness={0.35} roughness={0.45} />
      </mesh>
      <MostradorPc x={0} z={-pcOffset} />
      <MostradorPc x={0} z={pcOffset} />
      <Html position={[0, 1.35, 0]} center distanceFactor={12} style={{ pointerEvents: "none" }}>
        <div className="twin-zone-label">Mostrador · 2 PC</div>
      </Html>
    </group>
  );
}

function PuertaMesh({ layout }: { layout: LocalLayout | null }) {
  const cell = layout?.cells.find((item) => item.kind === "puerta");
  if (!cell || !layout) return null;

  const pos = getPuertaFromLayout(layout);
  if (!pos) return null;

  const width = DOOR_W;
  const height = SHELF_H;
  const depth = 0.14;
  const frame = 0.095;
  const panelW = width - frame * 2;
  const panelH = height - frame * 1.65;
  const rotY = resolveFacingRotY(cell, layout);
  const handleSide = width / 2 - frame - 0.07;
  const handleY = height * 0.46;
  const faceZ = depth * 0.42;

  const frameMat = { color: "#40916c", metalness: 0.35, roughness: 0.5 };
  const jambDepth = depth * 1.15;

  return (
    <group position={[pos.x, 0, pos.z]} rotation={[0, rotY, 0]}>
      {/* Umbral inferior */}
      <mesh position={[0, frame * 0.45, depth * 0.08]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.06, frame * 0.85, jambDepth]} />
        <meshStandardMaterial color="#2d6a4f" metalness={0.3} roughness={0.62} />
      </mesh>

      {/* Marco: jambas y dintel */}
      <mesh position={[-width / 2 + frame / 2, height / 2 + frame * 0.15, 0]} castShadow>
        <boxGeometry args={[frame, height - frame * 0.3, jambDepth]} />
        <meshStandardMaterial {...frameMat} />
      </mesh>
      <mesh position={[width / 2 - frame / 2, height / 2 + frame * 0.15, 0]} castShadow>
        <boxGeometry args={[frame, height - frame * 0.3, jambDepth]} />
        <meshStandardMaterial {...frameMat} />
      </mesh>
      <mesh position={[0, height - frame / 2, 0]} castShadow>
        <boxGeometry args={[width, frame, jambDepth]} />
        <meshStandardMaterial {...frameMat} />
      </mesh>

      {/* Hoja de la puerta */}
      <mesh position={[0, frame + panelH / 2 + 0.02, faceZ * 0.55]} castShadow receiveShadow>
        <boxGeometry args={[panelW, panelH, 0.045]} />
        <meshStandardMaterial color="#2d6a4f" metalness={0.2} roughness={0.68} />
      </mesh>

      {/* Cristal superior */}
      <mesh position={[0, height * 0.68, faceZ * 0.62]}>
        <boxGeometry args={[panelW * 0.78, panelH * 0.38, 0.022]} />
        <meshStandardMaterial
          color="#9cf0c8"
          transparent
          opacity={0.38}
          emissive="#42e695"
          emissiveIntensity={0.1}
          metalness={0.12}
          roughness={0.22}
        />
      </mesh>

      {/* Moldura interior del cristal */}
      <mesh position={[0, height * 0.68, faceZ * 0.64]}>
        <boxGeometry args={[panelW * 0.82, panelH * 0.42, 0.012]} />
        <meshStandardMaterial color="#52b788" metalness={0.25} roughness={0.55} />
      </mesh>

      {/* Placa de cerradura */}
      <mesh position={[handleSide - 0.01, height * 0.36, faceZ * 0.68]} castShadow>
        <boxGeometry args={[0.05, 0.14, 0.018]} />
        <meshStandardMaterial color="#b8860b" metalness={0.75} roughness={0.28} />
      </mesh>

      {/* Pomo / manilla */}
      <mesh position={[handleSide, handleY, faceZ * 0.72]} castShadow>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.22} />
      </mesh>
      <mesh
        position={[handleSide - 0.045, handleY, faceZ * 0.68]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.018, 0.018, 0.09, 12]} />
        <meshStandardMaterial color="#c9a227" metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh position={[handleSide - 0.09, handleY, faceZ * 0.66]} castShadow>
        <cylinderGeometry args={[0.028, 0.028, 0.012, 12]} />
        <meshStandardMaterial color="#b8860b" metalness={0.78} roughness={0.3} />
      </mesh>

      <Html position={[0, height + 0.15, 0]} center distanceFactor={14} style={{ pointerEvents: "none" }}>
        <div className="twin-zone-label twin-zone-label--entrada">→ Puerta</div>
      </Html>
    </group>
  );
}

function RoundShelfProductBoxes({
  productCount,
  color,
}: {
  productCount: number;
  color: string;
}) {
  const density = Math.min(1, Math.max(0.15, productCount / 35));
  const palette = [color, "#6eb5ff", "#f5b54b", "#e07a5f"];

  return (
    <>
      {REDONDO_TIERS.map((tier, tierIdx) => {
        const count = Math.max(3, Math.min(10, Math.round(2 + density * (6 - tierIdx * 1.5))));
        return Array.from({ length: count }, (_, i) => {
          const angle = (i / count) * Math.PI * 2 + tierIdx * 0.4;
          const r = tier.radius * 0.62;
          const x = Math.cos(angle) * r;
          const z = Math.sin(angle) * r;
          const c = palette[(i + tierIdx) % palette.length];
          return (
            <mesh key={`${tierIdx}-${i}`} position={[x, tier.y + 0.14, z]} castShadow>
              <boxGeometry args={[0.12, 0.16, 0.1]} />
              <meshStandardMaterial color={c} roughness={0.42} metalness={0.08} />
            </mesh>
          );
        });
      })}
    </>
  );
}

function BuroMesh({ cell, layout }: { cell: LocalLayoutCell; layout: LocalLayout }) {
  const slot = cellToLayoutSlot(cell, layout, "Buró");
  const equip = cell.buroEquip ?? DEFAULT_BURO_EQUIP;
  const w = slot.shelfWidth ?? BURO_W;
  const d = BURO_D;
  const h = BURO_H;

  return (
    <group position={[slot.x, 0, slot.z]} rotation={[0, slot.rotY, 0]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#5c4a3a" roughness={0.72} metalness={0.12} />
      </mesh>
      <mesh position={[0, h + 0.012, 0]} receiveShadow>
        <boxGeometry args={[w + 0.04, 0.03, d + 0.04]} />
        <meshStandardMaterial color="#7a6552" roughness={0.55} metalness={0.18} />
      </mesh>

      {equip.torre && (
        <group position={[-w / 2 + 0.18, h, d / 2 - 0.14]}>
          <mesh position={[0, 0.28, 0]} castShadow>
            <boxGeometry args={[0.22, 0.56, 0.38]} />
            <meshStandardMaterial color="#2a3038" metalness={0.35} roughness={0.45} />
          </mesh>
          <mesh position={[0, 0.58, 0.08]}>
            <boxGeometry args={[0.08, 0.08, 0.04]} />
            <meshStandardMaterial color="#42e695" emissive="#42e695" emissiveIntensity={0.35} />
          </mesh>
        </group>
      )}

      {equip.monitor && (
        <group position={[0.05, h, -d / 2 + 0.12]}>
          <mesh position={[0, 0.38, 0]} castShadow>
            <boxGeometry args={[0.04, 0.28, 0.04]} />
            <meshStandardMaterial color="#3a4249" metalness={0.4} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.56, 0]}>
            <boxGeometry args={[0.52, 0.32, 0.03]} />
            <meshStandardMaterial
              color="#1e2830"
              emissive="#5a9fd4"
              emissiveIntensity={0.28}
              metalness={0.3}
              roughness={0.4}
            />
          </mesh>
        </group>
      )}

      {equip.teclado && (
        <mesh position={[0.08, h + 0.025, 0.06]} castShadow>
          <boxGeometry args={[0.36, 0.02, 0.12]} />
          <meshStandardMaterial color="#3a4249" metalness={0.25} roughness={0.55} />
        </mesh>
      )}

      {equip.mouse && (
        <mesh position={[w / 2 - 0.22, h + 0.03, 0.1]} castShadow>
          <boxGeometry args={[0.06, 0.025, 0.09]} />
          <meshStandardMaterial color="#4a5560" metalness={0.3} roughness={0.5} />
        </mesh>
      )}

      <Html position={[0, h + 0.55, 0]} center distanceFactor={12} style={{ pointerEvents: "none" }}>
        <div className="twin-zone-label">Buró</div>
      </Html>
    </group>
  );
}

function BuroMeshes({ layout }: { layout: LocalLayout | null }) {
  if (!layout) return null;
  return (
    <>
      {getBuroCells(layout).map((cell) => (
        <BuroMesh key={cell.buroId ?? `${cell.col},${cell.row}`} cell={cell} layout={layout} />
      ))}
    </>
  );
}

function BasculaMesh({ cell, layout }: { cell: LocalLayoutCell; layout: LocalLayout }) {
  const slot = cellToLayoutSlot(cell, layout, "Báscula");
  const w = BASCULA_W;
  const d = BASCULA_D;
  const h = BASCULA_H;

  return (
    <group position={[slot.x, 0, slot.z]} rotation={[0, slot.rotY, 0]}>
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <boxGeometry args={[w + 0.05, 0.05, d + 0.08]} />
        <meshStandardMaterial color="#2a3330" roughness={0.82} metalness={0.12} />
      </mesh>
      <mesh position={[0, h * 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h * 0.78, d]} />
        <meshStandardMaterial color="#e8ecea" roughness={0.35} metalness={0.55} />
      </mesh>
      <mesh position={[0, h * 0.82, 0]} castShadow>
        <boxGeometry args={[w * 0.72, 0.04, d * 0.88]} />
        <meshStandardMaterial color="#cfd8d3" roughness={0.4} metalness={0.65} />
      </mesh>
      <mesh position={[0, h * 0.92, d / 2 - 0.04]}>
        <boxGeometry args={[w * 0.55, 0.22, 0.04]} />
        <meshStandardMaterial
          color="#1a2420"
          emissive="#42e695"
          emissiveIntensity={0.22}
          roughness={0.35}
          metalness={0.2}
        />
      </mesh>
      <mesh position={[0, h * 0.78, -d / 2 + 0.06]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.08, 10]} />
        <meshStandardMaterial color="#5a6560" metalness={0.7} roughness={0.35} />
      </mesh>
      <Html position={[0, h + 0.35, 0]} center distanceFactor={12} style={{ pointerEvents: "none" }}>
        <div className="twin-zone-label">Báscula</div>
      </Html>
    </group>
  );
}

function BasculaMeshes({ layout }: { layout: LocalLayout | null }) {
  if (!layout) return null;
  return (
    <>
      {getBasculaCells(layout).map((cell) => (
        <BasculaMesh
          key={cell.basculaId ?? `${cell.col},${cell.row}`}
          cell={cell}
          layout={layout}
        />
      ))}
    </>
  );
}

function GondolaShelf({
  data,
  localLayout,
  selectedCategoryId,
  selectedEstanteId,
  highlight,
  onSelectCategory,
  onSelectEstante,
  onHover,
}: {
  data: Vista3DEstante;
  localLayout?: LocalLayout | null;
  selectedCategoryId: number | null;
  selectedEstanteId: number | null;
  highlight: Vista3DHighlight | null;
  onSelectCategory: (categoriaId: number, estanteId: number) => void;
  onSelectEstante: (estanteId: number) => void;
  onHover: (tip: TooltipState) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const pulseRef = useRef(0);
  const layout = resolveEstanteLayout(data.estante_nombre, data.estante_id);
  const shelfW = layout.shelfWidth ?? SHELF_W;
  const isFrio = isFrioCellForEstante(localLayout, data.estante_id);
  const isRedondo = isRedondoCellForEstante(localLayout, data.estante_id);
  const layoutCell = getCellForEstante(localLayout, data.estante_id);
  const showStock = cellShowsStock(layoutCell) && data.total_productos > 0;
  const estanteSelected = selectedEstanteId === data.estante_id;
  const estanteHighlighted =
    highlight !== null && highlight.estanteId === data.estante_id;
  const modulos = data.modulos.length > 0 ? data.modulos : [];
  const modWidth = modulos.length > 0 ? shelfW / modulos.length : shelfW;

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    if (estanteHighlighted) {
      pulseRef.current += delta * 5;
      const bounce = Math.sin(pulseRef.current) * 0.14;
      group.position.y = THREE.MathUtils.lerp(group.position.y, bounce, delta * 6);
      group.scale.setScalar(THREE.MathUtils.lerp(group.scale.x, 1.04, delta * 4));
    } else {
      group.position.y = THREE.MathUtils.lerp(group.position.y, 0, delta * 4);
      group.scale.setScalar(THREE.MathUtils.lerp(group.scale.x, 1, delta * 4));
    }
  });

  if (isRedondo) {
    const baseR = layout.shelfWidth ? layout.shelfWidth / 2.05 : 1.08;
    const scale = baseR / REDONDO_TIERS[0].radius;
    return (
      <group
        ref={groupRef}
        position={[layout.x, 0, layout.z]}
        rotation={[0, layout.rotY, 0]}
      >
        <mesh position={[0, SHELF_H / 2, 0]} castShadow>
          <cylinderGeometry args={[0.045 * scale, 0.055 * scale, SHELF_H * 0.92, 16]} />
          <meshStandardMaterial color="#5c4a3a" roughness={0.65} metalness={0.2} />
        </mesh>
        {REDONDO_TIERS.map((tier, idx) => (
          <mesh key={idx} position={[0, tier.y * scale, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[tier.radius * scale, tier.radius * scale, tier.thickness, 32]} />
            <meshStandardMaterial
              color={idx === 0 ? "#6b5344" : idx === 1 ? "#7a6552" : "#8a7560"}
              roughness={0.58}
              metalness={0.15}
            />
          </mesh>
        ))}
        {showStock && (
          <group scale={scale}>
            <RoundShelfProductBoxes productCount={data.total_productos} color="#40916c" />
          </group>
        )}
        <Html position={[0, SHELF_H + 0.85, 0]} center distanceFactor={11} style={{ pointerEvents: "none" }}>
          <div
            className={`twin-estante-tag ${estanteSelected || estanteHighlighted ? "twin-estante-tag--active" : ""} twin-estante-tag--redondo`}
          >
            ◎ {shortName(data.estante_nombre, 28)}
          </div>
        </Html>
        <mesh
          position={[0, 0.01, 0.4]}
          rotation={[-Math.PI / 2, 0, 0]}
          onClick={(event: ThreeEvent<MouseEvent>) => {
            event.stopPropagation();
            onSelectEstante(data.estante_id);
          }}
          onPointerOver={(event: ThreeEvent<PointerEvent>) => {
            onHover({
              x: event.clientX,
              y: event.clientY,
              title: data.estante_nombre,
              subtitle: "Estante redondo · 3 pisos",
            });
          }}
          onPointerOut={() => onHover(null)}
        >
          <circleGeometry args={[baseR + 0.25, 24]} />
          <meshStandardMaterial transparent opacity={0} />
        </mesh>
      </group>
    );
  }

  if (isFrio) {
    const frioW = layout.shelfWidth ?? FRIO_W;
    const frioD = FRIO_D;
    return (
      <group
        ref={groupRef}
        position={[layout.x, 0, layout.z]}
        rotation={[0, layout.rotY, 0]}
      >
        <mesh position={[0, 0.04, 0]} receiveShadow>
          <boxGeometry args={[frioW + 0.12, 0.08, frioD + 0.22]} />
          <meshStandardMaterial color="#2a3540" metalness={0.55} roughness={0.45} />
        </mesh>
        <mesh position={[0, SHELF_H / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[frioW, SHELF_H, frioD]} />
          <meshStandardMaterial color="#3d5166" metalness={0.35} roughness={0.55} />
        </mesh>
        <mesh position={[0, SHELF_H / 2, frioD / 2 + 0.02]}>
          <boxGeometry args={[frioW * 0.88, SHELF_H * 0.92, 0.05]} />
          <meshStandardMaterial
            color="#8fd4ff"
            transparent
            opacity={0.42}
            emissive="#6eb5ff"
            emissiveIntensity={estanteHighlighted ? 0.35 : 0.18}
            metalness={0.2}
            roughness={0.15}
          />
        </mesh>
        {Array.from({ length: SHELF_LEVELS }, (_, level) => {
          const y = 0.35 + level * (SHELF_H / SHELF_LEVELS);
          return (
            <mesh key={level} position={[0, y, 0.01]} castShadow>
              <boxGeometry args={[frioW * 0.82, 0.04, frioD * 0.82]} />
              <meshStandardMaterial color="#b8dff5" metalness={0.15} roughness={0.4} />
            </mesh>
          );
        })}
        {showStock && (
          <ShelfProductBoxes
            shelfW={frioW * 0.78}
            color="#7ec8e8"
            productCount={data.total_productos}
            z={0.04}
            scale={0.88}
          />
        )}
        <Html position={[0, SHELF_H + 0.85, 0]} center distanceFactor={11} style={{ pointerEvents: "none" }}>
          <div
            className={`twin-estante-tag ${estanteSelected || estanteHighlighted ? "twin-estante-tag--active" : ""} twin-estante-tag--frio`}
          >
            ❄️ {shortName(data.estante_nombre, 28)}
          </div>
        </Html>
        <mesh
          position={[0, 0.01, 0.4]}
          rotation={[-Math.PI / 2, 0, 0]}
          onClick={(event: ThreeEvent<MouseEvent>) => {
            event.stopPropagation();
            onSelectEstante(data.estante_id);
          }}
          onPointerOver={(event: ThreeEvent<PointerEvent>) => {
            onHover({
              x: event.clientX,
              y: event.clientY,
              title: data.estante_nombre,
              subtitle: "Nevera / zona de frío",
            });
          }}
          onPointerOut={() => onHover(null)}
        >
          <planeGeometry args={[frioW + 0.4, frioD + 0.8]} />
          <meshStandardMaterial transparent opacity={0} />
        </mesh>
      </group>
    );
  }

  return (
    <group
      ref={groupRef}
      position={[layout.x, 0, layout.z]}
      rotation={[0, layout.rotY, 0]}
    >
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <boxGeometry args={[shelfW + 0.2, 0.08, SHELF_D + 0.3]} />
        <meshStandardMaterial
          color={estanteHighlighted ? "#42e695" : "#3a3f44"}
          emissive={estanteHighlighted ? "#42e695" : "#000000"}
          emissiveIntensity={estanteHighlighted ? 0.25 : 0}
          metalness={0.4}
          roughness={0.5}
        />
      </mesh>

      {[-shelfW / 2 + 0.08, shelfW / 2 - 0.08].map((px) => (
        <mesh key={px} position={[px, SHELF_H / 2, 0]} castShadow>
          <boxGeometry args={[0.07, SHELF_H, 0.07]} />
          <meshStandardMaterial color="#8b939a" metalness={0.65} roughness={0.35} />
        </mesh>
      ))}

      {Array.from({ length: SHELF_LEVELS }, (_, level) => {
        const y = 0.35 + level * (SHELF_H / SHELF_LEVELS);
        return (
          <mesh key={level} position={[0, y, 0.02]} castShadow receiveShadow>
            <boxGeometry args={[shelfW, 0.06, SHELF_D]} />
            <meshStandardMaterial color="#c8cdd2" metalness={0.25} roughness={0.55} />
          </mesh>
        );
      })}

      {modulos.map((mod, modIndex) => {
        const modX = -shelfW / 2 + modWidth * modIndex + modWidth / 2;
        const selected = selectedCategoryId === mod.categoria_id;
        const moduleHighlighted =
          estanteHighlighted &&
          (highlight?.categoriaId === mod.categoria_id || highlight?.categoriaId === null);
        const color = hexToThree(mod.categoria_color);
        const fillRatio = Math.min(1, mod.productos / 120);

        return (
          <group key={mod.categoria_id} position={[modX, 0, -SHELF_D / 2 + 0.08]}>
            <mesh
              position={[0, SHELF_H / 2, 0]}
              onClick={(event: ThreeEvent<MouseEvent>) => {
                event.stopPropagation();
                onSelectCategory(mod.categoria_id, data.estante_id);
              }}
              onPointerOver={(event: ThreeEvent<PointerEvent>) => {
                event.stopPropagation();
                onHover({
                  x: event.clientX,
                  y: event.clientY,
                  title: mod.categoria_nombre,
                  subtitle: `${mod.productos} productos · ${data.estante_nombre}`,
                });
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                onHover(null);
                document.body.style.cursor = "auto";
              }}
            >
              <boxGeometry args={[modWidth - 0.08, SHELF_H - 0.2, 0.06]} />
              <meshStandardMaterial
                color={moduleHighlighted ? "#42e695" : color}
                transparent
                opacity={selected || moduleHighlighted ? 0.95 : 0.55}
                emissive={moduleHighlighted ? "#42e695" : color}
                emissiveIntensity={moduleHighlighted ? 0.65 : selected ? 0.35 : 0.08}
                roughness={0.25}
                metalness={0.15}
              />
            </mesh>

            {moduleHighlighted && (
              <mesh position={[0, SHELF_H / 2, 0.08]}>
                <boxGeometry args={[modWidth, SHELF_H, 0.02]} />
                <meshBasicMaterial color="#42e695" transparent opacity={0.15} />
              </mesh>
            )}

            {showStock &&
              Array.from({ length: SHELF_LEVELS }, (_, level) => {
                const y = 0.35 + level * (SHELF_H / SHELF_LEVELS) + 0.12;
                const boxes = Math.max(3, Math.min(7, Math.round(2 + fillRatio * 5)));
                return Array.from({ length: boxes }, (_, b) => {
                  const bx = (b - (boxes - 1) / 2) * (modWidth / (boxes + 0.5));
                  return (
                    <mesh key={`${level}-${b}`} position={[bx, y, 0.12]} castShadow>
                      <boxGeometry args={[0.17, 0.21, 0.13]} />
                      <meshStandardMaterial color={color} opacity={0.9} transparent roughness={0.4} />
                    </mesh>
                  );
                });
              })}

            <Html position={[0, SHELF_H + 0.35, 0.15]} center distanceFactor={10} style={{ pointerEvents: "none" }}>
              <div
                className={`twin-shelf-label ${selected || moduleHighlighted ? "twin-shelf-label--active" : ""}`}
                style={{ borderColor: moduleHighlighted ? "#42e695" : color }}
              >
                <span className="twin-shelf-label__name">{shortName(mod.categoria_nombre, 20)}</span>
                <span className="twin-shelf-label__count">{mod.productos}</span>
              </div>
            </Html>
          </group>
        );
      })}

      {showStock && modulos.length === 0 && (
        <ShelfProductBoxes
          shelfW={shelfW * 0.92}
          color="#40916c"
          productCount={Math.max(data.total_productos, 24)}
        />
      )}

      <Html position={[0, SHELF_H + 0.85, 0]} center distanceFactor={11} style={{ pointerEvents: "none" }}>
        <div
          className={`twin-estante-tag ${estanteSelected || estanteHighlighted ? "twin-estante-tag--active" : ""}`}
        >
          {estanteHighlighted ? "📍 " : "🗄️ "}
          {shortName(data.estante_nombre, 28)}
        </div>
      </Html>

      {estanteHighlighted && highlight && (
        <Html position={[0, SHELF_H + 1.35, 0.2]} center distanceFactor={9} style={{ pointerEvents: "none" }}>
          <div className="twin-pin-label">{shortName(highlight.productoNombre, 32)}</div>
        </Html>
      )}

      <mesh
        position={[0, 0.01, 0.4]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(event: ThreeEvent<MouseEvent>) => {
          event.stopPropagation();
          onSelectEstante(data.estante_id);
        }}
        onPointerOver={(event: ThreeEvent<PointerEvent>) => {
          onHover({
            x: event.clientX,
            y: event.clientY,
            title: data.estante_nombre,
            subtitle: `${data.total_productos} productos · ${modulos.length} categorías`,
          });
        }}
        onPointerOut={() => onHover(null)}
      >
        <planeGeometry args={[shelfW + 0.4, SHELF_D + 0.8]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

function HighlightBeacon({
  estantes,
  highlight,
}: {
  estantes: Vista3DEstante[];
  highlight: Vista3DHighlight | null;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const arrowRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const t = useRef(0);

  const target = highlight?.estanteId
    ? estantes.find((e) => e.estante_id === highlight.estanteId)
    : undefined;
  const slot = highlight?.estanteId
    ? resolveEstanteLayout(target?.estante_nombre ?? "", highlight.estanteId)
    : null;

  useFrame((_, delta) => {
    t.current += delta;
    if (arrowRef.current) {
      arrowRef.current.position.y = Math.sin(t.current * 3) * 0.18;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 1.5;
      const s = 1 + Math.sin(t.current * 3) * 0.12;
      ringRef.current.scale.set(s, s, s);
    }
  });

  if (!slot) return null;

  return (
    <group ref={groupRef} position={[slot.x, 0, slot.z]}>
      {/* Haz de luz roja */}
      <pointLight position={[0, SHELF_H + 1.2, 0]} intensity={1.4} color="#ff3b3b" distance={6} />
      {/* Flecha roja apuntando hacia abajo al estante */}
      <group ref={arrowRef} position={[0, SHELF_H + 1.55, 0]}>
        <mesh position={[0, 0.32, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.55, 12]} />
          <meshStandardMaterial color="#ff3b3b" emissive="#ff2d2d" emissiveIntensity={0.7} />
        </mesh>
        <mesh position={[0, -0.05, 0]}>
          <coneGeometry args={[0.22, 0.4, 16]} />
          <meshStandardMaterial color="#ff3b3b" emissive="#ff2d2d" emissiveIntensity={0.85} />
        </mesh>
      </group>
      {/* Anillo pulsante en el suelo del estante */}
      <mesh ref={ringRef} position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.72, 32]} />
        <meshBasicMaterial color="#ff3b3b" transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Scene({
  estantes,
  localLayout,
  selectedCategoryId,
  selectedEstanteId,
  highlight,
  onSelectCategory,
  onSelectEstante,
  onHover,
  variant,
}: PharmacyTwinCanvasProps & { onHover: (tip: TooltipState) => void; variant: SceneVariant }) {
  const sorted = useMemo(() => sortEstantesByLayout(estantes), [estantes]);
  const floorW = localLayout ? localLayout.cols * localLayout.cellSizeM + 4 : 44;
  const floorD = localLayout ? localLayout.rows * localLayout.cellSizeM + 4 : 28;
  const puerta = getPuertaFromLayout(localLayout);
  const useCustom = localLayout != null;
  const palette = SCENE_PALETTE[variant];

  return (
    <>
      <color attach="background" args={[palette.background]} />
      <fog attach="fog" args={palette.fog} />
      <ambientLight intensity={palette.ambient} />
      <hemisphereLight args={palette.hemisphere} />
      <directionalLight position={[8, 18, 12]} intensity={palette.directionalMain} color="#ffffff" castShadow />
      <directionalLight position={[-5, 12, -6]} intensity={palette.directionalFill} color="#e8f4ff" />
      <pointLight position={[0, 10, 2]} intensity={palette.point} color="#42e695" distance={24} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[floorW, floorD]} />
        <meshStandardMaterial color={palette.floor} roughness={0.78} metalness={0.08} />
      </mesh>
      <gridHelper
        args={[Math.max(floorW, floorD), Math.max(localLayout?.cols ?? 44, 12), palette.grid[0], palette.grid[1]]}
        position={[0, 0.005, 0]}
      />

      {!useCustom && (
        <>
      {/* Pasillo central libre */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.5, 0.01, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#1a2420" transparent opacity={0.55} />
      </mesh>

      {/* Paredes del rectángulo (como el borrador) */}
      <mesh position={[-7.85, 1.8, 0]} receiveShadow>
        <boxGeometry args={[0.12, 3.6, 18]} />
        <meshStandardMaterial color="#2a3330" roughness={0.9} />
      </mesh>
      <mesh position={[9.55, 1.8, 0]} receiveShadow>
        <boxGeometry args={[0.12, 3.6, 18]} />
        <meshStandardMaterial color="#2a3330" roughness={0.9} />
      </mesh>
      <mesh position={[0.5, 1.8, -8.85]} receiveShadow>
        <boxGeometry args={[18, 3.6, 0.12]} />
        <meshStandardMaterial color="#2a3330" roughness={0.9} />
      </mesh>
      <mesh position={[0.5, 1.8, 8.85]} receiveShadow>
        <boxGeometry args={[18, 3.6, 0.12]} />
        <meshStandardMaterial color="#2a3330" roughness={0.9} />
      </mesh>

      <Html position={[-6.8, 0.2, -8.2]} center distanceFactor={14} style={{ pointerEvents: "none" }}>
        <div className="twin-zone-label twin-zone-label--entrada">→ Puerta</div>
      </Html>
      <Html position={[2.6, 0.2, -8.2]} center distanceFactor={14} style={{ pointerEvents: "none" }}>
        <div className="twin-zone-label">3 estantes · mirando al interior</div>
      </Html>

      {/* Pasillo clientes 3 m desde estantes de entrada */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[4.5, 0.011, (pasilloClientesEntradaZ + entradaShelfFrontZ) / 2]}
      >
        <planeGeometry args={[8, PASILLO_CLIENTES]} />
        <meshStandardMaterial color="#1a2820" transparent opacity={0.4} roughness={0.9} />
      </mesh>
      <Html position={[4.5, 0.12, (pasilloClientesEntradaZ + entradaShelfFrontZ) / 2]} center distanceFactor={18} style={{ pointerEvents: "none" }}>
        <div className="twin-zone-label">Pasillo clientes · 3 m</div>
      </Html>

      {/* Pasillo tipo puerta (estante izq. ↔ mostrador) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[(mostradorLeftX + (mostradorLeftX - PASILLO_PUERTA)) / 2, 0.012, MOSTRADOR_LAYOUT.z]}
      >
        <planeGeometry args={[PASILLO_PUERTA, MOSTRADOR_LAYOUT.length + 0.3]} />
        <meshStandardMaterial color="#2a3028" transparent opacity={0.45} roughness={0.9} />
      </mesh>
      <Html
        position={[(mostradorLeftX + (mostradorLeftX - PASILLO_PUERTA)) / 2, 0.14, MOSTRADOR_LAYOUT.z]}
        center
        distanceFactor={17}
        style={{ pointerEvents: "none" }}
      >
        <div className="twin-zone-label twin-zone-label--pasillo">Pasillo · ancho puerta</div>
      </Html>

      <Html position={[MOSTRADOR_LAYOUT.x, 0.2, detrasMostradorCenterZ]} center distanceFactor={14} style={{ pointerEvents: "none" }}>
        <div className="twin-zone-label">Detrás mostrador · pared fondo</div>
      </Html>

      {/* Pasillo farmacéuticos (1,25 m entre mostrador y estante en pared fondo) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[mostradorCenterX, 0.012, (mostradorBackZ + detrasMostradorFrontZ) / 2]}
      >
        <planeGeometry args={[MOSTRADOR_LAYOUT.depth + 0.5, PASILLO_FARMACEUTICO]} />
        <meshStandardMaterial color="#243028" transparent opacity={0.45} roughness={0.9} />
      </mesh>
      <Html
        position={[mostradorCenterX, 0.15, (mostradorBackZ + detrasMostradorFrontZ) / 2]}
        center
        distanceFactor={16}
        style={{ pointerEvents: "none" }}
      >
        <div className="twin-zone-label twin-zone-label--pasillo">Pasillo farmacéuticos · 1,25 m</div>
      </Html>
      <Html position={[9.0, 0.2, 0]} center distanceFactor={14} style={{ pointerEvents: "none" }}>
        <div className="twin-zone-label twin-zone-label--ventana">Ventana</div>
      </Html>
        </>
      )}

      {useCustom && puerta && <PuertaMesh layout={localLayout} />}

      <BuroMeshes layout={localLayout} />
      <BasculaMeshes layout={localLayout} />

      <MostradorMesh layout={localLayout} />

      {sorted.map((estante) => (
        <GondolaShelf
          key={estante.estante_id}
          data={estante}
          localLayout={localLayout}
          selectedCategoryId={selectedCategoryId}
          selectedEstanteId={selectedEstanteId}
          highlight={highlight}
          onSelectCategory={onSelectCategory}
          onSelectEstante={onSelectEstante}
          onHover={onHover}
        />
      ))}

      <HighlightBeacon estantes={estantes} highlight={highlight} />

      <OrbitControls
        enablePan
        enableDamping
        dampingFactor={0.06}
        minDistance={8}
        maxDistance={26}
        maxPolarAngle={Math.PI / 2.05}
        target={[4, 1.6, 0]}
      />
    </>
  );
}

export function PharmacyTwinCanvas(props: PharmacyTwinCanvasProps) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const { isDark } = useTheme();
  const variant: SceneVariant = isDark ? "dark" : "light";
  const hint = useMemo(() => {
    if (props.highlight) {
      return `📍 ${props.highlight.productoNombre} — estante señalado`;
    }
    return "Arrastra para rotar · Clic en módulo = categoría · Búsqueda señala el estante";
  }, [props.highlight]);

  return (
    <div className={`pharmacy-twin-wrap ${isDark ? "pharmacy-twin-wrap--dark" : "pharmacy-twin-wrap--light"}`}>
      <div className="pharmacy-twin-hint">{hint}</div>
      <Canvas
        shadows
        camera={{ position: [-2, 14, 12], fov: 42, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false }}
        style={{ width: "100%", height: "100%" }}
      >
        <Scene {...props} variant={variant} onHover={setTooltip} />
      </Canvas>
      {tooltip && (
        <div className="tooltip-3d" style={{ left: tooltip.x + 14, top: tooltip.y + 14 }}>
          <strong>{tooltip.title}</strong>
          <span>{tooltip.subtitle}</span>
        </div>
      )}
    </div>
  );
}
