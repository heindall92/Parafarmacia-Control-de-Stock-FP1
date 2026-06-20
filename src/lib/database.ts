import Database from "@tauri-apps/plugin-sql";
import seedData from "./seedData.json";
import {
  buscarEnCatalogo,
  rankProductosPorNombre,
  type SearchMode,
} from "./search";
import type { LocalLayout } from "./localLayout";
import {
  LOCAL_LAYOUT_META_KEY,
  buildDefaultLocalLayout,
  parseLocalLayout,
} from "./localLayout";

export type Categoria = {
  id: number;
  nombre: string;
  color: string;
};

export type EstanteTipo = "normal" | "frio" | "redondo";

export type Estante = {
  id: number;
  nombre: string;
  descripcion: string | null;
  tipo: EstanteTipo;
};

export type Cuadrante = {
  id: number;
  estante_id: number;
  codigo: string;
  fila: number;
  columna: number;
  estante_nombre?: string;
};

export type Producto = {
  id: number;
  codigo_interno: string | null;
  nombre: string;
  categoria_id: number | null;
  estante_id: number | null;
  cuadrante_id: number | null;
  stock: number;
  stock_minimo: number;
  precio: number | null;
  laboratorio: string | null;
  ubicacion_detalle: string | null;
  indicacion: string | null;
  advertencia: string | null;
  imagen: string | null;
  notas: string | null;
  requiere_receta: number;
  activo: number;
  categoria_nombre?: string;
  categoria_color?: string;
  estante_nombre?: string;
  cuadrante_codigo?: string;
};

type SeedProducto = {
  codigo_interno: string;
  nombre: string;
  estante: string;
  categoria: string;
  ubicacion: string | null;
  indicacion: string | null;
  advertencia: string | null;
  imagen: string | null;
  stock: number;
  stock_minimo: number;
  precio: number | null;
  laboratorio: string | null;
  notas: string | null;
};

const SEED_VERSION = "parafarmacia-v4-img";
const EXPECTED_PRODUCTS = seedData.stats.productos;

const PRODUCTO_SELECT = `
  SELECT p.*,
    c.nombre as categoria_nombre,
    c.color as categoria_color,
    e.nombre as estante_nombre,
    q.codigo as cuadrante_codigo
  FROM productos p
  LEFT JOIN categorias c ON c.id = p.categoria_id
  LEFT JOIN estantes e ON e.id = p.estante_id
  LEFT JOIN cuadrantes q ON q.id = p.cuadrante_id
`;

let productSearchCache: Producto[] | null = null;

export function invalidateProductSearchCache() {
  productSearchCache = null;
}

async function getProductosSearchIndex(database: Database): Promise<Producto[]> {
  if (productSearchCache) return productSearchCache;
  productSearchCache = await database.select<Producto[]>(
    `${PRODUCTO_SELECT} WHERE p.activo = 1 ORDER BY p.nombre`
  );
  return productSearchCache;
}

/**
 * Fallback de PREVISUALIZACIÓN para el navegador. El plugin SQL de Tauri solo
 * existe dentro de la app nativa; al abrir el dev server en un navegador no hay
 * base de datos y las vistas no podían renderizarse. Cuando el runtime de Tauri
 * no está presente servimos los datos semilla (read-only) para poder previsualizar
 * la interfaz. En la app empaquetada `__TAURI_INTERNALS__` siempre existe, así que
 * este camino nunca se activa en producción.
 */
function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

let previewProductsCache: Producto[] | null = null;

function getPreviewProducts(): Producto[] {
  if (previewProductsCache) return previewProductsCache;
  const seeds = seedData.productos as unknown as SeedProducto[];
  previewProductsCache = seeds.map((p, index) => ({
    id: index + 1,
    codigo_interno: p.codigo_interno ?? null,
    nombre: p.nombre,
    categoria_id: (p as { categoria_id?: number }).categoria_id ?? null,
    estante_id: null,
    cuadrante_id: null,
    stock: p.stock ?? 0,
    stock_minimo: p.stock_minimo ?? 0,
    precio: p.precio ?? null,
    laboratorio: p.laboratorio ?? null,
    ubicacion_detalle: p.ubicacion ?? null,
    indicacion: p.indicacion ?? null,
    advertencia: p.advertencia ?? null,
    imagen: p.imagen ?? null,
    notas: p.notas ?? null,
    requiere_receta: 0,
    activo: 1,
    categoria_nombre: p.categoria ?? undefined,
    estante_nombre: p.estante ?? undefined,
  }));
  return previewProductsCache;
}

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load("sqlite:farmacia.db");
    await initSchema(db);
  }
  return db;
}

async function initSchema(database: Database) {
  await database.execute(`
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT '#2D6A4F'
    );

    CREATE TABLE IF NOT EXISTS estantes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      descripcion TEXT
    );

    CREATE TABLE IF NOT EXISTS cuadrantes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      estante_id INTEGER NOT NULL,
      codigo TEXT NOT NULL,
      fila INTEGER NOT NULL,
      columna INTEGER NOT NULL,
      FOREIGN KEY (estante_id) REFERENCES estantes(id),
      UNIQUE(estante_id, codigo)
    );

    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo_interno TEXT UNIQUE,
      nombre TEXT NOT NULL,
      categoria_id INTEGER,
      estante_id INTEGER,
      cuadrante_id INTEGER,
      stock INTEGER NOT NULL DEFAULT 0,
      stock_minimo INTEGER NOT NULL DEFAULT 5,
      precio REAL,
      laboratorio TEXT,
      ubicacion_detalle TEXT,
      indicacion TEXT,
      advertencia TEXT,
      imagen TEXT,
      notas TEXT,
      activo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (categoria_id) REFERENCES categorias(id),
      FOREIGN KEY (estante_id) REFERENCES estantes(id),
      FOREIGN KEY (cuadrante_id) REFERENCES cuadrantes(id)
    );
  `);

  await migrateSchema(database);
  await ensureSeed(database);
}

async function migrateSchema(database: Database) {
  const columns = await database.select<{ name: string }[]>(
    "PRAGMA table_info(productos)"
  );
  const names = new Set(columns.map((column) => column.name));
  const addColumn = async (name: string) => {
    if (!names.has(name)) {
      await database.execute(`ALTER TABLE productos ADD COLUMN ${name} TEXT`);
    }
  };
  await addColumn("ubicacion_detalle");
  await addColumn("indicacion");
  await addColumn("advertencia");
  await addColumn("imagen");
  if (!names.has("requiere_receta")) {
    await database.execute(
      "ALTER TABLE productos ADD COLUMN requiere_receta INTEGER NOT NULL DEFAULT 0"
    );
  }

  const estanteColumns = await database.select<{ name: string }[]>(
    "PRAGMA table_info(estantes)"
  );
  const estanteNames = new Set(estanteColumns.map((column) => column.name));
  if (!estanteNames.has("tipo")) {
    await database.execute(
      "ALTER TABLE estantes ADD COLUMN tipo TEXT NOT NULL DEFAULT 'normal'"
    );
  }
}

async function ensureSeed(database: Database) {
  const needsImport = await shouldReimportInventory(database);
  if (!needsImport) return;

  await database.execute("DELETE FROM productos");
  await database.execute("DELETE FROM cuadrantes");
  await database.execute("DELETE FROM estantes");
  await database.execute("DELETE FROM categorias");

  await seedFromExcelData(database);

  await database.execute(
    "INSERT OR REPLACE INTO app_meta (key, value) VALUES ('seed_version', $1)",
    [SEED_VERSION]
  );
}

async function shouldReimportInventory(database: Database): Promise<boolean> {
  const rows = await database.select<{ value: string }[]>(
    "SELECT value FROM app_meta WHERE key = 'seed_version'"
  );
  const storedVersion = rows[0]?.value;

  const countRows = await database.select<{ count: number }[]>(
    "SELECT COUNT(*) as count FROM productos WHERE activo = 1"
  );
  const currentCount = countRows[0]?.count ?? 0;

  if (storedVersion !== SEED_VERSION) return true;
  if (currentCount < EXPECTED_PRODUCTS * 0.9) return true;

  const demoRows = await database.select<{ id: number }[]>(`
    SELECT id FROM productos
    WHERE codigo_interno = 'PF-001'
      AND nombre LIKE '%CeraVe%'
    LIMIT 1
  `);
  if (demoRows.length > 0) return true;

  const demoEstante = await database.select<{ id: number }[]>(`
    SELECT id FROM estantes
    WHERE nombre LIKE 'Estante A — Venta libre%'
    LIMIT 1
  `);
  if (demoEstante.length > 0) return true;

  return false;
}

export async function reimportarInventario(): Promise<number> {
  db = null;
  invalidateProductSearchCache();
  const database = await Database.load("sqlite:farmacia.db");
  await migrateSchema(database);

  await database.execute("DELETE FROM productos");
  await database.execute("DELETE FROM cuadrantes");
  await database.execute("DELETE FROM estantes");
  await database.execute("DELETE FROM categorias");

  await seedFromExcelData(database);

  await database.execute(
    "INSERT OR REPLACE INTO app_meta (key, value) VALUES ('seed_version', $1)",
    [SEED_VERSION]
  );

  db = database;
  const rows = await database.select<{ count: number }[]>(
    "SELECT COUNT(*) as count FROM productos WHERE activo = 1"
  );
  return rows[0]?.count ?? 0;
}

export type NuevoProductoInput = {
  nombre: string;
  codigo_interno?: string | null;
  categoria_id?: number | null;
  estante_id?: number | null;
  ubicacion_detalle?: string | null;
  indicacion?: string | null;
  advertencia?: string | null;
  imagen?: string | null;
  stock?: number;
  stock_minimo?: number;
  precio?: number | null;
  laboratorio?: string | null;
  notas?: string | null;
  requiere_receta?: number;
};

export async function crearProducto(input: NuevoProductoInput): Promise<Producto> {
  const database = await getDb();
  await database.execute(
    `INSERT INTO productos (
      codigo_interno, nombre, categoria_id, estante_id, cuadrante_id,
      stock, stock_minimo, precio, laboratorio, ubicacion_detalle,
      indicacion, advertencia, imagen, notas
    ) VALUES ($1, $2, $3, $4, NULL, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [
      input.codigo_interno ?? null,
      input.nombre.trim(),
      input.categoria_id ?? null,
      input.estante_id ?? null,
      input.stock ?? 0,
      input.stock_minimo ?? 0,
      input.precio ?? null,
      input.laboratorio ?? null,
      input.ubicacion_detalle ?? null,
      input.indicacion ?? null,
      input.advertencia ?? null,
      input.imagen ?? null,
      input.notas ?? null,
    ]
  );

  const rows = await database.select<{ id: number }[]>(
    "SELECT id FROM productos ORDER BY id DESC LIMIT 1"
  );

  const created = rows[0]?.id
    ? await getProductoById(rows[0].id)
    : null;

  if (!created) {
    throw new Error("No se pudo crear el producto.");
  }

  invalidateProductSearchCache();
  return created;
}

export async function getSeedVersion(): Promise<string | null> {
  if (!isTauriRuntime()) return SEED_VERSION;
  const database = await getDb();
  const rows = await database.select<{ value: string }[]>(
    "SELECT value FROM app_meta WHERE key = 'seed_version'"
  );
  return rows[0]?.value ?? null;
}

async function seedFromExcelData(database: Database) {
  const categoriaIds = new Map<string, number>();

  for (const categoria of seedData.categorias) {
    await database.execute(
      "INSERT INTO categorias (nombre, color) VALUES ($1, $2)",
      [categoria.nombre, categoria.color]
    );
    const inserted = await database.select<{ id: number }[]>(
      "SELECT id FROM categorias WHERE nombre = $1",
      [categoria.nombre]
    );
    if (inserted[0]) categoriaIds.set(categoria.nombre, inserted[0].id);
  }

  const estanteIds = new Map<string, number>();

  for (const estante of seedData.estantes) {
    await database.execute(
      "INSERT INTO estantes (nombre, descripcion) VALUES ($1, $2)",
      [estante.nombre, estante.descripcion]
    );
    const inserted = await database.select<{ id: number }[]>(
      "SELECT id FROM estantes WHERE nombre = $1",
      [estante.nombre]
    );
    if (inserted[0]) estanteIds.set(estante.nombre, inserted[0].id);
  }

  for (const producto of seedData.productos as SeedProducto[]) {
    const categoriaId = categoriaIds.get(producto.categoria) ?? null;
    const estanteId = estanteIds.get(producto.estante) ?? null;

    await database.execute(
      `INSERT INTO productos (
        codigo_interno, nombre, categoria_id, estante_id, cuadrante_id,
        stock, stock_minimo, precio, laboratorio, ubicacion_detalle,
        indicacion, advertencia, imagen, notas
      ) VALUES ($1, $2, $3, $4, NULL, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        producto.codigo_interno,
        producto.nombre,
        categoriaId,
        estanteId,
        producto.stock,
        producto.stock_minimo ?? 0,
        producto.precio,
        producto.laboratorio,
        producto.ubicacion,
        producto.indicacion ?? null,
        producto.advertencia ?? null,
        producto.imagen ?? null,
        producto.notas,
      ]
    );
  }
}

export type { SearchMode } from "./search";

export async function initDatabase(): Promise<void> {
  if (!isTauriRuntime()) return;
  await getDb();
}

export async function getProductosCount(): Promise<number> {
  if (!isTauriRuntime()) return getPreviewProducts().length;
  const database = await getDb();
  const rows = await database.select<{ count: number }[]>(
    "SELECT COUNT(*) as count FROM productos WHERE activo = 1"
  );
  return rows[0]?.count ?? 0;
}

export async function getProductosPaginated(
  limit = 50,
  offset = 0,
  query = ""
): Promise<Producto[]> {
  if (!isTauriRuntime()) {
    const all = getPreviewProducts();
    const trimmedPreview = query.trim();
    const source = trimmedPreview ? rankProductosPorNombre(all, trimmedPreview) : all;
    return source.slice(offset, offset + limit);
  }

  const database = await getDb();
  const trimmed = query.trim();

  if (trimmed) {
    const index = await getProductosSearchIndex(database);
    return rankProductosPorNombre(index, trimmed).slice(offset, offset + limit);
  }

  return database.select<Producto[]>(
    `${PRODUCTO_SELECT}
    WHERE p.activo = 1
    ORDER BY p.nombre
    LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
}

export async function getProductos(): Promise<Producto[]> {
  return getProductosPaginated(100, 0);
}

export async function buscarProductos(
  query: string,
  mode: SearchMode = "nombre",
  extraTerms: string[] = []
): Promise<Producto[]> {
  const database = await getDb();
  const trimmed = query.trim();
  if (!trimmed && extraTerms.length === 0) return [];

  const index = await getProductosSearchIndex(database);
  return buscarEnCatalogo(index, trimmed, mode, extraTerms);
}

export async function getProductosStockBajo(): Promise<Producto[]> {
  const database = await getDb();
  return database.select<Producto[]>(`
    SELECT p.*,
      c.nombre as categoria_nombre,
      c.color as categoria_color,
      e.nombre as estante_nombre,
      q.codigo as cuadrante_codigo
    FROM productos p
    LEFT JOIN categorias c ON c.id = p.categoria_id
    LEFT JOIN estantes e ON e.id = p.estante_id
    LEFT JOIN cuadrantes q ON q.id = p.cuadrante_id
    WHERE p.activo = 1
      AND p.stock_minimo > 0
      AND p.stock <= p.stock_minimo
    ORDER BY p.stock ASC
    LIMIT 100
  `);
}

export async function getProductosStockBajoCount(): Promise<number> {
  const database = await getDb();
  const rows = await database.select<{ count: number }[]>(`
    SELECT COUNT(*) as count
    FROM productos
    WHERE activo = 1
      AND stock_minimo > 0
      AND stock <= stock_minimo
  `);
  return rows[0]?.count ?? 0;
}

export async function getCategorias(): Promise<Categoria[]> {
  if (!isTauriRuntime()) {
    return (seedData.categorias as { nombre: string; color: string }[]).map((c, index) => ({
      id: index + 1,
      nombre: c.nombre,
      color: c.color,
    }));
  }
  const database = await getDb();
  return database.select<Categoria[]>("SELECT * FROM categorias ORDER BY nombre");
}

export async function getEstantes(): Promise<Estante[]> {
  const database = await getDb();
  return database.select<Estante[]>(
    "SELECT id, nombre, descripcion, COALESCE(tipo, 'normal') AS tipo FROM estantes ORDER BY nombre"
  );
}

export async function getCuadrantes(estanteId: number): Promise<Cuadrante[]> {
  const database = await getDb();
  return database.select<Cuadrante[]>(
    "SELECT * FROM cuadrantes WHERE estante_id = $1 ORDER BY fila, columna",
    [estanteId]
  );
}

export async function getProductosPorCuadrante(cuadranteId: number): Promise<Producto[]> {
  const database = await getDb();
  return database.select<Producto[]>(
    `
    SELECT p.*, c.nombre as categoria_nombre, c.color as categoria_color
    FROM productos p
    LEFT JOIN categorias c ON c.id = p.categoria_id
    WHERE p.cuadrante_id = $1 AND p.activo = 1
  `,
    [cuadranteId]
  );
}

export async function getProductosPorEstante(estanteId: number): Promise<Producto[]> {
  const database = await getDb();
  return database.select<Producto[]>(
    `
    SELECT p.*,
      c.nombre as categoria_nombre,
      c.color as categoria_color,
      e.nombre as estante_nombre,
      q.codigo as cuadrante_codigo
    FROM productos p
    LEFT JOIN categorias c ON c.id = p.categoria_id
    LEFT JOIN estantes e ON e.id = p.estante_id
    LEFT JOIN cuadrantes q ON q.id = p.cuadrante_id
    WHERE p.estante_id = $1 AND p.activo = 1
    ORDER BY p.ubicacion_detalle, p.nombre
  `,
    [estanteId]
  );
}

export async function getProductoById(id: number): Promise<Producto | null> {
  const database = await getDb();
  const rows = await database.select<Producto[]>(
    `${PRODUCTO_SELECT} WHERE p.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}
export function getSeedStats() {
  return seedData.stats;
}

export async function getCategoriaCounts(): Promise<Record<number, number>> {
  const database = await getDb();
  const rows = await database.select<{ categoria_id: number; count: number }[]>(`
    SELECT categoria_id, COUNT(*) as count
    FROM productos
    WHERE activo = 1 AND categoria_id IS NOT NULL
    GROUP BY categoria_id
  `);
  return Object.fromEntries(rows.map((row) => [row.categoria_id, row.count]));
}

export async function getEstanteCounts(): Promise<Record<number, number>> {
  const database = await getDb();
  const rows = await database.select<{ estante_id: number; count: number }[]>(`
    SELECT estante_id, COUNT(*) as count
    FROM productos
    WHERE activo = 1 AND estante_id IS NOT NULL
    GROUP BY estante_id
  `);
  return Object.fromEntries(rows.map((row) => [row.estante_id, row.count]));
}

export type Vista3DCategoria = {
  categoria_id: number;
  categoria_nombre: string;
  categoria_color: string;
  total_productos: number;
  estantes: Array<{
    estante_id: number;
    estante_nombre: string;
    productos: number;
  }>;
};

export async function getVista3DCategorias(): Promise<Vista3DCategoria[]> {
  const database = await getDb();
  const rows = await database.select<
    Array<{
      categoria_id: number;
      categoria_nombre: string;
      categoria_color: string;
      estante_id: number | null;
      estante_nombre: string | null;
      productos: number;
    }>
  >(`
    SELECT
      c.id AS categoria_id,
      c.nombre AS categoria_nombre,
      c.color AS categoria_color,
      e.id AS estante_id,
      e.nombre AS estante_nombre,
      COUNT(p.id) AS productos
    FROM productos p
    INNER JOIN categorias c ON c.id = p.categoria_id
    LEFT JOIN estantes e ON e.id = p.estante_id
    WHERE p.activo = 1
    GROUP BY c.id, e.id
    ORDER BY c.nombre, e.nombre
  `);

  const map = new Map<number, Vista3DCategoria>();

  for (const row of rows) {
    let entry = map.get(row.categoria_id);
    if (!entry) {
      entry = {
        categoria_id: row.categoria_id,
        categoria_nombre: row.categoria_nombre,
        categoria_color: row.categoria_color,
        total_productos: 0,
        estantes: [],
      };
      map.set(row.categoria_id, entry);
    }

    entry.total_productos += row.productos;
    if (row.estante_id && row.estante_nombre) {
      entry.estantes.push({
        estante_id: row.estante_id,
        estante_nombre: row.estante_nombre,
        productos: row.productos,
      });
    }
  }

  return [...map.values()].sort((a, b) => b.total_productos - a.total_productos);
}

export type Vista3DEstanteModulo = {
  categoria_id: number;
  categoria_nombre: string;
  categoria_color: string;
  productos: number;
};

export type Vista3DEstante = {
  estante_id: number;
  estante_nombre: string;
  total_productos: number;
  modulos: Vista3DEstanteModulo[];
};

/** Layout 3D agrupado por estante físico (pasillo real de la parafarmacia). */
export async function getVista3DEstantes(): Promise<Vista3DEstante[]> {
  const database = await getDb();
  const rows = await database.select<
    Array<{
      estante_id: number;
      estante_nombre: string;
      categoria_id: number | null;
      categoria_nombre: string | null;
      categoria_color: string | null;
      productos: number;
    }>
  >(`
    SELECT
      e.id AS estante_id,
      e.nombre AS estante_nombre,
      c.id AS categoria_id,
      c.nombre AS categoria_nombre,
      c.color AS categoria_color,
      COUNT(p.id) AS productos
    FROM estantes e
    LEFT JOIN productos p ON p.estante_id = e.id AND p.activo = 1
    LEFT JOIN categorias c ON c.id = p.categoria_id
    GROUP BY e.id, c.id
    ORDER BY e.nombre, productos DESC
  `);

  const map = new Map<number, Vista3DEstante>();

  for (const row of rows) {
    let entry = map.get(row.estante_id);
    if (!entry) {
      entry = {
        estante_id: row.estante_id,
        estante_nombre: row.estante_nombre,
        total_productos: 0,
        modulos: [],
      };
      map.set(row.estante_id, entry);
    }

    if (row.categoria_id && row.categoria_nombre && row.categoria_color) {
      entry.total_productos += row.productos;
      entry.modulos.push({
        categoria_id: row.categoria_id,
        categoria_nombre: row.categoria_nombre,
        categoria_color: row.categoria_color,
        productos: row.productos,
      });
    }
  }

  return [...map.values()].sort((a, b) => a.estante_nombre.localeCompare(b.estante_nombre, "es"));
}

export async function getProductosPorCategoria(
  categoriaId: number,
  estanteId?: number
): Promise<Producto[]> {
  const database = await getDb();
  if (estanteId) {
    return database.select<Producto[]>(
      `${PRODUCTO_SELECT}
      WHERE p.activo = 1 AND p.categoria_id = $1 AND p.estante_id = $2
      ORDER BY p.nombre
      LIMIT 120`,
      [categoriaId, estanteId]
    );
  }

  return database.select<Producto[]>(
    `${PRODUCTO_SELECT}
    WHERE p.activo = 1 AND p.categoria_id = $1
    ORDER BY p.estante_id, p.nombre
    LIMIT 120`,
    [categoriaId]
  );
}

export async function crearCategoria(nombre: string, color: string): Promise<Categoria> {
  const database = await getDb();
  await database.execute("INSERT INTO categorias (nombre, color) VALUES ($1, $2)", [
    nombre.trim(),
    color,
  ]);
  const rows = await database.select<Categoria[]>(
    "SELECT * FROM categorias WHERE nombre = $1",
    [nombre.trim()]
  );
  if (!rows[0]) throw new Error("No se pudo crear la categoría.");
  return rows[0];
}

export async function actualizarCategoria(
  id: number,
  nombre: string,
  color: string
): Promise<Categoria> {
  const database = await getDb();
  await database.execute("UPDATE categorias SET nombre = $1, color = $2 WHERE id = $3", [
    nombre.trim(),
    color,
    id,
  ]);
  const rows = await database.select<Categoria[]>("SELECT * FROM categorias WHERE id = $1", [id]);
  if (!rows[0]) throw new Error("Categoría no encontrada.");
  return rows[0];
}

export async function eliminarCategoria(id: number): Promise<void> {
  const database = await getDb();
  await database.execute("UPDATE productos SET categoria_id = NULL WHERE categoria_id = $1", [id]);
  await database.execute("DELETE FROM categorias WHERE id = $1", [id]);
}

export async function crearEstante(
  nombre: string,
  descripcion?: string | null,
  tipo: EstanteTipo = "normal"
): Promise<Estante> {
  const database = await getDb();
  await database.execute(
    "INSERT INTO estantes (nombre, descripcion, tipo) VALUES ($1, $2, $3)",
    [nombre.trim(), descripcion?.trim() || null, tipo]
  );
  const rows = await database.select<Estante[]>(
    "SELECT id, nombre, descripcion, COALESCE(tipo, 'normal') AS tipo FROM estantes WHERE nombre = $1",
    [nombre.trim()]
  );
  if (!rows[0]) throw new Error("No se pudo crear el estante.");
  return rows[0];
}

export async function crearFrio(nombre: string, descripcion?: string | null): Promise<Estante> {
  return crearEstante(nombre, descripcion, "frio");
}

export async function crearEstanteRedondo(
  nombre: string,
  descripcion?: string | null
): Promise<Estante> {
  return crearEstante(nombre, descripcion, "redondo");
}

export async function actualizarEstante(
  id: number,
  nombre: string,
  descripcion?: string | null
): Promise<Estante> {
  const database = await getDb();
  await database.execute("UPDATE estantes SET nombre = $1, descripcion = $2 WHERE id = $3", [
    nombre.trim(),
    descripcion?.trim() || null,
    id,
  ]);
  const rows = await database.select<Estante[]>("SELECT * FROM estantes WHERE id = $1", [id]);
  if (!rows[0]) throw new Error("Estante no encontrado.");
  return rows[0];
}

export async function eliminarEstante(id: number): Promise<void> {
  const database = await getDb();
  await database.execute("UPDATE productos SET estante_id = NULL WHERE estante_id = $1", [id]);
  await database.execute("DELETE FROM cuadrantes WHERE estante_id = $1", [id]);
  await database.execute("DELETE FROM estantes WHERE id = $1", [id]);
}

export type ActualizarProductoInput = NuevoProductoInput;

export async function actualizarProducto(
  id: number,
  input: ActualizarProductoInput
): Promise<Producto> {
  const database = await getDb();

  const fields: Array<{ column: string; value: unknown }> = [];
  const setIf = (key: keyof ActualizarProductoInput, column: string, value: unknown) => {
    if (key in input) fields.push({ column, value });
  };

  if ("nombre" in input) {
    fields.push({ column: "nombre", value: input.nombre.trim() });
  }
  setIf("codigo_interno", "codigo_interno", input.codigo_interno ?? null);
  setIf("categoria_id", "categoria_id", input.categoria_id ?? null);
  setIf("estante_id", "estante_id", input.estante_id ?? null);
  setIf("stock", "stock", input.stock ?? 0);
  setIf("stock_minimo", "stock_minimo", input.stock_minimo ?? 0);
  setIf("precio", "precio", input.precio ?? null);
  setIf("laboratorio", "laboratorio", input.laboratorio ?? null);
  setIf("ubicacion_detalle", "ubicacion_detalle", input.ubicacion_detalle ?? null);
  setIf("indicacion", "indicacion", input.indicacion ?? null);
  setIf("advertencia", "advertencia", input.advertencia ?? null);
  setIf("imagen", "imagen", input.imagen ?? null);
  setIf("notas", "notas", input.notas ?? null);
  setIf("requiere_receta", "requiere_receta", input.requiere_receta ? 1 : 0);

  if (fields.length > 0) {
    const setClause = fields
      .map((field, index) => `${field.column} = $${index + 1}`)
      .join(", ");
    const params = [...fields.map((field) => field.value), id];
    await database.execute(
      `UPDATE productos SET ${setClause} WHERE id = $${fields.length + 1} AND activo = 1`,
      params
    );
  }

  const updated = await getProductoById(id);
  if (!updated) throw new Error("No se pudo actualizar el producto.");
  invalidateProductSearchCache();
  return updated;
}

export async function eliminarProducto(id: number): Promise<void> {
  const database = await getDb();
  await database.execute("UPDATE productos SET activo = 0 WHERE id = $1", [id]);
  invalidateProductSearchCache();
}

export type BackupData = {
  formato: string;
  version: string;
  exportado: string;
  categorias: Record<string, unknown>[];
  estantes: Record<string, unknown>[];
  cuadrantes: Record<string, unknown>[];
  productos: Record<string, unknown>[];
  localLayout?: LocalLayout | null;
};

export async function getLocalLayout(): Promise<LocalLayout | null> {
  const database = await getDb();
  const rows = await database.select<{ value: string }[]>(
    "SELECT value FROM app_meta WHERE key = $1",
    [LOCAL_LAYOUT_META_KEY]
  );
  return parseLocalLayout(rows[0]?.value);
}

export async function saveLocalLayout(layout: LocalLayout): Promise<LocalLayout> {
  const database = await getDb();
  const payload: LocalLayout = { ...layout, updatedAt: new Date().toISOString() };
  await database.execute(
    "INSERT OR REPLACE INTO app_meta (key, value) VALUES ($1, $2)",
    [LOCAL_LAYOUT_META_KEY, JSON.stringify(payload)]
  );
  return payload;
}

export async function ensureLocalLayout(): Promise<LocalLayout> {
  const existing = await getLocalLayout();
  if (existing) return existing;
  const estantes = await getEstantes();
  const layout = buildDefaultLocalLayout(estantes);
  return saveLocalLayout(layout);
}

export async function resetLocalLayout(): Promise<LocalLayout> {
  const estantes = await getEstantes();
  const layout = buildDefaultLocalLayout(estantes);
  return saveLocalLayout(layout);
}

const BACKUP_FORMAT = "parafarmacia-backup";

export async function exportarDatos(): Promise<BackupData> {
  const database = await getDb();
  const [categorias, estantes, cuadrantes, productos, localLayout] = await Promise.all([
    database.select<Record<string, unknown>[]>("SELECT * FROM categorias"),
    database.select<Record<string, unknown>[]>("SELECT * FROM estantes"),
    database.select<Record<string, unknown>[]>("SELECT * FROM cuadrantes"),
    database.select<Record<string, unknown>[]>("SELECT * FROM productos"),
    getLocalLayout(),
  ]);

  return {
    formato: BACKUP_FORMAT,
    version: SEED_VERSION,
    exportado: new Date().toISOString(),
    categorias,
    estantes,
    cuadrantes,
    productos,
    localLayout,
  };
}

function buildInsert(table: string, row: Record<string, unknown>) {
  const columns = Object.keys(row);
  const placeholders = columns.map((_, index) => `$${index + 1}`);
  const values = columns.map((column) => row[column] ?? null);
  return {
    sql: `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`,
    values,
  };
}

export async function importarDatos(data: BackupData): Promise<number> {
  if (!data || data.formato !== BACKUP_FORMAT || !Array.isArray(data.productos)) {
    throw new Error("El archivo no es una copia de seguridad válida de Parafarmacia.");
  }

  const database = await getDb();

  await database.execute("DELETE FROM productos");
  await database.execute("DELETE FROM cuadrantes");
  await database.execute("DELETE FROM estantes");
  await database.execute("DELETE FROM categorias");

  for (const row of data.categorias ?? []) {
    const { sql, values } = buildInsert("categorias", row);
    await database.execute(sql, values);
  }
  for (const row of data.estantes ?? []) {
    const { sql, values } = buildInsert("estantes", row);
    await database.execute(sql, values);
  }
  for (const row of data.cuadrantes ?? []) {
    const { sql, values } = buildInsert("cuadrantes", row);
    await database.execute(sql, values);
  }
  for (const row of data.productos ?? []) {
    const { sql, values } = buildInsert("productos", row);
    await database.execute(sql, values);
  }

  await database.execute(
    "INSERT OR REPLACE INTO app_meta (key, value) VALUES ('seed_version', $1)",
    [SEED_VERSION]
  );

  if (data.localLayout) {
    await saveLocalLayout(data.localLayout);
  }

  invalidateProductSearchCache();

  const rows = await database.select<{ count: number }[]>(
    "SELECT COUNT(*) as count FROM productos WHERE activo = 1"
  );
  return rows[0]?.count ?? 0;
}
