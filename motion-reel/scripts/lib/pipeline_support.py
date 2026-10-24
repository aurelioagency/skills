"""Deterministic helpers shared by the motion-reel CLI and its tests (stdlib only)."""
from __future__ import annotations

import hashlib
import json
import math
import os
from pathlib import Path
import re
import subprocess
import time


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))


def write_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(tmp, path)


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def file_hash(path):
    path = Path(path)
    if not path.is_file():
        return None
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(4 * 1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def fingerprint(paths):
    result = {}
    for path in paths:
        path = Path(path)
        if path.is_dir():
            for f in sorted(path.rglob("*")):
                if f.is_file() and "__pycache__" not in f.parts:
                    result[str(f)] = file_hash(f)
        else:
            result[str(path)] = file_hash(path)
    return result


def words_of(data):
    return [word for segment in data.get("segments", []) for word in segment.get("words", [])] if "segments" in data else data.get("words", [])


def validate_transcript(data, duration):
    words = words_of(data)
    if not words:
        raise ValueError("Transcript has no word timestamps.")
    previous = -1.0
    for word in words:
        start, end = word.get("start"), word.get("end")
        if not isinstance(word.get("word"), str) or not word["word"].strip():
            raise ValueError("Empty transcript word.")
        if any(not isinstance(v, (int, float)) or not math.isfinite(v) for v in (start, end)):
            raise ValueError("Transcript timestamps must be finite numbers.")
        if not 0 <= start <= end <= duration + 0.08 or start < previous:
            raise ValueError(f"Invalid/out-of-order timestamp: {word['word']} {start}-{end}")
        previous = start
    return words


def scale_zones(zones, scale, duration):
    if not zones:
        raise ValueError("Caption zones are empty.")
    out, previous = [], 0.0
    for zone in zones:
        a, b, margin = (zone.get(k) for k in ("start", "end", "marginBottom"))
        if any(not isinstance(v, (int, float)) or not math.isfinite(v) for v in (a, b, margin)):
            raise ValueError("Caption zones require finite start/end/marginBottom.")
        if abs(a - previous) > 0.02 or b <= a or not 0 <= margin <= 1920:
            raise ValueError("Caption zones must tile time without gaps/overlap, in 1080x1920 design coordinates.")
        out.append({"start": a, "end": b, "marginBottom": round(margin * scale)})
        previous = b
    if previous < duration - 0.02:
        raise ValueError("Caption zones do not cover the whole film.")
    return out


def caption_text(config):
    paragraph = str(config.get("paragraph", "")).strip()
    tags = config.get("hashtags", [])
    if not paragraph:
        raise ValueError("Set caption.paragraph to the agreed 2–4 line text.")
    if len(tags) != 4 or len(set(tags)) != 4 or any(not re.fullmatch(r"#[\w]+", t) or t.casefold() == "#lacasadeaurelio" for t in tags):
        raise ValueError("caption.hashtags needs four distinct topic hashtags; the signature is appended automatically.")
    word = str(config.get("commentWord", "")).strip()
    if word and word.casefold() not in paragraph.casefold():
        raise ValueError("The comment word must also appear in the paragraph.")
    blocks = [paragraph]
    if word:
        blocks.append(f"Comentá {word} y te la mando por DM.")
    blocks += ["De la teoría a la práctica: Aurelio Agency →\nhttps://www.aurelioagency.com/es",
               "Unite a la comunidad:\nhttps://www.skool.com/la-casa-de-aurelio-2061",
               " ".join(tags + ["#LaCasaDeAurelio"])]
    dm = None
    if word:
        name, url = config.get("resourceName", "").strip(), config.get("resourceUrl", "").strip()
        if not name or not re.fullmatch(r"https://[^\s]+", url):
            raise ValueError("A DM requires resourceName and an explicitly confirmed resourceUrl; never infer the URL.")
        dm = f"Hola! Acá te dejo {name}:\n{url}\n"
    return "\n\n".join(blocks) + "\n", dm


def probe(path):
    result = subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)], capture_output=True, text=True)
    if result.returncode:
        raise ValueError(f"ffprobe failed: {result.stderr[-1000:]}")
    raw = json.loads(result.stdout)
    video = next((s for s in raw["streams"] if s["codec_type"] == "video"), None)
    if not video:
        raise ValueError("No video stream.")
    w, h = video["width"], video["height"]
    rotation = next((abs(int(float(s.get("rotation", 0)))) for s in video.get("side_data_list", []) if "rotation" in s), 0)
    if rotation in (90, 270):
        w, h = h, w
    n, d = map(float, video.get("avg_frame_rate", video["r_frame_rate"]).split("/"))
    return {"width": w, "height": h, "fps": n / d if d else 0,
            "duration": float(raw["format"]["duration"]),
            "audio": any(s["codec_type"] == "audio" for s in raw["streams"]),
            "hdr": video.get("color_transfer") in ("arib-std-b67", "smpte2084")}


class StepCache:
    """Content-addressed steps. Failed/modified outputs are never considered reusable."""
    def __init__(self, root):
        self.root = Path(root)
        self.path = self.root / "manifests/pipeline-state.json"
        self.state = read_json(self.path) if self.path.exists() else {"version": 1, "steps": {}, "approvals": {}}
        self.events = []

    def save(self):
        write_json(self.path, self.state)

    def run(self, name, key, outputs, action):
        key = digest(key)
        resolve_outputs = outputs if callable(outputs) else lambda: outputs
        expected = lambda: [Path(p) for p in resolve_outputs()]
        paths = expected()
        old = self.state["steps"].get(name, {})
        current = fingerprint(paths)
        valid = all(p.exists() for p in paths) and all(v is not None for v in current.values())
        if old.get("key") == key and valid and current == old.get("outputs"):
            self.events.append({"step": name, "cached": True})
            return
        self.state["steps"].pop(name, None)
        self.save()
        started = time.monotonic()
        action()
        paths = expected()
        if not all(p.exists() for p in paths):
            raise ValueError(f"{name} did not produce its expected output.")
        seconds = round(time.monotonic() - started, 3)
        self.state["steps"][name] = {"key": key, "outputs": fingerprint(paths), "seconds": seconds}
        self.events.append({"step": name, "cached": False, "seconds": seconds})
        self.save()

    def approve(self, gate, key, note):
        if not note.strip():
            raise ValueError("Record the user's explicit approval in --note.")
        self.state["approvals"][gate] = {"key": digest(key), "note": note, "at": time.time()}
        self.save()

    def approved(self, gate, key):
        return self.state["approvals"].get(gate, {}).get("key") == digest(key)

    def require(self, gate, key):
        if not self.approved(gate, key):
            raise ValueError(f"Approval required or stale: {gate}. Show its current artifact and record the user's explicit OK.")
