import type { GraphicName } from "../components/CarouselGraphics";

export type CarouselCard = {
  id: string;
  position: "tl" | "tr" | "bl" | "br";
  thumb: GraphicName;
  title: string;
  subtitle: string;
  metric?: string;
  metricTone?: "default" | "danger" | "success" | "warning";
  badge?: string;
  barPercent?: number;
  list?: { name: string; value: string; tone?: "default" | "danger" | "success" }[];
};

export type FloatBadge = {
  id: string;
  position: "t" | "r" | "b" | "l";
  icon: GraphicName;
};

export type CarouselSlide = {
  id: string;
  /** Solid theme color for the central panel. */
  color: string;
  /** Lighter accent used for the soft glow / circle ring. */
  accent: string;
  /** Page background tint behind the whole scene. */
  tint: string;
  tag: string;
  titleTop: string;
  titleBottom: string;
  hero: GraphicName;
  badges: FloatBadge[];
  cards: CarouselCard[];
};

export const PHARMACY_CAROUSEL_SLIDES: CarouselSlide[] = [
  {
    id: "inventario",
    color: "#16a34a",
    accent: "#86efac",
    tint: "#052e16",
    tag: "FarmaStock",
    titleTop: "Tu",
    titleBottom: "Inventario",
    hero: "bottle",
    badges: [
      { id: "b1", position: "t", icon: "cross" },
      { id: "b2", position: "r", icon: "box" },
    ],
    cards: [
      {
        id: "valor",
        position: "tl",
        thumb: "box",
        title: "Valor neto",
        subtitle: "Almacén general",
        metric: "€48.250",
        metricTone: "success",
      },
      {
        id: "alertas",
        position: "tr",
        thumb: "alert",
        title: "Stock crítico",
        subtitle: "Quiebre inminente",
        metric: "04 SKUs",
        metricTone: "danger",
      },
      {
        id: "capacidad",
        position: "bl",
        thumb: "barcode",
        title: "Capacidad estantes",
        subtitle: "Volumen ocupado",
        metric: "78%",
        barPercent: 78,
      },
      {
        id: "lotes",
        position: "br",
        thumb: "truck",
        title: "Entradas de lote",
        subtitle: "Últimas 24 h",
        badge: "+350 u.",
      },
    ],
  },
  {
    id: "lotes",
    color: "#4f46e5",
    accent: "#a5b4fc",
    tint: "#1e1b4b",
    tag: "Trazabilidad",
    titleTop: "Control de",
    titleBottom: "Lotes",
    hero: "blister",
    badges: [
      { id: "b1", position: "l", icon: "shield" },
      { id: "b2", position: "b", icon: "capsule" },
    ],
    cards: [
      {
        id: "trazas",
        position: "tl",
        thumb: "barcode",
        title: "Lotes activos",
        subtitle: "Con seguimiento",
        metric: "126",
        metricTone: "default",
      },
      {
        id: "critico",
        position: "tr",
        thumb: "alert",
        title: "Lote crítico",
        subtitle: "Control de calidad",
        metric: "LT-2026",
        metricTone: "danger",
      },
      {
        id: "auditoria",
        position: "br",
        thumb: "shield",
        title: "Auditoría sanitaria",
        subtitle: "Conformidad",
        metric: "100%",
        metricTone: "success",
      },
      {
        id: "movs",
        position: "bl",
        thumb: "capsule",
        title: "Movimientos",
        subtitle: "Últimos registros",
        list: [
          { name: "Ibuprofeno K-12", value: "+150 u.", tone: "success" },
          { name: "Amoxicilina B-7", value: "-40 u.", tone: "danger" },
        ],
      },
    ],
  },
  {
    id: "caducidad",
    color: "#d97706",
    accent: "#fcd34d",
    tint: "#451a03",
    tag: "Caducidad",
    titleTop: "Gestión de",
    titleBottom: "Caducidad",
    hero: "calendar",
    badges: [
      { id: "b1", position: "t", icon: "thermometer" },
      { id: "b2", position: "r", icon: "alert" },
    ],
    cards: [
      {
        id: "vencer",
        position: "tl",
        thumb: "calendar",
        title: "Por vencer",
        subtitle: "Próximos 30 días",
        metric: "14 Lotes",
        metricTone: "warning",
      },
      {
        id: "temp",
        position: "tr",
        thumb: "thermometer",
        title: "Cadena de frío",
        subtitle: "Nevera vacunas",
        metric: "4,2 °C",
        metricTone: "success",
      },
      {
        id: "merma",
        position: "bl",
        thumb: "alert",
        title: "Merma del mes",
        subtitle: "Producto retirado",
        metric: "1,8%",
        barPercent: 18,
      },
      {
        id: "proximos",
        position: "br",
        thumb: "box",
        title: "Próximas retiradas",
        subtitle: "Agenda sanitaria",
        badge: "Esta semana",
      },
    ],
  },
  {
    id: "ventas",
    color: "#e11d48",
    accent: "#fda4af",
    tint: "#4c0519",
    tag: "Mostrador",
    titleTop: "Punto de",
    titleBottom: "Venta",
    hero: "receipt",
    badges: [
      { id: "b1", position: "l", icon: "heart" },
      { id: "b2", position: "b", icon: "cross" },
    ],
    cards: [
      {
        id: "atenciones",
        position: "tl",
        thumb: "heart",
        title: "Atenciones hoy",
        subtitle: "Mostrador activo",
        metric: "142",
        metricTone: "default",
      },
      {
        id: "recetas",
        position: "tr",
        thumb: "receipt",
        title: "Recetas retenidas",
        subtitle: "Psicotrópicos",
        metric: "38",
        metricTone: "danger",
      },
      {
        id: "ticket",
        position: "bl",
        thumb: "chart",
        title: "Ticket medio",
        subtitle: "Jornada actual",
        metric: "€14,60",
        metricTone: "success",
      },
      {
        id: "top",
        position: "br",
        thumb: "capsule",
        title: "Más vendidos",
        subtitle: "Top de hoy",
        list: [
          { name: "Paracetamol 1g", value: "92 u." },
          { name: "Suero fisiológico", value: "61 u." },
        ],
      },
    ],
  },
  {
    id: "informes",
    color: "#0284c7",
    accent: "#7dd3fc",
    tint: "#082f49",
    tag: "Analítica",
    titleTop: "Datos e",
    titleBottom: "Informes",
    hero: "chart",
    badges: [
      { id: "b1", position: "t", icon: "barcode" },
      { id: "b2", position: "r", icon: "box" },
    ],
    cards: [
      {
        id: "rotacion",
        position: "tl",
        thumb: "chart",
        title: "Rotación media",
        subtitle: "Índice mensual",
        metric: "3,4x",
        metricTone: "success",
      },
      {
        id: "margen",
        position: "tr",
        thumb: "receipt",
        title: "Margen bruto",
        subtitle: "Acumulado mes",
        metric: "31%",
        barPercent: 62,
      },
      {
        id: "compras",
        position: "bl",
        thumb: "truck",
        title: "Pedidos sugeridos",
        subtitle: "Reposición auto.",
        metric: "09",
        metricTone: "warning",
      },
      {
        id: "exporta",
        position: "br",
        thumb: "barcode",
        title: "Exportar informe",
        subtitle: "Excel / PDF local",
        badge: "Offline",
      },
    ],
  },
];
