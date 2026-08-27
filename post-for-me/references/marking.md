# Marking a delivery folder once it is published

Read this when running the **Marking the delivery folder** step of a publish, or when someone has no convention yet and needs one.

## Why it has to happen during the publish

The folder was built in an earlier session — often days earlier, usually from a different chat and a different working directory. Nothing in that folder knows it was published, and nothing in the publishing session knows the folder exists unless someone says so.

The publish is the only moment where both halves are in the same room: the post result with its real date, and the folder the files came from. Miss it and the information is gone — a month later, the only way to tell what shipped is to open each network and compare by eye.

## The convention on this machine — settled, do not ask again

Marking is **not optional, not a question, and not conditional on the results**. Every time a post is created, rename the source folder immediately, in the same turn, without asking:

```
<folder>  ->  YYYY-MM-DD_<slug>_post
```

That is `fecha_tema_estado`: three blocks joined by `_`, words inside a block joined by `-`, everything lowercase. The full rules are in **The naming convention** at the bottom of this file.

The date is the publication date. Known deliverable roots on the mounted Drive:

```
G:\Unidades compartidas\Aurelio\Reels\
G:\Unidades compartidas\Aurelio\Carruseles\
```

The only checks that still apply are the idempotence rule and the **When not to mark** list at the bottom. Everything else below is background for a person who has no convention yet.

## The three questions, for someone with no convention

Ask once, use forever. Do not answer them on their behalf.

1. **Do you want published folders marked?** If no, drop it and do not raise it again.
2. **How?** Renaming is the usual answer, because the name shows up in every file listing without opening anything.
3. **Where?** The exact path holding the deliverables. A local path, or a Google Drive path if they have Drive for Desktop mounted. Get the real path.

## The three ways people mark

| Way | What to do | Idempotence check |
|---|---|---|
| **Rename** | Rename the folder to `YYYY-MM-DD_<slug>_post` using the publication date | Already ends in `_post` or `_POST` → leave it |
| **Move** | Move the folder into their `published/` directory | Already there → leave it |
| **Log** | Append date, folder name and `platform_data.url` to their log file | Folder already listed → leave it |

The idempotence check is not optional. Without it a second pass produces `2026-08-13_2026-08-11-thing_post_post`, and the original date is lost.

## Worked example

Carousel deliverables in a Google Drive shared folder mounted through Drive for Desktop, marked by renaming:

```
G:\Unidades compartidas\Aurelio\Carruseles\
    2026-08-11_proactive-loops_post      <- published, do not touch
    claude-nueva-cosa                    <- publish today -> rename
```

Right after the post is created, with `updated_at` = 2026-08-13:

```
claude-nueva-cosa  ->  2026-08-13_claude-nueva-cosa_post
```

## Two things worth saying the first time

**The date becomes the publication date.** If the folder was already dated by creation, marking rewrites that. The two differ, sometimes by weeks. Some people date by creation deliberately, so say it before doing it.

**Renaming on a mounted Drive keeps the file ID.** Links already shared keep working. Worth volunteering, because the fear of breaking shared links is the usual reason people refuse to rename anything.

## When not to mark

Almost never. The owner of this machine decided marking is unconditional: a created post
gets its folder renamed, even while `status` is still `processing` with `results: []`.
Post for Me confirms late, usually after the session ends, so waiting on results means
the folder never gets marked. Do not withhold the rename pending confirmation, and do
not raise it as a question.

Only two exceptions remain:

- **Already marked** — the folder name already ends in `_post`, or in the legacy `_POST`.
  Leave it. A second pass must not produce `2026-08-13_2026-08-11-thing_post_post`.
- **You do not know which folder produced the files.** Ask. Do not guess and rename the
  wrong one.

If results later come back `success: false` on every account, rename the folder back to
its plain name. That is a correction, not a reason to have waited.

## The naming convention: `fecha_tema_estado`

A folder has two shapes, and the difference is the whole point:

```
mcp-mercado-libre                       <- pending: tema only
2026-08-26_mcp-meli-conectar-todo_post  <- published: fecha_tema_estado
```

**The folder handed to you for publishing has no date and no `_post`.** That is the normal
state of a finished-but-unpublished delivery, not an oversight to correct. Marking adds
the two outer blocks around the topic:

```
MCP MERCADO LIBRE  ->  2026-08-27_mcp-mercado-libre_post
```

The topic block is normalised, never replaced. Three blocks means published, one block
means pending — which is why the folder listing works as the queue with no state file.

**Never ask the person to name the folder in this format.** They drop a folder with a
plain descriptive name — uppercase, spaces, accents, whatever reads well to them — and
that is all they owe you. Turning it into a slug is your job, and it happens at marking
time, not before. Do not flag the folder name as a problem, do not rename it ahead of
publishing, and do not read an unnormalised name as a sign the delivery is unfinished.

| Block | Rule |
|---|---|
| `fecha` | ISO 8601 `YYYY-MM-DD`, the publication date. First, so alphabetical order equals chronological order. |
| `tema` | Lowercase slug, words joined by `-`. No spaces, accents, parentheses or doubled separators. |
| `estado` | `post` once published. Absent while unpublished — that absence is what makes the folder listing double as the queue. |

`_` separates blocks, `-` separates words inside a block. Never the reverse.

To normalise an existing name: lowercase it, turn spaces into `-`, collapse repeated `-`,
strip leading and trailing `-`, then join the blocks with `_`.

**Legacy form** `YYYY-MM-DD-<slug>_POST` — hyphen after the date, uppercase suffix — still
counts as marked. Do not re-mark it; rename it to the current form only if you are already
touching that folder for another reason.
