# Measures the rendered width, in pixels, of each line received on stdin.
#
# Used by build-burn-in-captions.mjs and audit-caption-width.mjs. libass stops
# applying margin-based line wrapping once an event carries \pos or \move, so the
# line breaks have to be decided by us, against the real font metrics.
#
# Usage: python measure_text.py <font.ttf> <size-px>   (JSON array of strings on stdin)
import json
import sys

try:
    from PIL import ImageFont
except ImportError:  # pragma: no cover
    sys.stderr.write(
        "Pillow is required to measure caption width. Install it with: pip install Pillow\n"
    )
    sys.exit(2)

font_path, size = sys.argv[1], int(sys.argv[2])
font = ImageFont.truetype(font_path, size)
lines = json.loads(sys.stdin.read())
print(json.dumps([font.getlength(text) for text in lines]))
