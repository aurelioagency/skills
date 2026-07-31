# Instagram Reels 9:16 safe zones

Use this reference whenever the requested `9:16` destination includes Instagram Reels, Facebook Reels, or a vertical file that may later be boosted as a Reel.

## Source findings

Meta and Instagram currently document:

- Reels accept aspect ratios from `1.91:1` through `9:16`, with at least `30 FPS` and at least `720 px` resolution.
- Boosted Reels must use full-screen vertical `9:16`.
- Meta recommends vertical `9:16`, audio, and key messages inside the Reels safe zone.
- Meta's Reels ads guide explicitly requires keeping the bottom `35%` free of key creative elements, text, and logos.
- Meta recommends checking the final creative with its safe-zone checker or Ads Manager preview.

Primary sources:

- Instagram Help Centre, Reel size and aspect ratios: `https://www.facebook.com/help/instagram/1038071743007909?locale=en_GB`
- Instagram Help Centre, boosted Reels: `https://www.facebook.com/help/instagram/570215404599013?locale=en_GB`
- Meta for Business, Reels ads: `https://www.facebook.com/business/ads/facebook-instagram-reels-ads`
- Meta Reels ads guide PDF: `https://d3m889aznlr23d.cloudfront.net/img/events/458925814/assets/e042d2be.reels_ads_guide1.pdf`
- Instagram Help Centre, partnership-ad safe-zone warning: `https://www.facebook.com/help/instagram/864398265379023?locale=en_GB`

The current official pages do not publish one immutable four-sided pixel rectangle for every organic-Reels device and UI variant. A Meta-branded Reels playbook mirrored by a third party diagrams approximately `14%` at the top and `6%` on each side:

- Supplemental mirrored diagram: `https://rdigital.co/wp-content/uploads/2025/05/ReelsPlaybook_TurnCustomerAttentionIntoResults.pdf`

Because this copy is not hosted on a Meta domain, treat `14%` top and `6%` sides as documented supplemental geometry, not as an independently verified current Help Centre specification. The `35%` bottom clearance is directly stated in Meta's official Reels ads guide.

This workflow combines the official `35%` bottom rule with the supplemental `14%` top and `6%` side geometry as a conservative default for every Reel. This is a workflow decision intended to keep the output suitable for organic viewing and later boosting. Confirm paid-media deliverables in Meta's current safe-zone checker or Ads Manager preview.

## Required 1080x1920 geometry

For a `1080x1920` canvas:

| Boundary | Percentage | Pixel clearance |
| --- | ---: | ---: |
| Top | `14%` | `269 px` |
| Bottom | `35%` | `672 px` |
| Left | `6%` | `65 px` |
| Right | `6%` | `65 px` |

The conservative critical safe rectangle is:

```text
x1 = 65
y1 = 269
x2 = 1015
y2 = 1248
width = 950
height = 979
```

Apply that rectangle to captions, logos, calls to action, prices, brand or product labels, faces, and indispensable product detail. Backgrounds, texture, shadows, connector tails, and nonessential bleed may extend outside it.

## Workflow caption guardrail

The interaction rail occupies the right side of the phone interface. Keep captions and exact text inside a stricter right boundary:

```text
x1 = 65
y1 = 269
x2 = 972
y2 = 1248
```

The `10%` right clearance is a conservative workflow guardrail, not a separate Meta-published percentage. Use it for captions, logos, CTAs, and text labels. A nonessential image may use the supplemental-guide `6%` right margin when the storyboard explicitly approves it.

## Authoring contract

- Design a real `9:16` composition; never crop the `16:9` version.
- Keep the complete visible bounding box of every critical element inside the safe rectangle while its opacity is `0.5` or greater.
- Measure the full motion envelope, not only the resting frame.
- Treat the top, bottom, and right UI regions as unavailable layout space. Do not fill them with extra copy.
- Place captions in the central vertical band. Do not use the bottom third as a lower-third caption area.
- Let backgrounds and nonessential motion bleed through UI zones so the composition still fills the screen.
- Do not add `data-layout-allow-caption-zone` to captions, logos, CTAs, brand labels, or key products.
- If platform UI changes or the final delivery is paid media, confirm the output again in Meta Ads Manager before publishing.

Calculate the geometry for another `9:16` resolution with:

```text
node <skill>/scripts/reels-safe-zone.mjs --width <width> --height <height> --json
```

During authoring, copy `assets/starter-library/guides/reels-9x16-safe-zone.css`, add the two debug overlay elements, and enable `data-reels-safe-debug="true"` on the composition root. Disable the debug attribute before final render.

## Validation contract

At minimum:

1. Capture every approved panel with the safe-zone overlay enabled.
2. Capture entrances, holds, and exits for any caption or key asset near a boundary.
3. Run HyperFrames checks against the top, bottom, and right UI bands.
4. Reject a panel when any critical bounding box crosses its permitted rectangle.
5. Disable the overlay and repeat the final encoded-output inspection.
