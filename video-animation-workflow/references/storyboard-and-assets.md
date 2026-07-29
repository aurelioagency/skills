# Storyboards and raster assets

## Contents

- [Block structure](#block-structure)
- [Panel contract](#panel-contract)
- [Storyboard sheets](#storyboard-sheets)
- [Asset audit](#asset-audit)
- [New raster generation](#new-raster-generation)
- [Asset manifest](#asset-manifest)
- [Approval review](#approval-review)

## Block structure

Use blocks of at most ten seconds:

```text
A: 00:00-00:10
B: 00:10-00:20
C: 00:20-end
```

Shorter videos may use fewer blocks. A block is a production boundary, not a license to use only one panel. Add panels at every meaningful visual change.

## Panel contract

```text
Panel ID:
Exact time:
Narration:
Native editable text:
Composition and hierarchy:
Asset file or missing-asset ID:
Asset position:
Approximate scale:
Entry:
Continuous motion:
Exit:
SFX opportunity:
16:9 layout:
9:16 layout:
Purpose:
```

Specify safe margins numerically when a composition approaches an edge or platform overlay zone.

## Storyboard sheets

Generate one readable sheet per production block and requested format. A sheet is visual proof, not the source of exact captions.

- Use generated imagery to show composition and asset identity.
- Add exact panel labels and timing as native text outside generated bitmap panels when the tool allows.
- Keep a panel specification beside every sheet so spelling and timing never depend on image-rendered text.
- Save the generation prompt and untouched source output.
- Do not use a landscape sheet as the portrait storyboard.

## Asset audit

Search in this order:

1. active brand profile;
2. project assets;
3. this skill's starter library;
4. approved reference-project assets;
5. new generation.

Reuse means the exact approved file or subject identity. A similar regeneration is a new asset.

## New raster generation

Use the confirmed image-generation tool for every new bitmap illustration.

Prompt for:

- subject and semantic role;
- camera/viewpoint;
- material and lighting;
- palette constraints from the active brand;
- transparent, solid, or keyed background requirement;
- composition-safe empty areas;
- no text, logos, labels, watermarks, or signatures;
- intended format and approximate placement.

Generate each independently addressable object separately. A storyboard sheet is not a production asset.

Keep:

```text
assets/generated/<asset-id>/
  prompt.md
  source/
  production/
  review/
```

Do not patch a failed generated asset with programmatic placeholder art. Regenerate or clean the approved source while preserving identity.

## Asset manifest

Record:

| Asset ID | Panel | Exact file | Origin | Prompt/source | Brand adaptation | License/status | SHA-256 |
|---|---|---|---|---|---|---|---|

Origin is one of:

- brand profile;
- project reuse;
- starter-library reuse;
- generated new;
- user supplied.

The storyboard cannot be approved while a major visual says only "find an image later."

## Approval review

Review all blocks together for:

- narrative continuity;
- stable brand palette and typography;
- asset identity across transitions;
- one clear hierarchy per screen;
- readability in every requested ratio;
- no caption, label, asset, or arrow overlap;
- logical spatial continuity;
- reproducible geometry;
- one intentional sound opportunity per transition or semantic group.
