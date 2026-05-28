import Database from "@tauri-apps/plugin-sql";
import seedData from "./seedData.json";

export type Categoria = {
  id: number;
  nombre: string;
  color: string;
};

export type Estante = {
  id: number;
  nombre: string;
  descripcion: string | null;
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
  notas: string | null;
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
  stock: number;
  stock_minimo: number;
  precio: number | null;
  laboratorio: string | null;
  notas: string | null;
};

const SEED_VERSION = "parafarmacia-v3";
const EXPECTED_PRODUCTS = seedData.stats.productos;

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
  const hasUbicacion = columns.some((column) => column.name === "ubicacion_detalle");
  if (!hasUbicacion) {
    await database.execute("ALTER TABLE productos ADD COLUMN ubicacion_detalle TEXT");
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
  stock?: number;
  stock_minimo?: number;
  precio?: number | null;
  laboratorio?: string | null;
  notas?: string | null;
};

export async function crearProducto(input: NuevoProductoInput): Promise<Producto> {
  const database = await getDb();
  await database.execute(
    `INSERT INTO productos (
      codigo_interno, nombre, categoria_id, estante_id, cuadrante_id,
      stock, stock_minimo, precio, laboratorio, ubicacion_detalle, notas
    ) VALUES ($1, $2, $3, $4, NULL, $5, $6, $7, $8, $9, $10)`,
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

  return created;
}

export async function getSeedVersion(): Promise<string | null> {
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
        stock, stock_minimo, precio, laboratorio, ubicacion_detalle, notas
      ) VALUES ($1, $2, $3, $4, NULL, $5, $6, $7, $8, $9, $10)`,
      [
        producto.codigo_interno,
        producto.nombre,
        categoriaId,
        estanteId,
        producto.stock,
        0,
        producto.precio,
        producto.laboratorio,
        producto.ubicacion,
        producto.notas,
      ]
    );
  }
}

export async function initDatabase(): Promise<void> {
  await getDb();
}

export async function getProductosCount(): Promise<number> {
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
  const database = await getDb();
  const trimmed = query.trim();

  if (trimmed) {
    const term = `%${trimmed}%`;
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
      WHERE p.activo = 1 AND (
        p.nombre LIKE $1 OR
        p.codigo_interno LIKE $1 OR
        p.laboratorio LIKE $1 OR
        p.ubicacion_detalle LIKE $1 OR
        p.notas LIKE $1 OR
        c.nombre LIKE $1 OR
        e.nombre LIKE $1
      )
      ORDER BY p.nombre
      LIMIT $2 OFFSET $3
    `,
      [term, limit, offset]
    );
  }

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
    WHERE p.activo = 1
    ORDER BY p.nombre
    LIMIT $1 OFFSET $2
  `,
    [limit, offset]
  );
}

export async function getProductos(): Promise<Producto[]> {
  return getProductosPaginated(100, 0);
}

export async function buscarProductos(query: string): Promise<Producto[]> {
  const database = await getDb();
  const term = `%${query.trim()}%`;
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
    WHERE p.activo = 1 AND (
      p.nombre LIKE $1 OR
      p.codigo_interno LIKE $1 OR
      p.laboratorio LIKE $1 OR
      p.ubicacion_detalle LIKE $1 OR
      p.notas LIKE $1 OR
      c.nombre LIKE $1 OR
      e.nombre LIKE $1 OR
      q.codigo LIKE $1
    )
    ORDER BY p.nombre
    LIMIT 80
  `,
    [term]
  );
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
  const database = await getDb();
  return database.select<Categoria[]>("SELECT * FROM categorias ORDER BY nombre");
}

export async function getEstantes(): Promise<Estante[]> {
  const database = await getDb();
  return database.select<Estante[]>("SELECT * FROM estantes ORDER BY nombre");
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
    WHERE p.id = $1
  `,
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

export async function crearEstante(nombre: string, descripcion?: string | null): Promise<Estante> {
  const database = await getDb();
  await database.execute("INSERT INTO estantes (nombre, descripcion) VALUES ($1, $2)", [
    nombre.trim(),
    descripcion?.trim() || null,
  ]);
  const rows = await database.select<Estante[]>("SELECT * FROM estantes WHERE nombre = $1", [
    nombre.trim(),
  ]);
  if (!rows[0]) throw new Error("No se pudo crear el estante.");
  return rows[0];
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
  await database.execute(
    `UPDATE productos SET
      codigo_interno = $1,
      nombre = $2,
      categoria_id = $3,
      estante_id = $4,
      stock = $5,
      stock_minimo = $6,
      precio = $7,
      laboratorio = $8,
      ubicacion_detalle = $9,
      notas = $10
    WHERE id = $11 AND activo = 1`,
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
      input.notas ?? null,
      id,
    ]
  );

  const updated = await getProductoById(id);
  if (!updated) throw new Error("No se pudo actualizar el producto.");
  return updated;
}

export async function eliminarProducto(id: number): Promise<void> {
  const database = await getDb();
  await database.execute("UPDATE productos SET activo = 0 WHERE id = $1", [id]);
}
