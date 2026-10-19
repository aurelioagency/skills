#!/bin/sh
# Scaffold a motion-reel project:  sh <skill>/scripts/init.sh videos/<slug> [--preset presets/<name>] [--overlay]
# Copies the engine (film/), the pipeline scripts (scripts/) and the templates (brief, timeline, docs) into a NEW folder.
# Refuses an existing non-empty folder: parallel sessions often pick the same slug. Pick a distinctive one.
# --overlay: Branch B (motion graphics over the user's own footage) — also copies engine/video.js and wires it
#   into film/index.html, so film.js can call C.videoBG('assets/source.mp4') after C.start().
set -e
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$1"
[ -z "$DEST" ] && { echo "usage: sh $0 <project-dir> [--preset <preset-dir>] [--overlay]   e.g. videos/acme-launch-kinetic --preset presets/blank"; exit 1; }
PRESET=""
OVERLAY=""
shift
while [ $# -gt 0 ]; do
  case "$1" in
    --preset)
      # a path, or a bare name looked up in ./presets/ then in the skill's own presets/
      for P in "$2" "presets/$2" "$SKILL/presets/$2" "$SKILL/presets/$(basename "$2")"; do
        [ -f "$P/preset.jsonc" ] && { PRESET="$(cd "$P" && pwd)"; break; }
      done
      [ -n "$PRESET" ] || { echo "no preset '$2' (looked in ./presets and $SKILL/presets)"; exit 1; }
      shift 2 ;;
    --overlay) OVERLAY="1"; shift ;;
    *) echo "unknown argument: $1"; exit 1 ;;
  esac
done
if [ -d "$DEST" ] && [ -n "$(ls -A "$DEST" 2>/dev/null)" ]; then
  echo "REFUSING: $DEST exists and is not empty (another session may own it). Choose a new slug."; exit 2
fi
mkdir -p "$DEST"/film/lib "$DEST"/scripts "$DEST"/docs "$DEST"/audio/vo "$DEST"/assets/fonts "$DEST"/assets/brand "$DEST"/assets/cap "$DEST"/renders "$DEST"/review
cp "$SKILL"/engine/index.html "$SKILL"/engine/core.js "$SKILL"/engine/type.js "$SKILL"/engine/film.js "$DEST"/film/
cp "$SKILL"/engine/lib/motion.js "$SKILL"/engine/lib/motion.test.js "$DEST"/film/lib/
for f in render.mjs sync.mjs sfx.mjs capture.mjs beats.py music.py vo.py mix.py review.py preset.mjs; do cp "$SKILL/scripts/$f" "$DEST/scripts/"; done
cp "$SKILL"/templates/brief.md "$SKILL"/templates/timeline.json "$DEST"/
cp "$SKILL"/templates/docs/*.md "$DEST"/docs/
# the house sounds travel with the skill: every project gets its own copy (lib: paths in timeline.sfx resolve here)
[ -d "$SKILL/sfx" ] && cp -r "$SKILL/sfx" "$DEST/sfx-lib"
date -u +"created %Y-%m-%dT%H:%M:%SZ by motion-reel init" > "$DEST"/.owner

if [ -n "$OVERLAY" ]; then
  mkdir -p "$DEST"/assets/source
  mkdir -p "$DEST"/transcript
  cp "$SKILL"/engine/video.js "$SKILL"/engine/overlay.js "$DEST"/film/
  cp "$SKILL"/engine/film_overlay.js "$DEST"/film/film.js   # Branch B starter replaces the Branch A one
  cp "$SKILL"/scripts/transcribe.py "$SKILL"/scripts/captions.py "$SKILL"/scripts/autosfx.mjs "$DEST"/scripts/
  cp "$SKILL"/templates/docs/overlay_plan.md "$DEST"/docs/ 2>/dev/null || true
  # load captions.js (generated), video.js and overlay.js just before film.js, and add the subtitle style
  awk '{ if ($0 ~ /<script src="film\.js">/) { print "<script src=\"captions.js\"></script>"; print "<script src=\"video.js\"></script>"; print "<script src=\"overlay.js\"></script>" }
         if ($0 ~ /<\/style>/) { print "  /* Branch B subtitles (always on): phrase chunks on the chest zone, spoken words full ink */"
           print "  .cap { position: absolute; left: 0; width: 100%; text-align: center; font-family: 'UI', sans-serif; font-weight: 700;"
           print "         font-size: 60px; letter-spacing: -0.01em; color: #fff; white-space: nowrap; transform-origin: 50% 50%;"
           print "         text-shadow: 0 2px 4px rgba(0,0,0,.7), 0 6px 24px rgba(0,0,0,.55); }"
           print "  .cap .word { margin: 0 .12em; }" }
         print }' "$DEST"/film/index.html > "$DEST"/film/index.html.tmp
  mv "$DEST"/film/index.html.tmp "$DEST"/film/index.html
  echo 'window.CAPS = [];' > "$DEST"/film/captions.js
  # Branch B timeline defaults: seconds as beats, vertical, narration as the base track, SFX well under the voice
  node -e "const f='$DEST/timeline.json',fs=require('fs'),t=JSON.parse(fs.readFileSync(f,'utf8'));Object.assign(t,{bpm:60,formats:['9x16'],music:{source:'narration'},voiceover:null,marks:{},sfx:[],mix:{music:0,sfx:-14,vo:0,duck:false}});fs.writeFileSync(f,JSON.stringify(t,null,2))"
  echo "overlay mode: film/video.js + overlay.js wired in, timeline set to Branch B defaults. Next: copy the source AS IT COMES into assets/source/, set timeline.scale = source width / 1080, python3 scripts/transcribe.py (SKILL.md B1)."
fi

[ -n "$PRESET" ] && node "$SKILL"/scripts/preset.mjs "$PRESET" "$DEST"
cd "$DEST"
# rendering needs playwright: if this project doesn't have it, reuse the copy install.sh put next to the skill
if ! node -e "require.resolve('playwright', { paths: [process.cwd()] })" 2>/dev/null && [ -d "$SKILL/node_modules/playwright" ]; then
  ln -s "$SKILL/node_modules" node_modules && echo "linked playwright from the skill install"
fi
echo "scaffolded $DEST"
# toolchain checks (warn, don't fail)
command -v ffmpeg >/dev/null || echo "WARN: ffmpeg not on PATH"
node -e "require.resolve('playwright', { paths: [process.cwd()] })" 2>/dev/null \
  || echo "WARN: playwright not resolvable from $DEST → run: npm i -D playwright && npx playwright install chromium"
python3 -c "import numpy, scipy, soundfile, librosa, PIL" 2>/dev/null \
  || echo "WARN: python deps missing → pip install numpy scipy soundfile librosa pillow"
node film/lib/motion.test.js >/dev/null && echo "motion.js tests pass"
node scripts/sync.mjs >/dev/null && echo "film/data.js written (nominal grid until beats.json exists)"
echo "next: fill brief.md, then follow SKILL.md step 2 (assets)"
