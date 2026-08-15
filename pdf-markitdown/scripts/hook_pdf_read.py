#!/usr/bin/env python3
"""
Hook PreToolUse sobre Read.

Intercepta la lectura de un PDF -- venga de donde venga, incluso de un adjunto --
lo convierte con markitdown y cancela la lectura directa, devolviendo la ruta
del .md y el informe de tokens.

Si el PDF no tiene capa de texto (escaneado), deja pasar la lectura directa:
ese PDF son imagenes y no hay texto que extraer.

Falla siempre hacia abierto: ante cualquier error, permite la lectura normal.
Nunca debe romper la capacidad de leer un archivo.
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

EVENTO = "PreToolUse"


def responder(decision=None, razon=None, contexto=None):
    """Emite la respuesta del hook y termina. Sin salida = permitir."""
    if decision is None and contexto is None:
        sys.exit(0)
    salida = {"hookSpecificOutput": {"hookEventName": EVENTO}}
    if decision:
        salida["hookSpecificOutput"]["permissionDecision"] = decision
        salida["hookSpecificOutput"]["permissionDecisionReason"] = razon or ""
    if contexto:
        salida["hookSpecificOutput"]["additionalContext"] = contexto
    print(json.dumps(salida, ensure_ascii=False))
    sys.exit(0)


def md_al_dia(pdf, md):
    """True si ya existe un .md mas nuevo que el PDF."""
    try:
        return os.path.isfile(md) and os.path.getmtime(md) >= os.path.getmtime(pdf)
    except OSError:
        return False


def main():
    try:
        crudo = sys.stdin.buffer.read().decode("utf-8-sig")
        entrada = json.loads(crudo)
    except Exception:
        responder()

    if entrada.get("tool_name") != "Read":
        responder()

    pdf = (entrada.get("tool_input") or {}).get("file_path") or ""
    if not pdf.lower().endswith(".pdf") or not os.path.isfile(pdf):
        responder()

    try:
        import tempfile

        import pdf2md

        carpeta = os.path.join(tempfile.gettempdir(), "markitdown")
        os.makedirs(carpeta, exist_ok=True)
        nombre = os.path.basename(pdf)
        base = os.path.join(carpeta, os.path.splitext(nombre)[0])
        # Dos nombres distintos para saber de donde salio un .md cacheado.
        md, md_ocr = base + ".md", base + ".ocr.md"

        detalle = ""
        if md_al_dia(pdf, md):
            with open(md, encoding="utf-8") as f:
                texto = f.read()
            origen = "markitdown"
        elif md_al_dia(pdf, md_ocr):
            with open(md_ocr, encoding="utf-8") as f:
                texto = f.read()
            origen, detalle = "ocr", "cacheado"
            md = md_ocr
        else:
            texto, origen, detalle = pdf2md.extraer(pdf)
            if origen:
                destino = md if origen == "markitdown" else md_ocr
                with open(destino, "w", encoding="utf-8") as f:
                    f.write(texto)
                md = destino

        if not origen or not texto.strip():
            responder(
                contexto=(
                    f"[pdf-markitdown] {nombre}: no se pudo sacar texto usable. "
                    f"markitdown devolvio 0 caracteres y {detalle}. "
                    "La lectura directa sigue adelante porque es la unica forma de verlo. "
                    "Avisale al usuario que en este archivo no hubo ahorro de tokens."
                )
            )

        cajas = pdf2md.paginas_del_pdf(pdf)
        con_tool = pdf2md.tokens_de_texto(texto)
        sin_tool = sum(pdf2md.tokens_de_pagina(w, h) for w, h in cajas) + con_tool
        mb = os.path.getsize(pdf) / (1024 * 1024)
        reporte = pdf2md.informe(nombre, len(cajas), mb, sin_tool, con_tool, origen, detalle)

        responder(
            decision="deny",
            razon=(
                f"[pdf-markitdown] Lectura directa cancelada: este PDF ya esta convertido.\n"
                f"Lee este archivo en su lugar -> {md}\n"
                f"{reporte}\n"
                "Pegale el informe al usuario en la respuesta."
            ),
        )
    except Exception as e:
        responder(
            contexto=(
                f"[pdf-markitdown] No se pudo convertir el PDF ({e}). "
                "Sigue la lectura directa."
            )
        )


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    main()
