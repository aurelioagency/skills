# MiniMax H3 on KIE.ai — what the API actually accepts

Everything here is from the KIE docs (`https://docs.kie.ai/market/minimax-h3/...`) or from
runs against the live API. Nothing is guessed. If a field is not listed here, it does not exist —
do not invent parameters.

## Endpoints

| Purpose | Call |
|---|---|
| Submit a job | `POST https://api.kie.ai/api/v1/jobs/createTask` |
| Check a job | `GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId=...` |
| Credit balance | `GET https://api.kie.ai/api/v1/chat/credit` |
| Upload a local file | `POST https://kieai.redpandaai.co/api/file-base64-upload` |

Auth on all of them: `Authorization: Bearer <KIE_API_KEY>`.

Generation is asynchronous: `createTask` returns a `taskId` and nothing else. The result URL only
appears once `recordInfo` reports `state: "success"`, inside `resultJson.resultUrls[0]`.

Uploaded files are **deleted by KIE after 24 hours**. The job folder must keep its own copy of
every input; the returned URL is disposable.

## The three modes

The mode is the model id. There is no "role" field — each endpoint has its own input shape.

### `minimax-h3/text-to-video`

| Field | Required | Values |
|---|---|---|
| `prompt` | yes | 1–7000 chars |
| `aspect_ratio` | yes | `21:9` `16:9` `4:3` `1:1` `3:4` `9:16` |
| `duration` | yes | integer 4–15 (default 6) |
| `resolution` | no | `768P` or `2K` (default `2K`) |

### `minimax-h3/image-to-video`

| Field | Required | Values |
|---|---|---|
| `prompt` | yes | 1–7000 chars |
| `first_frame_url` | one of the two | image URL |
| `last_frame_url` | one of the two | image URL |
| `duration` | yes | integer 4–15 (default 6) |
| `resolution` | no | `768P` or `2K` (default `2K`) |

**There is no `aspect_ratio` here.** The framing comes from the image. Only two images fit in this
mode, and they are the exact opening and closing frames — this is the only mode that gives a clean
cut in and out of surrounding footage.

### `minimax-h3/reference-to-video`

| Field | Required | Values |
|---|---|---|
| `prompt` | yes | 1–7000 chars |
| `reference_image_urls` | at least one of image/video | array, max 9 |
| `reference_video_urls` | at least one of image/video | array, max 3 |
| `reference_audio_urls` | no | array, max 3 — needs an accompanying image or video |
| `aspect_ratio` | no | `adaptive` (default) `21:9` `16:9` `4:3` `1:1` `3:4` `9:16` |
| `duration` | yes | integer 4–15 (default 6) |
| `resolution` | no | `768P` or `2K` (default `2K`) |

More material fits here, but **there is no first/last frame control**. Choosing ref2v means giving
up the exact cut. What `reference_audio_urls` does to the output is not documented — do not promise
a behaviour that has not been tested.

## Input file limits

| Kind | Formats | Max size | Other |
|---|---|---|---|
| Image | JPG, JPEG, PNG, WEBP, HEIC, HEIF | 30 MB each | side 256–5760 px, aspect ratio 0.4–2.5 |
| Video | MP4, MOV (H.264/H.265, AAC/MP3) | 50 MB each | 2–15 s each, ≤15 s total, 23.976–60 fps |
| Audio | WAV, MP3 | 15 MB each | 2–15 s each, ≤15 s total |

## Cost

| Resolution | Credits per second |
|---|---|
| `768P` | 16 |
| `2K` | 26 |

**Input video seconds are billed too**: `credits = rate × (generated seconds + input video seconds)`.
A 6 s clip at 768P with a 5 s reference video costs `16 × 11 = 176`, not 96.

`resolution` defaults to `2K` server-side. Always send it explicitly. This skill sends `768P`
unless the user has approved 2K for that specific run.

## What does not exist

- **No `seed`.** Two identical requests give two different videos.
- **No prompt optimizer / rewriter flag.**
- **No negative prompt field** — negatives go in the prompt text itself.

The consequence is structural, not bad luck: **a 768P take that came out right cannot be
reproduced at 2K.** A 2K pass is a new roll of the dice. Say this to the user before they pay for it.

## Measured, not documented

- **`duration` is a request, not a contract.** Two runs at `duration: 4` both returned **4.458s**
  (107 frames at 24 fps), not 4.000s. Budget for the overshoot: if the clip has to hit an exact
  length for a splice, trim it in post rather than asking for a shorter duration.
- **768P output is 1344x768** for a 16:9 input image.
- **Generation time varies widely.** Two 4-second 768P clips, same account, minutes apart: one
  finished in 41s, the other spent 3 minutes queued before generating and took 226s in total. The
  poll timeout defaults to 20 minutes for that reason.
