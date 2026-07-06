Use the global skill `heygen-ai-avatar-video`.

If it is not installed on this machine, install it yourself first:
1. Run: git clone https://github.com/aurelioagency/skills.git into a temporary folder.
2. Copy only the `heygen-ai-avatar-video/` folder from the cloned repo into the
   agent skills directory
   (Claude Code: `~/.claude/skills/heygen-ai-avatar-video/`;
   Codex: `~/.codex/skills/heygen-ai-avatar-video/`).
3. Delete the temporary clone and read the installed `SKILL.md` before doing
   anything else.

Below, `<SKILL_DIR>` means that installed skill folder.

Also use the HyperFrames skills/tools as needed:
- hyperframes
- hyperframes-cli
- hyperframes-core
- hyperframes-animation
- hyperframes-creative

Task:
Create three final vertical videos from already-created modular assets.

Important workflow change:
Do NOT call HeyGen.
Do NOT call ElevenLabs.
Do NOT create avatar videos.
Do NOT create TTS.
Do NOT use any paid provider/API/MCP for voice or avatar generation.

The avatar/opening/outro assets are already provided. Your job is only:
1. organize the project;
2. use the provided opening clips;
3. use the provided body audio/transcript;
4. build the body/middle HyperFrames animation;
5. use the provided outro clip;
6. assemble three final videos.

Inputs I will provide:
- Opening 1 video/audio:
  <OPENING_1_PATH>
- Opening 2 video/audio:
  <OPENING_2_PATH>
- Opening 3 video/audio:
  <OPENING_3_PATH>
- Body audio:
  <BODY_AUDIO_PATH>
- Body transcript/captions if available:
  <BODY_TRANSCRIPT_PATH_OR_NONE>
- Outro video/audio:
  <OUTRO_PATH>
- Original script or notes, only for semantic reference:
  <SCRIPT_OR_NOTES_PATH>
- Project output folder:
  <PROJECT_PATH>

Vocabulary (per-video data):
- Product/brand name(s) exactly as written: <NAMES>
- Proper nouns that appear in the audio (people, places, technical terms): <LIST>
- ASR engines will mis-transcribe these; flag and correct them at the
  Transcript Approval Gate.

Approval gates (do not skip):
1. After transcription: show me the full transcript text of every clip in the chat
   and WAIT for my approval/corrections before rendering any caption.
2. Before production: show me your creative proposal (color palette, transitions,
   caption style/animation, avatar clip effects, end card design, body act structure)
   and WAIT for my approval before building anything.

Quality (non-negotiable):
- Maximum 2 encode generations end-to-end (1 intermediate per segment + 1 final).
- All per-segment effects (captions, zoom, end card) composited in a single
  ffmpeg pass per segment. CRF 10 intermediate / CRF 14 final. Never lower quality.
- Always `setsar=1` after any crop+scale.

Captions and layout:
- Captions must not cover the speaker's face (inspect frames first) and must not
  go off-screen: min 120px horizontal padding, overflow hidden, max 2 words per chunk.
- Platform safe zone (1080x1920): nothing important below y=1440 or above y=220.

Expected architecture:
opening1 + animated body + outro -> final video 1
opening2 + animated body + outro -> final video 2
opening3 + animated body + outro -> final video 3

Hard rules:
- No HeyGen generation.
- No ElevenLabs generation.
- No new paid provider calls.
- No full-script avatar video.
- No `*_full`, `combined`, `whole`, or `deliverable-avatar-segment` provider job.
- Use existing audio/video as source of truth.
- Captions must follow the real audio, not guessed script text.
- Do not start any caption/composite render before I approve the transcript text.
- Do not start production before I approve the creative proposal.
- Never degrade video quality: respect the 2-encode budget.
- Preserve all provided source assets locally.
- Keep everything in one project folder.
- Use HyperFrames for the animated body/middle.
- Use the same modular structure and QA style from the `heygen-ai-avatar-video` skill.
- Follow:
  <SKILL_DIR>\references\video-production-guidelines.md

Project layout:
Create or update:

<PROJECT_PATH>\
  source\
    script.md or notes.md
    build-composition.mjs
  manifests\
    project.json
    segments.json
    audio-meta.json
    assemble.json
    audits\
  assets\
    avatar\
      opening1.mp4
      opening2.mp4
      opening3.mp4
      outro.mp4
    voice\
      body.wav
      body.transcript.json or body.captions.json
    logos\
    music\
  public\
  renders\
    segments\
      body.mp4
    final\
  snapshots\

Implementation steps:

1. Read the provided skill and production guide completely.

2. Initialize/organize the project folder.
   - Copy provided opening clips to:
     assets/avatar/opening1.mp4
     assets/avatar/opening2.mp4
     assets/avatar/opening3.mp4
   - Copy provided outro to:
     assets/avatar/outro.mp4
   - Copy body audio to:
     assets/voice/body.wav
   - Copy transcript/captions if provided.
   - Record original source paths in `manifests/project.json`.

3. Build `manifests/segments.json` with exactly this structure:
   - opening1: kind `avatar`, provider `provided`, renderPath `assets/avatar/opening1.mp4`
   - opening2: kind `avatar`, provider `provided`, renderPath `assets/avatar/opening2.mp4`
   - opening3: kind `avatar`, provider `provided`, renderPath `assets/avatar/opening3.mp4`
   - body: kind `animation`, provider `local`, audioPath `assets/voice/body.wav`, renderPath `renders/segments/body.mp4`
   - outro: kind `avatar`, provider `provided`, renderPath `assets/avatar/outro.mp4`

4. Build `manifests/audio-meta.json`.
   - Include durations for each provided opening/outro if possible.
   - Include body audio duration.
   - Include transcript/caption paths.
   - If no body transcript is provided, transcribe the existing body audio locally or with the available transcription tool. Do not use ElevenLabs.
   - Then run the Transcript Approval Gate: show me the full transcript text of every clip, flag the Vocabulary proper nouns and any suspicious tokens, and WAIT for my approval/corrections before any caption work.

5. Build the body/middle animation with HyperFrames.
   - First run the Creative Proposal Gate: present the creative proposal and WAIT for my approval before building.
   - Use `source/build-composition.mjs` as the authored generator.
   - Generate `public/index.html`.
   - Use the body audio and approved transcript/captions for timing.
   - Use the visual style from the previous modular videos:
     - strong kinetic text;
     - readable mobile captions;
     - no metadata captions;
     - no fake logos;
     - no empty card space;
     - no text overflow;
     - center visible content, not just containers.
   - Research/use real screenshots/logos/assets if the body references public tools, repos, docs, brands, or products.
   - Render only the body segment to:
     renders/segments/body.mp4

6. Snapshot/QA the body animation.
   - Run text inventory to ensure no metadata leaked.
   - Run overflow checks.
   - Capture snapshots at relevant timestamps.
   - Before the full caption render, screenshot the caption HTML at 3-5 representative timestamps and verify spelling (against the approved transcript), position (face not covered, inside safe zones), and no horizontal overflow.
   - Fix any visual issues before final assembly.

7. Build `manifests/assemble.json`:
   - variant opening1:
     assets/avatar/opening1.mp4 + renders/segments/body.mp4 + assets/avatar/outro.mp4
     -> renders/final/<slug>-opening1.mp4
   - variant opening2:
     assets/avatar/opening2.mp4 + renders/segments/body.mp4 + assets/avatar/outro.mp4
     -> renders/final/<slug>-opening2.mp4
   - variant opening3:
     assets/avatar/opening3.mp4 + renders/segments/body.mp4 + assets/avatar/outro.mp4
     -> renders/final/<slug>-opening3.mp4

8. Assemble final videos.
   - Use stream copy only if codec/resolution/fps/audio compatibility is safe.
   - Otherwise re-encode once at final assembly.
   - Respect the 2-encode budget: all per-segment effects in one ffmpeg pass per segment, CRF 10 intermediate / CRF 14 final, `setsar=1` after any crop+scale.
   - Keep final output vertical 9:16, 1080x1920.
   - If background music is requested or already provided, mix it only at final assembly and record provenance.

9. Run verification before final response.
   - Verify all three final MP4s exist.
   - Verify each is 1080x1920.
   - Verify video stream exists.
   - Verify audio stream exists.
   - Verify durations make sense.
   - Inspect frames near splice boundaries.
   - Confirm opening/body/outro sync and captions.

10. Return:
   - final MP4 paths;
   - body segment path;
   - source asset paths;
   - manifest paths;
   - QA snapshot/report paths;
   - any warnings.

Important:
This is an assembly + HyperFrames animation job from existing media. It is NOT a HeyGen generation job and NOT a TTS job.
