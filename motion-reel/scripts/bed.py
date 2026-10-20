# Branch B background music: a steady track from the skill's library, laid under the narration → audio/bed.wav
# (mix.py adds it as is: no ducking, so it stays constant). Run from the project root, after audio/music.wav exists.
#
#   python3 scripts/bed.py                       the steadiest track of music/library.json that is long enough
#   python3 scripts/bed.py --track <file.mp3>    a specific track of the library (or any path)
#   python3 scripts/bed.py --under 34            dB under the narration's integrated loudness (default 34)
#
# Reference levels (aure-apps-22-apps-gratis, approved by the user 2026-10-19 after three rounds of listening):
# narration as delivered (~-21.6 LUFS) · SFX bus mix.sfx -3 dB, peaks ~9 dB under the voice peaks · bed ~34 dB under
# the narration (track at -16 LUFS → volume -39.6 dB). Order of importance: voice > SFX > music.
import json, os, re, subprocess, sys

SKILL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIB_DIRS = [os.environ.get('MOTION_REEL_MUSIC_LIB'), os.path.join('music-lib'), os.path.join(SKILL, 'music'),
            os.path.join(os.path.expanduser('~'), '.claude', 'skills', 'motion-reel', 'music')]
LIB = next((d for d in LIB_DIRS if d and os.path.exists(os.path.join(d, 'library.json'))), None)
arg = lambda k, d=None: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d
TL = json.load(open('timeline.json', encoding='utf-8'))
DUR = float(TL['duration'])
UNDER = float(arg('--under', 34))


def loud(path, extra=()):
    e = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', *extra, '-i', path, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(re.search(r'I:\s+(-?[\d.]+)', e[e.rfind('Summary'):]).group(1))


track = arg('--track')
if track and not os.path.exists(track) and LIB: track = os.path.join(LIB, track)
if not track:
    if not LIB: raise SystemExit('music library not found (skill/music/library.json)')
    lib = json.load(open(os.path.join(LIB, 'library.json'), encoding='utf-8'))
    ok = [r for r in lib if r['duration_s'] >= DUR + 0.5] or lib
    track = os.path.join(LIB, sorted(ok, key=lambda r: r['loudness_range_lu'])[0]['file'])
if not os.path.exists('audio/music.wav'): raise SystemExit('audio/music.wav (the narration) missing — extract it first (SKILL.md B1)')

narr = loud('audio/music.wav')
trk = loud(track, ('-t', str(DUR)))
gain = (narr - UNDER) - trk
# loop only if the track is shorter than the film; 0.4 s fade in, 1.2 s fade out
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-stream_loop', '-1', '-i', track, '-af',
                f'atrim=0:{DUR + 0.2},asetpts=N/SR/TB,aresample=48000,aformat=channel_layouts=stereo,volume={gain:.1f}dB,'
                f'afade=t=in:st=0:d=0.4,afade=t=out:st={max(0, DUR - 1.2):.2f}:d=1.2', '-c:a', 'pcm_s24le', 'audio/bed.wav'], check=True)
print(f'audio/bed.wav  {os.path.basename(track)}  narration {narr:.1f} LUFS · track {trk:.1f} LUFS · gain {gain:+.1f} dB '
      f'-> bed {UNDER:.0f} dB under the voice. Then: python3 scripts/mix.py')
