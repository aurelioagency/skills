# Eyecandy technique catalogue

136 techniques from [eyecannndy.com](https://eyecannndy.com), grouped by class, each with its link
and how it behaves on MiniMax H3. The site returns 403 to programmatic fetches, so this is a
bundled cache — it works in Claude Code and Codex alike, with no browser.

Use the technique name **verbatim** in the prompt. The model recognises these names; describing the
movement from scratch works worse.

## The three flags

- **works** — write the name, it comes out
- **works with a rule** — it comes out only if the prompt carries the clause noted on that line
  (see [`prompt-rules.md`](prompt-rules.md))
- **does not work** — not reachable with this API, for the reason stated on that line

Honest scope: **works** covers what has been run and what is a plain single-shot request. The rest is
judgement from how the endpoints behave, not from 136 paid tests. When a run contradicts a line
here, correct the line.

The two clauses referenced below:

- **FRAMING RULE** — the opening framing is the widest framing in the clip
- **SCALE RULE** — the subject grows by approaching, never by the camera retreating
- **ANCHOR** — name each object that must stay still and pin it

---

## 1. Camera movement

| Technique | Link | What it is | H3 |
|---|---|---|---|
| Aerial | [/aerial](https://eyecannndy.com/technique/aerial) | Footage from an aircraft or drone | works with a rule — FRAMING RULE, or it opens up and invents landscape |
| Arc | [/arc-movement](https://eyecannndy.com/technique/arc-movement) | Camera travels a smooth circle around the subject. Variants: arc spin, X-axis, Y-axis | works |
| Bolt Cam | [/bolt-cam](https://eyecannndy.com/technique/bolt-cam) | Very fast motorised camera arm, ~6 ft/s in any direction | works |
| Camera Roll | [/camera-roll](https://eyecannndy.com/technique/camera-roll) | The whole scene rotates, usually 180°. Variant: whip roll | works — verified, including a full 360° roll in i2v |
| Dolly | [/dolly-shot](https://eyecannndy.com/technique/dolly-shot) | Camera moves toward or away from the subject. Variants: crash dolly, infinite dolly, steadicam, technocrane | works with a rule — a dolly *out* needs the FRAMING RULE |
| Dolly Zoom | [/dolly-zoom](https://eyecannndy.com/technique/dolly-zoom) | Dolly one way while zooming the other; the background warps. Vertigo effect | works |
| Double Dolly | [/double-dolly](https://eyecannndy.com/technique/double-dolly) | Spike Lee's: dolly zoom while subject and camera are both moving | works |
| Fixed Cam | [/fixed-camera](https://eyecannndy.com/technique/fixed-camera) | Camera locked to an object; background changes, the object does not | works with a rule — ANCHOR the object or it drifts |
| FPV Drone | [/fpv-drone](https://eyecannndy.com/technique/fpv-drone) | Drone-eye footage, aggressive and continuous | works with a rule — FRAMING RULE on any opening-out move |
| Handheld | [/shaky-cam](https://eyecannndy.com/technique/shaky-cam) | Hand-held feel, documentary energy | works |
| Lazy Susan | [/lazy-susan](https://eyecannndy.com/technique/lazy-susan) | Camera at the centre of a table, panning to each subject | works with a rule — ANCHOR everything on the table |
| Locked-On | [/locked-on](https://eyecannndy.com/technique/locked-on) | One element stays pinned dead centre while everything else moves | works with a rule — ANCHOR the locked element by name |
| Omnidirectional | [/omnidirectional](https://eyecannndy.com/technique/omnidirectional) | 360° camera look. Variant: tiny planet | works with a rule — FRAMING RULE, it is a wide look by nature |
| Pan | [/pan](https://eyecannndy.com/technique/pan) | Camera rotates horizontally from a fixed point. Variant: yo-yo pan | works |
| Pass Through | [/pass-through](https://eyecannndy.com/technique/pass-through) | Camera physically passes through an object or person | works |
| Pedestal | [/pedestal](https://eyecannndy.com/technique/pedestal) | Camera rises or falls vertically, mount fixed | works with a rule — rising usually widens; FRAMING RULE |
| Snorricam | [/snorricam](https://eyecannndy.com/technique/snorricam) | Camera rigged to the body; the actor is still, the world swings | works |
| Tilt | [/tilt](https://eyecannndy.com/technique/tilt) | Camera pivots up or down from a fixed point. Variant: whip tilt | works |
| Tracking | [/tracking](https://eyecannndy.com/technique/tracking) | Camera follows the subject. Variants: towards camera, away from camera | works |
| Trucking | [/trucking](https://eyecannndy.com/technique/trucking) | Camera moves laterally alongside the subject | works |
| Wandering | [/wandering](https://eyecannndy.com/technique/wandering) | Camera drifts through a space as if walking | works with a rule — FRAMING RULE, it wanders into invented rooms |
| Whip Pan | [/whip-pan](https://eyecannndy.com/technique/whip-pan) | Very fast pan, motion-blur streaks. Variant: yo-yo whip | works |
| Zoom | [/zoom-in](https://eyecannndy.com/technique/zoom-in) | Focal length change. Variants: crash zoom, infinite zoom, slow zoom, super zoom, yo-yo zoom, zoom out | works with a rule — zoom *in* is clean; any zoom out needs the FRAMING RULE |

## 2. Angle and height

| Technique | Link | What it is | H3 |
|---|---|---|---|
| Dutch Angle | [/dutch-angle](https://eyecannndy.com/technique/dutch-angle) | Camera tilted off-axis for unease | works |
| Ground Level | [/ground-shot](https://eyecannndy.com/technique/ground-shot) | Camera 1–2 feet off the ground. Variant: water level | works |
| High Angle | [/high-angle](https://eyecannndy.com/technique/high-angle) | Looking down at the subject at an angle | works |
| Low Angle | [/low-angle](https://eyecannndy.com/technique/low-angle) | Looking up; makes subjects tower. Variant: trunk shot | works |
| Overhead | [/overhead](https://eyecannndy.com/technique/overhead) | Camera directly above, shooting down. Variants: bird's-eye, overhead close-up, overhead tracking | works with a rule — FRAMING RULE unless the source image is already overhead |
| Over the Shoulder | [/over-the-shoulder](https://eyecannndy.com/technique/over-the-shoulder) | Camera behind one character, facing another | works with a rule — say `closer to the camera than <subject>`; "behind the shoulder" reads as depth and fuses the two |
| Profile | [/profile-shot](https://eyecannndy.com/technique/profile-shot) | Subject in side profile | works |
| Worms-Eye | [/worms-eye](https://eyecannndy.com/technique/worms-eye) | Looking straight up from the ground | works with a rule — FRAMING RULE, it tends to reveal invented ceiling |

## 3. Framing and composition

| Technique | Link | What it is | H3 |
|---|---|---|---|
| Aspect Ratio Switch | [/aspect-ratio-switch](https://eyecannndy.com/technique/aspect-ratio-switch) | The frame's dimensions change mid-shot | does not work — the output has one fixed aspect ratio; crop it in post |
| Central Framing | [/central-framing](https://eyecannndy.com/technique/central-framing) | Subject dead centre, symmetrical | works |
| Close-Up | [/close-up](https://eyecannndy.com/technique/close-up) | Frame filled by part of the subject. Variants: extreme close-up, medium close-up | works |
| Cut-ins | [/cut-ins](https://eyecannndy.com/technique/cut-ins) | Cut from a shot into a closer element of that same shot | does not work — needs a cut; use two clips, or i2v with the close-up as `last_frame` |
| Match Split | [/match-split](https://eyecannndy.com/technique/match-split) | Split screen where both halves form one coherent image | does not work — compositing; build it in post from two clips |
| Reflections | [/reflections](https://eyecannndy.com/technique/reflections) | Mirror and window shots | works with a rule — ANCHOR the mirror; reflections drift badly otherwise |
| Screen in Screen | [/screen-in-screen](https://eyecannndy.com/technique/screen-in-screen) | A screen or photo frame shown inside the frame | works with a rule — ANCHOR the inner screen and state what plays on it |
| Shadow Box | [/shadow-box](https://eyecannndy.com/technique/shadow-box) | Visuals placed inside the frame without filling it. Variant: light box | works with a rule — ANCHOR the box edges |
| Split Screen | [/split-screen](https://eyecannndy.com/technique/split-screen) | Frame divided into segments. Variant: frame division | does not work — compositing; assemble in post |
| Tableau | [/tableau-shots](https://eyecannndy.com/technique/tableau-shots) | Painting-like arranged composition | works with a rule — ANCHOR every element or the arrangement melts |
| Two Shot | [/two-shot](https://eyecannndy.com/technique/two-shot) | Two people in frame, not necessarily side by side | works with a rule — give each one a distinct position; converging subjects fuse |
| Void | [/void](https://eyecannndy.com/technique/void) | Dream-like empty space. Variant: light void | works with a rule — FRAMING RULE, or it fills the void with invented set |
| Wide shot | [/wide-shot](https://eyecannndy.com/technique/wide-shot) | The full subject and its surroundings. Variant: extreme wide | works with a rule — only if the opening frame is already wide; a wide *reveal* violates the FRAMING RULE |

## 4. Optics, lens and light

| Technique | Link | What it is | H3 |
|---|---|---|---|
| Fisheye | [/fisheye](https://eyecannndy.com/technique/fisheye) | Ultra-wide bulging distortion | works with a rule — FRAMING RULE; fisheye is a wider look than the source frame |
| Focal shift | [/focal-shift](https://eyecannndy.com/technique/focal-shift) | Focus moves from one subject to another | works |
| Halation | [/halation](https://eyecannndy.com/technique/halation) | Film-style glow bleeding around highlights | works |
| Hard Light | [/hard-light](https://eyecannndy.com/technique/hard-light) | Sharp-edged shadows, high contrast lighting | works |
| Haze | [/haze](https://eyecannndy.com/technique/haze) | Soft, dreamy, diffused image | works |
| Light Flash | [/light-flash](https://eyecannndy.com/technique/light-flash) | A burst of light across the frame | works |
| Magnification | [/magnification](https://eyecannndy.com/technique/magnification) | Macro view inside a magnifying glass | works with a rule — ANCHOR the glass and SCALE RULE for what grows inside it |
| Night Vision | [/night-vision](https://eyecannndy.com/technique/night-vision) | Amplified low-light / infrared look | works |
| Probe | [/probe-lens](https://eyecannndy.com/technique/probe-lens) | Macro probe lens weaving through tight spaces | works |
| Shallow Focus | [/focal-focus](https://eyecannndy.com/technique/focal-focus) | Thin depth of field. Variants: bokeh, rack focus | works |
| Silhouette | [/silhouette](https://eyecannndy.com/technique/silhouette) | Dark shape against a bright background. Variant: shadows | works |
| Slit-scan | [/slit-scan](https://eyecannndy.com/technique/slit-scan) | Scanning a narrow slit across a scene; time smears across space | does not work — a scanline process, not a camera move; do it in post |
| Split Diopter | [/split-diopter](https://eyecannndy.com/technique/split-diopter) | Two planes sharp at once, near and far | works |
| Spotlight | [/spotlight](https://eyecannndy.com/technique/spotlight) | A single pool of light isolating the subject | works |
| Thermal | [/thermal](https://eyecannndy.com/technique/thermal) | Heat-camera look | works |
| Tilt Shift | [/tilt-shift](https://eyecannndy.com/technique/tilt-shift) | Selective plane of focus; the world looks like a model | works |
| Ultra Wide | [/ultra-wide-zero-d](https://eyecannndy.com/technique/ultra-wide-zero-d) | Extremely wide lens, minimal distortion | works with a rule — only as the opening framing, never as a reveal |
| Vignette | [/vignette](https://eyecannndy.com/technique/vignette) | Darkened frame edges | works |
| Wigglegram | [/wigglegram](https://eyecannndy.com/technique/wigglegram) | Multi-lens parallax wobble, popularised by *HUMBLE.* | does not work — a multi-camera artefact; fake it in post |
| X-Ray | [/x-ray](https://eyecannndy.com/technique/x-ray) | Skeletal, see-through imaging | works |

## 5. Transitions

| Technique | Link | What it is | H3 |
|---|---|---|---|
| Conveyor | [/conveyor](https://eyecannndy.com/technique/conveyor) | Scenes slide past like a conveyor belt | works |
| Crash cut | [/crash-transition](https://eyecannndy.com/technique/crash-transition) | A crash zoom that cuts into another scene | works with a rule — generate the crash zoom, make the cut in post |
| Flash Cut | [/flash-cut](https://eyecannndy.com/technique/flash-cut) | Rapid-fire images in succession | does not work — many cuts; assemble in post |
| Jump cut | [/jump-cut](https://eyecannndy.com/technique/jump-cut) | The subject jumps forward in time within one shot | does not work — an edit, not a camera behaviour |
| Match Cut | [/match-cut](https://eyecannndy.com/technique/match-cut) | Two different scenes linked by a matching shape or motion | works with a rule — do it as i2v with the second scene as `last_frame`, then cut in post |
| Match motion | [/match-motion](https://eyecannndy.com/technique/match-motion) | Camera motion carries seamlessly across a cut | does not work via reference video — motion is not inherited (verified 2/2). Describe both moves in words, in two clips |
| Morphing | [/morphing](https://eyecannndy.com/technique/morphing) | One object transforms into another | works — i2v with start and end as the two frames is exactly this |
| Object Portal | [/object-portal](https://eyecannndy.com/technique/object-portal) | An object becomes a doorway into another world. Variant: frame portal | works with a rule — ANCHOR the object; only the portal interior may change |
| Quick Cuts | [/quick-cuts](https://eyecannndy.com/technique/quick-cuts) | Frenetic hyper-fast cutting | does not work — many cuts; assemble in post |
| Set Transition | [/set-transition](https://eyecannndy.com/technique/set-transition) | The set itself opens, falls away, or lifts | works |
| Transformation | [/transformation](https://eyecannndy.com/technique/transformation) | A being or object turns into something else | works |
| Transitions | [/transition](https://eyecannndy.com/technique/transition) | The general family. Variants: arc, crash, infinite, **roll transition**, screen | works — roll transition is verified |

## 6. Time and speed

| Technique | Link | What it is | H3 |
|---|---|---|---|
| Boomerang | [/boomerang](https://eyecannndy.com/technique/boomerang) | Short clip looping forward then reverse | does not work — generate the forward move and mirror it in ffmpeg |
| Bullet Time | [/bullet-time](https://eyecannndy.com/technique/bullet-time) | Time freezes while the camera keeps orbiting | works with a rule — ANCHOR every subject as frozen, then ask for the orbit |
| Cinemagraph | [/cinemagraph](https://eyecannndy.com/technique/cinemagraph) | A still image with one element moving | works with a rule — ANCHOR everything except the one moving element |
| Echo print | [/echo-printing](https://eyecannndy.com/technique/echo-printing) | Trailing after-images behind the motion | does not work — a print process; do it in post |
| Fast Motion | [/undercranking](https://eyecannndy.com/technique/undercranking) | Sped-up action. Variants: **hyperlapse**, timelapse, time slice | works — hyperlapse is understood by name |
| Freeze Frame | [/freeze-frame](https://eyecannndy.com/technique/freeze-frame) | The image stops dead on one frame | works with a rule — put the freeze at the tail of the timeline and hold it |
| Infinite Loop | [/infinite](https://eyecannndy.com/technique/infinite) | Movement that appears endless | works with a rule — make the last frame match the first, then loop in post |
| Motion Blur | [/motion-blur](https://eyecannndy.com/technique/motion-blur) | Smeared movement | works |
| Slow Motion | [/slow-motion](https://eyecannndy.com/technique/slow-motion) | Action slowed. Variant: ultra slow motion | works |
| Speed Ramp | [/speed-ramping](https://eyecannndy.com/technique/speed-ramping) | Speed shifts within one shot | works with a rule — write the ramp into the timeline second by second |
| Step-print | [/step-printing](https://eyecannndy.com/technique/step-printing) | Repeated frames, stuttering low frame rate. Variant: low frame-rate | does not work — a frame-rate process; do it in post |
| Stutter | [/stutter](https://eyecannndy.com/technique/stutter) | Frames repeated or skipped for a jittery look | does not work — a frame-level edit; do it in post |

## 7. Image manipulation and texture

| Technique | Link | What it is | H3 |
|---|---|---|---|
| Architexture | [/architexture](https://eyecannndy.com/technique/architexture) | Buildings and murals animated in place. Variant: moving murals | works with a rule — ANCHOR the building; only the surface may move |
| Collage | [/collage](https://eyecannndy.com/technique/collage) | Mixed images and clips assembled into one visual | works with a rule — ref2v with up to 9 images, but no exact cut in or out |
| Color Shift | [/color-shift](https://eyecannndy.com/technique/color-shift) | Colour changes dramatically mid-shot | works |
| Datamosh | [/datamosh](https://eyecannndy.com/technique/datamosh) | Compression-artefact smearing between scenes | does not work — a codec artefact; do it in post |
| Distortions | [/distortions](https://eyecannndy.com/technique/distortions) | Warped, bent imagery | works |
| Double Exposure | [/double-exposure](https://eyecannndy.com/technique/double-exposure) | Images layered over each other. Variant: cross dissolve | works |
| Duplication | [/duplication](https://eyecannndy.com/technique/duplication) | The same subject cloned in frame. Variant: object duplication | works with a rule — give each copy its own position; same destination means fusion |
| Feedback | [/glitch](https://eyecannndy.com/technique/glitch) | Analogue glitch, static, CRT distortion | works |
| Floating UI | [/digital-overlay](https://eyecannndy.com/technique/digital-overlay) | Abstract digital interface floating in the shot | works with a rule — ANCHOR the panels; unanchored UI drifts |
| Generative | [/generative](https://eyecannndy.com/technique/generative) | AI-generated visuals as an aesthetic | works |
| Kaleidoscope | [/kaleidoscope](https://eyecannndy.com/technique/kaleidoscope) | Symmetrical mirrored patterns | works |
| Levitation | [/floating](https://eyecannndy.com/technique/floating) | A person or object hovers with no support | works with a rule — ANCHOR the hover height, or it keeps rising |
| Masking | [/masking](https://eyecannndy.com/technique/masking) | Isolating regions of the frame to combine footage. Variants: background replacement, double exposure mask, window masking | does not work — a compositing step; do it in post |
| Maximalism | [/maximalism](https://eyecannndy.com/technique/maximalism) | Excess of colour, pattern, texture, ornament | works |
| Mixed Media | [/mixed-media](https://eyecannndy.com/technique/mixed-media) | Several media combined in one image | works |
| Parallax | [/parallax](https://eyecannndy.com/technique/parallax) | Foreground and background move separately for depth | works |
| Projections | [/projections](https://eyecannndy.com/technique/projections) | Images projected onto walls, buildings, bodies | works with a rule — ANCHOR the projection surface |
| Scale Shift | [/scale-shift](https://eyecannndy.com/technique/scale-shift) | Forced perspective; small looks huge and vice versa. Variants: big head, giant, miniature | works with a rule — SCALE RULE, always |
| Typography | [/typography](https://eyecannndy.com/technique/typography) | Text as a visual element. Variants: credits, diegetic, hand-drawn, intertitles, kinetic, subtitles, title card | works with a rule — expect misspelling; put real text in post |

## 8. POV, subject and narrative

| Technique | Link | What it is | H3 |
|---|---|---|---|
| Anthropo | [/anthropomorphism](https://eyecannndy.com/technique/anthropomorphism) | Human traits given to animals or objects. Variant: talking animal | works |
| BTS | [/breakdown](https://eyecannndy.com/technique/breakdown) | Deliberately unfinished look — visible green screen, VFX in progress | works |
| Choreo | [/choreo](https://eyecannndy.com/technique/choreo) | Designed dance movement carrying the piece | works |
| Epiphany | [/epiphany-shot](https://eyecannndy.com/technique/epiphany-shot) | The moment a character realises something | works |
| Falling | [/falling](https://eyecannndy.com/technique/falling) | Subject falling or flying. Variant: flying | works with a rule — SCALE RULE if the subject approaches the lens as it falls |
| First-Person | [/first-person-pov](https://eyecannndy.com/technique/first-person-pov) | The camera is the character's eyes. Variants: animal POV, direct address | works |
| Fourth Wall | [/fourth-wall](https://eyecannndy.com/technique/fourth-wall) | The character acknowledges the camera. Variants: aside, direct, droste effect, frame play | works |
| Gesture | [/digital-gesture](https://eyecannndy.com/technique/digital-gesture) | Swiping and tapping the real world as if it were a screen | works |
| Interview | [/interview](https://eyecannndy.com/technique/interview) | Subject answering an off-screen question. Variant: news | works |
| Object POV | [/as-object](https://eyecannndy.com/technique/as-object) | The lens *is* an object in the character's world. Variants: mirror cam, screen POV | works with a rule — never point a second element at the lens too, or they fuse |
| Product | [/product](https://eyecannndy.com/technique/product) | Hero shots of a product. Variants: alcohol, car, shoes | works with a rule — ANCHOR the product, or it deforms and floats |
| Video Portraits | [/video-portraits](https://eyecannndy.com/technique/video-portraits) | A short moving portrait of a person or group | works |
| Voyeur | [/voyeur](https://eyecannndy.com/technique/voyeur) | Watching someone who does not know they are watched | works |

## 9. Animation and practical

| Technique | Link | What it is | H3 |
|---|---|---|---|
| Animation | [/traditional](https://eyecannndy.com/technique/traditional) | Cel animation and its cousins. Variants: 3D, charcoal, colour sketch, comic art, doodle, line art, oil paint, pencil sketch, rotoscope | works |
| Diorama | [/model](https://eyecannndy.com/technique/model) | A miniature built replica of a scene | works |
| Photogrammetry | [/photogrammetry](https://eyecannndy.com/technique/photogrammetry) | 3D reconstruction from photographs. Variant: NeRF | works — as a *look*, not as actual reconstruction |
| Pixel Art | [/pixel-art](https://eyecannndy.com/technique/pixel-art) | Hand-placed pixel animation. Variant: live action pixelation | works |
| Stop Motion | [/stop-motion](https://eyecannndy.com/technique/stop-motion) | Objects moved frame by frame. Variants: claymation, pixilation | works |
| Zoetrope | [/zoetrope](https://eyecannndy.com/technique/zoetrope) | Spinning cylinder of sequential images. Variant: phenakistiscope | works with a rule — ANCHOR the device; ask only for the drum to spin |

## 10. Aesthetic and genre

| Technique | Link | What it is | H3 |
|---|---|---|---|
| Altered state | [/trip](https://eyecannndy.com/technique/trip) | Drug- or alcohol-warped perception. Variants: drug trip, inebriation | works |
| Dreamcore | [/dreamcore](https://eyecannndy.com/technique/dreamcore) | Dream and nightmare motifs. Variant: liminal | works |
| Dystopian | [/dystopian](https://eyecannndy.com/technique/dystopian) | Oppressive, collapsed-society imagery | works |
| Magical realism | [/surrealism](https://eyecannndy.com/technique/surrealism) | Magic treated as ordinary inside a real world | works |
| Photography | [/photography](https://eyecannndy.com/technique/photography) | Stills-photography language applied to motion | works |
| Stylistic Suck | [/stylistic-suck](https://eyecannndy.com/technique/stylistic-suck) | Deliberately bad, for irony | works |
| Underwater | [/underwater](https://eyecannndy.com/technique/underwater) | Shot beneath the surface | works |
| Video Game | [/video-game](https://eyecannndy.com/technique/video-game) | Game-engine look and shot grammar | works |
| Vintage | [/vhs](https://eyecannndy.com/technique/vhs) | Found-footage, VHS, archival feel. Variants: archival, vintage graphics | works |
| Weirdcore | [/wierdcore](https://eyecannndy.com/technique/wierdcore) | Low-quality surreal imagery; dread and false nostalgia | works |
