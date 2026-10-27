import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
fonts = json.loads((ROOT / 'public/data/fonts.json').read_text(encoding='utf-8'))['fonts']
words = json.loads((ROOT / 'public/data/words.json').read_text(encoding='utf-8'))['words']
counts = Counter(font['category'] for font in fonts)
assert len(fonts) == 400, f'Expected 400 typefaces, got {len(fonts)}'
assert counts == {'Serif': 200, 'Sans-Serif': 200}, f'Unbalanced categories: {counts}'
assert len({font['id'] for font in fonts}) == 400, 'Duplicate font ids'
assert len({font['name'].casefold() for font in fonts}) == 400, 'Duplicate font names'
assert all(font.get('anatomicalTip') for font in fonts), 'Missing anatomical tip'
assert len(words) >= 20, 'Word inventory is too short'
assert len({word.casefold() for word in words}) == len(words), 'Duplicate words'
print(f'PASS: {len(fonts)} unique typefaces (200 Serif, 200 Sans-Serif) and {len(words)} unique words.')
