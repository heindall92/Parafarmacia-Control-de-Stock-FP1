"""Importa parafarmacia v1.xlsx y genera seedData.json + fotos por estante.

Además del catálogo (productos, estantes, bloques), extrae las fotos que el
Excel tiene ancladas a filas de cada hoja y asocia a cada medicamento la foto
del bloque donde aparece. Las imágenes se redimensionan y se guardan en
`public/estantes/` para servirlas desde la app (offline).
"""

from __future__ import annotations

import io
import json
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

import pandas as pd
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
EXCEL_CANDIDATES = [
    ROOT.parent / "parafarmacia v1.xlsx",
    Path(r"g:\parafarmacia v1.xlsx"),
]
OUTPUT = ROOT / "src" / "lib" / "seedData.json"
IMG_DIR = ROOT / "public" / "estantes"
IMG_PUBLIC_PREFIX = "estantes"
MAX_IMG_SIZE = 1100  # px (lado mayor)
JPEG_QUALITY = 80

NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "pkgr": "http://schemas.openxmlformats.org/package/2006/relationships",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "xdr": "http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
}

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


# --------------------------------------------------------------------------
# Relaciones del paquete xlsx: hoja -> drawing -> imágenes ancladas a filas
# --------------------------------------------------------------------------

def _read_rels(zf: zipfile.ZipFile, rels_path: str) -> dict[str, str]:
    if rels_path not in zf.namelist():
        return {}
    root = ET.fromstring(zf.read(rels_path))
    out: dict[str, str] = {}
    for rel in root.findall("pkgr:Relationship", NS):
        out[rel.attrib["Id"]] = rel.attrib["Target"]
    return out


def _resolve(base_dir: str, target: str) -> str:
    parts = (base_dir + "/" + target).split("/")
    stack: list[str] = []
    for part in parts:
        if part in ("", "."):
            continue
        if part == "..":
            if stack:
                stack.pop()
        else:
            stack.append(part)
    return "/".join(stack)


def build_sheet_image_map(zf: zipfile.ZipFile) -> dict[str, list[dict]]:
    """Devuelve {nombre_hoja: [{from_row, to_row, media}]}"""
    workbook = ET.fromstring(zf.read("xl/workbook.xml"))
    wb_rels = _read_rels(zf, "xl/_rels/workbook.xml.rels")

    sheet_to_target: dict[str, str] = {}
    for sheet in workbook.find("main:sheets", NS).findall("main:sheet", NS):
        name = sheet.attrib["name"]
        rid = sheet.attrib[f"{{{NS['r']}}}id"]
        target = wb_rels.get(rid)
        if target:
            sheet_to_target[name] = _resolve("xl", target)

    result: dict[str, list[dict]] = {}
    for name, sheet_path in sheet_to_target.items():
        sheet_dir = sheet_path.rsplit("/", 1)[0]
        sheet_file = sheet_path.rsplit("/", 1)[1]
        sheet_rels = _read_rels(zf, f"{sheet_dir}/_rels/{sheet_file}.rels")

        drawing_target = next(
            (t for t in sheet_rels.values() if "drawings/drawing" in t), None
        )
        if not drawing_target:
            result[name] = []
            continue

        drawing_path = _resolve(sheet_dir, drawing_target)
        drawing_dir = drawing_path.rsplit("/", 1)[0]
        drawing_file = drawing_path.rsplit("/", 1)[1]
        drawing_rels = _read_rels(zf, f"{drawing_dir}/_rels/{drawing_file}.rels")

        drawing = ET.fromstring(zf.read(drawing_path))
        anchors: list[dict] = []

        for anchor in list(drawing):
            tag = anchor.tag.split("}")[-1]
            frm = anchor.find("xdr:from", NS)
            if frm is None:
                continue
            from_row = int(frm.find("xdr:row", NS).text)

            to_node = anchor.find("xdr:to", NS)
            to_row = (
                int(to_node.find("xdr:row", NS).text)
                if to_node is not None
                else from_row
            )

            blip = anchor.find(".//a:blip", NS)
            if blip is None:
                continue
            embed = blip.attrib.get(f"{{{NS['r']}}}embed")
            target = drawing_rels.get(embed)
            if not target:
                continue
            media = _resolve(drawing_dir, target)
            anchors.append({"from_row": from_row, "to_row": to_row, "media": media})

        anchors.sort(key=lambda a: a["from_row"])
        result[name] = anchors

    return result


def pick_image(anchors: list[dict], row: int) -> str | None:
    if not anchors:
        return None

    def distance(anchor: dict) -> int:
        if anchor["from_row"] <= row <= anchor["to_row"]:
            return 0
        return min(abs(anchor["from_row"] - row), abs(anchor["to_row"] - row))

    best = min(anchors, key=distance)
    return best["media"]


def export_image(zf: zipfile.ZipFile, media: str, stem: str) -> str:
    """Redimensiona y guarda la imagen; devuelve la ruta pública relativa."""
    out_name = f"{stem}.jpg"
    out_path = IMG_DIR / out_name
    public_ref = f"{IMG_PUBLIC_PREFIX}/{out_name}"
    if out_path.exists():
        return public_ref

    data = zf.read(media)
    img = Image.open(io.BytesIO(data))
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")
    img.thumbnail((MAX_IMG_SIZE, MAX_IMG_SIZE), Image.LANCZOS)
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    img.save(out_path, "JPEG", quality=JPEG_QUALITY, optimize=True)
    return public_ref


# --------------------------------------------------------------------------
# Parseo de hojas
# --------------------------------------------------------------------------

def parse_sheet(sheet_name: str, df: pd.DataFrame) -> tuple[list[dict], set[str]]:
    products: list[dict] = []
    blocks: set[str] = set()
    current_block: str | None = None

    for excel_row, row in df.iterrows():
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
                "fila": int(excel_row),
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
                "indicacion": row.get("indicacion"),
                "advertencia": row.get("advertencia"),
                "imagen": row.get("imagen"),
                "stock": 0,
                "stock_minimo": 3,
                "precio": None,
                "laboratorio": None,
                "notas": " | ".join(notas_parts) if notas_parts else None,
            }
        )

    if any(p["categoria"] == "General" for p in productos) and "General" not in categoria_index:
        categorias = [{"nombre": "General", "color": "#2D6A4F"}] + [
            c for c in categorias if c["nombre"] != "General"
        ]
        categoria_index = {c["nombre"]: i + 1 for i, c in enumerate(categorias)}
        for producto in productos:
            producto["categoria_id"] = categoria_index.get(producto["categoria"], 1)

    con_imagen = sum(1 for p in productos if p.get("imagen"))
    return {
        "source": "parafarmacia v1.xlsx",
        "estantes": estantes,
        "categorias": categorias,
        "productos": productos,
        "stats": {
            "estantes": len(estantes),
            "categorias": len(categorias),
            "productos": len(productos),
            "con_imagen": con_imagen,
        },
    }


def main() -> None:
    excel_path = find_excel()
    xl = pd.ExcelFile(excel_path)
    estante_names = xl.sheet_names

    with zipfile.ZipFile(excel_path) as zf:
        sheet_images = build_sheet_image_map(zf)

        all_products: list[dict] = []
        all_blocks: set[str] = set()
        media_cache: dict[str, str] = {}

        for sheet in estante_names:
            df = pd.read_excel(excel_path, sheet_name=sheet, header=None)
            products, blocks = parse_sheet(sheet, df)
            anchors = sheet_images.get(sheet, [])

            for product in products:
                media = pick_image(anchors, product["fila"])
                if media:
                    if media not in media_cache:
                        stem = Path(media).stem
                        media_cache[media] = export_image(zf, media, stem)
                    product["imagen"] = media_cache[media]

            all_products.extend(products)
            all_blocks.update(blocks)

    seed = build_seed(all_products, estante_names, all_blocks)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(seed, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Excel: {excel_path}")
    print(f"Generado: {OUTPUT}")
    print(f"Imágenes en: {IMG_DIR} ({len(media_cache)} fotos únicas)")
    print(f"Productos: {seed['stats']['productos']}")
    print(f"Con imagen: {seed['stats']['con_imagen']}")
    print(f"Categorías: {seed['stats']['categorias']}")
    print(f"Estantes: {seed['stats']['estantes']}")


if __name__ == "__main__":
    main()
