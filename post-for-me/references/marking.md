# Marking a delivery folder once it is published

Read this when running the **Marking the delivery folder** step of a publish, or when someone has no convention yet and needs one.

## Why it has to happen during the publish

The folder was built in an earlier session — often days earlier, usually from a different chat and a different working directory. Nothing in that folder knows it was published, and nothing in the publishing session knows the folder exists unless someone says so.

The publish is the only moment where both halves are in the same room: the post result with its real date, and the folder the files came from. Miss it and the information is gone — a month later, the only way to tell what shipped is to open each network and compare by eye.

## The convention on this machine — settled, do not ask again

Marking is **not optional and not a question**. Every time a publish comes back `success` on every account, rename the source folder immediately, in the same turn, without asking:

```
<folder>  ->  YYYY-MM-DD-<folder>_POST
```

The date is the publication date. Known deliverable roots on the mounted Drive:

```
G:\Unidades compartidas\Aurelio\Reels\Finales\
G:\Unidades compartidas\Aurelio\Carrouseles\
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
| **Rename** | Rename the folder to `YYYY-MM-DD-<slug>_POST` using the publication date | Already ends in `_POST` → leave it |
| **Move** | Move the folder into their `published/` directory | Already there → leave it |
| **Log** | Append date, folder name and `platform_data.url` to their log file | Folder already listed → leave it |

The idempotence check is not optional. Without it a second pass produces `2026-08-13-2026-08-11-thing_POST_POST`, and the original date is lost.

## Worked example

Carousel deliverables in a Google Drive shared folder mounted through Drive for Desktop, marked by renaming:

```
G:\Unidades compartidas\Aurelio\Carrouseles\
    2026-08-11-proactive-loops_POST      <- published, do not touch
    claude-nueva-cosa                    <- publish today -> rename
```

After every account comes back `success`, with `updated_at` = 2026-08-13:

```
claude-nueva-cosa  ->  2026-08-13-claude-nueva-cosa_POST
```

## Two things worth saying the first time

**The date becomes the publication date.** If the folder was already dated by creation, marking rewrites that. The two differ, sometimes by weeks. Some people date by creation deliberately, so say it before doing it.

**Renaming on a mounted Drive keeps the file ID.** Links already shared keep working. Worth volunteering, because the fear of breaking shared links is the usual reason people refuse to rename anything.

## When not to mark

- Any account came back `success: false`. A partial publish is not a publish.
- The post is scheduled and has not gone out yet — `status` is `scheduled`, not `processed`.
- It was created with `isDraft`.
- You are not certain which folder produced the files. Ask; do not guess and rename the wrong one.
- **The post is stuck in `processing` with no results at all.** See below — this one does not look like the others.

## The stuck post, which is the case that causes the argument

`success: false` is easy: it failed, do not mark. The hard case is the post that never
answers — `status: "processing"`, `results: []`, and it stays that way.

**The tell is `updated_at` equal to `created_at`.** A post that is genuinely working
through several accounts moves that timestamp. One where both stamps are identical
minutes later never got dispatched at all. Check it before concluding anything:

```ts
const post = await client.socialPosts.retrieve(id);
post.created_at === post.updated_at   // nothing has happened yet
```

**Do not mark it, and say why in one sentence.** Marking writes a publication date into
the folder name, and a wrong date there is worse than no date: every later session
trusts that name and nobody re-checks the network.

Say it explicitly, because otherwise the omission reads as forgetting the step — and the
convention above is emphatic that the step is not optional, which makes silence look
like a mistake. The sentence to use: *"no marqué la carpeta porque el post sigue sin
confirmar en ninguna cuenta"*. Then give the state and let the user decide.

If the user asks for the rename anyway, do it — it is their record and their call — but
state that the mark is going on an unconfirmed publish, and that the folder has to go
back to its plain name if the post turns out not to have gone out.
