"""Quiz template: cut the real clips a reel uses into small seek-friendly files for film/quiz.js.

Usage:  python prep-clips.py <clips.json> <out_dir>
clips.json: [{ "name": "f1", "src": "E:/.../clip.mp4", "start": 5.2, "dur": 0.7,
               "mode": "full" | "band" | "crop",       # full: vertical 1080x1920 crop centred on cx
               "cx": 960,                               # full: centre x of the crop in the source (px)
               "crop": [x, y, w, h], "out": [w, h],     # crop / band: region of the source (in 1920x1080 space) and output size
                                                        # (a 9:16 crop like [cx-230, 0, 461, 820] -> [1080, 1920] hides
                                                        # broadcast score bugs at the bottom; out sizes are rounded to even)
               "speed": 1.0,                            # < 1 = slow motion (frames interpolated to 60 fps)
               "blur": 0, "dark": 0.0 }]               # blurred dark background clips
"dur" is the length on the FILM (seconds); the source span is dur * speed.
Output: <out_dir>/<name>.mp4, H.264, no audio, short GOP (cheap exact seeks in the renderer).
"""
import json, subprocess, sys
from pathlib import Path


def build(c, out_dir):
    out = Path(out_dir) / f"{c['name']}.mp4"
    speed = c.get("speed", 1.0)
    src_dur = c["dur"] * speed + 0.15
    mode = c.get("mode", "full")
    f = []
    if mode == "full":
        # 9:16 window out of a 16:9 source: 608 x 1080 around cx
        cx = c.get("cx", 960)
        x = max(0, min(1920 - 608, int(cx - 304)))
        f += [f"scale=1920:1080", f"crop=608:1080:{x}:0", "scale=1080:1920:flags=lanczos"]
    else:
        x, y, w, h = c.get("crop", [0, 0, 1920, 1080])
        ow, oh = c.get("out", [1080, 608])
        ow, oh = ow - ow % 2, oh - oh % 2          # x264 needs even sizes
        f += ["scale=1920:1080", f"crop={w}:{h}:{x}:{y}", f"scale={ow}:{oh}:flags=lanczos"]
    if c.get("blur"):
        f.append(f"gblur=sigma={c['blur']}")
    if c.get("dark"):
        f.append(f"eq=brightness={-abs(c['dark'])}:saturation={c.get('sat', 0.7)}")
    if speed != 1.0:
        f += [f"setpts=PTS/{speed}", "minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:vsbmc=1"]
    else:
        f.append("fps=30")
    cmd = ["ffmpeg", "-v", "error", "-y", "-ss", str(c["start"]), "-t", f"{src_dur:.3f}", "-i", c["src"],
           "-vf", ",".join(f), "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-g", "10", "-bf", "0",
           "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(out)]
    subprocess.run(cmd, check=True)
    print("wrote", out)


if __name__ == "__main__":
    spec, out_dir = sys.argv[1], sys.argv[2]
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    for c in json.loads(Path(spec).read_text(encoding="utf-8")):
        build(c, out_dir)
