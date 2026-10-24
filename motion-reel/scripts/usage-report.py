#!/usr/bin/env python
"""Compare explicit Claude JSONL exports. No API calls or discovery of private logs."""
import argparse
import json
from pathlib import Path

FIELDS = ('input_tokens', 'cache_creation_input_tokens', 'cache_read_input_tokens', 'output_tokens')


def summarize(paths):
    files = sorted({f.resolve() for value in paths for f in
                    (Path(value).rglob('*.jsonl') if Path(value).is_dir() else [Path(value)])})
    records, warnings = {}, []
    for path in files:
        if not path.is_file():
            raise ValueError(f'Missing log: {path}')
        for n, line in enumerate(path.read_text(encoding='utf-8-sig').splitlines(), 1):
            if not line.strip():
                continue
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                warnings.append(f'{path.name}:{n}: invalid JSON; excluded')
                continue
            message = row.get('message', row)
            if not isinstance(message, dict) or message.get('role', row.get('type')) != 'assistant':
                continue
            usage = message.get('usage')
            if not isinstance(usage, dict):
                continue
            mid = message.get('id')
            if not mid:
                warnings.append(f'{path.name}:{n}: usage without message ID; excluded to avoid double counting')
                continue
            if not all(k in usage for k in ('input_tokens', 'output_tokens')):
                warnings.append(f'{path.name}:{n}: incomplete usage; excluded')
                continue
            totals = {}
            for key in FIELDS:
                value = usage.get(key, 0)
                if not isinstance(value, int) or value < 0:
                    raise ValueError(f'{path.name}:{n}: invalid {key}')
                totals[key] = value
            previous = records.get(mid, {'model': message.get('model', 'unknown'), **dict.fromkeys(FIELDS, 0)})
            # Claude may log several content blocks/final updates for one assistant message.
            records[mid] = {'model': message.get('model', previous['model']),
                            **{key: max(previous[key], totals[key]) for key in FIELDS}}
    by_model = {}
    for record in records.values():
        bucket = by_model.setdefault(record['model'], {**dict.fromkeys(FIELDS, 0), 'messages': 0})
        bucket['messages'] += 1
        for key in FIELDS:
            bucket[key] += record[key]
    totals = {key: sum(r[key] for r in records.values()) for key in FIELDS}
    if not records:
        warnings.append('No usable assistant usage found; no token estimate can be made.')
    return {'files': len(files), 'messages': len(records), 'byModel': by_model, 'tokens': totals,
            'totalTokens': sum(totals.values()) if records else None, 'warnings': warnings,
            'note': 'Includes only supplied logs. Include subagent logs; cache tokens are not priced like normal input.'}


def compare(before, after):
    a, b = before['totalTokens'], after['totalTokens']
    return {'before': before, 'after': after,
            'tokenReductionPercent': round(100 * (a - b) / a, 2) if a and b is not None else None,
            'costReductionPercent': None,
            'caveat': 'Comparable scope and complete run/subagent exports must be confirmed separately. No dollar estimate.'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--before', nargs='+', required=True)
    parser.add_argument('--after', nargs='+', required=True)
    args = parser.parse_args()
    print(json.dumps(compare(summarize(args.before), summarize(args.after)), ensure_ascii=False, indent=2))
