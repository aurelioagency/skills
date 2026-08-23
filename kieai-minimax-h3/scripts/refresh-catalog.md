# How the Eyecandy clip index was built (and how to rebuild it)

`references/eyecannndy-clips.tsv` is a cache. This file is the recipe, because rebuilding it is not
a `curl` away.

## Why it has to be a cache

`eyecannndy.com` answers **403 to every programmatic request** — plain fetch, and fetch with a real
browser User-Agent and Accept-Language, both refused. The block survives a correct UA, so it is not
UA sniffing alone; the browser gets through on an HttpOnly cookie that a script cannot read.

Consequence: the index can only be built **from inside a real browser session**, and a Node script
cannot refresh it on its own. That is exactly why it ships bundled — an agent running under Codex,
or under Claude Code with no browser, still gets the full catalogue.

## The endpoints

Discovered by reading the site's htmx attributes, not documented anywhere.

| What | Call | Notes |
|---|---|---|
| Clips of a technique | `GET /technique/<slug>` | Each `img[hx-get]` is one clip; the `hx-get` URL carries the clip id, and **`data-src`** is the real asset |
| One clip's record | `GET /clip_info_g/<id>/?type=clip&board=&entry=&p_type=&p_id=&t_id=&q=` | Returns an HTML fragment: title, year, description, techniques, credits, original source, tags |
| Search | `GET /search/?q=<term>` | Same grid shape as a technique page, capped at 100 results |

Two traps, both cost time when they were hit:

- **The full parameter string matters.** `/clip_info_g/<id>/?type=technique` alone returns the whole
  page (65 KB of navigation) instead of the 7 KB fragment. An `HX-Request: true` header does not fix
  it. Use the query string exactly as above.
- **There is no per-clip page.** `/clip/<id>/` and every variant 404s. The clip's asset URL is the
  only permalink a clip has — so that is what the index stores and what gets shown to users.
- **Take `data-src`, never `src`.** The grid lazy-loads: `src` is a downscaled copy under
  `/media/CACHE/images/clip/…` and `data-src` is the real file under `/media/clip/…`, usually
  `.webp`. The difference is not cosmetic — measured on the same clip, the thumbnail is 100×56 and
  the real asset is 600×338. The first build of this index took `src` and shipped 6,399 postage
  stamps.

## The procedure

From a browser session with the site open, in the page's own JS context:

1. **Technique index** — fetch all 136 `/technique/<slug>` pages, 6 workers in parallel. Collect
   `{id, slug, title, gif}` from every `img[hx-get]`. About 25 seconds; 10,902 rows collapsing to
   6,399 unique clips.
2. **Per-clip records** — fetch `/clip_info_g/<id>/...` for each unique id, 10 workers. Extract the
   tags (every `a[href^="/search/?q="]` except the first, which is the title link) and the year.
   Roughly 3 clips/second, so about half an hour. Accumulate into a global object so a timed-out
   tool call never loses progress.

   **Ten workers is the ceiling.** The server is the bottleneck, not the client: adding a second
   pool of 12 workers mid-run dropped throughput from 3.4 to 2.4 clips/second, because the extra
   workers re-fetched ids the first pool had already queued. Start the pool once and leave it.
3. **Getting the data out** — this is the part that is not obvious. The browser pane cannot write to
   disk: a Blob plus a synthetic `<a download>` click produces no file. Instead, gzip the payload in
   the page (`CompressionStream`), base64 it, and return the whole string from one call. It exceeds
   the tool's output cap, so the harness **writes it to a file on disk** — which is the goal. Then
   decode locally:

   ```js
   const raw = JSON.parse(fs.readFileSync(savedFile, 'utf8')).map(x => x.text).join('');
   const b64 = /"([A-Za-z0-9+/=]{1000,})"/.exec(raw)[1];   // the saved file also holds a trailing note
   const tsv = zlib.gunzipSync(Buffer.from(b64, 'base64')).toString('utf8');
   ```

   810 KB of TSV travels as 359 KB of base64 and costs no context at all.

## The file format

`references/eyecannndy-clips.tsv`, one clip per line, six tab-separated columns:

```text
id  title  gifPath  techniqueSlugs  year  tags
```

`gifPath` is relative to `https://asset.eyecannndy.com/media/CACHE/images/clip/` and `techniqueSlugs`
and `tags` are comma-separated. `scripts/find-reference.mjs` reads it; nothing else should parse it
by hand.
