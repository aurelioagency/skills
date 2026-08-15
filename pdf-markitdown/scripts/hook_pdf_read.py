#!/usr/bin/env python3
"""
PreToolUse hook on Read.

Intercepts the reading of a PDF -- wherever it comes from -- converts it with
markitdown and cancels the direct read, handing back the path of the .md and
the token report.

If the PDF has no text layer, local OCR runs. If OCR produces nothing either,
the direct read is allowed through: that file is images and there is no text
to extract.

Always fails open: on any error the normal read proceeds. This must never
take away the ability to read a file.
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

EVENT = "PreToolUse"


def respond(decision=None, reason=None, context=None):
    """Emit the hook response and exit. No output = allow."""
    if decision is None and context is None:
        sys.exit(0)
    out = {"hookSpecificOutput": {"hookEventName": EVENT}}
    if decision:
        out["hookSpecificOutput"]["permissionDecision"] = decision
        out["hookSpecificOutput"]["permissionDecisionReason"] = reason or ""
    if context:
        out["hookSpecificOutput"]["additionalContext"] = context
    print(json.dumps(out, ensure_ascii=False))
    sys.exit(0)


def md_current(pdf, md):
    """True if a .md newer than the PDF already exists."""
    try:
        return os.path.isfile(md) and os.path.getmtime(md) >= os.path.getmtime(pdf)
    except OSError:
        return False


def main():
    try:
        raw = sys.stdin.buffer.read().decode("utf-8-sig")
        payload = json.loads(raw)
    except Exception:
        respond()

    if payload.get("tool_name") != "Read":
        respond()

    pdf = (payload.get("tool_input") or {}).get("file_path") or ""
    if not pdf.lower().endswith(".pdf") or not os.path.isfile(pdf):
        respond()

    try:
        import tempfile

        import pdf2md

        folder = os.path.join(tempfile.gettempdir(), "markitdown")
        os.makedirs(folder, exist_ok=True)
        name = os.path.basename(pdf)
        base = os.path.join(folder, os.path.splitext(name)[0])
        # Two different names so a cached .md still says where it came from.
        md, md_ocr = base + ".md", base + ".ocr.md"

        detail = ""
        if md_current(pdf, md):
            with open(md, encoding="utf-8") as f:
                text = f.read()
            source = "markitdown"
        elif md_current(pdf, md_ocr):
            with open(md_ocr, encoding="utf-8") as f:
                text = f.read()
            source, detail = "ocr", "cached"
            md = md_ocr
        else:
            text, source, detail = pdf2md.extract(pdf)
            if source:
                target = md if source == "markitdown" else md_ocr
                with open(target, "w", encoding="utf-8") as f:
                    f.write(text)
                md = target

        if not source or not text.strip():
            respond(
                context=(
                    f"[pdf-markitdown] {name}: no usable text could be extracted. "
                    f"markitdown returned 0 characters and {detail}. "
                    "The direct read proceeds because it is the only way to see this file. "
                    "Tell the user there was no token saving on it."
                )
            )

        boxes = pdf2md.pdf_pages(pdf)
        with_tool = pdf2md.text_tokens(text)
        without_tool = sum(pdf2md.page_tokens(w, h) for w, h in boxes) + with_tool
        mb = os.path.getsize(pdf) / (1024 * 1024)
        summary = pdf2md.report(name, len(boxes), mb, without_tool, with_tool, source, detail)

        respond(
            decision="deny",
            reason=(
                f"[pdf-markitdown] Direct read cancelled: this PDF is already converted.\n"
                f"Read this file instead -> {md}\n"
                f"{summary}\n"
                "Present this report to the user, in their language."
            ),
        )
    except Exception as e:
        respond(
            context=(
                f"[pdf-markitdown] The PDF could not be converted ({e}). "
                "The direct read proceeds."
            )
        )


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    main()
