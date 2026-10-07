# Web Builder — Complete Website Skill

An agent skill that builds complete websites in code — Next.js + Tailwind + Framer Motion — with a design identity of their own, and with a fixed 20-point legal / SEO / performance / UX checklist that is never skipped:

```
interview → scaffold → design identity → real components → 20-point checklist → SEO + accessibility → automated review → security check → report
```

When the request also involves selling something, it activates a commerce module: login, Stripe payments, and secure delivery of large files after payment.

Works with agent harnesses that support file-based skills (Claude Code, Codex, and similar). `SKILL.md` and its references are written in Spanish.

## What's in this folder

| Path | Purpose |
|---|---|
| [SKILL.md](SKILL.md) | The 10-step flow, both modules, and the hard rules |
| [references/checklist-20-puntos.md](references/checklist-20-puntos.md) | How to implement each of the 20 points in Next.js |
| [references/seo-accesibilidad.md](references/seo-accesibilidad.md) | JSON-LD, complete metadata, ARIA, keyboard navigation, heading hierarchy |
| [references/recursos-terceros.md](references/recursos-terceros.md) | The external design skills and MCPs, how to install them, and what happens if one is missing |
| [references/auth-setup.md](references/auth-setup.md) | Auth.js setup for the App Router *(commerce)* |
| [references/entrega-de-archivos.md](references/entrega-de-archivos.md) | Purchase → webhook → signed URL → download, and why GB-sized files can't be served from a Next.js route *(commerce)* |
| [assets/](assets/) | Starting templates: privacy policy, terms, cookie banner, 404 page, HTTPS middleware, `robots.ts`, `sitemap.ts`, validated contact form; plus checkout, webhook, and signed-download routes *(commerce)* |
| [scripts/check-broken-links.mjs](scripts/check-broken-links.mjs) | Crawls the locally running site and reports broken links |
| [scripts/optimize-images.mjs](scripts/optimize-images.mjs) | Compresses images in `public/` with sharp before delivery |

## Key features

- **A design identity, not the usual AI template.** Before any visual component it runs third-party design skills: Taste to extract real tokens from a reference site, or UI/UX Pro Max to pick palette and typography for the industry; Emil Kowalski's skills to decide what to animate and how; Impeccable for a final polish pass.
- **Real components.** With the 21st.dev / Magic MCP connected, it inserts ready-made React/Tailwind components instead of inventing the UI from scratch.
- **The 20-point checklist, always.** Privacy policy, terms, no exposed secrets, forced HTTPS, cookie banner, meta tags, `sitemap.xml`, `robots.txt`, alt text, optimized images, load speed, contrast, responsive, custom 404, no broken links, validated forms, anti-spam, analytics, and a single CTA — generated as real code, completed with the business's real data rather than placeholders.
- **Advanced SEO and accessibility.** JSON-LD structured data, ARIA, keyboard navigation, and a correct heading hierarchy beyond the basic checklist.
- **Automatic review.** With the Playwright MCP it opens the site, checks real contrast, mobile layout, and broken links; without it, it still runs the broken-link script.
- **Extra security pass** with Anthropic's official `claude-security` plugin before delivery — installed only with your OK.
- **Commerce module, only when asked for.** Login with Auth.js, Stripe checkout, a webhook as the single source of truth for payment, and delivery of large files through short-lived signed URLs to external storage (Cloudflare R2 or Backblaze B2). It is never activated for a plain landing or portfolio.
- **Clear limits.** No deploy, no domain purchase, no DNS, no Search Console, and no creating Stripe or storage accounts. The privacy policy and terms are generic starting templates, not legal advice — have a lawyer review them before publishing.

## Installation

**Option A — let your agent install it (recommended).** Open Claude Code and paste:

```text
Install the web-builder skill from https://github.com/aurelioagency/skills :
1. Run: git clone --filter=blob:none --sparse https://github.com/aurelioagency/skills.git into a temporary folder.
2. Inside it, run: git sparse-checkout set web-builder
3. Copy the web-builder/ folder into ~/.claude/skills/web-builder/
4. Delete the temporary clone and confirm the skill loads.
5. Check the requirements: Node 18+ and npm. Tell me which optional design skills
   and MCPs are missing and ask before installing any of them.
6. Explain how to use the skill, tell me where its files ended up on my machine,
   and ask me if we start my first website now.
```

**Option B — manual.** Clone the repo and run the bundled installer:

```powershell
git clone https://github.com/aurelioagency/skills.git
cd skills
node install-skills.mjs web-builder          # Claude Code
node install-skills.mjs web-builder --codex  # Codex
```

Any other harness: point it at this folder's `SKILL.md`.

## Updating

Improvements land in the repo; your installed copy never updates itself. To update, re-run the installer from an up-to-date clone — it replaces the installed skill cleanly, keeps its `node_modules`, and records the installed commit in `.installed-from.json`:

```powershell
git pull
node install-skills.mjs web-builder
```

To find out whether you are behind without installing anything:

```powershell
node install-skills.mjs web-builder --check
```

## Uninstalling

The installed skill lives in `~/.claude/skills/web-builder/`. Removing it touches nothing else — sites already built are yours. From a clone:

```powershell
node install-skills.mjs web-builder --remove
```

Or simply delete that folder yourself.

## Requirements

- **Node.js 18+** and npm, to scaffold and run the Next.js project.
- **Optional third-party skills and MCPs**, each announced before it is installed: [Taste](https://github.com/Leonxlnx/taste-skill), [UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill), [Emil Kowalski's skills](https://github.com/emilkowalski/skills), [Impeccable](https://github.com/pbakaus/impeccable), the 21st.dev Magic MCP, the [Playwright MCP](https://github.com/microsoft/playwright-mcp), and the `claude-security` plugin. See [references/recursos-terceros.md](references/recursos-terceros.md); the skill still works if any is missing.
- **Commerce module only:** your own Stripe account and your own object-storage account (Cloudflare R2 or Backblaze B2), with credentials set as environment variables in `.env.local` — never created or handled in chat. Stripe charges a fee per transaction and the storage charges per GB.

## Usage

Once installed, the skill triggers from the request — you don't need to name any of the checklist points:

> Armame una landing para mi estudio de arquitectura

> Quiero un portfolio con blog y formulario de contacto

> Necesito una web para vender un curso con login y descarga después del pago

It interviews you (business, sections, reference site, language, real contact data), builds the project, and ends with a report: the 20 points checked off, the security check result, and the short list of what's left for you to do by hand — deploy, domain, and Search Console.

## License

MIT — see [LICENSE](../LICENSE) at the repo root.
