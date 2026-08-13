# Marking a delivery folder once it is published

Read this when running the **Marking the delivery folder** step of a publish, or when someone has no convention yet and needs one.

## Why it has to happen during the publish

The folder was built in an earlier session — often days earlier, usually from a different chat and a different working directory. Nothing in that folder knows it was published, and nothing in the publishing session knows the folder exists unless someone says so.

The publish is the only moment where both halves are in the same room: the post result with its real date, and the folder the files came from. Miss it and the information is gone — a month later, the only way to tell what shipped is to open each network and compare by eye.

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
