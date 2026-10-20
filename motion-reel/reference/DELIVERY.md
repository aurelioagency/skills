# Project folders, caption, DM reply, delivery folder and Drive (both branches)

A copy of social-video-producer's **Post Description**, **DM Reply**, **Delivery Package** and **Publish To Drive** sections, with the paths changed to this skill (`<Documents>\motion-reel\`). The two scripts, `scripts/deliver-package.mjs` and `scripts/publish-to-drive.mjs`, are the same as that skill's; `deliver-package.mjs` also reads this skill's transcript at `transcript/approved.json`. When a rule changes in one skill, change it in the other.

**Project layout (both branches).** Every project lives at `<Documents>\motion-reel\.work\<slug>\` (derive `<Documents>` from the current environment), and its delivery folder is `<Documents>\motion-reel\<slug>\`. **The slug must be descriptive of the video's actual topic, in kebab-case**: never the source filename, a date or a non-descriptive label (`0824`, `video1`, `reel-1019`, `final2`). In Branch A it comes from the product at intake. In Branch B it is not knowable before the transcript is read, so if the project must be created first, use a short placeholder and rename the folder plus every file inside it that carries the slug right after the Transcript Approval Gate. Never ship a delivery folder or final filename still named after a placeholder. **Before renaming the project folder or running `publish-to-drive.mjs`, get the shell out of it** (`cd` to `<Documents>`; the shell's working directory persists between commands): a session whose working directory is inside `.work\<slug>\` cannot rename that folder and `publish-to-drive.mjs` cannot delete it (`EPERM`).

```text
motion-reel\<slug>\              <- DELIVERY: only what the user consumes
  source\
    <slug>-portada.png            (Branch B)
    transcript-<slug>.txt         (when the video has a voice)
  output\
    <the finished video(s)>       (Branch B: subtitles + cover as frame 0; Branch A: one per format)
    caption-<slug>.txt
    dm-reply-<slug>.txt           (only when the caption has the comment-for-DM line)

motion-reel\.work\<slug>\        <- the project; the user never has to open it
```

## Post Description (Social Caption)

Every finished video ships with a ready-to-publish post description in `caption-<slug>.txt` next to the final MP4 in `renders\final\`, plus pasted in the chat. Plain text, UTF-8, no markdown, no headings, nothing but the caption itself, ready to select-all and paste.

**Caption template (Instagram / TikTok), La Casa de Aurelio:**

```text
<2-4 lineas que resumen el gancho o insight principal del video, tono directo, sin relleno>

De la teoría a la práctica: Aurelio Agency →
https://www.aurelioagency.com/es

Unite a la comunidad:
https://www.skool.com/la-casa-de-aurelio-2061

<4 hashtags dinamicos segun el tema> #LaCasaDeAurelio
```

Rules:

- The caption opens directly with the written paragraph. There is no "Bienvenidos a la Casa de Aurelio!" greeting any more (removed 2026-10-02 at the user's request — it had become redundant); never add it back.
- The services paragraph links and both URLs are **fixed**. Never reword, translate, shorten, or adapt them.
- The only written block is the 2-4 line paragraph: it restates the video's strongest idea, hook, or figure — not a recap of every line spoken. No filler, no generic AI phrasing, no inflated claims. Natural rhythm for the language actually spoken in the video.
- **Deduce the variant from what the video's outro actually says — never ask when the material already answers it.** If the outro asks the viewer to comment a word to receive something by DM (a skill, a template, a resource), insert a `Comentá <PALABRA> y te la mando por DM.` line right after the written paragraph, and make sure that exact word also appears written out in the paragraph itself. Otherwise, skip that line entirely — do not invent a comment CTA the video never asked for. Only ask the user if the outro itself leaves the intent ambiguous.
- **Exactly 5 hashtags, always.** One fixed: `#LaCasaDeAurelio`, always last, as signature. The other four are dynamic, picked by the video's actual topic:
  - Agentes / automatización de tareas → `#AIAgents #Agentic #Automatizacion #AIWorkflows`
  - n8n / workflows → `#n8n #NoCode #WorkflowAutomation #Automatizacion`
  - OpenAI / modelos puntuales → `#OpenAI #Codex #GPT #IA`
  - Claude / Anthropic → `#Claude #Anthropic #IA #AIWorkflows`
  - Productividad / negocio → `#Productividad #FutureOfWork #PYMES #IA`
  - Desarrollo / código → `#DevTools #SoftwareEngineering #IA`
  - Ninguna categoría encaja → construí los cuatro con palabras literales del video (nombres de herramientas, conceptos técnicos, el tema puntual tratado).
- **When the video names a specific tool or product, prefer literal tags built from that name over the generic category bucket, even when the bucket technically fits.** The buckets above are a fallback for when nothing in the video gives you a sharper tag, not the default reach for any video that's broadly "about agents" or "about código." A video about a named tool (e.g. Iris, an MCP screenshot tool) gets tags like `#Iris #MCP #CodingAgents #DevTools`, not the same `#AIAgents #Agentic #Automatizacion #AIWorkflows` set reused from an unrelated agents video — reusing one bucket across different videos is exactly the "always the same hashtags" failure to avoid. Confirmed: the user caught this after a video got the same Agentes bucket as prior unrelated videos despite covering a specifically named tool.
- A hashtag off-topic subtracts more than it adds: don't reach for `#Claude`, `#IA`, `#Automatizacion` or `#AIWorkflows` as filler defaults when the video isn't actually about that — pick what the video is actually about.
- Blank lines between blocks exactly as shown in the template.

### DM Reply (Resource Hand-off)

Whenever the caption gets the `Comentá <PALABRA> y te la mando por DM.` line (see the rule above), also write `dm-reply-<slug>.txt` next to it in `renders\final\`. It is the manual fallback: the text to paste if the resource ever has to be sent by hand instead of by the ReplyKaro automation. `deliver-package.mjs` auto-detects and ships this file the same way it does the caption — optional, so branches with no comment-CTA simply have none.

Plain text, UTF-8, ready to paste into a DM. **One link only: the resource page URL** (`https://www.aurelioagency.com/blog/<slug>`, `<slug>` = the delivery folder name). That page already unifies everything (the resource, the Skool community, Aurelio Agency), so nothing else goes in the message. Exact structure, confirmed with the user 2026-10-07:

```text
Hola! Acá te dejo <nombre del recurso>:
https://www.aurelioagency.com/blog/<slug>
```

- It is the **manual fallback**: the message to paste if the resource has to be sent by hand. The ReplyKaro automation does not use its text, only the page URL in it.
- **No** Skool line, **no** Aurelio Agency close, **no** repo or tool link, **no** install steps — never add them back (the user had to correct this twice).
- The page URL is deterministic from the slug, so the file can be written before the page exists; `resource-page` then creates the page at that address. **That only holds when the resource is external (a repo, someone else's tool) and `resource-page` will create the page.** If the link is not known for sure, **never deduce or invent the URL: ask the user for the exact link before writing `dm-reply-<slug>.txt`**. Own resource (already a page of aurelioagency.com) without its link: ask for that link and use it as is. External resource without its link: ask for the resource's link anyway, so `resource-page` can create the page that points to it (confirmed 2026-10-13: a `blog/<slug>` link made up from the folder name shipped in the dm-reply and to Drive, pointing to a page that does not exist).
- The real source link of the resource (repo, tool site) goes only to `resource-page` with `--github <url>`, taken from what the video's transcript shows or says; if it cannot be confirmed, verify at the source with `gh`/`WebFetch`, never guess.
- Voseo, simple words.


## Delivery Package (mandatory final step)

A file buried in `renders\final\` next to manifests, audits and snapshots has not been delivered. Every finished run ends by gathering the deliverables into the video's own folder, `<Documents>\motion-reel\<slug>\` — the script derives it from the project's location under `.work\`:

```powershell
node "<skill-dir>\scripts\deliver-package.mjs" --project "<project>"
```

- **Before running it, list `renders\final\` and confirm it contains exactly the video(s) meant to ship — no intermediate render left behind.** `deliver-package.mjs` picks up every `.mp4`/`.mov`/`.webm` in that folder by default, so a pre-cover or pre-fix intermediate that was rebuilt but not moved out (to `renders\pre-cover\` or similar) gets delivered and published alongside the real final file. This happened for real: an older no-cover render sat in `renders\final\` after a caption re-burn and both files shipped to the user's local delivery folder AND the Drive publish before it was caught. Whenever a video in `renders\final\` is rebuilt, move the file it replaces out of that folder in the same step — do not leave two videos there "to compare later." If a stray file is only discovered after `deliver-package.mjs` or `publish-to-drive.mjs` already ran, delete it from both the local delivery folder and the Drive copy, not just from the project.
- It lives inside the project, which lives inside the working directory — that is what makes the links clickable. The script refuses to run under a placeholder slug (`tmp-0826`, `video1`, `final2`), because the whole point is that the user can tell which video is which from the folder name.
- Large files are hardlinked rather than copied, so the tidy folder costs no extra disk. Editing a delivered file edits the one in `renders\final\` too — they are the same bytes. Re-run with `--overwrite` after a re-render.
- The folder is split into exactly two subfolders:
  - `source\` — the cover `<slug>-portada.png` on its own, `transcript-<slug>.txt` (the full transcript as readable wrapped prose), and any `--extra` file. Raw material, not the deliverable. The user's own raw originals stay in `.work\<slug>\assets\source\` and never ship here.
  - `output\` — the finished video with the cover burned in as frame 0 (see COVER.md) plus the post description `caption-<slug>.txt`, plus `dm-reply-<slug>.txt` when the caption carries a comment-for-DM CTA (see **DM Reply (Resource Hand-off)** — optional, auto-detected, not every video has one). Once the cover is frame 0, the video needs no further human edit, so it ships as the finished, ready-to-post asset directly in `output\` — it does not wait there empty for someone else to drop a cut in.
- **The word-level transcript JSON does NOT ship.** It is a build input for the caption pipeline, not a deliverable. It stays in the project under `transcript\`. The same goes for every other intermediate: manifests, audits, snapshots, segment renders, the extracted WAV. A delivery folder is what the user consumes, not a copy of the workspace.
- Add something else only when the user would actually use it, via `--extra` (e.g. the attribution text for licensed music). The subtitle `.ass` does **not** ship: approved means the subtitles are final and never hand-edited again, so it stays in `.work\` and is deleted at publish.
- **Hand over clickable links, and know exactly what is clickable.** Three rules learned the hard way:
  - A link works only when its href is a path **relative to the working directory and inside it**. A path that escapes the working directory fails with "outside the working directory", so `../Downloads/...` never works from `Documents`.
  - A `file:///` URL is never clickable here. Do not use one.
  - **A folder link cannot be opened. Verified twice on this harness:** a path outside the working directory fails with "outside the working directory", and a folder path *inside* it fails with "no se pudo encontrar este archivo" even when the folder demonstrably exists — the viewer resolves files only. Do not offer a folder as a clickable link, and do not promise one. If the user asks for one, say plainly that this interface cannot do it and give them the two things that work.
- **To give the user a one-click "open the delivery folder", use a shell command block.** The harness puts a Run button on any fenced ` ```bash ` block, so this is the click that actually opens the folder — the thing a markdown link cannot do. Always include it, right at the top of the handoff:

  ````text
  ```bash
  explorer.exe "<Documents>\motion-reel\<slug>"
  ```
  ````

  (`open` on macOS, `xdg-open` on Linux.) When the user asks for "a clickable link to the folder", this is the answer — not an apology about what links cannot do. Reach for a Run block whenever the goal is an action rather than viewing a file.
- Then, underneath: **one link per file**, relative to the working directory — `[<slug>-subs.mp4](motion-reel/<slug>/source/<slug>-subs.mp4)`, `[caption-<slug>.txt](motion-reel/<slug>/output/caption-<slug>.txt)` — and the absolute path as plain text to copy-paste. The script also opens the folder once on its own when it finishes.
- The script also opens the folder in the file manager (`--no-open` to skip), which is the only way a folder actually opens for the user.
- Still send the final video itself through the normal file-sending path so it previews in the conversation. If it is too large to upload, say so plainly and point at the folder.

- Report exact final paths and any remaining risk — after the delivery folder link.

## Publish To Drive (after the user approves)

`deliver-package.mjs` hands the delivery folder to the user for review. It does **not** touch Drive. Only once the user has explicitly approved the video, cover and caption, mirror the delivery folder into the Aurelio **Reels** shared drive:

```powershell
node "<skill-dir>\scripts\publish-to-drive.mjs" --project "<project>"
```

- The shared drive is mounted locally by Google Drive for desktop, so this is a plain folder copy — Drive syncs it up. On Windows the mount is `G:\Unidades compartidas\Aurelio\Reels`; pass `--reels "<path>"` on another machine.
- It creates one folder per video, `<Reels>\<slug>\`, named **only** after the descriptive slug, with the **same `source\` + `output\` split** the delivery folder has. Adding the posting date and `_post` suffix (`<YYYY-MM-DD>_<slug>_post\`) is a separate publishing skill's job, done when the content is actually posted — never here. `--overwrite` replaces an existing folder; `--dry-run` shows what would be copied.
- The finished, human-edited reel is added to that folder's `output\` later by whoever edits it — this skill only seeds `source\` and the caption.
- **On success it deletes the whole `.work\<slug>\` build tree.** Publishing means approved, and by then the delivery folder and the Drive copy hold everything the user keeps; `.work` is only extracted audio, transcripts, manifests, snapshots, cover frames, the copy of the source, the drafts, node_modules, and a final MP4 that is just a hardlink to the delivery copy — none of it worth its gigabyte. Pass `--keep-work` to keep it (e.g. a repair is likely). `--dry-run` reports what it would copy and delete.
- Never run this before approval, and never as part of the same breath as `deliver-package.mjs`. Approval is a separate, explicit go-ahead from the user.
- Large videos (100 MB+) copy instantly to the local mount but take a few minutes to finish uploading in the background; report that the copy is done and Drive is syncing, don't claim the upload is complete.
- **Disco lleno:** si falla con `ENOSPC`, el disco C no tiene lugar para la caché de Drive (la unidad G: usa C). Con menos de ~0,5 GB libres no sube. No se borra nada sin el OK del usuario: proponerle liberar espacio o borrar los intermedios del proyecto (los drafts de `renders\`, `review\`, snapshots) y reintentar con `--overwrite`.
- **`EPERM` al borrar `.work\<slug>`:** la sesión de Claude tiene ese proyecto como carpeta de trabajo, o un ffmpeg viejo lo tiene abierto. La copia a Drive ya quedó hecha; mover la sesión a otra carpeta antes de publicar y borrar `.work\<slug>` después. Antes de empezar, que no quede un ffmpeg colgado de una prueba (`ssim` con `-loop 1` sin `-t` no termina nunca).
- Si después de publicar se cambia algo en la carpeta de entrega (por ejemplo el `dm-reply`), copiar el archivo también a Drive y comparar con `md5sum`.
