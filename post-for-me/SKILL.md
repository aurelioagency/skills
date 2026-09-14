---
name: post-for-me
description: Publish to social networks with Post for Me, and install, verify or repair its MCP server. Use for BOTH jobs. Publishing - use whenever someone asks to publish, post, upload, share or schedule content on Instagram, TikTok, LinkedIn, Facebook, X, YouTube, Pinterest, Threads or Bluesky through Post for Me or postforme, including carousels, reels, shorts and stories, whether the media is a local file or a URL, and including scheduling for later, checking whether a post went out, and marking the delivery folder with its publication date afterwards. Spanish phrasings trigger it the same way, and a request to upload or publish media is enough on its own even when Post for Me is never named: "subi el reel que esta en Drive", "publica esto en Instagram", "manda el carrusel a todas las cuentas", "subilo a las redes", "programa esto para el viernes". Setup - use whenever someone mentions installing, configuring, connecting or repairing Post for Me, postforme or post-for-me-mcp, asks to "connect my social accounts to Claude", or reports that an MCP server will not start, does not show up, shows an error, or that their Claude config "deleted itself". Covers Windows, macOS and Linux, and applies regardless of the language the request is written in. Never publishes anything that was not explicitly asked for and confirmed.
---

# Post for Me

Two jobs, one skill: get the official Post for Me MCP server (`post-for-me-mcp`) working, and then publish with it — upload media, write the post, send it to the right accounts, confirm it landed, and mark the folder the files came from.

Setup happens once. Publishing repeats forever. Read the section you are actually on:

| The request sounds like | Go to |
|---|---|
| "install Post for Me", "connect my accounts", "the server shows an error" | **Setting up the MCP**, further down |
| "publish this on Instagram", "post the carousel", "schedule this for Friday" | **Publishing**, right here |

## Publishing

### Publishing goes through the REST API directly, not the `execute` tool

`mcp__post_for_me_api__execute` runs the code it's given on a Stainless-hosted
sandbox by default, and that hosted backend was shut down — every `execute` call
fails with `410: Gone` (see `references/troubleshooting.md` §11). The fix
(`--code-execution-mode=local` in the server's launch args) does not survive on
this machine: Claude Desktop manages this connector's definition itself and
rewrites `args`/`env` back to their original values on every relaunch, even
after a verified, backed-up write. Confirmed with a controlled test — closed the
app, wrote the flag, checked the file (present), reopened, checked again (gone).
There is no field in Settings → Connectors to edit it either; that screen only
exposes tool permissions, not the launch command.

**So: publish with plain HTTPS calls (`curl` from Bash) against
`https://api.postforme.dev/v1/...` directly, using the API key.** Everything
below that used to read `client.socialPosts.create(...)` inside `execute` now
means "call that endpoint with curl instead." `search_docs` still works fine
(it's a separate tool, not `execute`) — use it to look up exact fields when
unsure.

Get the key without retyping it anywhere: it already lives in
`claude_desktop_config.json`, at `mcpServers.post_for_me_api.env.POST_FOR_ME_API_KEY`.
Read it from there each time rather than hardcoding it in a prompt or a file:

```bash
API_KEY=$(python -c "import json; print(json.load(open(r'C:\Users\<user>\AppData\Roaming\Claude\claude_desktop_config.json', encoding='utf-8-sig'))['mcpServers']['post_for_me_api']['env']['POST_FOR_ME_API_KEY'])")
```

(macOS/Linux: swap in `desktop_config_path()` from `scripts/verify_mcp.py` for
the right path.) Never print `$API_KEY` itself in a summary or error message —
mask it the way the scripts do.

### A post cannot be taken back

Post for Me has no retract. Once a post lands it is public on every network it reached, and undoing it means deleting it by hand, account by account. Everything below exists because of that one fact.

Two rules follow, and neither is negotiable:

**Never publish something nobody asked for.** No test post to check the install, no draft "just to see how it looks", no scheduled post to try the flow. If you want to prove the connection works, read: `GET /v1/social-accounts` confirms the key and the link, and changes nothing.

**Never guess the target accounts.** "Post it everywhere" and "all platforms" are not instructions to fan out to every connected account — those lists routinely mix a brand's accounts with someone's personal ones, and a brand post on a personal profile is the exact mistake that cannot be undone. List the accounts, show which ones you intend to use, and get a yes on that list.

That rule is about *guessing*, and it expires the moment the person stops leaving it to you. **Once they name the set — "all of them", "including the personal one", "todas las cuentas es a todas las cuentas" — that is the answer, and it overrides any standing exclusion you are carrying.** Flag the conflict once, inside the gate, on one line: *"X was never used before and your saved rule excluded it — going in because you asked."* Then publish it. Do not spend a turn on it, do not offer to leave it out, do not raise it again after they answer. Someone repeating an instruction is not someone who misunderstood it.

### Do the homework before the gate, not across three turns

Every lookup you need happens **before** the gate is shown. The gate is the one place the person is asked to read carefully, so it has to be complete and final when it appears. Discovering a detail afterwards and coming back with "one more thing" turns a single confirmation into an interrogation, and it is the fastest way to burn the trust that makes the gate work at all.

Prior posts are the best available spec and they cost one call. `GET /v1/social-posts`, then `GET /v1/social-posts/{id}` on the closest match, shows the exact account set, the `placement` per platform, the `title` overrides, and whether the video shipped as its own post. A folder that follows the same shape as a previous delivery should be published the same way. Match it instead of asking.

### The delivery folder is finished work, not a draft to review

When someone points at a folder and says publish it, **everything in that folder is the content.** They put it there, they finished it, and they are not asking you to audit the contents. A `short.mp4` next to ten PNGs is not an anomaly worth a question — it is the video cut of that carousel, and it ships.

What you owe them is *routing*, not permission. Sorting the assets by what each platform accepts is your job to do silently:

- **Images-only carousel** → Instagram, TikTok, LinkedIn, Facebook, Threads, X, Pinterest.
- **YouTube takes video only.** There is no image-post type; PNGs sent there fail after `processing`. The short is what goes to YouTube, as its own post, with its own `title`.
- **One asset per account, never both.** If the carousel already reached Instagram, the video cut of that same carousel does not also go there as a reel. The split exists so every account gets the content once.

State the split in the gate as a decision — "YouTube gets the short because it cannot take the images" — and move on. It is a fact about the platform, not a choice the person needs to make.

**"Already published" on a *different* post is not a reason to skip an account for *this* one.** A reel or short published in an earlier, separate job does not retroactively cover the carousel job for that same topic — each publish call is its own delivery, and every account capable of taking this folder's assets gets them in this job. Do not reason from "this topic already reached that account somehow" to "so this account can be skipped now" — that is guessing at what the person wants instead of routing what they asked for. If a video-capable folder is being published and the owner names or implies an account (including "todas" / "everywhere"), and that account only takes video, send it the video in this same job — never explain it away by pointing at a prior post.

**Do not question or re-litigate an explicit publish instruction.** Once the owner has said what to publish and named or confirmed the accounts, execute it — do not raise "but this went out already" or "but this doesn't seem necessary" as a reason to hold back or narrow the request. The one thing worth surfacing before publishing is a genuine platform constraint (an account that structurally cannot take the asset, e.g. images to YouTube) — state it once, as a fact, and act on the rest. Never frame a platform's own limitation as your own judgment call, and never repeat an already-answered objection after the owner has overridden it.

### The standing recipe for this machine

Settled with the owner. Do not re-derive it from previous posts — a lookup here is verification, not discovery.

#### The delivery folder

**`output\` is the deliverable, `source\` is raw footage.** The MP4 to publish, the caption and the transcript live in `output\`. Never publish anything from `source\` — those are camera files and intermediate cuts. A folder with neither subfolder keeps its deliverable at the root.

**Find the caption by reading, not by filename.** It has been `<slug>-caption.txt`, but it can just as well be `caption.txt`, `descripcion.txt` or `description.txt`. Take the `.txt` files in `output\`, skip the transcript (it is verbatim spoken text — no greeting, no links, no hashtags), and open what remains. One read settles it. Never hardcode the name, and never skip publishing because the file "was not found" under a name you assumed.

**Use the caption verbatim.** Do not rewrite it, translate it, trim it, or add hashtags of your own.

#### If there is no caption, stop and ask

Do not publish with a caption you wrote on your own initiative. Ask, and offer the two options:

1. **The standing template** below, filled in properly.
2. **A minimal draft**, when the owner does not have the caption ready for that particular video and just wants something serviceable to correct.

Either way the draft is shown in the gate for approval before anything goes out.

**How to build the minimal draft.** The material already answers most of it — work down these sources in order and stop at the first that gives you the topic:

1. **The transcript in `output\`.** This is what the video actually says, and it is the best source there is. The strongest idea is usually in the first two sentences (the hook) and the ask is in the last one.
2. **The folder and file names.** `github-project-nomad`, `project-nomad-internet-offline` — these carry the topic and often the angle. Turn the slug back into words.
3. **Nothing usable in either** → ask the owner what the video is about. Do not guess from the filename alone when the filename is opaque.

Then fill the template:

- **The 2-4 line paragraph** restates the single strongest idea — the hook, the figure, the surprising claim — not a summary of everything said. Voseo, direct, no filler, no AI throat-clearing ("En el mundo de hoy...", "¿Sabías que...?" as an opener).
- **Describe only what the material confirms.** Never invent how a product works, what it includes or what it costs. If the transcript does not say it, it does not go in the caption.
- **The DM line** goes in only if the outro actually asks for it — take the exact word from the transcript.
- **The four dynamic hashtags** come from the literal words of the piece: tool names, the concept it treats. `#LaCasaDeAurelio` closes.
- Fixed blocks and blank lines exactly as in the template.

#### The caption template, La Casa de Aurelio

Copied here on request so this skill stands alone. **It also lives in `social-video-producer\SKILL.md` (videos) and `social-carousel-generator\references\la-casa-preset.md` (carousels)** — if the owner changes the template, all three copies need the change.

```text
Bienvenidos a la Casa de Aurelio!

<2-4 lineas que resumen el gancho o insight principal, tono directo, sin relleno>

De la teoría a la práctica: Aurelio Agency →
https://www.aurelioagency.com/es

Unite a la comunidad:
https://www.skool.com/la-casa-de-aurelio-2061

<4 hashtags dinamicos segun el tema> #LaCasaDeAurelio
```

- The greeting, the services line and both URLs are **fixed**. Never reword, translate or shorten them. Fixed does not mean exempt from voseo: it is `Unite a la comunidad`, not `Únete`.
- The only written block is the 2-4 line paragraph — the strongest idea of the piece, not a recap.
- **The DM call to action is deduced from the material, never invented.** If the video's outro asks the viewer to comment a word to receive something, add `Comentá <PALABRA> y te la mando por DM.` right after the paragraph, and make sure that word also appears written in the paragraph. If the outro says nothing of the sort, leave the line out.
- **Exactly 5 hashtags.** `#LaCasaDeAurelio` last, as signature; the other four picked by the actual topic. An off-topic hashtag subtracts more than it adds.
- Blank lines between blocks exactly as shown.

#### The accounts

**Only Aurelio's connected accounts.** Call `GET /v1/social-accounts` and filter on `status == "connected"` at publish time — the table below is the expected shape, not a substitute for the check. **Never list, name or mention a disconnected account**, not in the gate, not in the summary, not as an aside. They are not of interest and raising them is noise.

A reel goes to these five as a single post:

| Account | Configuration |
|---|---|
| Instagram `lacasadeaurelio` | `placement: 'reels'` |
| Facebook La Casa de Aurelio | `placement: 'reels'` |
| TikTok La Casa de Aurelio | `title` |
| YouTube La Casa de Aurelio | `title`, `privacy_status: 'public'` |
| LinkedIn Aurelio Agency | — |

Plus `localizations: {}` on every entry, always. `external_id` is the folder slug.

**`ing.gustavopaz` is optional, and it is asked every single time.** It is the owner's second Instagram; some deliveries go there and some do not, and past posts do not settle it. Ask inside the gate — `placement: 'reels'` when it is in — and never assume either way from what previous reels did.

#### What you write yourself

**Only the `title` for TikTok and YouTube.** Take it from the piece's own hook; the caption is not a title.

**A proposal is a proposal.** Nothing is built until the owner says yes — do not describe a pending gate as something you "reconstructed", "rebuilt" or "assembled". Say what you actually did: read the folder, applied the recipe, wrote the title.

### Before you build the call

Four things, and none of them can be assumed:

1. **Which accounts.** `GET /v1/social-accounts`. Show **every connected account**, `platform` and `username`, never the tokens (the response includes `access_token`/`refresh_token` per account — read `platform`/`username`/`status` and ignore the rest). If a confirmation-question tool caps the number of choices (e.g. 4 options), do not silently drop accounts to fit — list all of them as plain text first (numbered or bulleted), then let the person pick from that full list. An account left off the list because of a tool limit is a silent omission, not a decision the person made. YouTube is not a special case here: it takes video only and title is required-ish (see below), but it still gets a `caption` like every other platform — list it and ask for it exactly like the rest.
2. **The caption.** Exactly as written. Do not improve it, do not translate it, do not append hashtags of your own.
3. **The media.** A public URL Post for Me can fetch, or a local file — which has to be uploaded first, see below.
4. **When.** Now, or `scheduled_at` as an ISO 8601 string. Confirm the timezone if they said something like "Friday at 9".

### Local files have to be uploaded first

Post for Me fetches media by URL; it cannot see the person's disk. The upload is three plain `curl` calls, all from Bash — no batching, no timeout ceiling, because none of this goes through `execute` anymore:

**Step 1 — mint an upload URL, one call per file:**

```bash
curl -s -X POST "https://api.postforme.dev/v1/media/create-upload-url" \
  -H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json"
```

Returns `{ "upload_url": "...", "media_url": "..." }`. One call per file — for a
multi-slide carousel just loop it; there is no 25-second wall to fit under, so
there is nothing to batch.

**Step 2 — PUT the bytes to `upload_url`:**

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X PUT \
  -H "Content-Type: image/png" \
  --data-binary "@slide.png" \
  "<upload_url>"
```

`200` is success. Check the status code per file rather than assuming — a loop
over several files should print one line each, so a single silent failure in
the middle cannot pass for a complete upload.

**Step 3 — use `media_url` when creating the post**, in slide order. The public
`media_url` is a plain URL with no token; the *signed* `upload_url` is the one
that expires — its token carries about a two-hour window. `media_url` expires
in 24 hours if it goes unused. Upload as part of the publish, not hours ahead.

### The confirmation gate

Before the call that publishes, show four lines and stop:

- The accounts, by platform and username
- The caption, in full — not a summary
- The media, by filename or URL, in order
- When it goes out: now, or the scheduled time

Then ask, and wait for an explicit yes. Not "looks good?" — say that it will be public and cannot be retracted. If any part came from your own inference rather than from what they said, flag that line specifically.

### If the publish call is denied by the permission layer

A `curl` call from Bash can still hit the harness's permission layer like any
other shell command — the mechanism is the same one described in
`references/troubleshooting.md` §10, just attached to `Bash` instead of
`mcp__post_for_me_api__execute` now. It is intermittent: the same call can be
denied, then succeed on a plain retry with no setting touched in between, so
retrying once or twice when the person asks is normal and not a sign anything
is broken.

If it keeps getting denied, the equivalent allowlist line goes in
`~/.claude/settings.json`, scoped to the specific curl command rather than to
`Bash` as a whole where possible (e.g. `"Bash(curl * api.postforme.dev*)"`).
Say the same cost out loud as before: it covers publishing without the
harness's own brake, so the confirmation gate above becomes the only check
left.

### Building the post

Write the JSON payload to a file first (heredoc in Bash), then POST it — this
also solves the line-break problem below in one move:

```bash
cat > /tmp/post_payload.json << 'EOF'
{
  "caption": "First line\n\nSecond paragraph",
  "social_accounts": ["spc_...", "spc_..."],
  "media": [{ "url": "<media_url>" }],
  "external_id": "delivery-folder-slug",
  "account_configurations": [
    { "social_account_id": "spc_...", "configuration": { "placement": "reels", "localizations": {} } },
    { "social_account_id": "spc_...", "configuration": { "title": "Título", "localizations": {} } }
  ]
}
EOF

curl -s -X POST "https://api.postforme.dev/v1/social-posts" \
  -H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json" \
  -d @/tmp/post_payload.json
```

Omit `scheduled_at` (or set it to `null`) to publish now; pass an ISO 8601
string to schedule.

`external_id` is worth filling in every time. It is the only thing that ties the published post back to the folder the files came from, which is what makes the marking step below possible weeks later.

Per-account overrides go in `account_configurations`, and they matter more than they look:

- `placement` — `reels`, `timeline` or `stories` for Instagram, Facebook and Threads. With `stories` and several media items, Post for Me creates **one post per item**, not one story with several cards.
- `share_to_feed: false` — Instagram video shows only in the Reels tab.
- `title` — required-ish for YouTube, TikTok and Pinterest; the `caption` is not a title.
- `privacy_status`, `made_for_kids`, `board_ids`, `is_draft` — platform-specific, read them off the docs rather than from memory.

**Pass `localizations: {}` on every account configuration, not just YouTube's.** This was originally an SDK-typing quirk (the TS types shared one `Configuration` interface requiring it everywhere), but keep doing it now that calls are raw JSON too — YouTube's own API genuinely needs `localizations` as an empty **map**, never `[]`:

```
Invalid value at 'resource' (Map), Cannot bind a list to map for field 'localizations'.
```

That failure is invisible until you read the results, which is the next step. The full case is in `references/troubleshooting.md`.

### Captions keep their line breaks only if you build them right

Writing the caption inline in a shell command re-indents or mangles multi-line
text fast. Build the JSON payload as a file (the heredoc above) with real `\n`
escapes for line breaks, rather than embedding a raw multi-line string in a
one-liner `-d '...'` argument. If you construct the caption from parts first,
join them with `\n` before writing the file, don't concatenate literal
newlines into a shell argument.

Check the platform's own limits too — Instagram in particular reads badly past a handful of hashtags, and some accounts have a house rule stricter than the platform's.

### After it lands

`POST /v1/social-posts` returns before the networks have finished. `status` moves `processing` → `processed`; the real outcome is per account:

```bash
curl -s "https://api.postforme.dev/v1/social-post-results?post_id=$POST_ID" \
  -H "Authorization: Bearer $API_KEY"
```

The `post_id` filter is honoured server-side, so **an empty `data` means the networks have not answered yet — not that the filter is wrong**. Do not go hunting for a bug in the query: a multi-image carousel across several accounts can sit in `processing` for a long time — an hour is normal, not a symptom. (`limit` on this endpoint is *not* reliably honoured — it can return more rows than asked for, so never infer "that's all of them" from a short list.)

**`updated_at` is not a progress signal. Do not read it as one.** It stays equal to `created_at` even on posts that finished and published successfully — verified on three separate posts, two of them `processed` with live URLs. A post whose timestamps match has *not* necessarily stalled, and telling the user it "never got dispatched" on that basis is wrong.

The only two signals that mean anything are `status` reaching `processed` and the per-account results arriving. Everything else is noise. Until they land, the honest answer is "sent, not confirmed yet" — never "it looks stuck".

Each result carries `success`, `error`, and `platform_data.url` — the direct link to the published post. Report those links. If any account failed, say which and why; do not describe a partial publish as done, and do not mark anything.

**Never report a publish as successful off the create call alone.** `socialPosts.create` returning an id proves the post was *accepted*, nothing more. Until the results come back per account, the honest status is "sent, confirmation pending" — say exactly that if the session ends before they land.

### Retrying a publish without double-posting

A publish that errors is ambiguous in the one way that matters: a permission denial, a timeout or a dropped connection can happen *before* the post was created or *after*. Retrying blind is how the same carousel goes out twice, and Post for Me cannot retract either copy.

`external_id` is the way out, and it is why the field is worth setting every time. Before any retry, ask whether the post already exists:

```bash
curl -s "https://api.postforme.dev/v1/social-posts?external_id=delivery-folder-slug" \
  -H "Authorization: Bearer $API_KEY"
```

A non-empty `data` means the post is already in flight — read its results, do not create it again. Only an empty result justifies re-sending.

One distinction worth keeping straight: a result row with `success: false` is a **platform rejection**, and there retrying is safe, because nothing was published on that account. The failed attempt stays in the dashboard as an error row — mention it, so it is not misread as a double post.

### Marking the delivery folder

This is the step everyone forgets, because by the time you publish, the folder that produced the files was built in another session days ago. Do it here, while you still know both halves.

**A publish is not finished until the folder is renamed.** On this machine the convention is settled: it is part of the publish, not a follow-up question. Do not ask permission, do not offer it as an option, and do not leave it for the next turn. Deliverables live under `G:\Unidades compartidas\Aurelio\` — `Reels\` and `Carruseles\`.

**Mark it once the post is created. Do not wait for the per-account results.** The owner of this machine decided that explicitly: `processing` with no results yet still gets marked, because the post was sent and the results routinely confirm later, after the session is over. Waiting means the folder never gets marked at all. Report the pending confirmation in the summary — but rename first, in the same turn.

Steps:

1. Take the publication date from `updated_at`, or `scheduled_at` if it was scheduled.
2. Rename the folder the published files came from to `YYYY-MM-DD_<slug>_post`, following the naming convention below. The folder arrives named after its topic only — no date, no state — so marking *adds* the two outer blocks around the topic; it does not replace it.
3. If the folder is already marked — it ends in `_post`, or in the legacy `_POST` — leave it alone. A second pass must not produce `2026-08-13_2026-08-11-thing_post_post`.
4. Say in the summary which folder was marked and with what date.

#### The naming convention: `fecha_tema_estado`

A delivery folder has **two shapes**, and the whole queue depends on telling them apart:

```
mcp-mercado-libre                       <- pending: tema only, no date, no state
2026-08-26_mcp-meli-conectar-todo_post  <- published: fecha_tema_estado
```

**The folder you are about to publish has neither a date nor `_post`.** It is named after its topic and nothing else — that is how it was handed over, and it is correct. Marking is what adds the two outer blocks: normalise the topic into the `tema` slug, prepend the publication date, append `_post`. The topic block survives intact in the middle; you are wrapping it, not rewriting it.

```
MCP MERCADO LIBRE  ->  2026-08-27_mcp-mercado-libre_post
```

That is why the queue needs no state file: three blocks means done, one block means pending.

**Never ask the person to name the folder in this format.** They drop a folder with a plain descriptive name — uppercase, spaces, accents, whatever reads well to them — and that is all they owe you. Turning it into a slug is your job, and it happens at marking time, not before. Do not flag the folder name as a problem, do not rename it ahead of publishing, and do not treat an unnormalised name as a sign the delivery is unfinished.

- **`_` separates blocks, `-` separates words inside a block.** Never the other way round.
- **Everything lowercase**, the state suffix included: `_post`, never `_POST`.
- **Date first, ISO 8601 `YYYY-MM-DD`.** It is the only order in which alphabetical sorting and chronological sorting are the same thing.
- **No spaces, no accents, no parentheses, no doubled separators.** `Skill Edición (2)` becomes `skill-edicion-2`.
- **The state block is the publication marker.** A folder with no `_post` is unpublished, and that absence is what lets the folder listing double as the queue.

To normalise a name that does not follow this: lowercase it, turn spaces into `-`, collapse repeated `-`, strip leading and trailing `-`, then join the three blocks with `_`.

**Legacy names** use `YYYY-MM-DD-<slug>_POST` — hyphen after the date, uppercase suffix. Treat those as already marked and do not re-mark them; rename them to the current form only if you are touching that folder for another reason anyway.

`references/marking.md` has the templates, the idempotence rule and the cases where marking must *not* happen. Ask about the convention only when working for someone who has not set one.

Two things worth saying out loud the first time: the date becomes the **publication** date, which is not the creation date and can differ by weeks; and renaming a folder on a mounted Google Drive keeps its file ID, so links already shared keep working.

## Setting up the MCP

### Before touching anything

Three things:

1. **The Post for Me API key.** From the dashboard at `app.postforme.dev`, under Settings → API Keys. It starts with `pfm_live_`. Ask for it if you do not have it.
2. **Where Claude is running.** This decides the whole flow — see the next section.
3. **Node.js installed.** If it is missing the script says so; it comes from `nodejs.org`, then retry.

Never print the key — not in summaries, not in error messages. The scripts mask it automatically; hold the same standard in anything you write yourself.

## The ordering problem, which is the number one cause of failure

Claude Desktop keeps its configuration in memory and **rewrites the whole file** every time it saves a preference. Edit that file while the app is running and it will eventually be overwritten, with no error of any kind. The person reasonably concludes the install "didn't work".

That produces two paths depending on where you are running:

**Inside Claude Desktop** (the desktop app, either the chat or a Claude Code panel): you cannot close the application, because closing it kills you mid-task. Do this instead:

1. Run the script with `--dry-run` to validate everything that can be validated without writing: paths, Node, current JSON, whether it is already installed.
2. Show the summary and ask the person to **close Claude Desktop completely**, including the system tray icon.
3. Tell them to run the script from a separate terminal with the app closed. Give them the exact command, ready to copy.
4. When they reopen the app and tell you, verify.

**In a terminal** (Claude Code on the console, with Claude Desktop closed): do the whole thing in one go. The script still refuses to write if it detects the app alive, so nothing can break by accident.

Explain the reason in one line. Once someone understands that the app overwrites the file, they never fall into the trap again.

## Installing

`scripts/install_mcp.py` does the heavy lifting, in this order: detect the OS and the right config path, verify Node and npx exist, check that Claude is not running, save a timestamped backup, validate the current JSON, insert the entry without touching anything else, write atomically, and re-validate the result.

```bash
python scripts/install_mcp.py --api-key "pfm_live_..."
```

Options worth knowing:

| Option | Purpose |
|---|---|
| `--dry-run` | Validate and show what it would do, without writing. Always use this first. |
| `--target desktop\|code\|both` | Where to install. Defaults to `desktop`. `code` uses the `claude mcp add` CLI. |
| `--version 2.9.1` | Pin a version instead of `@latest`. |
| `--name my_name` | Change the server identifier. Defaults to `post_for_me_api`. |
| `--uninstall` | Remove the entry instead of adding it. |
| `--force` | Write even if Claude is running. Only when the person asks knowing the risk. |

The script is **idempotent**: if the entry already exists it updates it rather than duplicating. Run it as many times as needed.

One Windows detail the official docs do not cover, and which breaks installs: the published example uses `"command": "npx"`, but on Windows `npx` is a `.cmd` shim rather than an executable, so Claude cannot launch it and the server errors out. The script resolves the absolute path to `npx` on every OS, which avoids this and also protects against an app whose `PATH` differs from the terminal's.

## Verifying

After the person restarts Claude:

```bash
python scripts/verify_mcp.py
```

All read-only. It checks that the entry is in the config, that the JSON is still valid, that Node and npx respond, whether server processes are alive, and whether the log files appeared. Adding `--check-api` makes one `GET` call to confirm the key is valid and report how many accounts are connected — without listing sensitive data and without writing anything.

Two signals that mislead people, worth reading correctly:

- **A non-empty `mcp-server-<name>.log` does not mean something is wrong.** That file also collects informational startup and protocol traffic; it can reach tens of kilobytes on a perfectly healthy install. What matters is whether there are error lines (`"level":"error"`, `ENOENT`, `is not recognized`). Also note that `Server disconnected` appears every time Claude closes — that is a normal shutdown, not a failure. The script compares whether the most recent successful startup came after the most recent real failure, instead of guessing from file size.
- `logs/mcp-info.json` can be frozen for months and show an empty `activeServers` even when everything works. It is not a live indicator; ignore it.

The conclusive test is functional: ask Claude in the chat, "what accounts do I have connected in Post for Me?". A list means it is ready.

### Closing the install

Say what they can do now, in one concrete sentence they can type: *"publish this video on Instagram and TikTok"*. Reinforce that the first thing to try should be a read — "what accounts do I have connected?" — and not a post.

If they produce deliverables in folders, this is also the moment to ask how they want published folders marked, so the answer is on record before the first real publish. See **Marking the delivery folder** above.

## The final report, which is half the value

Always end an install with a summary. The person just let an assistant modify configuration files on their machine; they deserve to know exactly what happened and how to undo it. Without this the install works but leaves someone without control over their own computer.

Include four things:

**What was installed.** The server, the version, and what they can do now — in plain words, not jargon: "you can now ask it to upload a video to your networks and it will".

**Which files were touched.** Full path and reason for each. The exact inventory is in `references/files-touched.md`; read it and adapt it to what actually happened in this install, without inventing files that were never created.

**How to uninstall.** That it comes out clean: remove the entry and restart. No installer, no services, no registry entries, nothing in Program Files.

**What to try now.** One concrete sentence to type in the chat. Reinforce that the first thing they try should be a read query, not a post.

If something is unfinished — for example, the person has not restarted the app yet — say so plainly instead of declaring the install complete.

## Uninstalling

Two different things can be removed, and it is worth asking which before deleting anything:

- **The MCP** — the `post_for_me_api` entry inside Claude's configuration. Removing it is what actually disconnects Claude from the networks, and it is what stops publishing from working.
- **The skill** — the folder `~/.claude/skills/post-for-me/`. Removing it means Claude loses the publishing protocol and the diagnostics: the raw MCP tools keep working, so posts still go out, but without the confirmation gate or the folder marking.

To remove the MCP:

```bash
python scripts/install_mcp.py --uninstall
```

It removes only that entry, leaves the rest of the file untouched, backs up first and validates afterwards. If no other servers remain it also drops the now-empty `mcpServers` key, leaving the file as it was. The usual requirement applies: the app must be closed.

Tell the person explicitly that **their Post for Me account, connected accounts and published posts are untouched**. Uninstalling disconnects Claude; it deletes nothing from their networks. That worry comes up every time, so get ahead of it.

## When something fails

Read `references/troubleshooting.md`. It covers what actually happens: the config that deletes itself, the server that will not start, invalid JSON, `npx` not resolving, the Microsoft Store packaged app and its duplicated paths, permissions, and what each log file means.

It also covers failures at publish time, which look different: the create call returns `status: "processing"` and the platform rejects the post afterwards, so the error only exists in the post results. Read those before telling anyone a post went out.

One piece of advice that applies to all of them: look at the evidence before proposing a cause. Comparing the config file's creation time against its modification time tells you whether it was recreated. The server log's most recent startup versus its most recent failure tells you the current state. Diagnosing from data instead of hypotheses saves a lot of back and forth.

## References

- `references/files-touched.md` — inventory of everything created or modified, per OS, and how to revert it.
- `references/marking.md` — rule template for marking a delivery folder after publishing, with a worked example.
- `references/troubleshooting.md` — known problems with symptom, evidence and fix.
- `scripts/install_mcp.py` — idempotent cross-platform installer with backup and validation.
- `scripts/verify_mcp.py` — read-only verification.
