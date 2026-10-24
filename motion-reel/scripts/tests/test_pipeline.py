"""Run: python -B -m unittest discover -s <skill>/scripts/tests -v"""
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))
from lib.pipeline_support import StepCache, caption_text, digest, fingerprint, read_json, scale_zones, validate_transcript, write_json
from pipeline import Pipeline

spec = importlib.util.spec_from_file_location('usage_report', SCRIPTS / 'usage-report.py')
usage_report = importlib.util.module_from_spec(spec)
spec.loader.exec_module(usage_report)


class CacheTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.cache = StepCache(self.root)
        self.output = self.root / 'result.txt'
        self.runs = 0

    def action(self):
        self.runs += 1
        self.output.write_text('correct')

    def run_step(self, key=1):
        self.cache.run('example', key, [self.output], self.action)

    def test_repeat_does_not_execute(self):
        self.run_step(); self.run_step()
        self.assertEqual(self.runs, 1)

    def test_changed_input_regenerates(self):
        self.run_step(); self.run_step(2)
        self.assertEqual(self.runs, 2)

    def test_tampered_output_regenerates(self):
        self.run_step(); self.output.write_text('damaged'); self.run_step()
        self.assertEqual(self.output.read_text(), 'correct')
        self.assertEqual(self.runs, 2)

    def test_missing_output_regenerates(self):
        self.run_step(); self.output.unlink(); self.run_step()
        self.assertEqual(self.runs, 2)

    def test_dynamic_artifact_deletion_regenerates(self):
        manifest = self.root / 'artifacts.json'
        def outputs():
            return [manifest] + [self.root / name for name in (read_json(manifest) if manifest.exists() else [])]
        def action():
            self.action(); write_json(manifest, ['result.txt'])
        self.cache.run('dynamic', 1, outputs, action)
        self.cache.run('dynamic', 1, outputs, action)
        self.assertEqual(self.runs, 1)
        self.output.unlink()
        self.cache.run('dynamic', 1, outputs, action)
        self.assertEqual(self.runs, 2)

    def test_failed_step_never_appears_complete(self):
        self.run_step()
        with self.assertRaises(RuntimeError):
            self.cache.run('example', 2, [self.output], lambda: (_ for _ in ()).throw(RuntimeError('test')))
        self.assertNotIn('example', StepCache(self.root).state['steps'])

    def test_changed_material_invalidates_approval(self):
        self.cache.approve('plan', {'text': 'a'}, 'Synthetic test approval')
        with self.assertRaises(ValueError):
            self.cache.require('plan', {'text': 'b'})

    def test_empty_approval_rejected(self):
        with self.assertRaises(ValueError):
            self.cache.approve('plan', 1, ' ')


class ContentTests(unittest.TestCase):
    def test_final_zones_scale_from_draft(self):
        zones = [{'start': 0, 'end': 2, 'marginBottom': 500}, {'start': 2, 'end': 4, 'marginBottom': 400}]
        self.assertEqual(scale_zones(zones, 2, 4)[1], {'start': 2, 'end': 4, 'marginBottom': 800})
        self.assertEqual(zones[1]['marginBottom'], 400)

    def test_invalid_zones_rejected(self):
        for zones in ([{'start': 0.5, 'end': 4, 'marginBottom': 500}],
                      [{'start': 0, 'end': 1, 'marginBottom': 500}],
                      [{'start': 0, 'end': 4, 'marginBottom': float('nan')}],
                      [{'start': 0, 'end': 3, 'marginBottom': 500}, {'start': 2, 'end': 4, 'marginBottom': 500}]):
            with self.assertRaises(ValueError):
                scale_zones(zones, 2, 4)

    def test_transcript_checks_real_time(self):
        for words in ([], [{'word': 'bad', 'start': 2, 'end': 3}],
                      [{'word': 'bad', 'start': float('nan'), 'end': 1}],
                      [{'word': 'later', 'start': 1, 'end': 1.2}, {'word': 'earlier', 'start': .2, 'end': .5}]):
            with self.assertRaises(ValueError):
                validate_transcript({'words': words}, 2)

    def test_caption_fixed_blocks_and_five_tags(self):
        result, dm = caption_text({'paragraph': 'A real idea.', 'hashtags': ['#One', '#Two', '#Three', '#Four']})
        self.assertIn('https://www.aurelioagency.com/es', result)
        self.assertTrue(result.endswith('#One #Two #Three #Four #LaCasaDeAurelio\n'))
        self.assertIsNone(dm)

    def test_dm_url_never_inferred(self):
        config = {'paragraph': 'La PLANTILLA funciona.', 'hashtags': ['#One', '#Two', '#Three', '#Four'],
                  'commentWord': 'PLANTILLA', 'resourceName': 'la plantilla'}
        with self.assertRaises(ValueError):
            caption_text(config)
        config['resourceUrl'] = 'https://example.com/confirmed-page'
        self.assertIn(config['resourceUrl'], caption_text(config)[1])

    def test_cta_word_boundaries(self):
        spec = importlib.util.spec_from_file_location('detect_shots', SCRIPTS / 'detect-shots.py')
        module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
        self.assertNotIn('\x08', (SCRIPTS / 'detect-shots.py').read_text(encoding='utf-8'))
        self.assertIsNotNone(module.CTA_RE.search('Seguime y comentá CODIGO.'))


class ApprovalIntegrationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for directory in ('film', 'assets', 'docs', 'transcript', 'audio', 'renders', 'manifests'):
            (self.root / directory).mkdir()
        write_json(self.root / 'pipeline.json', {'version': 1, 'branch': 'B', 'source': 'assets/source.mp4',
                   'takes': [], 'edits': {'color': .35}, 'language': 'es', 'model': 'large-v3',
                   'captions': {'zones': 'transcript/zones.json'}, 'cover': {}, 'caption': {}})
        write_json(self.root / 'timeline.json', {'duration': 2, 'formats': ['9x16'], 'mix': {'sfx': -3}})
        for name in ('assets/source.mp4', 'film/film.js', 'brief.md', 'docs/overlay_plan.md',
                     'transcript/approved.json', 'renders/draft_9x16_subs.mp4', 'transcript/zones.json'):
            (self.root / name).write_text('fixture')
        self.p = Pipeline(self.root)
        self.p.cache.approve('plan', self.p.gate_key('plan'), 'Synthetic test')
        self.p.receipt('draft', self.p.gate_key('draft'))

    def test_stale_film_cannot_be_approved(self):
        (self.root / 'film/film.js').write_text('changed scene')
        with self.assertRaises(ValueError):
            self.p.approve('first-look', 'Synthetic test')

    def test_stale_zone_file_cannot_be_approved(self):
        (self.root / 'transcript/zones.json').write_text('changed position')
        with self.assertRaises(ValueError):
            self.p.approve('first-look', 'Synthetic test')

    def test_sfx_change_does_not_change_visual_cache(self):
        key = self.p.visual_key()
        tl = read_json(self.root / 'timeline.json'); tl['mix']['sfx'] = -5
        write_json(self.root / 'timeline.json', tl)
        self.assertEqual(key, self.p.visual_key())
        with self.assertRaises(ValueError):
            self.p.require_current_draft()

    def test_changed_transcript_invalidates_plan(self):
        (self.root / 'transcript/approved.json').write_text('different words')
        with self.assertRaises(ValueError):
            self.p.require('plan')

    def test_generated_data_is_not_visual_input(self):
        before = self.p.visual_key()
        (self.root / 'film/data.js').write_text('generated audio data')
        self.assertEqual(before, self.p.visual_key())

    def test_unrecorded_draft_cannot_be_approved(self):
        self.p.cache.state['receipts'].clear()
        with self.assertRaises(ValueError):
            self.p.approve('first-look', 'Synthetic test')

    def test_user_delivery_changes_prevent_replacement(self):
        dest = self.p.delivery_dir(); dest.mkdir(); (dest / 'user.txt').write_text('important')
        self.p.cache.state['deliveryFiles'] = {}
        with patch.object(self.p, 'require_current_final'):
            with self.assertRaisesRegex(ValueError, 'outside the pipeline'):
                self.p.deliver()


class UsageTests(unittest.TestCase):
    def test_duplicate_message_ids_and_subagents(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp); (root / 'subagents').mkdir()
            message = {'type': 'assistant', 'message': {'role': 'assistant', 'id': 'msg_1', 'model': 'opus',
                       'usage': {'input_tokens': 10, 'output_tokens': 5, 'cache_read_input_tokens': 20}}}
            (root / 'main.jsonl').write_text(json.dumps(message) + '\n' + json.dumps(message))
            message['message']['id'] = 'msg_2'; message['message']['model'] = 'sonnet'
            (root / 'subagents/worker.jsonl').write_text(json.dumps(message))
            result = usage_report.summarize([root])
            self.assertEqual(result['messages'], 2)
            self.assertEqual(result['totalTokens'], 70)
            self.assertEqual(set(result['byModel']), {'opus', 'sonnet'})

    def test_missing_usage_not_zero_savings(self):
        with tempfile.TemporaryDirectory() as temp:
            result = usage_report.summarize([temp])
            self.assertIsNone(result['totalTokens'])
            self.assertIsNone(usage_report.compare(result, result)['tokenReductionPercent'])


if __name__ == '__main__':
    unittest.main()
