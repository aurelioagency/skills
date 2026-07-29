# Asset index — 0724 YouTube intro

Source compositions: `0724-youtube-intro` (`00:00–00:21`).

Before the `0724-youtube-intro-00-07` project was removed, its 29 copied assets were
verified byte-for-byte with SHA-256:

- 11 production-ready generated images
- 10 original ImageGen renders
- 8 sound effects used by the final `00:00–00:07` composition

## Typography and caption handoff

| Location | Purpose |
|---|---|
| `fonts/` | User-supplied Shelley/Helvetica, Poppins Black, official Google Fonts Inter/Playfair Display, plus Aventa and Saol Display. Poppins Light/Regular remain external requirements. |
| `baigun-typography.css` | Copy-paste `@font-face`, type hierarchy, responsive format sizes, safe zones, and caption motion. |
| `TYPOGRAPHY_STYLE_GUIDE.md` | Human-readable font roles, sizes, line height, tracking, spacing, palette, and usage rules. |
| `AVATAR_CAPTIONS_HANDOFF.md` | Recovered, scoped handoff for cumulative kinetic captions over avatar footage. |
| `generic-kinetic-type.css` | Project-neutral copy-paste font loading, semantic type roles, safe zones, and word-animation states. |
| `GENERIC_TYPOGRAPHY_SYSTEM.md` | Project-neutral font selection, sizing, spacing, tracking, safe-area, and fallback rules. |
| `GENERIC_CAPTION_KINETIC_TYPE_BEST_PRACTICES.md` | General production contract for greetings, object reveals, full intros, storyboards, captions, voice timing, and SFX. |
| `FONT_LICENSE_REQUIREMENTS.md` | Font provenance, checksums, official license references, and archive status. |
| `INTER_OFL.txt` | Official SIL Open Font License for the archived Inter variable font. |
| `PLAYFAIR_DISPLAY_OFL.txt` | Official SIL Open Font License for the archived Playfair Display variable italic font. |

## Generated images

Location: `img_generated/`

### Production-ready assets

| File | What it is / where to use it |
|---|---|
| `warm_cream_paper_background.png` | Shared warm cream paper texture behind all three intro blocks. |
| `green_dollar_cash_symbol.png` | Green dollar sign and coins for the business/money reveal in `00:00–00:07`. |
| `social_content_cards_stack.png` | Three vertical social-content cards for the “CREAR CONTENIDO” beat. |
| `three_phone_content_constellation.png` | Phone/content network for the “PARA REDES” beat. |
| `camera_recording_icon.png` | Coral professional camera for the “GRABARTE” beat. |
| `camera_recording_motion_echo.png` | Three camera echoes for the “UNA Y OTRA VEZ” repetition beat. |
| `painted_x_no_manual_editing.png` | Painted coral X that cancels repeated/manual work. |
| `video_editor_timeline_panel.png` | Dark editing timeline for the manual-editing beat. |
| `editing_scissors_icon.png` | Scissors used when the timeline is cut. |
| `pixel_hand_cursor.png` | Pixel cursor for clicking/selecting an editing action. |
| `layered_video_editing_stack.png` | Stacked editing layers for “EDITAR TODO”. |
| `three_vertical_phones_empty_screens.png` | Exact three-phone composition shown from `00:09–00:14`; paste one five-second vertical video into each empty screen. |
| `ai_skill_folder_black_coral.png` | Black/coral skill folder revealed in the `00:14–00:21` block. |
| `claude_workspace_window.png` | Claude workspace card in the three-platform reveal. |
| `chatgpt_workspace_window.png` | ChatGPT workspace card in the three-platform reveal. |
| `gemini_workspace_window.png` | Gemini workspace card in the three-platform reveal. |

### Original ImageGen renders

The `source_raw_` files preserve the original generated output before chroma removal
or production cleanup.

| Raw source | Production-ready counterpart |
|---|---|
| `source_raw_green_dollar_cash_symbol.png` | `green_dollar_cash_symbol.png` |
| `source_raw_social_content_cards_stack.png` | `social_content_cards_stack.png` |
| `source_raw_three_phone_content_constellation.png` | `three_phone_content_constellation.png` |
| `source_raw_camera_recording_icon.png` | `camera_recording_icon.png` |
| `source_raw_camera_recording_motion_echo.png` | `camera_recording_motion_echo.png` |
| `source_raw_painted_x_no_manual_editing.png` | `painted_x_no_manual_editing.png` |
| `source_raw_video_editor_timeline_panel.png` | `video_editor_timeline_panel.png` |
| `source_raw_editing_scissors_icon.png` | `editing_scissors_icon.png` |
| `source_raw_pixel_hand_cursor.png` | `pixel_hand_cursor.png` |
| `source_raw_layered_video_editing_stack.png` | `layered_video_editing_stack.png` |

The `coral_gift_box_*` assets were already present in this shared archive. They were
retained unchanged and are not required by the `0724-youtube-intro` compositions.

## Sound effects

Location: `audio_sound_effect/`

Filenames describe both the sound and the footage event they support.

### Effects used in `00:00–00:07`

| File | Footage cue / exact use |
|---|---|
| `tick_important_word.mp3` | `00:00.16`: quiet tick when the first important word locks into place. |
| `cash_money_value_word.mp3` | `00:00.52`: cash/coin cue when the green dollar sign lands. |
| `whoosh_fast_transition.mp3` | `00:01.16`: micro-whoosh between fast phrase/object states. |
| `pop_social_content_cards.mp3` | `00:01.78`: grouped pops as the three content cards appear. |
| `swipe_social_content_transition.mp3` | `00:02.56`: swipe into the social/phone constellation. |
| `shutter_camera_recording_reveal.mp3` | `00:03.42`: shutter and record click when the camera appears. |
| `ratchet_repeat_rewind_action.mp3` | `00:04.34`: rewind/ratchet under “UNA Y OTRA VEZ”. |
| `snap_timeline_cut_or_folder_open.mp3` | `00:05.12`: sharp snip/impact when the editing timeline is cut. |

### Effects used in `00:07–00:14`

Times are global video time; subtract seven seconds for the standalone block.

| File | Footage cue / exact use |
|---|---|
| `whoosh_clean_scene_wipe.mp3` | `00:07.00`: clean wipe out of the approved first block. |
| `tick_important_word.mp3` | `00:07.10` and `00:07.38`: restrained word hits on “MIRÁ” and “esto.” |
| `slice_typography_split.mp3` | `00:08.20`: slice cue as the typography divides/transitions. |
| `lock_phone_or_platform_card.mp3` | `00:08.55–00:09.00`: mechanical lock as the exact three-phone composition reaches its final slot. |

### Effects used in `00:14–00:21`

Times are global video time; subtract fourteen seconds for the standalone block.

| File | Footage cue / exact use |
|---|---|
| `tick_important_word.mp3` | `00:14.59` and `00:16.17`: quiet word locks; keep far below the voice. |
| `snap_timeline_cut_or_folder_open.mp3` | `00:15.17`: sharp snap as the skill folder opens/lands. |
| `pop_warm_ui_claude_reveal.mp3` | `00:15.67`: warm UI pop when Claude appears. |
| `whoosh_fast_transition.mp3` | `00:15.94`: micro-whoosh for the phrase/platform jump. |
| `impact_hero_word_or_low_thump.mp3` | `00:16.02`: restrained low thump beneath the hero phrase. |
| `lock_phone_or_platform_card.mp3` | `00:16.77`: mechanical lock when ChatGPT reaches its slot. |
| `chime_glass_gemini_reveal.mp3` | `00:17.69`: glassy chime when Gemini appears. |
| `confirm_three_platform_nodes.mp3` | `00:17.97`: three-node confirmation when Claude, ChatGPT, and Gemini form one system. |

Some purpose-specific filenames contain identical audio bytes because the same cue was
reused for a different semantic event. The names are intentionally retained so an
editor can select a cue by footage purpose.

### Mixing rule

- Keep the voice dominant.
- Use one cue per semantic group, not one sound per word.
- Word ticks normally sit around `0.06–0.08` relative volume.
- Transitions and locks normally sit around `0.08–0.12` relative volume.
- Trim long tails before the next spoken phrase.
