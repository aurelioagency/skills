---
name: pdf-markitdown
description: Convert any PDF to Markdown with markitdown (Microsoft) BEFORE reading it, so pages never enter the context as images. Use whenever the user attaches, uploads or drags a PDF into the chat, or passes the path of a .pdf — even if they only say "read this", "summarize this", "what does this say", or say nothing at all. Spanish phrasings trigger it the same way: "leé esto", "resumime esto", "qué dice acá", "analizá el archivo". Also use when asked to extract text, tables or content from a PDF, convert a PDF to Markdown or plain text, or process several PDFs in batch. Always return the token savings report.
---

# PDF → Markdown with markitdown

A PDF that enters the chat is **never read directly**. It is converted with markitdown first, and the resulting `.md` is what gets read.

## Why this skill exists

Reading a PDF directly puts every page into the context as an image: ~2,300 tokens per page, whatever it contains. markitdown extracts only the text: a 12-page catalog drops from 32,000 tokens to 4,400. Same useful content, 86% less context.

The problem is that without this skill the cheap path is never taken, because reading the PDF directly works and never reports what it cost. The skill forces the step and shows the number.

---

## The hook gets there first

A `PreToolUse` hook on `Read` in `~/.claude/settings.json` points at `scripts/hook_pdf_read.py`. On any attempt to read a PDF, it converts the file and **cancels** the direct read.

When that happens you receive an error starting with `[pdf-markitdown]` carrying the path of the `.md` and the report already computed. That is not a failure — it is the skill working. Read that `.md` and **paste the report into your answer**. There is no need to run `pdf2md.py` again.

If the hook returned the "no usable text" notice instead, the direct read went ahead: tell the user there was no saving on that file.

The rest of the flow applies when the hook did not intervene — for example if the user asks to convert a PDF to `.md` without reading it, or when processing a batch.

---

## Flow

1. **Preflight.** Closes when markitdown answers.
2. **Convert.** Closes with the `.md` written and the exit code read.
3. **Report.** Closes when the user has seen the three token figures.
4. **Read the `.md`.** Closes when the original request is answered.

---

## 1. Preflight

```bash
python -c "import markitdown; print(markitdown.__version__)"
```

If it fails, install it — the project is https://github.com/microsoft/markitdown.git:

```bash
python -m pip install "markitdown[all]"
```

`[all]` brings the extras: PDF, Office, images, audio, HTML. Without it there is no PDF support.

## 2. Convert

```bash
python scripts/pdf2md.py "<pdf path>"
```

The `.md` goes to `%TEMP%\markitdown\<name>.md` unless you pass `-o <path>`. If the user asked for the file itself, use `-o` and leave it where they want it.

**The exit codes decide:**

| Exit | What happened | What to do |
|---|---|---|
| `0` | Text extracted, by markitdown or by OCR | Go to step 3 |
| `3` | Neither markitdown nor OCR got usable text | Tell the user and read the PDF directly. Not your failure, not the skill's |
| `1` | A real error | Show the message, do not improvise |

The report carries a `Via:` line naming where the text came from — `markitdown` or `OCR (Tesseract)` with its confidence. If it came from OCR, say so: the text may contain recognition errors and the user needs to know that before trusting a figure or a proper name.

Never read the PDF directly on exit `0`. You already have the text.

## 3. Report

The script prints it. **Put it in your answer, always**, even if the user did not ask: it is the only way they know the skill ran and what it saved.

```
==========================================================
  TOKEN REPORT - markitdown
==========================================================
  File   : 213.pdf
  Size   : 12 pages, 7.9 MB
  Via    : markitdown
----------------------------------------------------------
  Without the tool (pages as images) :    32,177 tokens
  With the tool (plain text)         :     4,362 tokens
----------------------------------------------------------
  SAVED                              :    27,815 tokens  (86.4%)
==========================================================
```

**The script prints English; you present it in the user's language.** Translate the four labels and keep the numbers untouched. Someone writing to you in Spanish gets `SIN LA HERRAMIENTA / CON LA HERRAMIENTA / AHORRO`; in French, `SANS L'OUTIL / AVEC L'OUTIL / ÉCONOMIE`. The report is for the user, so it is written the way the user reads.

The figures are an estimate, not an invoice. Do not present them as exact. They come from:

- **Without the tool** = each page as an image + the text. An image costs ≈ `(width × height) / 750`, long edge capped at 1568 px, which is how Anthropic tokenizes images. Each page's real dimensions come from the PDF.
- **With the tool** = `characters / 3.8`, the average for mixed Spanish/English.

## 4. Read the `.md`

Only now do you read the file and answer what was asked. If the `.md` is huge, grep inside it instead of reading it whole — that is what the conversion was for.

---

## Several PDFs

One `.md` per PDF, and a total at the end. Do not read any of them until every conversion is done.

```bash
for f in *.pdf; do python scripts/pdf2md.py "$f"; done
```

In PowerShell:

```powershell
Get-ChildItem *.pdf | ForEach-Object { python scripts/pdf2md.py $_.FullName }
```

---

## The gate

```
PDF arrives
 │
 ├─ markitdown extracts text ─────────► use the .md              (saving)
 │
 └─ 0 characters: it is a scan
      │
      ├─ OCR extracts text ───────────► use the OCR .md          (saving)
      │
      └─ OCR extracts nothing ────────► direct read              (no saving)
```

**There is no quality threshold.** If OCR produces text, that text is used. The user asked to read the PDF they handed over, not for the skill to decide whether it is worth reading.

Confidence is measured anyway and travels in the report. Below 70 the detail reads `DOUBTFUL READING, warn the user`: when you see that, **say it in your answer**, in their language — something like "this text came from OCR at confidence 55, some words may be misread". It is a warning, not an excuse to avoid answering.

---

## Limits

- **Handwriting OCR contains errors.** It is used anyway, with the warning. Do not discard it on your own.
- **OCR is slow.** ~1.5 s per page. Capped at 50 pages per file.
- **No images extracted.** If what matters in the PDF is a photo, a plan or a chart, the text is not enough and it has to be read directly.
- **Tables come out flattened.** pdfminer returns text in reading order; it does not rebuild the grid. Verify any critical table against the PDF.
- **No heading detection.** The output is plain text inside a `.md`, with no heading hierarchy.
- **Only where there is a shell.** In a claude.ai chat without a terminal, markitdown cannot run.
