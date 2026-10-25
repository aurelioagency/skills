"""Final render invariants; real Chromium/FFmpeg smoke runs supplement these tests."""
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))
spec = importlib.util.spec_from_file_location('render_final', SCRIPTS / 'render-final.py')
render_final = importlib.util.module_from_spec(spec)
spec.loader.exec_module(render_final)
from pipeline import Pipeline
from lib.pipeline_support import write_json


class ParallelTests(unittest.TestCase):
    def test_non_integer_duration_has_no_omitted_or_duplicated_frames(self):
        for fps in (30, 60, 30000 / 1001):
            total = round(28.31 * fps)
            intervals = render_final.frame_ranges(total, round(3 * fps))
            self.assertEqual([i for start, end in intervals for i in range(start, end)], list(range(total)))

    def test_resource_limits_override_excessive_worker_requests(self):
        pixels = 2160 * 3840
        self.assertEqual(render_final.worker_count('auto', 10, pixels, 64 * 2**30, 16), 4)
        self.assertEqual(render_final.worker_count('20', 10, pixels, 5 * 2**30, 16), 1)
        self.assertEqual(render_final.worker_count('auto', 10, pixels, None, 16), 1)
        self.assertEqual(render_final.worker_count('auto', 1, pixels, 64 * 2**30, 16), 1)

    def test_native_dimensions_and_fps_are_required_before_render(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            write_json(root / 'pipeline.json', {'version': 1, 'branch': 'B', 'source': 'source.mp4'})
            write_json(root / 'timeline.json', {'scale': 1, 'fps': 60, 'formats': ['9x16']})
            pipeline = Pipeline(root)
            with patch('pipeline.probe', return_value={'width': 2160, 'height': 3840, 'fps': 60}), patch.object(pipeline, 'command') as command:
                with self.assertRaisesRegex(ValueError, 'native source resolution'):
                    pipeline.render(final=True)
                write_json(root / 'timeline.json', {'scale': 2, 'fps': 30, 'formats': ['9x16']})
                with self.assertRaisesRegex(ValueError, 'fps cannot be lower'):
                    pipeline.render(final=True)
                command.assert_not_called()

    def test_low_memory_renders_whole_film_once_without_concatenating(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            write_json(root / 'timeline.json', {'scale': 2, 'fps': 60, 'duration': 12})
            def capture(args, cwd, log):
                self.assertEqual(args[0], 'node')  # No concatenation command needed.
                self.assertEqual(args[args.index('--frames') + 1], '0,720')
                Path(args[args.index('--output') + 1]).write_bytes(b'verified fixture')
            with patch.object(render_final, 'available_memory', return_value=5 * 2**30), \
                 patch.object(render_final, 'run_logged', side_effect=capture) as run, \
                 patch.object(render_final, 'verify_segment', return_value={}):
                report = render_final.render(root, '9x16', key='test')
            self.assertEqual(run.call_count, 1)
            self.assertEqual((report['mode'], report['workers'], report['segments']), ('single', 1, 1))
            self.assertEqual((root / 'renders/9x16.mp4').read_bytes(), b'verified fixture')

    def test_reject_wrong_size_fps_missing_frame_and_segment_audio(self):
        stream = {'codec_type': 'video', 'width': 2160, 'height': 3840, 'avg_frame_rate': '60/1', 'nb_read_frames': '180'}
        for changes, audio in [({'width': 1080}, False), ({'avg_frame_rate': '30/1'}, False), ({'nb_read_frames': '179'}, False), ({}, True)]:
            streams = [{**stream, **changes}] + ([{'codec_type': 'audio'}] if audio else [])
            with patch.object(render_final.subprocess, 'run') as run:
                run.return_value.returncode = 0
                run.return_value.stdout = json.dumps({'streams': streams})
                with self.assertRaisesRegex(ValueError, 'Segment must be'):
                    render_final.verify_segment('chunk.mp4', 2160, 3840, 60, 180)

    def test_failed_segment_never_replaces_existing_master(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            write_json(root / 'timeline.json', {'scale': 2, 'fps': 60, 'duration': 6})
            (root / 'renders').mkdir(); target = root / 'renders/9x16.mp4'; target.write_bytes(b'existing final')
            with patch.object(render_final, 'run_logged', side_effect=RuntimeError('renderer failed')), patch.object(render_final, 'available_memory', return_value=64 * 2**30):
                with self.assertRaisesRegex(RuntimeError, 'renderer failed'):
                    render_final.render(root, '9x16', key='test')
            self.assertEqual(target.read_bytes(), b'existing final')
            self.assertFalse((root / 'manifests/render-9x16.lock').exists())


if __name__ == '__main__':
    unittest.main()
