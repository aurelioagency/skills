# Mix music + sfx + voiceover → audio/mix.wav at -14 LUFS integrated, ≤ -1 dBTP, 48 kHz 24-bit. Run from the project root.
# Branch B (music.source = narration): the user's narration keeps its own level; only the SFX are added under it.
#   python3 scripts/mix.py
# Inputs (any may be missing except music): audio/music.wav, audio/sfx.wav, audio/vo.wav, audio/bed.wav (Branch B background music, scripts/bed.py)
# Levels in dB from timeline.json "mix": { "music": 0, "sfx": -3, "vo": 0, "duck": true }
# The music is trimmed/padded to timeline.duration with a 0.3 s tail fade, and side-chain ducked under the VO.
import json, os, subprocess

TL = json.load(open('timeline.json'))
DUR = float(TL['duration'])
LV = {'music': 0.0, 'sfx': -3.0, 'vo': 0.0, 'duck': True, **(TL.get('mix') or {})}
have = {k: os.path.exists(f'audio/{k}.wav') for k in ('music', 'sfx', 'vo', 'bed')}
if not have['music']: raise SystemExit('audio/music.wav missing (python3 scripts/music.py, or copy the supplied track there)')


def ff(args, capture=False):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-y', *args], capture_output=True, text=True)
    if r.returncode: raise SystemExit(r.stderr[-2000:])
    return r.stderr


inputs, chains, labels = [], [], []
def inp(name, gain, mono_to_stereo=False):
    inputs.extend(['-i', f'audio/{name}.wav']); i = len(inputs) // 2 - 1
    up = ',pan=stereo|c0=c0|c1=c0' if mono_to_stereo else ',aformat=channel_layouts=stereo'
    chains.append(f'[{i}:a]aresample=48000{up},apad,atrim=0:{DUR},volume={gain}dB[{name}]')
inp('music', LV['music'])
chains[-1] = chains[-1].replace('[music]', f',afade=t=out:st={DUR - 0.3}:d=0.3[music]')
if have['sfx']: inp('sfx', LV['sfx'])
# Branch B background music (audio/bed.wav, made by scripts/bed.py): a steady bed levelled under the narration and the
# SFX (voice > SFX > music). Plain: added as is, constant. mix.bedDuck (user, 2026-10-26: "no se escucha nada la música,
# que se escuche y no tape mi voz"): the bed sits louder (bed.under ~14) and makes room for the voice instead — a 5 dB
# dip around 2.5 kHz (where speech is understood) and a side-chain keyed by the narration that pulls it ~6 dB down while
# the speaker talks (mix=0.62 caps the dip) and lets it back up in the pauses.
BED_DUCK = have['bed'] and LV.get('bedDuck') and not have['vo']
if have['bed']: inp('bed', LV.get('bed', 0.0))
if BED_DUCK:
    chains.append('[music]asplit[music_v][music_key]')
    chains.append('[bed]equalizer=f=2500:width_type=o:width=1.6:g=-5[bed_eq];'
                  '[bed_eq][music_key]sidechaincompress=threshold=0.015:ratio=20:attack=25:release=500:knee=3:mix=0.62[bed_d]')
if have['vo']:
    inp('vo', LV['vo'], mono_to_stereo=True)
    if LV['duck']:
        chains.append('[vo]asplit[vo_out][vo_key]')
        chains.append('[music][vo_key]sidechaincompress=threshold=0.04:ratio=4:attack=15:release=280:makeup=1[music_out]')
ducked = have['vo'] and LV['duck']
labels = (['[music_out]'] if ducked else ['[music_v]'] if BED_DUCK else ['[music]']) + (['[sfx]'] if have['sfx'] else []) +          (['[bed_d]'] if BED_DUCK else ['[bed]'] if have['bed'] else []) + ((['[vo_out]'] if ducked else ['[vo]']) if have['vo'] else [])
graph = ';'.join(chains) + f";{''.join(labels)}amix=inputs={len(labels)}:normalize=0:duration=first,alimiter=limit=0.95:level=false[mix]"
ff([*inputs, '-filter_complex', graph, '-map', '[mix]', '-c:a', 'pcm_f32le', 'audio/mix_raw.wav'])

# loudness: linear gain to -14 LUFS into a -1.5 dBFS limiter run at 4x oversampling (synth transients make
# inter-sample overs; a 48 kHz limiter lets true peak reach 0 dBTP), re-measured and corrected
def measure(path):
    e = ff(['-nostats', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'])
    summ = e[e.rfind('Summary'):]
    get = lambda k: float(next(l.split()[1] for l in summ.splitlines() if l.strip().startswith(k)))
    return get('I:'), get('Peak:')
I0, _ = measure('audio/mix_raw.wav'); gain = -14 - I0
# Branch B: the narration is the user's finished audio (CapCut) and is NOT re-levelled: the SFX are added under it and
# only a safety limiter runs. A quiet source is reported (below), never silently pumped up.
NARRATION = (TL.get('music') or {}).get('source') == 'narration'
if NARRATION:
    narr_gain = 0.0
for _ in range(1 if NARRATION else 3):
    if NARRATION: need = gain; gain = 0.0
    ff(['-i', 'audio/mix_raw.wav', '-af', f'volume={gain:.2f}dB,aresample=192000,alimiter=limit=0.841:attack=1:release=40:level=false,aresample=48000', '-ar', '48000', '-c:a', 'pcm_s24le', 'audio/mix.wav'])
    I, TP = measure('audio/mix.wav')
    if NARRATION or abs(I + 14) <= 0.15: break
    gain += -14 - I
print(f"audio/mix.wav  inputs: {', '.join(k for k, v in have.items() if v)}  levels music {LV['music']} / sfx {LV['sfx']} / vo {LV['vo']} dB"
      f"{'  (music ducked under VO)' if have['vo'] and LV['duck'] else ''}{'  (bed carved and ducked under the narration)' if BED_DUCK else ''}")
print(f'integrated {I:.1f} LUFS (target -14)   true peak {TP:.1f} dBTP (limit -1)   gain {gain:+.1f} dB into the limiter')
if not NARRATION and (abs(I + 14) > 0.5 or TP > -1): print('WARNING: off target — the limiter is working too hard; lower the loudest stem (usually sfx) and rerun')
# Branch B: the narration is the user's own, already-finished audio (they pass it through CapCut first). A big lift
# means a raw phone recording slipped through: say so to the user, don't silently pump it.
if NARRATION:
    print(f'narration kept at its own level (not re-levelled): mix {I:.1f} LUFS')
    # the house voice level is -21.5 LUFS (prep-takes.py levels raw takes there; it is what the user's CapCut +15 dB gave)
    if I0 < -21.5 - 3:
        print(f'WARNING: the source narration is quiet ({I0:.1f} LUFS, {-21.5 - I0:+.1f} dB under the house level -21.5). Tell the user: an edited video whose voice was not raised (raw takes go through prep-takes.py, which levels them).')
