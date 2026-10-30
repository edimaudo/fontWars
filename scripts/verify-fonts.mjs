import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataPath = resolve(root, 'public/data/fonts.json');
const reportPath = resolve(root, 'public/data/font-verification.json');
const { fonts } = JSON.parse(await readFile(dataPath, 'utf8'));
const glyphSet = 'HamburgefontsivAaGgRr0123456789';
const concurrency = 8;
const batchSize = 16;

function cssFamilyNames(css) {
  return new Set([...css.matchAll(/font-family\s*:\s*['"]([^'"]+)['"]/giu)].map((match) => match[1].trim()));
}

async function verifyBatch(batch) {
  const params = new URLSearchParams();
  for (const font of batch) params.append('family', font.name);
  params.set('text', glyphSet);
  params.set('display', 'block');
  const url = `https://fonts.googleapis.com/css2?${params.toString()}`;
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 FontWars-FontVerifier/1.0' },
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error(`Google Fonts CSS API returned HTTP ${response.status}`);
    const families = cssFamilyNames(await response.text());
    return batch.map((font) => ({
      id: font.id,
      name: font.name,
      category: font.category,
      verified: families.has(font.name),
      reason: families.has(font.name) ? null : 'Family did not return a CSS font-face for the requested glyph set.',
    }));
  } catch (error) {
    if (batch.length === 1) {
      return [{
        id: batch[0].id,
        name: batch[0].name,
        category: batch[0].category,
        verified: false,
        reason: error instanceof Error ? error.message : String(error),
      }];
    }
    const midpoint = Math.ceil(batch.length / 2);
    const [left, right] = await Promise.all([
      verifyBatch(batch.slice(0, midpoint)),
      verifyBatch(batch.slice(midpoint)),
    ]);
    return [...left, ...right];
  }
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index], index);
    }
  }));
  return results;
}

const batches = [];
for (let index = 0; index < fonts.length; index += batchSize) {
  batches.push(fonts.slice(index, index + batchSize));
}

console.log(`Checking ${fonts.length} families against the Google Fonts CSS API...`);
const checkedBatches = await mapWithConcurrency(batches, concurrency, verifyBatch);
const results = checkedBatches.flat().sort((a, b) => a.id.localeCompare(b.id));
const verified = results.filter((item) => item.verified).length;
const report = {
  provider: 'Google Fonts CSS API',
  checkedAt: new Date().toISOString(),
  requestedGlyphSet: glyphSet,
  expectedCount: fonts.length,
  verifiedCount: verified,
  failedCount: results.length - verified,
  results,
};

await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`Verified ${verified}/${fonts.length}. Report: ${reportPath}`);

if (verified !== fonts.length) {
  console.error('Font verification failed. Review font-verification.json and replace or correct failed families.');
  process.exitCode = 1;
}
