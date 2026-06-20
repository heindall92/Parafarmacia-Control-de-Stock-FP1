import type { NecesidadFiltro } from "./search";

export const DEFAULT_NECESIDAD_FILTROS: NecesidadFiltro[] = [
  { id: "tos", label: "Tos", terms: ["tos", "carraspera", "jarabe", "ronquera"] },
  { id: "garganta", label: "Garganta", terms: ["garganta", "pastilla", "faríngeo", "faringeo", "bucal", "angina"] },
  { id: "intimo", label: "Cuidado íntimo", terms: ["íntim", "intim", "urinario", "higiene femenina", "genital"] },
  {
    id: "nasal",
    label: "Nasal / resfriado",
    terms: ["nasal", "resfriado", "congestión", "congestion", "sinusitis", "moco", "rinitis"],
  },
  {
    id: "ocular",
    label: "Ojos",
    terms: ["ocular", "lágrima", "lagrima", "colirio", "párpado", "parpado", "lentilla"],
  },
  { id: "piel", label: "Piel", terms: ["piel", "dermat", "eczema", "hidrat", "crema", "atópica", "atopica"] },
];

const STORAGE_KEY = "farma-necesidad-filtros";
export const FILTROS_UPDATED_EVENT = "farma-filtros-updated";

function isValidFiltro(value: unknown): value is NecesidadFiltro {
  if (!value || typeof value !== "object") return false;
  const row = value as NecesidadFiltro;
  return (
    typeof row.id === "string" &&
    typeof row.label === "string" &&
    Array.isArray(row.terms) &&
    row.terms.every((term) => typeof term === "string")
  );
}

export function getNecesidadFiltros(): NecesidadFiltro[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_NECESIDAD_FILTROS;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_NECESIDAD_FILTROS;
    const valid = parsed.filter(isValidFiltro);
    return valid.length > 0 ? valid : DEFAULT_NECESIDAD_FILTROS;
  } catch {
    return DEFAULT_NECESIDAD_FILTROS;
  }
}

export function saveNecesidadFiltros(filtros: NecesidadFiltro[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtros));
  window.dispatchEvent(new CustomEvent(FILTROS_UPDATED_EVENT));
}

export function resetNecesidadFiltros() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(FILTROS_UPDATED_EVENT));
}

export function createFiltroId(label: string): string {
  const base = label
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base || "filtro"}-${Date.now().toString(36)}`;
}

export function parseTermsInput(value: string): string[] {
  return value
    .split(/[,;\n]+/)
    .map((term) => term.trim())
    .filter(Boolean);
}
