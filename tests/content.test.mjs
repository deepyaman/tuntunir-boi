// Checks every story directory for the things a build cannot catch:
// the romanized text and the Bengali source line up, the romanized text
// uses only the characters docs/romanization.md allows, and every picture
// the story imports exists. Run with `npm run test:content`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const storiesDir = fileURLToPath(new URL('../src/stories/', import.meta.url));

// See "Normalization" in docs/romanization.md.
const ALLOWED_MARKS = 'ÃãÊêÔôÕõĨĩŨũḌḍṚṛṬṭẼẽỄễỖỗ';
const ALLOWED_PUNCTUATION = '‘’“”–—';
const ALLOWED = new RegExp(`^[\\t\\n\\r\\x20-\\x7e${ALLOWED_MARKS}${ALLOWED_PUNCTUATION}]*$`, 'u');

const blocks = (text) => text.trim().split(/\n\s*\n/);

function parseRomanized(mdx) {
  const [, frontmatter, body] = mdx.split(/^---\s*$/m);
  const imports = [...body.matchAll(/^import \w+ from '\.\/(.+?)';$/gm)].map((m) => m[1]);
  const illustrations = [...body.matchAll(/^<Illustration\b[^>]*>/gm)].map((m) => m[0]);
  const captions = illustrations.filter((tag) => /\bcaption=/.test(tag));
  const paragraphs = blocks(body).filter((b) => !b.startsWith('import ') && !b.startsWith('<'));
  const titleBn = frontmatter.match(/^titleBn:\s*"(.+)"$/m)?.[1];
  return { body, imports, illustrations, captions, paragraphs, titleBn };
}

function parseBengali(md) {
  const all = blocks(md);
  const headings = all.filter((b) => b.startsWith('# '));
  const captions = all.filter((b) => b.startsWith('> '));
  const paragraphs = all.filter((b) => !b.startsWith('# ') && !b.startsWith('> '));
  return { headings, captions, paragraphs };
}

for (const dir of readdirSync(storiesDir).sort()) {
  test(`story ${dir}`, () => {
    const mdxPath = join(storiesDir, dir, 'index.mdx');
    const bnPath = join(storiesDir, dir, 'source.bn.md');
    assert.ok(existsSync(mdxPath), 'index.mdx is missing');
    assert.ok(existsSync(bnPath), 'source.bn.md is missing');

    const mdx = readFileSync(mdxPath, 'utf8');
    const bn = readFileSync(bnPath, 'utf8');
    assert.equal(mdx, mdx.normalize('NFC'), 'index.mdx is not NFC');
    assert.equal(bn, bn.normalize('NFC'), 'source.bn.md is not NFC');

    const rom = parseRomanized(mdx);
    const src = parseBengali(bn);

    assert.equal(src.headings.length, 1, 'source.bn.md needs exactly one "# title" line');
    assert.equal(src.headings[0].slice(2), rom.titleBn, 'titleBn does not match the heading in source.bn.md');
    assert.equal(rom.paragraphs.length, src.paragraphs.length, 'paragraph counts differ between index.mdx and source.bn.md');
    assert.equal(rom.captions.length, src.captions.length, 'caption counts differ between <Illustration /> tags and "> " lines');

    const bad = [...new Set([...rom.body].filter((ch) => !ALLOWED.test(ch)))];
    assert.deepEqual(bad, [], `characters outside the romanization scheme: ${bad.join(' ')}`);

    for (const file of rom.imports) {
      assert.ok(existsSync(join(storiesDir, dir, file)), `imported picture ${file} is missing`);
    }
    assert.equal(rom.illustrations.length, rom.imports.length, 'every imported picture should be placed exactly once');
  });
}
