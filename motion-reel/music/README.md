# Background music library (motion-reel, Branch B)

Steady, low-dynamics tracks for the background bed of a reel. Every track here measured a loudness range ≤ 2 LU, so it never jumps over the voice. `library.json` lists each one with its source, the cut that was taken, duration and loudness, steadiest first.

- `python3 scripts/bed.py` (from a project) picks a track long enough for the video, rotating so consecutive videos do not share the same music (the one unused or used longest ago, steadiest first; history in `~/.claude/motion-reel/music-history.json`), and lays it 34 dB under the narration (reference levels: `reference/AUDIO.md` §2b).
- To add a track: cut its steadiest stretch (≥ 30 s), measure it (`ffmpeg -i x.mp3 -af ebur128 -f null -`), keep it only if LRA ≤ 2 LU, and add its entry (title, artist, source, cut) to `library.json`.
- Sources are royalty-free libraries (Jamendo via archive.org, YouTube Audio Library). Check the license on the source page before using a track for a client.
