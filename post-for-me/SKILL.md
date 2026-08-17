---
name: post-for-me
description: Publish to social networks with Post for Me, and install, verify or repair its MCP server. Use for BOTH jobs. Publishing - use whenever someone asks to publish, post, upload, share or schedule content on Instagram, TikTok, LinkedIn, Facebook, X, YouTube, Pinterest, Threads or Bluesky through Post for Me or postforme, including carousels, reels, shorts and stories, whether the media is a local file or a URL, and including scheduling for later, checking whether a post went out, and marking the delivery folder with its publication date afterwards. Setup - use whenever someone mentions installing, configuring, connecting or repairing Post for Me, postforme or post-for-me-mcp, asks to "connect my social accounts to Claude", or reports that an MCP server will not start, does not show up, shows an error, or that their Claude config "deleted itself". Covers Windows, macOS and Linux, and applies regardless of the language the request is written in. Never publishes anything that was not explicitly asked for and confirmed.
---

# Post for Me

Two jobs, one skill: get the official Post for Me MCP server (`post-for-me-mcp`) working, and then publish with it — upload media, write the post, send it to the right accounts, confirm it landed, and mark the folder the files came from.

Setup happens once. Publishing repeats forever. Read the section you are actually on:

| The request sounds like | Go to |
|---|---|
| "install Post for Me", "connect my accounts", "the server shows an error" | **Setting up the MCP**, further down |
| "publish this on Instagram", "post the carousel", "schedule this for Friday" | **Publishing**, right here |

## Publishing

### A post cannot be taken back

Post for Me has no retract. Once a post lands it is public on every network it reached, and undoing it means deleting it by hand, account by account. Everything below exists because of that one fact.

Two rules follow, and neither is negotiable:

**Never publish something nobody asked for.** No test post to check the install, no draft "just to see how it looks", no scheduled post to try the flow. If you want to prove the connection works, read: `GET /v1/social-accounts` confirms the key and the link, and changes nothing.

**Never guess the target accounts.** "Post it everywhere" and "all platforms" are not instructions to fan out to every connected account — those lists routinely mix a brand's accounts with someone's personal ones, and a brand post on a personal profile is the exact mistake that cannot be undone. List the accounts, show which ones you intend to use, and get a yes on that list.

That rule is about *guessing*, and it expires the moment the person stops leaving it to you. **Once they name the set — "all of them", "including the personal one", "todas las cuentas es a todas las cuentas" — that is the answer, and it overrides any standing exclusion you are carrying.** Flag the conflict once, inside the gate, on one line: *"X was never used before and your saved rule excluded it — going in because you asked."* Then publish it. Do not spend a turn on it, do not offer to leave it out, do not raise it again after they answer. Someone repeating an instruction is not someone who misunderstood it.

### Do the homework before the gate, not across three turns

Every lookup you need happens **before** the gate is shown. The gate is the one place the person is asked to read carefully, so it has to be complete and final when it appears. Discovering a detail afterwards and coming back with "one more thing" turns a single confirmation into an interrogation, and it is the fastest way to burn the trust that makes the gate work at all.

Prior posts are the best available spec and they cost one call. `client.socialPosts.list()`, then `retrieve()` on the closest match, shows the exact account set, the `placement` per platform, the `title` overrides, and whether the video shipped as its own post. A folder that follows the same shape as a previous delivery should be published the same way. Match it instead of asking.

### The delivery folder is finished work, not a draft to review

When someone points at a folder and says publish it, **everything in that folder is the content.** They put it there, they finished it, and they are not asking you to audit the contents. A `short.mp4` next to ten PNGs is not an anomaly worth a question — it is the video cut of that carousel, and it ships.

What you owe them is *routing*, not permission. Sorting the assets by what each platform accepts is your job to do silently:

- **Images-only carousel** → Instagram, TikTok, LinkedIn, Facebook, Threads, X, Pinterest.
- **YouTube takes video only.** There is no image-post type; PNGs sent there fail after `processing`. The short is what goes to YouTube, as its own post, with its own `title`.
- **One asset per account, never both.** If the carousel already reached Instagram, the video cut of that same carousel does not also go there as a reel. The split exists so every account gets the content once.

State the split in the gate as a decision — "YouTube gets the short because it cannot take the images" — and move on. It is a fact about the platform, not a choice the person needs to make.

### Before you build the call

Four things, and none of them can be assumed:

1. **Which accounts.** `client.socialAccounts.list()`. Show `platform` and `username` for the ones you plan to use, never the tokens.
2. **The caption.** Exactly as written. Do not improve it, do not translate it, do not append hashtags of your own.
3. **The media.** A public URL Post for Me can fetch, or a local file — which has to be uploaded first, see below.
4. **When.** Now, or `scheduled_at` as an ISO 8601 string. Confirm the timezone if they said something like "Friday at 9".

### Local files have to be uploaded first

Post for Me fetches media by URL; it cannot see the person's disk. Neither can the `execute` tool — its code runs in a container with no filesystem access and no network beyond the SDK client. So the bytes cannot travel through `execute`. The upload is three stages, and only the middle one happens locally:

**Stage 1 — mint the URLs, inside `execute`.** One call per file:

```ts
const { upload_url, media_url } = await client.media.createUploadURL();
```

The method is `createUploadURL`, with `URL` uppercase. `createUploadUrl` does not exist and fails typechecking.

**`execute` times out at 25 seconds, and this is where it bites.** Each `createUploadURL` takes roughly 2 seconds, so a nine-slide carousel does not fit in one call — not sequentially, and not with `Promise.all` either, which times out just the same because the ceiling is wall-clock, not concurrency. Measured on a real nine-slide run: **batches of three complete in 7–8 seconds each**. Ask for three per call, repeat, and collect the pairs as you go. Return them from every call — variables do not persist between `execute` invocations, so a batch you do not return is a batch you have lost.

**Stage 2 — PUT the bytes, from the local shell.** Bash with `curl`, one PUT per file, checking the status code rather than assuming:

```bash
curl -s -o /dev/null -w "%{http_code}" -X PUT \
  -H "Content-Type: image/png" \
  --data-binary "@slide.png" \
  "<upload_url>"
```

`200` is success. Write the loop to print a line per file so a single silent failure in the middle cannot pass for a complete upload.

**Stage 3 — build the post with the `media_url`s**, in slide order. The public `media_url` is a plain URL with no token; the *signed* `upload_url` is the one that expires — its token carries about a two-hour window. `media_url` expires in 24 hours if it goes unused. Upload as part of the publish, not hours ahead.

### The confirmation gate

Before the call that publishes, show four lines and stop:

- The accounts, by platform and username
- The caption, in full — not a summary
- The media, by filename or URL, in order
- When it goes out: now, or the scheduled time

Then ask, and wait for an explicit yes. Not "looks good?" — say that it will be public and cannot be retracted. If any part came from your own inference rather than from what they said, flag that line specifically.

### Building the post

```ts
const post = await client.socialPosts.create({
  caption,
  social_accounts: [...],
  media: [{ url }],
  scheduled_at,        // omit or null to publish now
  external_id,         // your own id — use the delivery folder slug
});
```

`external_id` is worth filling in every time. It is the only thing that ties the published post back to the folder the files came from, which is what makes the marking step below possible weeks later.

Per-account overrides go in `account_configurations`, and they matter more than they look:

- `placement` — `reels`, `timeline` or `stories` for Instagram, Facebook and Threads. With `stories` and several media items, Post for Me creates **one post per item**, not one story with several cards.
- `share_to_feed: false` — Instagram video shows only in the Reels tab.
- `title` — required-ish for YouTube, TikTok and Pinterest; the `caption` is not a title.
- `privacy_status`, `made_for_kids`, `board_ids`, `is_draft` — platform-specific, read them off the docs rather than from memory.

**`localizations` is required on every account configuration, not just YouTube's.** The SDK types `account_configurations[].configuration` as one shared `Configuration`, so a plain Instagram override fails to compile:

```
TS2741: Property 'localizations' is missing in type '{ placement: "timeline" }'
but required in type 'Configuration'.
```

Pass `localizations: {}` on every entry, whatever the platform:

```ts
account_configurations: [
  { social_account_id: 'spc_…', configuration: { placement: 'timeline', localizations: {} } },
  { social_account_id: 'spc_…', configuration: { title: 'Título', localizations: {} } },
]
```

An empty **map**, never `[]`. A typechecked call is not a valid call: `localizations: []` satisfies TypeScript, creates the post, and only then fails against Google with a 400. That class of failure is invisible until you read the results, which is the next step. The full case is in `references/troubleshooting.md`.

### Captions keep their line breaks only if you build them right

Writing the caption as a multi-line template literal inside the `execute` tool re-indents every line, and the post goes out with leading spaces on each paragraph. Build it from an array instead:

```ts
const caption = [
  'First line',
  '',
  'Second paragraph',
].join('\n');
```

Check the platform's own limits too — Instagram in particular reads badly past a handful of hashtags, and some accounts have a house rule stricter than the platform's.

### After it lands

`socialPosts.create` returns before the networks have finished. `status` moves `processing` → `processed`; the real outcome is per account:

```ts
const results = await client.socialPostResults.list({ post_id: post.id });
```

The `post_id` filter is honoured server-side, so **an empty `data` means the networks have not answered yet — not that the filter is wrong**. Do not go hunting for a bug in the query: a multi-image carousel across several accounts can sit in `processing` for a long time — an hour is normal, not a symptom. (`limit` on this endpoint is *not* reliably honoured — it can return more rows than asked for, so never infer "that's all of them" from a short list.)

**`updated_at` is not a progress signal. Do not read it as one.** It stays equal to `created_at` even on posts that finished and published successfully — verified on three separate posts, two of them `processed` with live URLs. A post whose timestamps match has *not* necessarily stalled, and telling the user it "never got dispatched" on that basis is wrong.

The only two signals that mean anything are `status` reaching `processed` and the per-account results arriving. Everything else is noise. Until they land, the honest answer is "sent, not confirmed yet" — never "it looks stuck".

Each result carries `success`, `error`, and `platform_data.url` — the direct link to the published post. Report those links. If any account failed, say which and why; do not describe a partial publish as done, and do not mark anything.

**Never report a publish as successful off the create call alone.** `socialPosts.create` returning an id proves the post was *accepted*, nothing more. Until the results come back per account, the honest status is "sent, confirmation pending" — say exactly that if the session ends before they land.

### Retrying a publish without double-posting

A publish that errors is ambiguous in the one way that matters: a permission denial, a timeout or a dropped connection can happen *before* the post was created or *after*. Retrying blind is how the same carousel goes out twice, and Post for Me cannot retract either copy.

`external_id` is the way out, and it is why the field is worth setting every time. Before any retry, ask whether the post already exists:

```ts
const existing = await client.socialPosts.list({ external_id: 'delivery-folder-slug' });
```

A non-empty `data` means the post is already in flight — read its results, do not create it again. Only an empty result justifies re-sending.

One distinction worth keeping straight: a result row with `success: false` is a **platform rejection**, and there retrying is safe, because nothing was published on that account. The failed attempt stays in the dashboard as an error row — mention it, so it is not misread as a double post.

### Marking the delivery folder

This is the step everyone forgets, because by the time you publish, the folder that produced the files was built in another session days ago. Do it here, while you still know both halves.

**A publish is not finished until the folder is renamed.** On this machine the convention is settled: it is part of the publish, not a follow-up question. Do not ask permission, do not offer it as an option, and do not leave it for the next turn. Deliverables live under `G:\Unidades compartidas\Aurelio\` — `Reels\Finales\` and `Carrouseles\`.

**Mark it once the post is created. Do not wait for the per-account results.** The owner of this machine decided that explicitly: `processing` with no results yet still gets marked, because the post was sent and the results routinely confirm later, after the session is over. Waiting means the folder never gets marked at all. Report the pending confirmation in the summary — but rename first, in the same turn.

Steps:

1. Take the publication date from `updated_at`, or `scheduled_at` if it was scheduled.
2. Rename the folder the published files came from to `YYYY-MM-DD-<folder>_POST`.
3. If the folder is already marked, leave it alone — a second pass must not produce `2026-08-13-2026-08-11-thing_POST_POST`.
4. Say in the summary which folder was marked and with what date.

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
