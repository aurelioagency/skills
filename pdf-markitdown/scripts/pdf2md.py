#!/usr/bin/env python3
"""
Convierte un PDF a Markdown con markitdown y reporta cuantos tokens se ahorraron
frente a leer el PDF directo (cada pagina entra como imagen).

Uso:
    python pdf2md.py <archivo.pdf> [--out salida.md]

Salida:
    - Escribe el .md
    - Imprime el informe de tokens
    - Exit 0 = ok | 3 = PDF sin capa de texto (escaneado) | 1 = error
"""

import argparse
import os
import sys
import tempfile

# --- Constantes del calculo -------------------------------------------------
# Anthropic: tokens de una imagen ~= (ancho * alto) / 750
PX_POR_TOKEN = 750
# El lado largo de una imagen se capea en 1568 px antes de tokenizar
LADO_MAX = 1568
# Render asumido de una pagina PDF antes del capeo
DPI_RENDER = 150
# Estimador de texto -> tokens. ~3.8 chars/token para mezcla espanol/ingles.
CHARS_POR_TOKEN = 3.8

EXIT_OK = 0
EXIT_ERROR = 1
EXIT_SIN_TEXTO = 3


def paginas_del_pdf(path):
    """Devuelve [(ancho_pt, alto_pt), ...] de cada pagina."""
    from pdfminer.pdfpage import PDFPage

    cajas = []
    with open(path, "rb") as f:
        for page in PDFPage.get_pages(f):
            x0, y0, x1, y1 = page.mediabox
            cajas.append((abs(x1 - x0), abs(y1 - y0)))
    return cajas


def tokens_de_pagina(ancho_pt, alto_pt):
    """Tokens que cuesta una pagina renderizada como imagen."""
    if ancho_pt <= 0 or alto_pt <= 0:
        return 0.0
    escala = DPI_RENDER / 72.0
    w = ancho_pt * escala
    h = alto_pt * escala
    largo = max(w, h)
    if largo > LADO_MAX:
        factor = LADO_MAX / largo
        w *= factor
        h *= factor
    return (w * h) / PX_POR_TOKEN


def tokens_de_texto(texto):
    return len(texto) / CHARS_POR_TOKEN


def convertir(path):
    """Devuelve el markdown extraido por markitdown."""
    try:
        from markitdown import MarkItDown
    except ImportError:
        sys.stderr.write(
            "markitdown no esta instalado.\n"
            'Instalalo con:  python -m pip install "markitdown[all]"\n'
        )
        sys.exit(EXIT_ERROR)

    resultado = MarkItDown().convert(path)
    return getattr(resultado, "text_content", None) or getattr(resultado, "markdown", "") or ""


def extraer(path):
    """
    Saca el texto del PDF por el mejor camino disponible.

    Devuelve (texto, origen, detalle):
        origen 'markitdown' -> el PDF tenia capa de texto
        origen 'ocr'        -> escaneado, pero el OCR salio confiable
        origen None         -> no hay texto usable, hay que leer la pagina
    """
    texto = convertir(path)
    if texto.strip():
        return texto, "markitdown", ""

    try:
        import ocr
    except ImportError:
        return "", None, "el modulo de OCR no esta disponible"

    if not ocr.disponible():
        return "", None, "Tesseract no esta instalado"

    texto, paginas, truncado, confianza = ocr.extraer(path)
    if ocr.usable(texto, confianza):
        detalle = f"confianza {confianza}"
        if ocr.dudosa(confianza):
            detalle += " - LECTURA DUDOSA, avisar al usuario"
        if truncado:
            detalle += f", solo las primeras {paginas} paginas"
        return texto, "ocr", detalle

    return "", None, "el OCR tampoco saco texto"


def miles(n):
    """12345 -> 12.345 (formato es-AR)."""
    return f"{int(round(n)):,}".replace(",", ".")


def informe(nombre, n_paginas, mb, sin_tool, con_tool, origen="markitdown", detalle=""):
    ahorro = sin_tool - con_tool
    pct = (ahorro / sin_tool * 100) if sin_tool else 0.0
    ancho = 58
    etiqueta = "markitdown" if origen == "markitdown" else "OCR (Tesseract)"
    via = etiqueta + (f" - {detalle}" if detalle else "")
    lineas = [
        "",
        "=" * ancho,
        "  INFORME DE TOKENS - markitdown",
        "=" * ancho,
        f"  Archivo : {nombre}",
        f"  Tamano  : {n_paginas} paginas, {mb:.1f} MB",
        f"  Via     : {via}",
        "-" * ancho,
        f"  Sin la herramienta (paginas como imagen) : {miles(sin_tool):>9} tokens",
        f"  Con la herramienta (texto plano)         : {miles(con_tool):>9} tokens",
        "-" * ancho,
        f"  AHORRO                                   : {miles(ahorro):>9} tokens  ({pct:.1f}%)",
        "=" * ancho,
        "",
    ]
    return "\n".join(lineas)


def main():
    ap = argparse.ArgumentParser(description="PDF -> Markdown con informe de tokens")
    ap.add_argument("pdf", help="ruta del PDF")
    ap.add_argument("-o", "--out", help="ruta del .md de salida")
    args = ap.parse_args()

    path = os.path.abspath(args.pdf)
    if not os.path.isfile(path):
        sys.stderr.write(f"No existe el archivo: {path}\n")
        sys.exit(EXIT_ERROR)

    try:
        cajas = paginas_del_pdf(path)
    except Exception as e:
        sys.stderr.write(f"No se pudo leer la estructura del PDF: {e}\n")
        cajas = []

    texto, origen, detalle = extraer(path)

    con_tool = tokens_de_texto(texto)
    # Leer el PDF directo cuesta las imagenes de cada pagina + el texto que traen
    sin_tool = sum(tokens_de_pagina(w, h) for w, h in cajas) + con_tool

    mb = os.path.getsize(path) / (1024 * 1024)
    nombre = os.path.basename(path)

    if not texto.strip():
        sys.stderr.write(
            f"\n[!] {nombre}: no se pudo sacar texto usable.\n"
            f"    markitdown devolvio 0 caracteres (no tiene capa de texto) y "
            f"{detalle}.\n"
            "    Hay que leer la pagina directo.\n\n"
        )
        sys.exit(EXIT_SIN_TEXTO)

    if args.out:
        destino = os.path.abspath(args.out)
    else:
        carpeta = os.path.join(tempfile.gettempdir(), "markitdown")
        os.makedirs(carpeta, exist_ok=True)
        # El sufijo .ocr.md deja registrado de donde salio el texto, para que
        # el hook no etiquete como markitdown algo que vino del OCR.
        sufijo = ".md" if origen == "markitdown" else ".ocr.md"
        destino = os.path.join(carpeta, os.path.splitext(nombre)[0] + sufijo)

    os.makedirs(os.path.dirname(destino), exist_ok=True)
    with open(destino, "w", encoding="utf-8") as f:
        f.write(texto)

    print(f"Markdown escrito en: {destino}")
    print(f"Caracteres extraidos: {miles(len(texto))}")
    print(informe(nombre, len(cajas), mb, sin_tool, con_tool, origen, detalle))
    sys.exit(EXIT_OK)


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass
    main()
