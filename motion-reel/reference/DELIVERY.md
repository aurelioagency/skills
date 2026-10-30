# Delivery and publication

For watched batches, use the root supplied by motion-reel-ingest: `<Videos>/Motion Reel/Entregas/.work/<unique-topic-slug>` for work and `<Videos>/Motion Reel/Entregas/<unique-topic-slug>` for delivery. Existing projects stay in place.

Standalone working project: `<Documents>/motion-reel/.work/<descriptive-topic-slug>`. Delivery: `<Documents>/motion-reel/<slug>`, split into `source/` and `output/`. Use a topic name in kebab-case, never a date, source filename or generic `video1`. The normal workflow is `pipeline.py final`, then `deliver`. Specialized low-level scripts remain available for legacy projects.

## Caption and optional DM

Every finished video includes UTF-8 `caption-<slug>.txt`, plain text, and the full caption pasted in the handoff message:

```text
<2–4 lines on the strongest idea, hook or figure>

De la teoría a la práctica: Aurelio Agency →
https://www.aurelioagency.com/es

Unite a la comunidad:
https://www.skool.com/la-casa-de-aurelio-2061

<four topical hashtags> #LaCasaDeAurelio
```

The fixed blocks/URLs never change. No greeting, headings, Markdown, generic filler or inflated claims. Editorial work is limited to the short opening and four tags. Prefer literal product/tool/concept tags from this video; do not reuse unrelated generic AI buckets. Five tags total; signature last. Configure paragraph/tags once; code assembles the template.

Infer the variant from the actual outro. If it requests a comment word for a resource, set `commentWord` and include that exact word naturally in the paragraph. Code inserts `Comentá <PALABRA> y te la mando por DM.` after it. Do not invent that CTA when absent from the video.

That variant also needs `dm-reply-<slug>.txt`:

```text
Hola! Acá te dejo <nombre del recurso>:
<confirmed resource page URL>
```

One link only, the resource's Aurelio landing page, without community/service links, repository link, installation steps or extra close. The script requires `resourceName` and confirmed HTTPS `resourceUrl`; it does not infer a page from the folder name. Confirm the page's actual URL, or the exact destination explicitly agreed for page creation. An unknown own-resource URL must be obtained. Original repo/tool URLs belong to the resource-page creation task, not this DM. Voseo, simple words. Creating that page or sending a DM is outside this runner.

## Package

`deliver` includes only the explicit final video(s) in `output/`, with caption and optional DM. Branch B video already has subtitles and the cover as frame zero. `source/` includes the standalone cover and readable transcript when present. JSON timestamps, ASS files, raw takes and intermediates stay in work. Other useful material, such as a required music attribution, can be added deliberately using the low-level packager's `--extra` option; preserve it on subsequent deliveries.

The runner uses file copies so later renders cannot change an existing delivery via hardlinks. Automatic replacement requires an unchanged recorded package. If files were added/edited outside the runner, preserve those changes before replacing; do not override blindly.

Show the actual video, full cover and caption in the message for review. Provide accessible per-file links/previews using the current host's supported conventions and the absolute folder path. Open the folder using the host's file tool or native file manager when helpful; do not assume a folder Markdown link works everywhere. Report final duration, measured audio level, creative scores and unresolved defects.

## Drive: separate approval

After explicit approval of the final video, cover and caption for publication, record `approve --gate publish --note "<received OK>"`, then `publish`. The default local mount is `G:\Unidades compartidas\Aurelio\Reels`; `--reels <path>` selects another mount.

One folder per descriptive slug, same source/output structure. No posting date or `_post` suffix; another publishing workflow handles those if needed. The runner refuses to overwrite a published folder and uses `--keep-work` so future corrections can reuse cached work. Deleting the work project is a separate cleanup decision.

The legacy `publish-to-drive.mjs` deletes work unless `--keep-work` is passed: do not call it unguarded from this workflow. If the mount is absent or disk is full, report the actual failure; never delete user files to make space automatically. A successful local copy only means Drive can begin syncing, not that cloud upload has completed. Publishing to a social network is outside this skill.
