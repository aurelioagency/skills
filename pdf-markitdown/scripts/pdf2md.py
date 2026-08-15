#!/usr/bin/env python3
"""
Convert a PDF to Markdown with markitdown and report how many tokens that
saved against reading the PDF directly (every page entering as an image).

Usage:
    python pdf2md.py <file.pdf> [--out output.md]

Output:
    - Writes the .md
    - Prints the token report
    - Exit 0 = ok | 3 = no usable text (read it directly) | 1 = error
"""

import argparse
import os
import sys
import tempfile

# --- Accounting constants ---------------------------------------------------
# Anthropic: an image costs about (width * height) / 750 tokens
PX_PER_TOKEN = 750
# An image's long edge is capped at 1568 px before tokenizing
MAX_EDGE = 1568
# Assumed render resolution of a PDF page before that cap
RENDER_DPI = 150
# Text-to-token estimate. ~3.8 chars per token for mixed Spanish/English.
CHARS_PER_TOKEN = 3.8

EXIT_OK = 0
EXIT_ERROR = 1
EXIT_NO_TEXT = 3


def pdf_pages(path):
    """Return [(width_pt, height_pt), ...] for every page."""
    from pdfminer.pdfpage import PDFPage

    boxes = []
    with open(path, "rb") as f:
        for page in PDFPage.get_pages(f):
            x0, y0, x1, y1 = page.mediabox
            boxes.append((abs(x1 - x0), abs(y1 - y0)))
    return boxes


def page_tokens(width_pt, height_pt):
    """Tokens one page costs when rendered as an image."""
    if width_pt <= 0 or height_pt <= 0:
        return 0.0
    scale = RENDER_DPI / 72.0
    w = width_pt * scale
    h = height_pt * scale
    long_edge = max(w, h)
    if long_edge > MAX_EDGE:
        factor = MAX_EDGE / long_edge
        w *= factor
        h *= factor
    return (w * h) / PX_PER_TOKEN


def text_tokens(text):
    return len(text) / CHARS_PER_TOKEN


def convert(path):
    """Return the markdown markitdown extracted from the file."""
    try:
        from markitdown import MarkItDown
    except ImportError:
        sys.stderr.write(
            "markitdown is not installed.\n"
            'Install it with:  python -m pip install "markitdown[all]"\n'
        )
        sys.exit(EXIT_ERROR)

    result = MarkItDown().convert(path)
    return getattr(result, "text_content", None) or getattr(result, "markdown", "") or ""


def extract(path):
    """
    Get the text out of the PDF by the best route available.

    Returns (text, source, detail):
        source 'markitdown' -> the PDF had a text layer
        source 'ocr'        -> a scan, but OCR produced text
        source None         -> no usable text, the page has to be read directly
    """
    text = convert(path)
    if text.strip():
        return text, "markitdown", ""

    try:
        import ocr
    except ImportError:
        return "", None, "the OCR module is unavailable"

    if not ocr.available():
        return "", None, "Tesseract is not installed"

    text, pages, truncated, confidence = ocr.extract(path)
    if ocr.usable(text, confidence):
        detail = f"confidence {confidence}"
        if ocr.doubtful(confidence):
            detail += " - DOUBTFUL READING, warn the user"
        if truncated:
            detail += f", first {pages} pages only"
        return text, "ocr", detail

    return "", None, "OCR produced no text either"


def grouped(n):
    """12345 -> 12,345"""
    return f"{int(round(n)):,}"


def report(name, n_pages, mb, without_tool, with_tool, source="markitdown", detail=""):
    saved = without_tool - with_tool
    pct = (saved / without_tool * 100) if without_tool else 0.0
    width = 58
    label = "markitdown" if source == "markitdown" else "OCR (Tesseract)"
    via = label + (f" - {detail}" if detail else "")
    lines = [
        "",
        "=" * width,
        "  TOKEN REPORT - markitdown",
        "=" * width,
        f"  File   : {name}",
        f"  Size   : {n_pages} pages, {mb:.1f} MB",
        f"  Via    : {via}",
        "-" * width,
        f"  Without the tool (pages as images) : {grouped(without_tool):>9} tokens",
        f"  With the tool (plain text)         : {grouped(with_tool):>9} tokens",
        "-" * width,
        f"  SAVED                              : {grouped(saved):>9} tokens  ({pct:.1f}%)",
        "=" * width,
        "",
    ]
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser(description="PDF -> Markdown with a token report")
    ap.add_argument("pdf", help="path to the PDF")
    ap.add_argument("-o", "--out", help="path of the output .md")
    args = ap.parse_args()

    path = os.path.abspath(args.pdf)
    if not os.path.isfile(path):
        sys.stderr.write(f"No such file: {path}\n")
        sys.exit(EXIT_ERROR)

    try:
        boxes = pdf_pages(path)
    except Exception as e:
        sys.stderr.write(f"Could not read the PDF structure: {e}\n")
        boxes = []

    text, source, detail = extract(path)

    with_tool = text_tokens(text)
    # Reading the PDF directly costs the page images plus the text they carry
    without_tool = sum(page_tokens(w, h) for w, h in boxes) + with_tool

    mb = os.path.getsize(path) / (1024 * 1024)
    name = os.path.basename(path)

    if not text.strip():
        sys.stderr.write(
            f"\n[!] {name}: no usable text could be extracted.\n"
            f"    markitdown returned 0 characters (no text layer) and {detail}.\n"
            "    The page has to be read directly.\n\n"
        )
        sys.exit(EXIT_NO_TEXT)

    if args.out:
        target = os.path.abspath(args.out)
    else:
        folder = os.path.join(tempfile.gettempdir(), "markitdown")
        os.makedirs(folder, exist_ok=True)
        # The .ocr.md suffix records where the text came from, so the hook
        # never labels an OCR result as markitdown.
        suffix = ".md" if source == "markitdown" else ".ocr.md"
        target = os.path.join(folder, os.path.splitext(name)[0] + suffix)

    os.makedirs(os.path.dirname(target), exist_ok=True)
    with open(target, "w", encoding="utf-8") as f:
        f.write(text)

    print(f"Markdown written to: {target}")
    print(f"Characters extracted: {grouped(len(text))}")
    print(report(name, len(boxes), mb, without_tool, with_tool, source, detail))
    sys.exit(EXIT_OK)


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass
    main()
