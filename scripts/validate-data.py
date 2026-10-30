import json
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
fonts = json.loads((ROOT / 'public/data/fonts.json').read_text(encoding='utf-8'))['fonts']
words = json.loads((ROOT / 'public/data/words.json').read_text(encoding='utf-8'))['words']
counts = Counter(font['category'] for font in fonts)
tier_category_counts = Counter((font['category'], font['challengeTier']) for font in fonts)
assert len(fonts) == 400, f'Expected 400 typefaces, got {len(fonts)}'
assert counts == {'Serif': 200, 'Sans-Serif': 200}, f'Unbalanced categories: {counts}'
assert len({font['id'] for font in fonts}) == 400, 'Duplicate font ids'
assert len({font['name'].casefold() for font in fonts}) == 400, 'Duplicate font names'
assert len({font['anatomicalTip'] for font in fonts}) == 400, 'Every font must have a distinct observation prompt'
for font in fonts:
    assert font.get('provider') == 'Google Fonts', f"Unexpected provider for {font.get('name')}"
    assert font.get('anatomicalFocus') and font.get('anatomicalTip'), f"Missing anatomy prompt: {font.get('name')}"
    assert font.get('challengeTier') in (1, 2, 3), f"Invalid challenge tier: {font.get('name')}"
    parsed = urlparse(font.get('familyPageUrl', ''))
    assert parsed.scheme == 'https' and parsed.netloc == 'fonts.google.com', f"Invalid family page URL: {font.get('name')}"
assert len(words) >= 20, 'Word inventory is too short'
assert len({word.casefold() for word in words}) == len(words), 'Duplicate words'
for difficulty, allowed_tiers in {
    'Easy': (1,),
    'Standard': (1, 2, 3),
    'Expert': (3,),
}.items():
    eligible = [font for font in fonts if font['challengeTier'] in allowed_tiers]
    for category in ('Serif', 'Sans-Serif'):
        category_count = sum(font['category'] == category for font in eligible)
        assert category_count >= 5, f'Not enough {difficulty} {category} fonts for Classification'
    pair_capacity = sum(
        amount // 2
        for (category, tier), amount in tier_category_counts.items()
        if tier in allowed_tiers
    )
    assert pair_capacity >= 10, f'Not enough same-category, same-tier pairs for {difficulty} Duel'
print(f'PASS: {len(fonts)} unique catalogue records (200 Serif, 200 Sans-Serif), {len(set(font["anatomicalTip"] for font in fonts))} unique observation prompts, and {len(words)} unique words. Classification and Duel pools exist at all three difficulty levels.')
