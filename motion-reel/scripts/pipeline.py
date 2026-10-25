#!/usr/bin/env python
"""Motion Reel: deterministic production stages; creative work remains in film.js.

Run from anywhere. Logs stay on disk; stdout is one compact JSON result. No LLM calls.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time

from lib.pipeline_support import (StepCache, caption_text, digest, file_hash, fingerprint,
                                  probe, read_json, scale_zones, validate_transcript, words_of, write_json)

SKILL = Path(__file__).resolve().parent.parent
SIZES = {"9x16": (1080, 1920), "16x9": (1920, 1080), "1x1": (1080, 1080), "4x5": (1080, 1350)}
FONT = "assets/fonts/captions/NeueMontreal-Bold.otf"
GATES = ("cuts", "union", "transcript", "plan", "first-look", "draft", "publish")


def initialize(root, branch, source=None, takes=None, preset=None):
    if root.exists() and any(root.iterdir()):
        raise ValueError("Project must be new and empty. Existing projects are never overwritten.")
    for source_file in ([source] if source else takes or []):
        if not Path(source_file).is_file():
            raise ValueError(f"Missing input: {source_file}")
    for directory in ("film/lib", "docs", "audio/vo", "assets/source", "assets/fonts", "assets/brand",
                      "transcript", "manifests/audits", "snapshots", "renders/final", "review", "scripts"):
        (root / directory).mkdir(parents=True, exist_ok=True)
    for name in ("core.js", "type.js", "index.html", "film.js"):
        shutil.copy2(SKILL / "engine" / name, root / "film" / name)
    shutil.copytree(SKILL / "engine/lib", root / "film/lib", dirs_exist_ok=True)
    shutil.copytree(SKILL / "scripts", root / "scripts", dirs_exist_ok=True, ignore=shutil.ignore_patterns("__pycache__"))
    shutil.copytree(SKILL / "templates/docs", root / "docs", dirs_exist_ok=True)
    shutil.copytree(SKILL / "sfx", root / "sfx-lib")
    shutil.copy2(SKILL / "templates/brief.md", root / "brief.md")
    timeline = read_json(SKILL / "templates/timeline.json")
    config = {"version": 1, "branch": branch, "source": None, "takes": [], "language": "es", "model": "large-v3",
              "resources": [], "edits": {"color": 0.35, "keep": [], "cut": []},
              "captions": {"zones": None, "singleShot": True},
              "render": {"workers": "auto", "segmentSeconds": 3},
              "cover": {"input": None, "frame": 0, "lines": [], "yOffset": 0},
              "caption": {"paragraph": "", "hashtags": [], "commentWord": "", "resourceName": "", "resourceUrl": ""}}
    if branch == "B":
        timeline.update(bpm=60, formats=["9x16"], music={"source": "narration"}, voiceover=None,
                        marks={}, sfx=[], mix={"music": 0, "sfx": -3, "vo": 0, "duck": False})
        for name in ("video.js", "overlay.js"):
            shutil.copy2(SKILL / "engine" / name, root / "film" / name)
        shutil.copy2(SKILL / "engine/film_overlay.js", root / "film/film.js")
        shutil.copytree(SKILL / "assets/brand/aurelio", root / "assets/brand/aurelio", dirs_exist_ok=True)
        html = root / "film/index.html"
        html.write_text(html.read_text(encoding="utf-8").replace('<script src="film.js">',
                        '<script src="video.js"></script>\n<script src="overlay.js"></script>\n<script src="film.js">'), encoding="utf-8")
    if source:
        src = Path(source).resolve()
        dest = root / "assets/source" / ("source" + src.suffix.lower())
        shutil.copy2(src, dest)
        config["source"] = dest.relative_to(root).as_posix()
    if takes:
        # The caller determines semantic order; preserve the explicitly supplied order.
        for i, value in enumerate(takes, 1):
            src = Path(value).resolve()
            dest = root / "assets/source" / f"take-{i:02d}{src.suffix.lower()}"
            shutil.copy2(src, dest)
            config["takes"].append(dest.relative_to(root).as_posix())
    write_json(root / "timeline.json", timeline)
    write_json(root / "pipeline.json", config)
    (root / ".owner").write_text("motion-reel pipeline " + time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), encoding="utf-8")
    p = Pipeline(root)
    if preset:
        target = Path(preset).resolve() if Path(preset).exists() else SKILL / "presets" / preset
        p.command("preset", ["node", str(SKILL / "scripts/preset.mjs"), str(target), str(root)])
    p.command("initial-sync", p.js("sync.mjs"))
    return {"project": str(root), "config": str(root / "pipeline.json"), "next": "prepare" if takes else "transcribe" if branch == "B" else "plan"}


class Pipeline:
    def __init__(self, root):
        self.root = Path(root).resolve()
        self.config = read_json(self.p("pipeline.json"))
        if self.config.get("version") != 1 or self.config.get("branch") not in ("A", "B"):
            raise ValueError("Unsupported pipeline configuration.")
        self.cache = StepCache(self.root)
        self.tools_key = fingerprint([SKILL / "scripts"])

    def p(self, value):
        return self.root / value

    def js(self, name, *args):
        return ["node", str(SKILL / "scripts" / name), *map(str, args)]

    def py(self, name, *args):
        return [sys.executable, str(SKILL / "scripts" / name), *map(str, args)]

    def command(self, name, args):
        logs = self.p("manifests/logs")
        logs.mkdir(parents=True, exist_ok=True)
        log = logs / (re.sub(r"[^a-zA-Z0-9_-]", "_", name) + ".log")
        env = os.environ.copy()
        modules = env.get("MOTION_REEL_NODE_MODULES", str(SKILL / "node_modules"))
        env["NODE_PATH"] = modules + (os.pathsep + env["NODE_PATH"] if env.get("NODE_PATH") else "")
        env["MOTION_REEL_MUSIC_LIB"] = str(SKILL / "music")
        env["PYTHON_PATH"] = sys.executable
        env["PYTHONIOENCODING"] = "utf-8"
        env["PYTHONDONTWRITEBYTECODE"] = "1"
        started = time.monotonic()
        with log.open("w", encoding="utf-8") as stream:
            completed = subprocess.run(list(map(str, args)), cwd=self.root, env=env, stdout=stream,
                                       stderr=subprocess.STDOUT, creationflags=0x08000000 if os.name == "nt" else 0)
        record = {"step": name, "seconds": round(time.monotonic() - started, 3), "exitCode": completed.returncode,
                  "log": str(log), "logBytes": log.stat().st_size}
        with self.p("manifests/commands.jsonl").open("a", encoding="utf-8") as stream:
            stream.write(json.dumps(record) + "\n")
        if completed.returncode:
            raise ValueError(f"{name} failed. Log: {log}\n" + log.read_text(encoding="utf-8", errors="replace")[-1800:])
        return log

    def step(self, name, values, inputs, outputs, action):
        self.cache.run(name, {"tools": self.tools_key, "values": values, "inputs": fingerprint(inputs)}, outputs, action)

    def source(self):
        if self.config.get("takes"):
            return self.p(f"assets/source/{self.root.name}-edit.mp4")
        if not self.config.get("source"):
            raise ValueError("Set pipeline.json source or initialize with --source/--takes.")
        return self.p(self.config["source"])

    def source_key(self):
        inputs = [self.p(t) for t in self.config.get("takes", [])] or [self.source()]
        return {"files": fingerprint(inputs), "edits": self.config.get("edits"), "joined": file_hash(self.source())}

    def prepare_key(self):
        return {"takes": fingerprint([self.p(t) for t in self.config.get("takes", [])]),
                "color": self.config["edits"]["color"], "language": self.config["language"], "model": self.config["model"],
                "plan": file_hash(self.p("manifests/takes-plan.json")),
                "comparison": file_hash(self.p("snapshots/color-before-after.png"))}

    def transcript_key(self):
        return {"source": self.source_key(), "raw": file_hash(self.p("transcript/transcript.json")),
                "language": self.config["language"], "model": self.config["model"]}

    def visual_key(self):
        tl = read_json(self.p("timeline.json"))
        # Sound-only edits must remux, not recapture frames. film.js must not read mix/sfx.
        visual_tl = {k: v for k, v in tl.items() if k not in ("mix", "sfx")}
        films = [p for p in self.p("film").rglob("*") if p.is_file() and p.name != "data.js"]
        return {"timeline": visual_tl, "files": fingerprint(films + [self.p("assets"), self.p("beats.json"), self.p("audio/vo_placed.json")]), "source": self.source_key() if self.config["branch"] == "B" else None}

    def draft_paths(self):
        return [self.p("renders/draft_9x16_subs.mp4")] if self.config["branch"] == "B" else [self.p(f"renders/draft_{fmt}.mp4") for fmt in read_json(self.p("timeline.json"))["formats"]]

    def final_paths(self):
        return [self.p(f"renders/final/{self.root.name}-final.mp4")] if self.config["branch"] == "B" else [self.p(f"renders/final/{self.root.name}-{fmt}.mp4") for fmt in read_json(self.p("timeline.json"))["formats"]]

    def gate_key(self, gate):
        c = self.config
        if gate == "cuts":
            return {"takes": fingerprint([self.p(t) for t in c.get("takes", [])]), "edits": c["edits"], "plan": file_hash(self.p("manifests/takes-plan.json"))}
        if gate == "union":
            return {"cuts": self.gate_key("cuts"), "source": file_hash(self.source()), "preview": file_hash(self.p("review/union-preview.mp4"))}
        if gate == "transcript":
            return {"source": self.source_key(), "approved": file_hash(self.p("transcript/approved.json"))}
        if gate in ("plan", "first-look"):
            plan = "overlay_plan.md" if c["branch"] == "B" else "shotlist.md"
            return {"plan": file_hash(self.p("docs/" + plan)), "brief": file_hash(self.p("brief.md")),
                    "transcript": self.gate_key("transcript") if c["branch"] == "B" else None}
        if gate == "draft":
            return {"tools": self.tools_key, "plan": self.gate_key("plan"), "visual": self.visual_key(), "audio": file_hash(self.p("audio/mix.wav")),
                    "captions": c.get("captions"), "draft": fingerprint(self.draft_paths()),
                    "zoneInput": file_hash(self.p(c.get("captions", {}).get("zones") or "__no_zone_override__")),
                    "zones": file_hash(self.p("manifests/caption-zones-draft.json")),
                    "transcript": file_hash(self.p("transcript/approved.json")),
                    "timelineAudio": {k: read_json(self.p("timeline.json")).get(k) for k in ("sfx", "mix")},
                    "bed": c.get("bed"), "bedInput": file_hash(self.p(c.get("bed", {}).get("track") or "__library_bed__")),
                    "audioInputs": fingerprint([self.p(f"audio/{k}.wav") for k in ("music", "vo")])}
        if gate == "publish":
            return {"draft": self.gate_key("draft"), "final": fingerprint(self.final_paths()),
                    "cover": c.get("cover"), "caption": c.get("caption"), "delivery": fingerprint([self.delivery_dir()])}
        raise ValueError(f"Unknown gate {gate}")

    def approve(self, gate, note):
        requirements = {
            "cuts": [self.p("manifests/takes-plan.json")], "union": [self.source(), self.p("review/union-preview.mp4")] if self.config["branch"] == "B" else [],
            "transcript": [self.p("transcript/approved.json")],
            "plan": [self.p("docs/overlay_plan.md" if self.config["branch"] == "B" else "docs/shotlist.md")],
            "first-look": self.draft_paths(), "draft": self.draft_paths(), "publish": [self.delivery_dir()]}
        for path in requirements[gate]:
            if not path.exists():
                raise ValueError(f"Cannot approve missing artifact: {path}")
        if gate == "cuts":
            self.require_receipt("prepare", self.prepare_key())
        if gate == "union":
            self.require("cuts")
            self.require_receipt("join", self.gate_key("union"))
        if gate == "transcript":
            self.require_receipt("transcribe", self.transcript_key())
            validate_transcript(read_json(self.p("transcript/approved.json")), probe(self.source())["duration"])
        if gate in ("first-look", "draft"):
            self.require("plan")
            self.require_current_draft()
        if gate == "draft":
            self.require("first-look")
        if gate == "publish":
            self.require("draft")
            self.require_current_final()
            self.require_receipt("delivery", self.delivery_key())
        self.cache.approve(gate, self.gate_key(gate), note)

    def require(self, gate):
        self.cache.require(gate, self.gate_key(gate))

    def receipt(self, name, key):
        self.cache.state.setdefault("receipts", {})[name] = digest(key)
        self.cache.save()

    def require_receipt(self, name, key):
        if self.cache.state.get("receipts", {}).get(name) != digest(key):
            raise ValueError(f"{name} is missing or stale; run {name} for the current inputs before approving or continuing.")

    def require_current_draft(self):
        self.require_receipt("draft", self.gate_key("draft"))

    def final_key(self):
        return {"draft": self.gate_key("draft"), "cover": self.config.get("cover"),
                "coverInput": file_hash(self.p(self.config.get("cover", {}).get("input") or self.source())) if self.config["branch"] == "B" else None,
                "caption": self.config.get("caption"), "files": fingerprint(self.final_paths()),
                "coverOutput": file_hash(self.p(f"renders/final/{self.root.name}-portada.png")),
                "texts": fingerprint([self.p(f"renders/final/{name}-{self.root.name}.txt") for name in ("caption", "dm-reply")])}

    def require_current_final(self):
        self.require_receipt("final", self.final_key())

    def prepare(self):
        takes = [self.p(t) for t in self.config.get("takes", [])]
        if not takes:
            raise ValueError("prepare is for raw takes; use transcribe for an edited source.")
        out = self.p("manifests/takes-plan.json")
        edits = self.config["edits"]
        def prepare_outputs():
            outputs = [out, self.p("snapshots/color-before-after.png")]
            candidates = read_json(out).get("cover_candidates", []) if out.exists() else []
            if candidates:
                outputs += [self.p("snapshots/cover-candidates.png")] + [self.p(c["png"]) for c in candidates]
            return outputs
        self.step("prepare", {"color": edits["color"], "model": self.config["model"], "language": self.config["language"]}, takes,
                  prepare_outputs,
                  lambda: self.command("prepare", self.py("prep-takes.py", "plan", "--takes", *takes, "--color", edits["color"],
                                                         "--model", self.config["model"], "--language", self.config["language"])))
        # Gather short acoustic evidence for false starts without asking an LLM to decode the whole video.
        report = []
        for i, take in enumerate(takes, 1):
            result = self.p(f"manifests/take-{i}-silence.json")
            def scan(i=i, take=take, result=result):
                log = self.command(f"take-{i}-silence", ["ffmpeg", "-hide_banner", "-i", take, "-t", "12", "-af", "silencedetect=n=-40dB:d=0.15", "-f", "null", "-"])
                text = log.read_text(encoding="utf-8")
                spans = [{"end": float(a), "duration": float(b)} for a, b in re.findall(r"silence_end: ([\d.]+) \| silence_duration: ([\d.]+)", text)]
                write_json(result, {"take": i, "pauses": spans, "needsFalseStartReview": any(s["duration"] > 0.6 and s["end"] - s["duration"] > 0.2 for s in spans)})
            self.step(f"silence-{i}", {}, [take], [result], scan)
            report.append(read_json(result))
        write_json(self.p("manifests/false-start-candidates.json"), report)
        self.step("take-evidence", {"language": self.config["language"], "model": self.config["model"]},
                  takes + [out, self.p("manifests/false-start-candidates.json")], [self.p("manifests/take-evidence")],
                  lambda: self.command("take-evidence", self.py("inspect-takes.py", "--language", self.config["language"], "--model", self.config["model"])))
        self.receipt("prepare", self.prepare_key())

    def join(self):
        self.require("cuts")
        edits = self.config["edits"]
        args = self.py("prep-takes.py", "build", "--color", edits["color"], "--out-built", "manifests/takes-build.json")
        for key in ("keep", "cut"):
            if edits.get(key):
                args += ["--" + key, *edits[key]]
        self.step("join", self.gate_key("cuts"), [], [self.source(), self.p("review/union-preview.mp4"), self.p("manifests/takes-build.json")],
                  lambda: self.command("join", args))
        self.receipt("join", self.gate_key("union"))

    def transcribe(self):
        if self.config["branch"] != "B":
            raise ValueError("Branch A uses its supplied/generated voiceover, not the footage transcription stage.")
        if self.config.get("takes"):
            self.require("union")
        src = self.source()
        info = probe(src)
        if info["hdr"] or abs(info["width"] / info["height"] - 9 / 16) > 0.005 or not info["audio"]:
            raise ValueError("Branch B needs SDR vertical 9:16 footage with audio; keep the source resolution.")
        tl = read_json(self.p("timeline.json"))
        tl.update(duration=info["duration"], scale=info["width"] / 1080, bpm=60, formats=["9x16"], music={"source": "narration"})
        write_json(self.p("timeline.json"), tl)
        transcript = self.p("transcript/transcript.json")
        imported = self.config.get("transcriptInput")
        if imported:
            def import_transcript():
                data = read_json(self.p(imported))
                validate_transcript(data, info["duration"])
                write_json(transcript, data)
            self.step("transcribe", {"imported": True}, [src, self.p(imported)], [transcript], import_transcript)
        else:
            self.step("transcribe", {"language": self.config["language"], "model": self.config["model"]}, [src], [transcript],
                      lambda: self.command("transcribe", self.js("transcribe-media.mjs", "--input", src, "--out-audio", "transcript/voice16k.wav",
                          "--out-transcript", transcript, "--language", self.config["language"], "--model", self.config["model"], "--python", sys.executable)))
        validate_transcript(read_json(transcript), info["duration"])
        self.step("voice-extract", {}, [src], [self.p("audio/music.wav")], lambda: self.command("voice-extract",
                  ["ffmpeg", "-v", "error", "-y", "-i", src, "-vn", "-ar", "48000", "-ac", "2", "-c:a", "pcm_s24le", "audio/music.wav"]))
        self.step("font", {}, [SKILL / "assets/fonts/NeueMontreal-Bold.otf"], [self.p(FONT)],
                  lambda: self.command("font", self.js("freeze-caption-font.mjs", "--project", self.root, "--output", FONT)))
        self.step("source-shots", {}, [src, transcript], [self.p("manifests/shots-source.json"), self.p("snapshots/shots-check-source.png")],
                  lambda: self.command("source-shots", self.py("detect-shots.py", "--allow-no-face", "--video", src, "--transcript", transcript,
                      "--out-shots", "manifests/shots-source.json", "--out-check", "snapshots/shots-check-source.png")))
        # The scaffold has a fixed source placeholder; replace it once, preserving later custom scenes.
        film = self.p("film/film.js")
        text = film.read_text(encoding="utf-8")
        if "../assets/source/clip.mp4" in text:
            rel = os.path.relpath(src, self.p("film")).replace("\\", "/")
            text = text.replace("'../assets/source/clip.mp4'", json.dumps(rel)).replace("{ fps: 30 }", "{ fps: " + str(info["fps"]) + " }")
            film.write_text(text, encoding="utf-8")
        write_json(self.p("manifests/source-info.json"), info)
        self.receipt("transcribe", self.transcript_key())

    def assets(self):
        # capture.mjs uses fixed names. One resource per folder prevents overwrites.
        for i, resource in enumerate(self.config.get("resources", []), 1):
            folder = self.p(f"assets/resources/{i}")
            folder.mkdir(parents=True, exist_ok=True)
            command = self.js("capture.mjs", resource["url"])
            if resource.get("sections"):
                command += ["--sections", ",".join(resource["sections"])]
            def capture(folder=folder, command=command, i=i):
                original = self.root
                try:
                    self.root = folder
                    self.command(f"capture-{i}", command)
                finally:
                    self.root = original
            self.step(f"capture-{i}", resource, [], [folder / "assets"], capture)

    def check_film_timing(self):
        """Branch B hard stops (user, 2026-10-25), checked on the film itself before anything renders:
        no animation from second 0, the first one lands 1-3 s after the speaker starts talking (and only once the
        opening camera move has settled, which the plan states); every Aurelio close plays to the end, never frozen on AI."""
        timing = read_json(self.p("manifests/film-timing.json"))
        if timing.get("missing"):
            raise ValueError("film/overlay.js is older than the opening/close checks: copy <skill>/engine/overlay.js into film/ and run draft again.")
        first_word = words_of(read_json(self.p("transcript/approved.json")))[0]["start"]
        onsets = sorted([(c["at"], c.get("what") or c["kind"]) for c in timing["cues"]]
                        + [(t, "punch-in") for t in timing["punch"]] + [(t, "impact") for t in timing["impacts"]]
                        + [(t, "layout switch") for t in timing["layout"]])
        if onsets and onsets[0][0] < first_word + 1.0 - 0.02:
            raise ValueError(f"First animation ({onsets[0][1]}) at {onsets[0][0]:.2f} s: nothing may animate before {first_word + 1.0:.2f} s "
                             f"(speech starts at {first_word:.2f} s; the first animation lands 1-3 s after that, once the camera has settled). "
                             "Move it in docs/overlay_plan.md and film/film.js.")
        for w in timing["wordmarks"]:
            if w["cycle"] < 1.4 or w["at"] + w["cycle"] > timing["duration"] + 1e-3:
                raise ValueError(f"The Aurelio close at {w['at']:.2f} s cannot finish its animation before the film ends ({timing['duration']:.2f} s): "
                                 "it needs at least 1.4 s after it lands. Land it earlier in the CTA or keep more tail after the last word.")

    def audio(self):
        tl = read_json(self.p("timeline.json"))
        if self.config["branch"] == "B":
            # autosfx evaluates the film, so it must see current duration/marks before collecting cues.
            self.command("sync-before-cues", self.js("sync.mjs"))
            self.step("autosfx", self.visual_key(), [], [self.p("manifests/auto-cues.json"), self.p("manifests/film-timing.json")],
                      lambda: self.command("autosfx", self.js("autosfx.mjs", "--output", "manifests/auto-cues.json", "--timing", "manifests/film-timing.json")))
            self.check_film_timing()
        elif tl.get("music", {}).get("source") == "synth":
            self.step("music", {k: tl.get(k) for k in ("music", "duration", "bpm", "marks")}, [],
                      [self.p("audio/music.wav"), self.p("audio/drums.wav")], lambda: self.command("music", self.py("music.py")))
        if self.config["branch"] == "A":
            args = self.py("beats.py", "audio/music.wav")
            if tl.get("music", {}).get("source") == "synth":
                args += ["--stem", "audio/drums.wav"]
            self.step("beats", {"bpm": tl["bpm"]}, [self.p("audio/music.wav")], [self.p("beats.json")], lambda: self.command("beats", args))
            if self.p("vo.json").exists():
                self.step("voiceover", {}, [self.p("vo.json"), self.p("audio/vo"), self.p("beats.json")],
                          [self.p("audio/vo.wav"), self.p("audio/vo_placed.json")], lambda: self.command("voiceover", self.py("vo.py")))
        self.step("sync", {}, [self.p("timeline.json"), self.p("beats.json"), self.p("audio/vo_placed.json"), self.p("manifests/auto-cues.json")],
                  [self.p("cues.json"), self.p("film/data.js")], lambda: self.command("sync", self.js("sync.mjs", "--auto-cues", "manifests/auto-cues.json") if self.config["branch"] == "B" else self.js("sync.mjs")))
        self.step("sfx", {}, [self.p("cues.json"), self.p("sfx-lib"), self.p("assets/sfx")], [self.p("audio/sfx.wav")], lambda: self.command("sfx", self.js("sfx.mjs")))
        if self.config["branch"] == "B":
            self.step("bed", {"duration": tl["duration"], "bed": self.config.get("bed")}, [self.p("audio/music.wav"), SKILL / "music", self.p(self.config.get("bed", {}).get("track", "audio/music.wav"))], [self.p("audio/bed.wav")],
                      lambda: self.command("bed", self.py("bed.py", *(["--track", str(self.p(self.config["bed"]["track"]))] if self.config.get("bed", {}).get("track") else []))))
        self.step("mix", {"mix": tl.get("mix"), "duration": tl["duration"], "music": tl.get("music")},
                  [self.p(f"audio/{k}.wav") for k in ("music", "sfx", "vo", "bed")], [self.p("audio/mix.wav")], lambda: self.command("mix", self.py("mix.py")))

    def render(self, final=False):
        tl = read_json(self.p("timeline.json"))
        if final and self.config["branch"] == "B":
            info = probe(self.source())
            expected = (round(1080 * tl.get("scale", 1)), round(1920 * tl.get("scale", 1)))
            if expected != (info["width"], info["height"]):
                raise ValueError(f"Final must retain native source resolution {info['width']}x{info['height']}; timeline is {expected}. No preview-size final.")
            if tl["fps"] + .001 < info["fps"]:
                raise ValueError("Final fps cannot be lower than the source. Never lower quality to meet a deadline.")
        for fmt in tl["formats"]:
            name = ("master-" if final else "draft-") + fmt
            output = self.p(f"renders/{fmt}.mp4" if final else f"renders/draft_{fmt}.mp4")
            silent = self.p(f"renders/clean/{name}.mp4")
            def capture(fmt=fmt, output=output, silent=silent, name=name):
                if final:
                    settings = self.config.get("render", {})
                    self.command(name, self.py("render-final.py", "--project", self.root, "--fmt", fmt,
                        "--workers", settings.get("workers", "auto"), "--segment-seconds", settings.get("segmentSeconds", 3),
                        "--crf", 10 if self.config["branch"] == "B" else 16, "--key", digest(self.visual_key())))
                else:
                    self.command(name, self.js("render.mjs", "--fmt", fmt, "--audio", "audio/.no-audio.wav", "--draft"))
                silent.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(output, silent)
            self.step(name, self.visual_key(), [], [silent], capture)
            self.step(name + "-mux", {}, [silent, self.p("audio/mix.wav")], [output],
                      lambda silent=silent, output=output, name=name: self.command(name + "-mux", ["ffmpeg", "-v", "error", "-y", "-i", silent,
                          "-i", "audio/mix.wav", "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "320k", "-shortest", "-movflags", "+faststart", output]))
            if final:
                w, h = (round(v * tl.get("scale", 1)) for v in SIZES[fmt])
                self.verify(output, w, h, tl["duration"], name + "-verify", fps=tl["fps"])

    def captions(self, final=False):
        tl = read_json(self.p("timeline.json"))
        settings = self.config["captions"]
        draft_zones = self.p("manifests/caption-zones-draft.json")
        if not final:
            override = settings.get("zones")
            if override:
                self.step("draft-zones", settings, [self.p(override)], [draft_zones],
                          lambda: write_json(draft_zones, scale_zones(read_json(self.p(override)), 1, tl["duration"])))
            else:
                raw_zones = self.p("manifests/caption-zones-detected.json")
                self.step("draft-detect", {"singleShot": settings.get("singleShot", True)}, [self.p("renders/draft_9x16.mp4"), self.p("transcript/approved.json")],
                          [raw_zones, self.p("snapshots/shots-check-draft.png"), self.p("manifests/shots-draft.json")],
                          lambda: self.command("draft-detect", self.py("detect-shots.py", "--allow-no-face", "--video", "renders/draft_9x16.mp4", "--transcript", "transcript/approved.json",
                              "--out-zones", raw_zones, "--out-shots", "manifests/shots-draft.json", "--out-check", "snapshots/shots-check-draft.png")))
                def resolve_zones():
                    zones = read_json(raw_zones)
                    if settings.get("singleShot", True):
                        zones = [{"start": 0, "end": tl["duration"], "marginBottom": min(z["marginBottom"] for z in zones)}]
                    write_json(draft_zones, scale_zones(zones, 1, tl["duration"]))
                self.step("draft-zones", settings, [raw_zones], [draft_zones], resolve_zones)
        source = self.p("renders/9x16.mp4" if final else "renders/draft_9x16.mp4")
        info = probe(source)
        scale = info["width"] / 1080
        name = "final" if final else "draft"
        zones = self.p(f"manifests/caption-zones-{name}-scaled.json")
        self.step(name + "-scale-zones", {"scale": scale, "duration": tl["duration"]}, [draft_zones], [zones],
                  lambda: write_json(zones, scale_zones(read_json(draft_zones), scale, tl["duration"])))
        ass = self.p(f"renders/subs-{name}.ass")
        dimensions = ["--video-width", info["width"], "--video-height", info["height"]]
        styling = ["--size", 104 * scale, "--shadow", 6 * scale, "--outline", 0, "--blur", 0,
                   "--margin-lr", 120 * scale, "--margin-bottom", 500 * scale, "--rise-px", 6 * scale, "--max-words", 1]
        self.step(name + "-ass", {"dimensions": dimensions, "styling": styling}, [self.p("transcript/approved.json"), self.p(FONT), zones], [ass],
                  lambda: self.command(name + "-ass", self.js("build-burn-in-captions.mjs", "--transcript", "transcript/approved.json", "--output", ass,
                      "--font-file", FONT, "--zones", zones, "--python", sys.executable, *dimensions, *styling)))
        audit = self.p(f"manifests/audits/caption-width-{name}.json")
        self.step(name + "-caption-width", {}, [ass, self.p(FONT)], [audit],
                  lambda: self.command(name + "-caption-width", self.js("audit-caption-width.mjs", "--ass", ass, "--font-file", FONT, "--output", audit, "--python", sys.executable)))
        out = self.p("renders/subtitled-master.mp4" if final else "renders/draft_9x16_subs.mp4")
        self.step(name + "-burn", {}, [source, ass, self.p(FONT)], [out],
                  lambda: self.command(name + "-burn", self.js("burn-in-captions.mjs", "--input", source, "--ass", ass, "--output", out, "--fonts-dir", "assets/fonts/captions")))
        self.verify(out, info["width"], info["height"], tl["duration"], name + "-verify", fps=tl["fps"] if final else None)

    def verify(self, video, width, height, duration, name, fps=None):
        info = probe(video)
        tolerance = max(0.1, 2 / (info["fps"] or 30))
        if (info["width"], info["height"]) != (width, height) or not info["audio"] or abs(info["duration"] - duration) > tolerance:
            raise ValueError(f"{name}: invalid resolution, duration or missing audio: {info}")
        if fps is not None and abs(info["fps"] - fps) > .001:
            raise ValueError(f"{name}: fps changed from {fps} to {info['fps']}")
        write_json(self.p(f"manifests/audits/{name}.json"), info)

    def review(self, final=False):
        name = "final" if final else "draft"
        tl = read_json(self.p("timeline.json"))
        videos = self.final_paths() if final else self.draft_paths()
        report = self.p(f"review/r{name}/metrics.json")
        args = self.py("review.py", name, *([] if final else ["--draft"]))
        if self.config["branch"] == "B":
            args += ["--video", str(videos[0])]
        self.step(name + "-review", {"branch": self.config["branch"]}, videos + [self.p("cues.json")], [report.parent],
                  lambda: self.command(name + "-review", args))
        metrics = read_json(report)
        warnings = []
        for label in ("source", "draft"):
            shots = self.p(f"manifests/shots-{label}.json")
            if shots.exists() and any(s.get("needsReview") for s in read_json(shots)["shots"]):
                warnings.append({"kind": "caption_zone_unverified", "source": label, "note": "No face detected; visually verify subtitles and set captions.zones if needed."})
        if metrics.get("near_blank_frames"):
            warnings.append({"kind": "near_blank_frames", "moments": metrics["near_blank_frames"]})
        if metrics.get("max_gap_between_visual_events", {}).get("seconds", 0) > 4:
            warnings.append({"kind": "pacing", "measurement": metrics["max_gap_between_visual_events"], "note": "heuristic; inspect visually"})
        sync = metrics.get("sync", {})
        if (sync.get("hits_mean_abs_ms") or 0) > 45:
            warnings.append({"kind": "sync", "meanMs": sync["hits_mean_abs_ms"], "note": "mixed speech/music can trigger this heuristic"})
        loudness = metrics.get("loudness", {})
        if isinstance(loudness, dict):
            level = float(str(loudness.get("I", "nan")).split()[0])
            peak = float(str(loudness.get("Peak", "nan")).split()[0])
            if peak > -1:
                raise ValueError(f"True peak {peak} exceeds -1 dBTP. Fix the mix before continuing.")
            if self.config["branch"] == "A" and abs(level + 14) > 0.5:
                raise ValueError(f"Branch A mix {level} is outside -14 ±0.5 LUFS.")
            if self.config["branch"] == "B" and level < -24.5:
                warnings.append({"kind": "quiet_voice", "lufs": level, "note": "Do not silently normalize an edited source."})
        summary = {"technicalChecks": "passed", "creativeReview": "required", "warnings": warnings,
                   "metrics": str(report), "contact": str(report.parent / "contact.jpg"),
                   "safeZones": str(report.parent / "safe_9x16.jpg"), "captionZones": str(self.p("manifests/caption-zones-draft.json"))}
        write_json(self.p(f"review/{name}-summary.json"), summary)
        return summary

    def draft(self):
        if self.config["branch"] == "B":
            self.require("transcript")
        self.require("plan")
        self.audio()
        self.render()
        if self.config["branch"] == "B":
            self.captions()
        result = self.review()
        self.receipt("draft", self.gate_key("draft"))
        return result

    def cover(self):
        c = self.config["cover"]
        if c.get("ready"):
            source = self.p(c.get("input") or "")
            if not source.is_file() or source.suffix.lower() not in (".png", ".jpg", ".jpeg", ".webp"):
                raise ValueError("cover.ready requires the user's finished cover image as cover.input")
            output = self.p(f"renders/final/{self.root.name}-portada.png")
            self.step("cover-ready", c, [source], [output], lambda: self.command("cover-ready",
                      ["ffmpeg", "-v", "error", "-y", "-i", source, "-frames:v", "1", output]))
            return output
        if len(c.get("lines", [])) != 3:
            raise ValueError("Set cover.lines to the three agreed headline lines (wrap emphasis in *).")
        source = self.p(c.get("input") or self.source())
        output = self.p(f"renders/final/{self.root.name}-portada.png")
        args = self.js("build-cover.mjs", "--project", self.root, "--input", source, "--frame", c.get("frame", 0),
                       "--font-file", FONT, "--style", "white", "--anchor", "bottom", "--small-size", 68, "--big-size", 166,
                       "--y-offset", c.get("yOffset", 0), "--output", output)
        for line in c["lines"]:
            args += ["--line", line]
        report = self.p("manifests/audits/cover.json")
        def build():
            log = self.command("cover", args)
            data = json.loads(log.read_text(encoding="utf-8"))
            write_json(report, data)
            if not data.get("insideGridCrop"):
                raise ValueError("Cover headline falls outside the profile crop; adjust cover.yOffset.")
        self.step("cover", c, [source, self.p(FONT)], [output, report], build)
        return output

    def texts(self):
        caption, dm = caption_text(self.config["caption"])
        folder = self.p("renders/final")
        folder.mkdir(parents=True, exist_ok=True)
        (folder / f"caption-{self.root.name}.txt").write_text(caption, encoding="utf-8")
        dm_path = folder / f"dm-reply-{self.root.name}.txt"
        if dm:
            dm_path.write_text(dm, encoding="utf-8")
        elif dm_path.exists():
            dm_path.unlink()  # only this generated optional file, never a directory

    def final(self):
        self.require("draft")
        self.require_current_draft()
        # Validate text/cover configuration before an expensive final capture.
        caption_text(self.config["caption"])
        if self.config["branch"] == "B":
            cover = self.cover()
        self.audio()
        # Audio must be unchanged from the approved draft; recomputation cannot silently change it.
        self.require("draft")
        self.render(final=True)
        tl = read_json(self.p("timeline.json"))
        if self.config["branch"] == "B":
            self.captions(final=True)
            subs = self.p("renders/subtitled-master.mp4")
            output = self.final_paths()[0]
            self.step("cover-frame", {}, [subs, cover], [output], lambda: self.command("cover-frame",
                      self.py("finish-video.py", "--input", subs, "--cover", cover, "--output", output)))
            info = probe(subs)
            self.verify(output, info["width"], info["height"], info["duration"] + 1 / info["fps"], "delivery-video", fps=tl["fps"])
        else:
            for fmt, output in zip(tl["formats"], self.final_paths()):
                source = self.p(f"renders/{fmt}.mp4")
                self.step("final-copy-" + fmt, {}, [source], [output], lambda source=source, output=output: shutil.copy2(source, output))
        self.texts()
        result = self.review(final=True)
        self.receipt("final", self.final_key())
        return result

    def delivery_dir(self):
        return self.root.parent.parent / self.root.name if self.root.parent.name == ".work" else self.p("entrega")

    def delivery_key(self):
        return {"final": self.final_key(), "files": fingerprint([self.delivery_dir()])}

    def deliver(self):
        self.require_current_final()
        # Explicit video list prevents shipping intermediate or obsolete renders.
        args = self.js("deliver-package.mjs", "--project", self.root, "--no-open", "--copy")
        if self.delivery_dir().exists():
            # A previously recorded delivery is the only folder we can replace automatically.
            recorded = self.cache.state.get("deliveryFiles")
            if recorded is None or recorded != fingerprint([self.delivery_dir()]):
                raise ValueError("Delivery folder is untracked or has changed outside the pipeline. Preserve it before replacing.")
            args += ["--overwrite"]
        for video in self.final_paths():
            args += ["--video", str(video)]
        self.command("deliver", args)
        self.cache.state["deliveryFiles"] = fingerprint([self.delivery_dir()])
        self.receipt("delivery", self.delivery_key())

    def publish(self, reels=None):
        self.require_current_final()
        self.require_receipt("delivery", self.delivery_key())
        self.require("publish")
        args = self.js("publish-to-drive.mjs", "--project", self.root, "--keep-work")
        if reels:
            args += ["--reels", reels]
        # Never auto-overwrite a published folder. Never delete the reproducible build here.
        self.command("publish", args)

    def status(self):
        gates = {}
        for gate in GATES:
            try:
                gates[gate] = self.cache.approved(gate, self.gate_key(gate))
            except (ValueError, OSError, KeyError):
                gates[gate] = False
        return {"branch": self.config["branch"], "approvals": gates,
                "completedSteps": len(self.cache.state["steps"]), "events": self.cache.events,
                "drafts": list(map(str, self.draft_paths())), "finals": list(map(str, self.final_paths()))}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["init", "status", "prepare", "join", "transcribe", "assets", "draft", "review", "cover", "texts", "final", "deliver", "publish", "approve"])
    parser.add_argument("--project", required=True)
    parser.add_argument("--branch", choices=["A", "B"], default="B")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--source")
    group.add_argument("--takes", nargs="+")
    parser.add_argument("--preset")
    parser.add_argument("--gate", choices=GATES)
    parser.add_argument("--note", default="")
    parser.add_argument("--reels")
    args = parser.parse_args()
    root = Path(args.project).resolve()
    if args.command == "init":
        result = initialize(root, args.branch, args.source, args.takes, args.preset)
    else:
        p = Pipeline(root)
        lock = p.p("manifests/pipeline.lock")
        lock.parent.mkdir(parents=True, exist_ok=True)
        try:
            fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        except FileExistsError:
            raise ValueError(f"Another pipeline may be running. Inspect {lock}; remove only after confirming its PID has stopped.")
        try:
            os.write(fd, str(os.getpid()).encode())
            os.close(fd)
            detail = None
            if args.command == "approve":
                if not args.gate:
                    raise ValueError("approve requires --gate and --note with the user's explicit OK.")
                p.approve(args.gate, args.note)
            elif args.command == "publish":
                p.publish(args.reels)
            elif args.command != "status":
                detail = getattr(p, args.command)()
            result = {**p.status(), "detail": str(detail) if isinstance(detail, Path) else detail}
        finally:
            lock.unlink(missing_ok=True)
    print(json.dumps({"ok": True, "command": args.command, **result}, ensure_ascii=False, separators=(",", ":")))


if __name__ == "__main__":
    try:
        if hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8")
        main()
    except (ValueError, OSError, KeyError) as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False))
        sys.exit(1)
