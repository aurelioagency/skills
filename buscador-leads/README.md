# Buscador de Leads — Lead Search and Contact Enrichment Skill

An agent skill that finds potential clients by scraping public sites, and fills in missing contact data (email, WhatsApp, Instagram) on a list you already have:

```
Mode A:  industry + city → pick the site → inspect the real page → scrape → contacts per lead → list for review
Mode B:  existing list   → find each lead's own page → extract contacts → show what was found and where → save
```

It only searches and hands over data. It never sends, publishes, or contacts anyone — outreach is a separate, later step.

Works with agent harnesses that support file-based skills (Claude Code, Codex, and similar). `SKILL.md` and its references are written in Spanish.

## What's in this folder

| Path | Purpose |
|---|---|
| [SKILL.md](SKILL.md) | The skill: the two modes, the step order of each, and the hard rules |
| [references/sitios-por-rubro.md](references/sitios-por-rubro.md) | Candidate sites per industry — grows as new industries are searched |
| [references/contacto-mercadolibre.md](references/contacto-mercadolibre.md) | Enrichment flow for Mercado Libre sellers: why email/phone is rarely public there and where it can actually come from |
| [scripts/fetch.py](scripts/fetch.py) | Downloads a page so its real structure can be inspected before writing selectors (`--stealth` for JS-heavy sites, `--html` for raw markup) |
| [scripts/extract_contacts.py](scripts/extract_contacts.py) | Pulls email, WhatsApp, Instagram, and website from a page |
| [scripts/export_csv.py](scripts/export_csv.py) | Exports a list of results to CSV |

## Key features

- **Two modes, chosen from the request.** Search by industry when there is no list yet; enrich when there is one. If the request doesn't make it clear, the skill asks.
- **Looks at the real page before scraping.** No selectors are hardcoded: every site changes its HTML, so the skill inspects the page first and writes a small ad-hoc scraper for it.
- **Announces the size of a scrape before launching it** — how many pages and results — and paginates politely instead of looping hard.
- **Never invents a contact.** If a profile plus a web search turn up no public email or phone, the cell stays empty with a "not public" note.
- **Shows its sources.** Before saving into a spreadsheet it shows what it found and where it came from, so you can review it.
- **Escalates only when needed.** A plain fetcher first; a real-browser stealth fetcher if the site blocks it, before discarding the source.
- **Social networks only as enrichment.** Instagram, LinkedIn, and Facebook are never the source of the initial list (they block fast scraping) — only a one-off lookup for a lead already found elsewhere.
- **Nothing is sent anywhere.** No messages, no posts, and nothing written into a campaign file unless you ask for it.

## Installation

**Option A — let your agent install it (recommended).** Open Claude Code and paste:

```text
Install the buscador-leads skill from https://github.com/aurelioagency/skills :
1. Run: git clone --filter=blob:none --sparse https://github.com/aurelioagency/skills.git into a temporary folder.
2. Inside it, run: git sparse-checkout set buscador-leads
3. Copy the buscador-leads/ folder into ~/.claude/skills/buscador-leads/
4. Delete the temporary clone and confirm the skill loads.
5. Check the requirements: Python 3 and the scrapling package (and openpyxl if I
   will enrich Excel files). Install anything missing (ask me to approve each
   install command).
6. Explain how to use the skill, tell me where its files ended up on my machine,
   and ask me if we search for my first leads now.
```

**Option B — manual.** Clone the repo and run the bundled installer:

```powershell
git clone https://github.com/aurelioagency/skills.git
cd skills
node install-skills.mjs buscador-leads          # Claude Code
node install-skills.mjs buscador-leads --codex  # Codex
```

Any other harness: point it at this folder's `SKILL.md`.

## Updating

Improvements land in the repo; your installed copy never updates itself. To update, re-run the installer from an up-to-date clone — it replaces the installed skill cleanly, keeps its `node_modules`, and records the installed commit in `.installed-from.json`:

```powershell
git pull
node install-skills.mjs buscador-leads
```

To find out whether you are behind without installing anything:

```powershell
node install-skills.mjs buscador-leads --check
```

## Uninstalling

The installed skill lives in `~/.claude/skills/buscador-leads/`. Removing it touches nothing else. From a clone:

```powershell
node install-skills.mjs buscador-leads --remove
```

Or simply delete that folder yourself.

## Requirements

- **Python 3** with [Scrapling](https://github.com/D4Vinci/Scrapling): `pip install scrapling` (for `--stealth`, also the browser dependencies Scrapling documents).
- **openpyxl** — only when enriching an Excel file: `pip install openpyxl`.
- **No API keys and no paid providers.**

The Mercado Libre flow in `SKILL.md` points at the author's own campaign spreadsheet. If you use the skill on a different list, give it the path to yours.

## Usage

Once installed, the skill is available in **every** session on the machine and triggers from the request itself:

> Buscame inmobiliarias en Rosario con mail y WhatsApp

> Completá los contactos que faltan en este Excel

> Armame un listado de restaurantes de Palermo para contactar

It asks for the industry and the city if you didn't give them, says which site it will scrape, shows what it found, and only exports to CSV or writes into a spreadsheet when you ask.

## License

MIT — see [LICENSE](../LICENSE) at the repo root.
