# pdf-markitdown — Stop paying image tokens for PDFs

An agent skill that routes every PDF through [MarkItDown](https://github.com/microsoft/markitdown) before the agent reads it, falls back to local OCR for scans, and reports what each conversion saved.

```
PDF arrives  →  MarkItDown extracts text  →  agent reads the .md  →  reports tokens saved
             →  no text layer? local OCR  →  agent reads the .md
             →  OCR found nothing? the agent reads the pages directly
```

Works with agent harnesses that support file-based skills (Claude Code, Codex, and similar). Everything runs locally: no API keys, no paid services, nothing leaves the machine.

## Why this skill exists

You install MarkItDown to save tokens. Then the agent never uses it.

That is not a hypothetical — it is what prompted this skill. Asked directly whether it would use the tool that had just been installed:

> **"But if I hand you the document in another chat, you're not going to use markitdown?"**
>
> **"Correct, no. When you hand me a PDF I read it directly with my own reading tool: I see the pages as images as well as the text, so I pick up diagrams, layout, tables, and even a scan with no text layer."**

The native reader is good. That is precisely the problem: it works, it never reports what it cost, so nothing ever forces the cheaper path. Every page enters the context as an image. Measured on a real 12-page product catalog: **32,177 tokens read natively against 4,362 through MarkItDown** — the same useful content for 86% less context.

Installing the skill is not enough either. With the skill present and firing, the saving still did not happen:

> **"The saving didn't occur this time. When you attached the PDF, the system read it directly before I could do anything — the skill fired afterwards. So this document entered twice: as images and as text."**

A skill is instructions the agent follows once it has the turn. The read already happened. That ordering is why this skill ships a `PreToolUse` hook: the hook runs *before* the read, converts the file, and cancels the direct read, so the only thing that reaches the model is MarkItDown's output.

The third problem showed up during testing. MarkItDown returns **zero characters** for a scanned PDF — it is a text extractor, not an OCR engine, and the "OCR" the upstream README advertises applies to image files and needs a paid vision model behind it. Without a fallback, half the PDFs on a real machine become unreadable. So the skill adds local Tesseract OCR, and only gives up when even that finds nothing.

## What's in this folder

| Path | Purpose |
|---|---|
| [SKILL.md](SKILL.md) | The skill itself: the gate, exit codes, the token report, batch mode, limits |
| [scripts/pdf2md.py](scripts/pdf2md.py) | Conversion + token accounting. The CLI entry point |
| [scripts/ocr.py](scripts/ocr.py) | Local Tesseract OCR with per-document confidence scoring |
| [scripts/hook_pdf_read.py](scripts/hook_pdf_read.py) | The `PreToolUse` hook: converts and cancels the direct read |

## How it works

```
PDF
 │
 ├─ MarkItDown extracts text ─────────► use the .md              (saving)
 │
 └─ 0 characters: it is a scan
      │
      ├─ OCR extracts text ───────────► use the OCR .md          (saving)
      │
      └─ OCR extracts nothing ────────► direct read              (no saving)
```

**There is no quality threshold.** If OCR produces text, the text is used. Confidence is measured and travels in the report — below 70 it is flagged as a doubtful reading — but it never blocks a file. If you hand the agent a PDF, you want it read; an imperfect reading beats none.

Measured on real documents:

| Document | Route | Confidence | Saving |
|---|---|---|---|
| Rent receipt (native PDF) | MarkItDown | — | 94.9% |
| 12-page product catalog | MarkItDown | — | 86.4% — 27,815 tokens |
| Same receipt, rasterized to a scan | OCR | 88.5 | 95.7% |
| Handwritten notes | OCR | 55.8 | 94.6% — flagged doubtful |
| 3D asset catalog, photo-heavy | OCR | 43.5 | 98.5% — 71,280 tokens |

The "read natively" figure is not a guess. It applies Anthropic's image formula — `(width × height) / 750`, long edge capped at 1568 px — to each page's real dimensions, plus the text tokens. The MarkItDown figure is `characters / 3.8`. Both are estimates, and the report says so.

## Key features

- **Runs before the read, not after.** The hook intercepts the file; the model only ever sees converted text.
- **Local OCR fallback.** Tesseract + pypdfium2. No API key, no cloud, no per-page cost.
- **Never leaves you unable to read a file.** Every failure path — no OCR installed, conversion crash, empty output — falls through to the normal direct read.
- **Reports every conversion.** Tokens before, tokens after, saving, percentage, and which route produced the text.
- **Batch mode.** Convert hundreds of PDFs to `.md` without spending context on any of them.

## Installation

Paste this into Claude Code:

```text
Install the pdf-markitdown skill from https://github.com/aurelioagency/skills :
1. Run: git clone --filter=blob:none --sparse https://github.com/aurelioagency/skills.git into a temporary folder.
2. Inside it, run: git sparse-checkout set pdf-markitdown
3. Copy the pdf-markitdown/ folder into ~/.claude/skills/pdf-markitdown/
4. Delete the temporary clone and confirm the skill loads.
5. Check the skill's requirements (see its README) and install anything missing
   (ask me to approve each install command).
6. Register the PreToolUse hook described in this README in my settings.json,
   showing me the exact edit before applying it.
7. Explain how to use the skill and tell me where its files ended up on my machine.
```

### The hook

The skill works on its own, but without the hook the agent has to remember to use it. The hook makes the conversion structural. Add this to `~/.claude/settings.json`, merging with whatever is already there:

```json
"hooks": {
  "PreToolUse": [
    {
      "matcher": "Read",
      "hooks": [
        {
          "type": "command",
          "command": "python \"<skill-path>/scripts/hook_pdf_read.py\"",
          "timeout": 600,
          "statusMessage": "Converting PDF with markitdown..."
        }
      ]
    }
  ]
}
```

Replace `<skill-path>` with the absolute path where the skill was installed, using forward slashes.

Do **not** add an `if: "Read(**/*.pdf)"` filter to narrow it. That filter stops the hook from firing at all — verified by elimination. The script already exits immediately for anything that is not a PDF, which costs about 150 ms per read.

To disable: delete the `hooks` block.

## Requirements

- Python 3.10+ (MarkItDown's own minimum)
- MarkItDown with the optional extras:

```bash
python -m pip install "markitdown[all]"
```

Without `[all]` there is no PDF support at all.

For the OCR fallback (optional — skip it and scans just go to a direct read):

```bash
winget install --id UB-Mannheim.TesseractOCR
```

```bash
python -m pip install pytesseract pypdfium2
```

Tesseract ships with English only. For other languages, drop the `.traineddata` files into a `tessdata/` folder inside the skill — `ocr.py` points `TESSDATA_PREFIX` there when it exists, which avoids needing administrator rights to write into `Program Files`:

```bash
curl -L -o tessdata/spa.traineddata https://github.com/tesseract-ocr/tessdata_fast/raw/main/spa.traineddata
```

The language codes are set in `ocr.py` (`LANGUAGES`, default `spa+eng`).

The token report is printed in English; the skill instructs the agent to present it in whatever language the user writes in.

## Usage

Hand the agent a PDF and ask for what you want. The conversion is automatic and the report comes back with the answer.

Direct CLI use:

```bash
python scripts/pdf2md.py "document.pdf"
```

```bash
python scripts/pdf2md.py "document.pdf" -o "output.md"
```

Without `-o`, the `.md` lands in the system temp folder under `markitdown/`. Exit codes: `0` converted, `3` no usable text (read it directly), `1` a real error.

## Limits

- **Two-column academic papers extract badly.** pdfminer interleaves the columns and MarkItDown tries to build tables where there are none. Readable enough to summarize, not reliable enough to quote.
- **Tables are flattened.** Text comes out in reading order; the grid is not reconstructed. Verify anything critical against the original.
- **No images.** If what matters in the PDF is a photo, a diagram or a plan, the text is not enough — ask for a direct read.
- **Handwriting OCR contains errors.** It is used anyway and flagged. For a critical figure or a proper name, check the original.
- **OCR is slow.** Around 1.5 s per page, capped at 50 pages per file.
- **The hook needs a shell.** In a chat interface without one, none of this runs.
- **Attachment coverage is unverified.** The hook is confirmed to intercept reads the agent initiates. Whether it also intercepts the read a harness fires when a user drags a file into the chat was never conclusively established in testing — the observable evidence was consistent with it, but no test isolated it. Passing the file *path* instead of attaching it is the path that is known to work.

## License

MIT — see the repository [LICENSE](../LICENSE). MarkItDown is MIT (Microsoft); Tesseract is Apache 2.0; bundled language data retains its own license.
