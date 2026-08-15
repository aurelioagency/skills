#!/usr/bin/env python3
"""
Local OCR for scanned PDFs, with Tesseract.

Only used when markitdown returned 0 characters, meaning the PDF has no
text layer. Each page is rasterized with pypdfium2 and handed to Tesseract.
Everything runs locally: nothing leaves the machine, no paid API.

If OCR produces text, that text is used. There is no threshold that rejects
a reading: the user asked to read the PDF they handed over, and an imperfect
reading beats none. Confidence is measured all the same, but as information,
not as a gate -- it travels in the report so the user knows how much to
trust what they are reading.

Measured on this machine:
    scanned printed document ... 88.5  (near exact)
    handwritten notes .......... 55.8  (half legible)
    photo-heavy catalog ........ 43.5  (mostly noise)

The .traineddata files live in <skill>/tessdata so the skill does not depend
on write permissions inside Program Files.
"""

import os

TESSERACT_CANDIDATES = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
]

TESSDATA = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "tessdata")

DPI = 200
LANGUAGES = "spa+eng"
MAX_PAGES = 50
# Below this the reading is shaky. It is NOT rejected: the report says so.
DOUBTFUL_CONFIDENCE = 70.0
# The only real floor: if almost nothing came out, there is no text to use.
MIN_CHARS = 20


def binary():
    """Path to the Tesseract executable, or None if it is not installed."""
    for c in TESSERACT_CANDIDATES:
        if os.path.isfile(c):
            return c
    from shutil import which

    return which("tesseract")


def available():
    return binary() is not None


def _text_from_data(data):
    """Rebuild the text and collect the confidences from an image_to_data."""
    lines = {}
    confidences = []
    for i, word in enumerate(data["text"]):
        word = (word or "").strip()
        if not word:
            continue
        c = int(data["conf"][i])
        if c >= 0:
            confidences.append(c)
        key = (data["block_num"][i], data["par_num"][i], data["line_num"][i])
        lines.setdefault(key, []).append(word)

    text = "\n".join(" ".join(words) for _, words in sorted(lines.items()))
    return text, confidences


def extract(path, max_pages=MAX_PAGES):
    """
    Return (text, pages_processed, truncated, confidence).

    confidence is Tesseract's average over every word, 0-100. This function
    does not judge it: use `usable()` and `doubtful()` to decide.
    Raises RuntimeError if Tesseract is not installed.
    """
    exe = binary()
    if not exe:
        raise RuntimeError(
            "Tesseract is not installed. "
            "winget install --id UB-Mannheim.TesseractOCR"
        )

    import pypdfium2 as pdfium
    import pytesseract

    pytesseract.pytesseract.tesseract_cmd = exe
    # Via the environment variable rather than --tessdata-dir: pytesseract
    # splits the config on whitespace and the quotes end up inside the path.
    if os.path.isdir(TESSDATA):
        os.environ["TESSDATA_PREFIX"] = TESSDATA

    doc = pdfium.PdfDocument(path)
    total = len(doc)
    n = min(total, max_pages)
    scale = DPI / 72.0

    parts = []
    confidences = []
    for i in range(n):
        image = doc[i].render(scale=scale).to_pil()
        data = pytesseract.image_to_data(
            image, lang=LANGUAGES, output_type=pytesseract.Output.DICT
        )
        text, cs = _text_from_data(data)
        if text.strip():
            parts.append(text)
        confidences.extend(cs)
        image.close()

    doc.close()
    confidence = (sum(confidences) / len(confidences)) if confidences else 0.0
    return "\n\n".join(parts), n, total > n, round(confidence, 1)


def usable(text, confidence):
    """
    True if OCR produced something to work with.

    Does not judge quality -- that is what `doubtful()` reports.
    Only the absence of text sends a file to a direct read.
    """
    return len(text.strip()) >= MIN_CHARS


def doubtful(confidence):
    """True if the text probably carries recognition errors."""
    return confidence < DOUBTFUL_CONFIDENCE
