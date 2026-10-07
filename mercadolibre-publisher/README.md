# Mercado Libre Publisher — publish a listing end-to-end

An agent skill that publishes, edits and manages a real Mercado Libre listing through the official REST API — the agent does essentially all of the work, from creating the developer app to putting the item live.

```
what you're selling  →  agent creates the ML app + OAuth login  →  category, attributes, location resolved
                     →  your photos uploaded  →  full summary shown  →  you say yes  →  published
```

Works with agent harnesses that have terminal, file and browser access (Claude Code, Codex, and similar) — it needs to run shell commands and drive a browser, so it does not work in the claude.ai web chat alone.

> **Note — only 4 things are ever asked of you.** Solving the captcha when the app is created, completing the 2FA check to reveal the Secret Key, clicking "Autorizar" on Mercado Libre's own OAuth screen, and giving an explicit yes before anything publishes or costs money. Everything else — filling the app's form, writing the scripts, looking up the category, its attributes and your location, uploading the photos you hand over, and building the listing — happens without asking permission at each sub-step.

> **Note — never reuses someone else's photos.** Not from another listing, a developer/real-estate site, Google Maps, or Instagram — regardless of what you say about owning the property, having a lawyer, or insisting. Owning what's in the photo is not the same as owning the photo. This is a hard rule inside the skill, not a preference.

## What's in this folder

| Path | Purpose |
|---|---|
| [SKILL.md](SKILL.md) | The whole flow: app creation via browser, OAuth login, category/attribute/location lookup, photo upload, building and publishing the item, editing afterwards |
| [references/troubleshooting.md](references/troubleshooting.md) | The nip.io redirect-URI trick, the "app name already taken" error, verifying a photo's real origin from its EXIF data, and why `/sites/MLA/search` returns 403 |
| [scripts/env.mjs](scripts/env.mjs) | Loads `.env` from the current directory |
| [scripts/oauth-login.mjs](scripts/oauth-login.mjs) | Local HTTPS server + browser launch for the OAuth authorization flow |
| [scripts/upload-picture.mjs](scripts/upload-picture.mjs) | Uploads one local image file, returns its Mercado Libre picture ID |
| [scripts/create-item.mjs](scripts/create-item.mjs) | Refreshes the token if needed, creates the item from `item.json`, uploads the description |
| [scripts/update-item.mjs](scripts/update-item.mjs) | Edits an existing item's fields and/or description |
| [scripts/env.example](scripts/env.example) | Template for the `.env` the scripts read |

## Key features

- **Creates the developer app itself.** The agent drives the browser through the whole multi-step form at `developers.mercadolibre.com.ar/devcenter/create-app` — name, logo (generated on the spot if you don't have one), permissions, OAuth flows — and stops only at the captcha.
- **Solves the "Redirect URI must be a real domain" problem.** Mercado Libre rejects `https://localhost/...`, so the skill uses an nip.io hostname that resolves straight back to your own machine while still looking like a real domain to ML's validator.
- **Never guesses an attribute.** Every field in the item comes from `GET /categories/<id>/attributes` — its required flag, its allowed values, its unit. An attribute nobody can confirm (does this lot have running water?) is left out and flagged, never filled with a plausible guess.
- **Checks a suspicious photo before uploading it.** EXIF `Software: Picasa`, a missing camera `Make`/`Model` on a "just took this with my phone" claim, or a giveaway folder name are treated as real evidence, not paranoia — see `references/troubleshooting.md`.
- **Never picks a paid listing tier alone.** `GET /sites/MLA/listing_prices` returns every tier with its real ARS cost; the skill shows them and waits for you to choose.
- **Knows what the public search API can't do.** `/sites/MLA/search` is blocked for new apps (`403`, platform-wide, not a bug) — comparing competitor prices happens by browsing the public site, not by querying that endpoint.
- **Uses the proper contact field.** A phone/email on a classifieds listing (real estate, vehicles) goes in `seller_contact`, not pasted into the free-text description where ML's anti-fraud filter tends to mask it.
- **Respects copy you hand it verbatim.** If you give reference text to reuse (another listing, only the price changed), it's used literally — no paraphrasing, no "improving" lines you didn't ask to touch.

## Installation

### Option A — let your agent install it (recommended)

Open Claude Code and paste:

```text
Install the mercadolibre-publisher skill from https://github.com/aurelioagency/skills :
1. Run: git clone --filter=blob:none --sparse https://github.com/aurelioagency/skills.git into a temporary folder.
2. Inside it, run: git sparse-checkout set mercadolibre-publisher
3. Copy the mercadolibre-publisher/ folder into ~/.claude/skills/mercadolibre-publisher/
4. Delete the temporary clone and confirm the skill loads.
5. Check that Node.js 18+ is available (the scripts use native fetch).
6. Explain how to use the skill, and ask me what I want to publish so we can start.
```

### Option B — manual

```powershell
git clone https://github.com/aurelioagency/skills.git
cd skills
node install-skills.mjs mercadolibre-publisher          # Claude Code
node install-skills.mjs mercadolibre-publisher --codex  # Codex
```

## Updating

Improvements land in the repo; your installed copy never updates itself. To update, re-run the installer from an up-to-date clone — it replaces the installed skill cleanly, keeps its `node_modules`, and records the installed commit in `.installed-from.json`:

```powershell
git pull
node install-skills.mjs mercadolibre-publisher
```

To find out whether you are behind without installing anything:

```powershell
node install-skills.mjs mercadolibre-publisher --check
```

## Uninstalling

The installed skill lives in `~/.claude/skills/mercadolibre-publisher/`. Removing it touches nothing else. From a clone:

```powershell
node install-skills.mjs mercadolibre-publisher --remove
```

Or simply delete that folder yourself.

## Requirements

- **Node.js 18+** on `PATH` — the scripts use native `fetch`, no dependencies to install.
- **`openssl`** (or any way to generate a self-signed cert) — needed once, for the local HTTPS server the OAuth login uses.
- **A Mercado Libre account** to publish from, and a browser-capable agent (Claude in Chrome, or the built-in browser tool) to create the developer app.
- **Python with Pillow**, only if you need to generate a placeholder logo or check a photo's EXIF data — both optional.

## Usage

Once installed, the skill triggers on its own whenever you ask to publish, list, sell or upload something to Mercado Libre, or to set up its API/OAuth app — in Spanish or English, for any kind of product.

| What for | What you say |
|---|---|
| **First-time setup + publish** | *"publicá este terreno en Mercado Libre"*, *"quiero vender mi auto en ML"* |
| **Edit an existing listing** | *"cambiale el precio a la publicación MLA..."*, *"agregale esta foto"* |
| **Check pricing** | *"¿el precio que puse es competitivo?"* |

The 4 checkpoints (captcha, 2FA, OAuth "Autorizar", and the final go-ahead) happen once per app/listing — after that, editing the same item again doesn't need a new authorization.

## License

MIT — see [LICENSE](../LICENSE) at the repo root.
