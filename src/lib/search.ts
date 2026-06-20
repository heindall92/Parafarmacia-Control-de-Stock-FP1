import type { Producto } from "./database";

export type SearchMode = "nombre" | "necesidad";

export type NecesidadFiltro = {
  id: string;
  label: string;
  terms: string[];
};

export { DEFAULT_NECESIDAD_FILTROS as NECESIDAD_FILTROS, getNecesidadFiltros } from "./necesidadFiltrosStore";

const FUZZY_MIN_SCORE = 0.52;

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s/-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const prev = new Array<number>(b.length + 1);
  const curr = new Array<number>(b.length + 1);

  for (let j = 0; j <= b.length; j += 1) prev[j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j += 1) prev[j] = curr[j];
  }

  return prev[b.length];
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (b.includes(a)) return 0.95 - Math.min(0.2, (b.length - a.length) * 0.02);
  if (a.includes(b)) return 0.9;

  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  return 1 - dist / maxLen;
}

function bestTokenScore(query: string, target: string): number {
  const tokens = target.split(/\s+/).filter((token) => token.length >= 2);
  let best = similarity(query, target);

  for (const token of tokens) {
    best = Math.max(best, similarity(query, token));
    if (query.length >= 4 && token.startsWith(query.slice(0, 4))) {
      best = Math.max(best, 0.78);
    }
  }

  return best;
}

function scoreNombre(query: string, producto: Producto): number {
  const q = normalizeSearchText(query);
  if (!q) return 0;

  const nombre = normalizeSearchText(producto.nombre);
  const codigo = normalizeSearchText(producto.codigo_interno ?? "");

  let score = bestTokenScore(q, nombre);
  if (codigo) {
    score = Math.max(score, similarity(q, codigo));
  }

  if (nombre.startsWith(q)) score += 0.08;
  return Math.min(score, 1);
}

function hayCoincidencia(texto: string | null | undefined, terminos: string[]): boolean {
  if (!texto) return false;
  const normal = normalizeSearchText(texto);
  return terminos.some((term) => normal.includes(normalizeSearchText(term)));
}

function scoreNecesidad(query: string, producto: Producto, extraTerms: string[] = []): number {
  const q = normalizeSearchText(query);
  if (!q) return 0;

  const terms = [q, ...extraTerms.map(normalizeSearchText).filter(Boolean)];
  const campos = [
    producto.nombre,
    producto.categoria_nombre,
    producto.indicacion,
    producto.advertencia,
    producto.notas,
    producto.ubicacion_detalle,
  ];

  let score = 0;
  for (const campo of campos) {
    if (!campo) continue;
    const normal = normalizeSearchText(campo);
    for (const term of terms) {
      if (!term) continue;
      if (normal.includes(term)) {
        const peso =
          campo === producto.indicacion || campo === producto.categoria_nombre ? 1 : 0.85;
        score = Math.max(score, peso);
      }
    }
  }

  if (hayCoincidencia(producto.indicacion, terms)) score = Math.max(score, 0.95);
  if (hayCoincidencia(producto.categoria_nombre, terms)) score = Math.max(score, 0.9);
  if (hayCoincidencia(producto.nombre, terms)) score = Math.max(score, 0.75);

  return score;
}

export function rankProductosPorNombre(productos: Producto[], query: string): Producto[] {
  const q = normalizeSearchText(query);
  if (!q) return [];

  return productos
    .map((producto) => ({ producto, score: scoreNombre(q, producto) }))
    .filter((row) => row.score >= FUZZY_MIN_SCORE)
    .sort((a, b) => b.score - a.score || a.producto.nombre.localeCompare(b.producto.nombre, "es"))
    .map((row) => row.producto);
}

export function rankProductosPorNecesidad(
  productos: Producto[],
  query: string,
  extraTerms: string[] = []
): Producto[] {
  const q = normalizeSearchText(query);
  const terms = extraTerms.length > 0 ? extraTerms : [q];
  if (terms.every((term) => !normalizeSearchText(term))) return [];

  return productos
    .map((producto) => ({
      producto,
      score: scoreNecesidad(q || terms[0], producto, extraTerms),
    }))
    .filter((row) => row.score >= 0.55)
    .sort((a, b) => b.score - a.score || a.producto.nombre.localeCompare(b.producto.nombre, "es"))
    .map((row) => row.producto);
}

export function buscarEnCatalogo(
  productos: Producto[],
  query: string,
  mode: SearchMode,
  extraTerms: string[] = []
): Producto[] {
  const limit = 80;
  if (mode === "necesidad") {
    return rankProductosPorNecesidad(productos, query, extraTerms).slice(0, limit);
  }
  return rankProductosPorNombre(productos, query).slice(0, limit);
}

export function terminosDeNecesidad(filtro: NecesidadFiltro): string[] {
  return filtro.terms;
}
