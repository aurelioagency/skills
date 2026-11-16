"""Quiz template: find and download the real clips a reel needs (yt-dlp), and leave a sheet to choose the seconds.

Usage:
  python fetch-assets.py search "Klose somersault World Cup FIFA" [n=8]
        lists n YouTube results: id | seconds | channel | title. Prefer official channels (FIFA, CONMEBOL, the brand itself).
  python fetch-assets.py get <tema> <nombre> <youtube-id>
        downloads up to 1080p to E:\\Motion Reel\\Recursos\\<tema>\\<nombre>-<id>.mp4 and writes a contact sheet next to it
        (<nombre>-<id>.jpg, 48 frames with their second) to pick the exact seconds for clips.json.
  python fetch-assets.py sheet <video> <t0> <t1> [step=0.25]
        a finer sheet of one stretch (for the precise start of a goal, a celebration, a UI moment).

Write every URL you use in docs/overlay_plan.md. Then put the chosen seconds in assets/clips/clips.json and run
prep-clips.py. Rules: hide any legible scoreboard (crop it out), no flags or graphics that are a red and white block,
prefer dark screen recordings for AI demos, a meme only if it reads in 1 second.
"""
import subprocess, sys
from pathlib import Path

ROOT = Path(r"E:\Motion Reel\Recursos")


def sheet(video, out, t0, t1, step, cols=8, width=200):
    import cv2
    from PIL import Image, ImageDraw
    cap = cv2.VideoCapture(str(video)); fps = cap.get(cv2.CAP_PROP_FPS)
    ims, t = [], t0
    while t <= t1 + 1e-6:
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(round(t * fps))); ok, f = cap.read()
        if not ok: break
        h, w = f.shape[:2]; f = cv2.resize(f, (width, int(h * width / w)))
        im = Image.fromarray(cv2.cvtColor(f, cv2.COLOR_BGR2RGB)); d = ImageDraw.Draw(im)
        d.rectangle([0, 0, 60, 16], fill=(0, 0, 0)); d.text((3, 2), f"{t:.2f}", fill=(255, 255, 0))
        ims.append(im); t += step
    rows = (len(ims) + cols - 1) // cols
    sh = Image.new("RGB", (cols * width, rows * ims[0].height))
    for i, im in enumerate(ims): sh.paste(im, ((i % cols) * width, (i // cols) * ims[0].height))
    sh.save(out, quality=85); print("sheet", out)


def duration(video):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(video)], capture_output=True, text=True)
    return float(r.stdout.strip())


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "search":
        n = int(sys.argv[3]) if len(sys.argv) > 3 else 8
        subprocess.run([sys.executable, "-m", "yt_dlp", "--flat-playlist", "--print", "%(id)s | %(duration)s | %(channel)s | %(title)s", f"ytsearch{n}:{sys.argv[2]}"])
    elif cmd == "get":
        tema, nombre, vid = sys.argv[2:5]
        folder = ROOT / tema; folder.mkdir(parents=True, exist_ok=True)
        out = folder / f"{nombre}-{vid}.mp4"
        subprocess.run([sys.executable, "-m", "yt_dlp", "-q", "-f", "bv*[height<=1080][ext=mp4]+ba[ext=m4a]/b[height<=1080]", "--merge-output-format", "mp4",
                        "-o", str(out), f"https://www.youtube.com/watch?v={vid}"], check=True)
        d = duration(out)
        sheet(out, out.with_suffix(".jpg"), 0, d, max(0.25, round(d / 48, 2)))
        print("url", f"https://www.youtube.com/watch?v={vid}", "->", out)
    elif cmd == "sheet":
        v, t0, t1 = sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
        step = float(sys.argv[5]) if len(sys.argv) > 5 else 0.25
        sheet(v, Path(v).with_name(Path(v).stem + f"_{t0:g}-{t1:g}.jpg"), t0, t1, step, cols=10, width=160)
    else:
        print(__doc__)
