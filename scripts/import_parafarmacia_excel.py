"""Importa parafarmacia v1.xlsx y genera seedData.json para la app."""

from __future__ import annotations

import json
import re
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
EXCEL_CANDIDATES = [
    ROOT.parent / "parafarmacia v1.xlsx",
    Path(r"g:\parafarmacia v1.xlsx"),
]
OUTPUT = ROOT / "src" / "lib" / "seedData.json"

HEADER_NAMES = {
    "medicamento / producto",
    "nombre del producto",
    "ubicación en el estante",
    "ubicacion en el estante",
    "ubicación en estante",
    "ubicacion en estante",
    "indicación principal",
    "indicacion principal",
    "advertencia / contraindicación clave",
    "advertencia / restricción importante",
}

CATEGORY_COLORS = [
    "#2D6A4F",
    "#40916C",
    "#52B788",
    "#1B4332",
    "#74C69D",
    "#95D5B2",
    "#344E41",
    "#52796F",
]


def find_excel() -> Path:
    for candidate in EXCEL_CANDIDATES:
        if candidate.exists():
            return candidate
    raise FileNotFoundError("No se encontró parafarmacia v1.xlsx")


def normalize(value) -> str | None:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    text = str(value).strip()
    return text or None


def is_header(name: str | None) -> bool:
    if not name:
        return True
    return name.lower() in HEADER_NAMES


def parse_sheet(sheet_name: str, df: pd.DataFrame) -> tuple[list[dict], set[str]]:
    products: list[dict] = []
    blocks: set[str] = set()
    current_block: str | None = None

    for _, row in df.iterrows():
        vals = [normalize(v) for v in row.tolist()]

        for value in vals:
            if value and value.lower().startswith("bloque:"):
                current_block = value.split(":", 1)[1].strip()
                blocks.add(current_block)

        if len(vals) <= 17:
            continue

        name, ubicacion, indicacion, advertencia = vals[14], vals[15], vals[16], vals[17]
        if is_header(name) or not name:
            continue
        if not ubicacion and not indicacion:
            continue

        products.append(
            {
                "estante": sheet_name,
                "bloque": current_block,
                "nombre": name,
                "ubicacion": ubicacion,
                "indicacion": indicacion,
                "advertencia": advertencia,
            }
        )

    return products, blocks


def slugify(text: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", text.lower()).strip("-")
    return cleaned[:48] or "producto"


def build_seed(product_rows: list[dict], estante_names: list[str], blocks: set[str]) -> dict:
    block_list = sorted(blocks)
    categorias = [
        {"nombre": block, "color": CATEGORY_COLORS[i % len(CATEGORY_COLORS)]}
        for i, block in enumerate(block_list)
    ]
    categoria_index = {name: idx + 1 for idx, name in enumerate(block_list)}

    estantes = [{"nombre": name, "descripcion": f"Inventario real — {name}"} for name in estante_names]

    productos = []
    seen_codes: set[str] = set()

    for idx, row in enumerate(product_rows, start=1):
        code_base = f"PF-{idx:04d}"
        code = code_base
        suffix = 1
        while code in seen_codes:
            suffix += 1
            code = f"{code_base}-{suffix}"
        seen_codes.add(code)

        notas_parts = []
        if row.get("ubicacion"):
            notas_parts.append(f"Ubicación: {row['ubicacion']}")
        if row.get("indicacion"):
            notas_parts.append(f"Indicación: {row['indicacion']}")
        if row.get("advertencia"):
            notas_parts.append(f"Advertencia: {row['advertencia']}")

        bloque = row.get("bloque")
        productos.append(
            {
                "codigo_interno": code,
                "nombre": row["nombre"],
                "estante": row["estante"],
                "categoria": bloque or "General",
                "categoria_id": categoria_index.get(bloque or "", None),
                "ubicacion": row.get("ubicacion"),
                "stock": 0,
                "stock_minimo": 3,
                "precio": None,
                "laboratorio": None,
                "notas": " | ".join(notas_parts) if notas_parts else None,
            }
        )

    # Asegurar categoría General si hay productos sin bloque
    if any(p["categoria"] == "General" for p in productos) and "General" not in categoria_index:
        categorias.insert(0, {"nombre": "General", "color": "#2D6A4F"})
        categoria_index["General"] = 1
        for cat in categorias[1:]:
            pass
        # Reindex categorias cleanly
        categorias = [{"nombre": "General", "color": "#2D6A4F"}] + [
            c for c in categorias if c["nombre"] != "General"
        ]
        categoria_index = {c["nombre"]: i + 1 for i, c in enumerate(categorias)}
        for producto in productos:
            producto["categoria_id"] = categoria_index.get(producto["categoria"], 1)

    return {
        "source": "parafarmacia v1.xlsx",
        "estantes": estantes,
        "categorias": categorias,
        "productos": productos,
        "stats": {
            "estantes": len(estantes),
            "categorias": len(categorias),
            "productos": len(productos),
        },
    }


def main() -> None:
    excel_path = find_excel()
    xl = pd.ExcelFile(excel_path)

    all_products: list[dict] = []
    all_blocks: set[str] = set()
    estante_names = xl.sheet_names

    for sheet in estante_names:
        df = pd.read_excel(excel_path, sheet_name=sheet, header=None)
        products, blocks = parse_sheet(sheet, df)
        all_products.extend(products)
        all_blocks.update(blocks)

    seed = build_seed(all_products, estante_names, all_blocks)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(seed, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Excel: {excel_path}")
    print(f"Generado: {OUTPUT}")
    print(f"Productos: {seed['stats']['productos']}")
    print(f"Categorías: {seed['stats']['categorias']}")
    print(f"Estantes: {seed['stats']['estantes']}")


if __name__ == "__main__":
    main()
