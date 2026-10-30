"""Compatibility entry point; batch intake is owned by motion-reel-ingest."""
from pathlib import Path
import runpy

if __name__ == '__main__':
    target = Path(__file__).resolve().parents[2] / 'motion-reel-ingest/scripts/batch-takes.py'
    if not target.is_file():
        raise SystemExit('Install the sibling motion-reel-ingest skill to use batch intake.')
    runpy.run_path(str(target), run_name='__main__')
