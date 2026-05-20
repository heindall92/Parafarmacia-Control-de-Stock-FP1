import Database from "@tauri-apps/plugin-sql";

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
  notas: string | null;
  activo: number;
  categoria_nombre?: string;
  categoria_color?: string;
  estante_nombre?: string;
  cuadrante_codigo?: string;
};

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
      notas TEXT,
      activo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (categoria_id) REFERENCES categorias(id),
      FOREIGN KEY (estante_id) REFERENCES estantes(id),
      FOREIGN KEY (cuadrante_id) REFERENCES cuadrantes(id)
    );
  `);

  const count = await database.select<{ count: number }[]>(
    "SELECT COUNT(*) as count FROM categorias"
  );

  if (count[0]?.count === 0) {
    await seedDemo(database);
  }
}

async function seedDemo(database: Database) {
  const categorias = [
    ["Dermocosmética", "#2D6A4F"],
    ["Higiene", "#40916C"],
    ["Vitaminas", "#52B788"],
    ["Primeros auxilios", "#1B4332"],
    ["Infantil", "#74C69D"],
  ] as const;

  for (const [nombre, color] of categorias) {
    await database.execute(
      "INSERT INTO categorias (nombre, color) VALUES ($1, $2)",
      [nombre, color]
    );
  }

  const estantes = [
    ["Estante A — Venta libre", "Productos de mostrador frontal"],
    ["Estante B — Dermocosmética", "Cremas y protección solar"],
    ["Estante C — Suplementos", "Vitaminas y minerales"],
  ] as const;

  for (const [nombre, descripcion] of estantes) {
    await database.execute(
      "INSERT INTO estantes (nombre, descripcion) VALUES ($1, $2)",
      [nombre, descripcion]
    );
  }

  for (let estanteId = 1; estanteId <= 3; estanteId++) {
    for (let fila = 1; fila <= 4; fila++) {
      for (let col = 1; col <= 6; col++) {
        const letra = String.fromCharCode(64 + fila);
        await database.execute(
          "INSERT INTO cuadrantes (estante_id, codigo, fila, columna) VALUES ($1, $2, $3, $4)",
          [estanteId, `${letra}${col}`, fila, col]
        );
      }
    }
  }

  const productosFixed = [
    ["PF-001", "Crema hidratante CeraVe 454ml", 1, 2, 8, 12, 5, 14.95, "CeraVe"],
    ["PF-002", "Protector solar ISDIN SPF50+", 1, 2, 14, 8, 3, 22.5, "ISDIN"],
    ["PF-003", "Vitamina D3 2000 UI", 3, 3, 45, 20, 8, 9.99, "Arkopharma"],
    ["PF-004", "Gel de manos antiséptico 500ml", 2, 1, 3, 15, 5, 4.5, "Sanytol"],
    ["PF-005", "Paracetamol infantil jarabe", 5, 1, 6, 6, 4, 6.75, "Kern Pharma"],
    ["PF-006", "Apósitos adhesivos surtidos", 4, 1, 18, 24, 10, 3.25, "Hansaplast"],
    ["PF-007", "Champú anticaspa Head&Shoulders", 2, 2, 5, 10, 4, 5.49, "P&G"],
    ["PF-008", "Omega 3 1000mg 60 cápsulas", 3, 3, 22, 14, 6, 12.9, "Solgar"],
  ] as const;

  for (const [codigo, nombre, catId, estId, cuadId, stock, min, precio, lab] of productosFixed) {
    await database.execute(
      `INSERT INTO productos (codigo_interno, nombre, categoria_id, estante_id, cuadrante_id, stock, stock_minimo, precio, laboratorio)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [codigo, nombre, catId, estId, cuadId, stock, min, precio, lab]
    );
  }
}

export async function getProductos(): Promise<Producto[]> {
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
    ORDER BY p.nombre
  `);
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
      c.nombre LIKE $1 OR
      q.codigo LIKE $1
    )
    ORDER BY p.nombre
    LIMIT 50
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
    WHERE p.activo = 1 AND p.stock <= p.stock_minimo
    ORDER BY p.stock ASC
  `);
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
