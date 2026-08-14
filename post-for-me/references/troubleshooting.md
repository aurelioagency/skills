# Troubleshooting

Real problems, with the evidence that tells them apart. Look at the data before proposing a cause — it saves a lot of back and forth.

## Contents

1. The config deletes itself
2. The server will not start
3. The server does not appear even though the file looks right
4. Invalid JSON
5. npx does not resolve
6. Permissions
7. How to read each log
8. Publishing errors
9. The `execute` tool times out
10. The permission layer denies the call

---

## 1. The config deletes itself

**Symptom.** The block is added, Claude is restarted, and the file comes back without it.

**How to tell the cause apart.** Compare creation time against last modification time:

```powershell
# Windows (PowerShell)
Get-Item "$env:APPDATA\Claude\claude_desktop_config.json" | Select CreationTime, LastWriteTime
```

```bash
# macOS / Linux
stat -f "%SB / %Sm" ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

If both timestamps are identical and recent, the file was **recreated from scratch**, not edited. That points to one of these two:

**Cause A — it was edited while the app was running.** Claude keeps the config in memory and rewrites the whole file when it saves any preference, overwriting the edit. No error is shown.

**Cause B — the JSON was invalid.** Claude could not parse it, discarded the entire file and wrote a default config. Also silent, and more common than it sounds because a stray comma is invisible.

**Fix for both.** Close the app completely, apply the change, validate the JSON, and only then open it. Once the app starts with the block present it loads it into memory, and later writes respect it.

---

## 2. The server will not start

**Symptom.** `mcp-server-post_for_me_api.log` contains error lines, or the server shows an error state.

**Most common cause on Windows.** `"command": "npx"`. On Windows `npx` is a `.cmd` shim rather than an executable, so Claude cannot launch it. The package's official docs ship that example, which is why it fails so often.

```json
"command": "C:\\Program Files\\nodejs\\npx.cmd"
```

Backslashes are doubled — that is JSON escaping, not a typo.

**Other causes.** Node not installed; the app's `PATH` differing from the terminal's (solved the same way, with an absolute path); or a blocked network preventing npx from downloading the package the first time.

**See the real error:**

```bash
npx -y post-for-me-mcp@latest --help
```

If that works in the terminal but fails inside Claude, the problem is the path or the environment, not the package.

---

## 3. The server does not appear even though the file looks right

- **The app was not restarted.** The config is read at startup. Actually close and reopen.
- **The name has odd characters.** Stick to lowercase and underscores.
- **`mcpServers` ended up nested in the wrong place.** It belongs at the JSON root, not inside `preferences` or any other key.
- **The wrong path was edited.** On Windows with the Microsoft Store build there are two visible paths that are the same file; if someone copied the file instead of editing it, they may have modified a real copy rather than the original.

---

## 4. Invalid JSON

The errors that show up most:

| Error | What it looks like |
|---|---|
| Trailing comma | `"env": { ... },` right before `}` |
| Missing comma | Two blocks with no separator between them |
| Unescaped backslashes | `"C:\Program Files\..."` instead of `"C:\\Program Files\\..."` |
| Smart quotes | `“command”` instead of `"command"`, typical when copying from a document |

Always validate before opening the app:

```bash
python -c "import json,sys; json.load(open(sys.argv[1], encoding='utf-8-sig')); print('valid')" <path>
```

---

## 5. npx does not resolve

Check that it exists and where:

```powershell
where npx     # Windows
```

```bash
which npx     # macOS / Linux
```

If nothing comes back, Node.js is missing (`nodejs.org`). If it resolves but Claude still fails, use the absolute path the command returned.

With version managers (nvm, fnm, volta) the path changes when the Node version changes. In that case point at a stable path, or reinstall the block after each version switch.

---

## 6. Permissions

If the installer cannot write:

- **Windows.** Usually an antivirus locking the config folder, or the file open in an editor.
- **macOS.** It may ask for folder access; grant it in System Settings → Privacy & Security.
- **Linux.** Check ownership of `~/.config/Claude`.

The backup is always written before attempting to write, so a permissions failure never leaves anything broken.

---

## 7. How to read each log

The `logs/` folder, next to the config file.

| File | What it tells you |
|---|---|
| `mcp-server-<name>.log` | Server startup and activity. **Size means nothing:** it also stores informational messages. Look for `"level":"error"`, `ENOENT`, `is not recognized`. |
| `mcp.log` | MCP protocol. Look for `Server started and connected successfully`. |
| `main.log` | General app log. Look for `Connected to post_for_me_api (2 tools)`. |
| `mcp-info.json` | **Ignore it.** Often frozen, showing empty lists even when everything works. |

A healthy startup looks like this inside the server log:

```
{"level":"info", ... ,"msg":"MCP Server running on stdio"}
```

If that line is there and there are no error lines, the server came up fine no matter how many kilobytes the file weighs.

`Server disconnected` appears every time Claude closes. It is a normal shutdown, not a failure — what matters is whether the most recent startup came after the most recent real error.

Seeing **2 tools** is correct and not a sign of a partial install: this server uses the "Code Mode" scheme, where the model writes code against the SDK instead of exposing one tool per endpoint.

---

## 8. Publishing errors

These fail *after* the post is created, so the SDK call returns a healthy-looking
`status: "processing"` and the failure only shows up in the post results.

Always read the outcome instead of trusting the create call:

```ts
const res = await client.socialPostResults.list({ post_id: '<id>' });
res.data.map(r => ({ ok: r.success, error: r.error, url: r.platform_data?.url }));
```

The `post_id` filter is applied server-side — verified by comparing an unfiltered call
(rows from many posts) against a filtered one (none). So **an empty `data` means the
networks have not answered yet**, not that the filter failed. Carousels across several
accounts can stay in `processing` for minutes; `updated_at` not moving confirms it.

`limit` on this endpoint is not reliably honoured — a call with `limit: 5` came back
with 16 rows. Never treat a short list as complete.

A failed result means the platform rejected it and **nothing was published on that
account**. Retrying does not create a duplicate. The failed attempt does stay in the
dashboard as an error row, which is worth mentioning to the user so they do not read
it as a double post.

### YouTube — "Cannot bind a list to map for field 'localizations'"

`platform_configurations.youtube` requires `localizations`: leave it out and the code
does not even typecheck (`Property 'localizations' is missing in type ... but required
in type 'YoutubeConfigurationDto'`).

The trap is what you put in it. YouTube's API wants a **map**, not a list, so
`localizations: []` satisfies TypeScript, creates the post, and only then fails against
Google with a 400:

```
Invalid value at 'resource' (Map), Cannot bind a list to map for field 'localizations'.
```

An empty map is correct, and it needs no cast:

```ts
platform_configurations: {
  youtube: {
    title: 'Título del video',
    privacy_status: 'public',
    made_for_kids: false,
    localizations: {}
  }
}
```

Vertical video under a minute lands as a Short on its own — there is no Shorts flag to set.

---

## 9. The `execute` tool times out

**Symptom.** `The code tool execution timed out after 25 seconds.` No partial result
comes back, and because variables do not persist between calls, whatever the code had
already produced is gone.

**Cause.** A hard 25-second wall-clock ceiling on the whole function. It is not a
concurrency limit: nine `createUploadURL()` calls timed out sequentially *and* wrapped
in `Promise.all`.

**Fix.** Split the work and return every batch. Measured on a nine-slide carousel,
each `createUploadURL` costs about 2 seconds and **three per call lands in 7–8 seconds**:

```ts
async function run(client) {
  const results = await Promise.all(
    Array.from({ length: 3 }, () => client.media.createUploadURL())
  );
  return results.map((u: any) => ({ upload_url: u.upload_url, media_url: u.media_url }));
}
```

Three calls of three, collecting the pairs as they come back. Anything not returned is lost.

**Related typo that costs a round trip.** The method is `createUploadURL`. Writing
`createUploadUrl` fails typechecking with `Property 'createUploadUrl' does not exist on
type 'Media'. Did you mean 'createUploadURL'?`

---

## 10. The permission layer denies the call

**Symptom.** `Permission for this action was denied by the Claude Code auto mode
classifier.` It arrives with no prompt shown to the user, and it is **intermittent**:
in one observed session the same `execute` tool ran four times, was denied on the call
that creates the post, was allowed on the retry, then denied on a read-only results
query, then allowed again.

**Cause.** This is the harness, not Post for Me and not the API. The classifier judges
what the action *does*, not which tool runs it, so publishing — public, irreversible,
fanning out to several accounts — is what it stops. In a **non-interactive session** no
approval dialog can be raised, so an action it will not wave through can only be denied.

**What this means for the work, and it is the important part.** A denial on the create
call means **nothing was created** — the call never ran. But do not assume that about
every error: see §8 on `external_id`, and check before re-sending. Never re-issue a
publish on the assumption that the first one did not go through.

**Fix.** An explicit rule in `permissions.allow` outranks the classifier. In
`~/.claude/settings.json`:

```json
"permissions": {
  "allow": [
    "mcp__post_for_me_api__execute"
  ]
}
```

It takes effect in a new session, not the current one.

**Claude cannot apply this fix itself, and should not try.** Editing the file that
grants its own permissions is denied by the same classifier — correctly. Hand the user
the exact line and let them paste it.

**Say the cost out loud when proposing it.** That rule covers the *whole* tool, reads
and writes alike, so publishing loses its automatic brake. What remains is the
confirmation gate in `SKILL.md` — accounts, caption, media, timing — which is a
protocol Claude follows, not something the harness enforces. Anyone who wants a machine
check on publishing specifically should leave the setting alone and publish from an
interactive session, where the prompt actually appears.

---

## Verifying without publishing

To confirm the key works, a read is enough:

```bash
python scripts/verify_mcp.py --check-api
```

In the chat, the equivalent is asking *"what accounts do I have connected in Post for Me?"*.

Never use a post as a test. It goes out to the person's real networks, it is visible to their audience, and Post for Me cannot retract it afterwards — it would have to be deleted by hand on every platform.
