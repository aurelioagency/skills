#!/usr/bin/env python3
"""
OCR local para PDFs escaneados, con Tesseract.

Se usa solo cuando markitdown devolvio 0 caracteres, o sea cuando el PDF
no tiene capa de texto. Rasteriza cada pagina con pypdfium2 y se la pasa
a Tesseract. Todo local: no sale nada a internet, no hay API paga.

Si el OCR saca texto, se usa. No hay umbral que lo rechace: el usuario
pide leer el PDF que pasa, y una lectura imperfecta es mejor que ninguna.
La confianza se mide igual, pero es informacion, no un porton: viaja en
el informe para que el usuario sepa cuanto confiar en lo que lee.

Medido en esta maquina:
    documento impreso escaneado ... 88.5  (texto casi exacto)
    documento manuscrito .......... 55.8  (se entiende a medias)
    catalogo con fotos ............ 43.5  (mucho ruido)

Los .traineddata viven en <skill>/tessdata para no depender de permisos
de escritura en Program Files.
"""

import os

CANDIDATOS_TESSERACT = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
]

TESSDATA = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "tessdata")

DPI = 200
IDIOMAS = "spa+eng"
MAX_PAGINAS = 50
# Debajo de esto la lectura es dudosa. NO se rechaza: se avisa en el informe.
CONFIANZA_DUDOSA = 70.0
# Unico piso real: si no salio practicamente nada, no hay texto que usar.
MINIMO_CARACTERES = 20


def binario():
    """Ruta del ejecutable de Tesseract, o None si no esta instalado."""
    for c in CANDIDATOS_TESSERACT:
        if os.path.isfile(c):
            return c
    from shutil import which

    return which("tesseract")


def disponible():
    return binario() is not None


def _texto_de_data(data):
    """Rearma el texto y junta las confianzas de un image_to_data."""
    lineas = {}
    confianzas = []
    for i, palabra in enumerate(data["text"]):
        palabra = (palabra or "").strip()
        if not palabra:
            continue
        c = int(data["conf"][i])
        if c >= 0:
            confianzas.append(c)
        clave = (data["block_num"][i], data["par_num"][i], data["line_num"][i])
        lineas.setdefault(clave, []).append(palabra)

    texto = "\n".join(" ".join(p) for _, p in sorted(lineas.items()))
    return texto, confianzas


def extraer(path, max_paginas=MAX_PAGINAS):
    """
    Devuelve (texto, paginas_procesadas, truncado, confianza).

    confianza es el promedio de Tesseract sobre todas las palabras, 0-100.
    No juzga: devuelve el dato. Usa `usable()` para decidir.
    Lanza RuntimeError si Tesseract no esta instalado.
    """
    exe = binario()
    if not exe:
        raise RuntimeError(
            "Tesseract no esta instalado. "
            "winget install --id UB-Mannheim.TesseractOCR"
        )

    import pypdfium2 as pdfium
    import pytesseract

    pytesseract.pytesseract.tesseract_cmd = exe
    # Por variable de entorno y no por --tessdata-dir: pytesseract parte el
    # config por espacios y las comillas terminan dentro de la ruta.
    if os.path.isdir(TESSDATA):
        os.environ["TESSDATA_PREFIX"] = TESSDATA

    doc = pdfium.PdfDocument(path)
    total = len(doc)
    n = min(total, max_paginas)
    escala = DPI / 72.0

    partes = []
    confianzas = []
    for i in range(n):
        imagen = doc[i].render(scale=escala).to_pil()
        data = pytesseract.image_to_data(
            imagen, lang=IDIOMAS, output_type=pytesseract.Output.DICT
        )
        texto, cs = _texto_de_data(data)
        if texto.strip():
            partes.append(texto)
        confianzas.extend(cs)
        imagen.close()

    doc.close()
    confianza = (sum(confianzas) / len(confianzas)) if confianzas else 0.0
    return "\n\n".join(partes), n, total > n, round(confianza, 1)


def usable(texto, confianza):
    """
    True si el OCR saco algo con que trabajar.

    No juzga la calidad: eso lo dice `dudosa()` y va en el informe.
    Solo la ausencia de texto manda a lectura directa.
    """
    return len(texto.strip()) >= MINIMO_CARACTERES


def dudosa(confianza):
    """True si el texto probablemente tenga errores de reconocimiento."""
    return confianza < CONFIANZA_DUDOSA
