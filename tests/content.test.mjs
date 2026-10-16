// Checks every story directory for the things a build cannot catch:
// the romanized text and the Bengali source line up, the romanized text
// uses only the characters docs/romanization.md allows, every picture the
// story imports exists, and the generated audio matches both texts word
// for word and sentence for sentence, and the glossary has one entry per word form
// that agrees with the romanized text and marks its romanized words. Run with
// `npm run test:content`.
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

  // The story page plays words and sentences from the clips, so a story needs its
  // audio before it can be built. The timings must describe exactly the Bengali
  // text, word for word, and the romanized text must split into the same
  // sentences and words, since the page pairs them by position.
  const audioDir = join(storiesDir, dir, 'audio');
  const timingsPath = join(audioDir, 'timings.json');
  test(`story ${dir} audio`, () => {
    assert.ok(existsSync(timingsPath), 'audio/timings.json is missing; run the pipeline (see pipeline/README.md)');
    const rom = parseRomanized(readFileSync(join(storiesDir, dir, 'index.mdx'), 'utf8'));
    const src = parseBengali(readFileSync(join(storiesDir, dir, 'source.bn.md'), 'utf8'));
    const timings = JSON.parse(readFileSync(timingsPath, 'utf8'));
    const clips = readdirSync(audioDir).filter((f) => f.endsWith('.m4a')).sort();

    assert.equal(timings.paragraphs.length, src.paragraphs.length, 'timings.json paragraph count differs from source.bn.md');
    assert.deepEqual(timings.paragraphs.map((p) => p.clip).sort(), clips, 'clips in audio/ and timings.json differ');

    timings.paragraphs.forEach((p, i) => {
      const spoken = p.sentences.flatMap((s) => s.words.map((w) => w.text));
      assert.deepEqual(spoken, src.paragraphs[i].split(/\s+/), `paragraph ${i + 1}: words in timings.json differ from source.bn.md`);
      // Same sentence rule as src/components/Paragraph.astro: the pipeline splits the
      // Bengali after a danda, ! or ? (plus a closing quote), and the danda is a full stop here.
      const sentences = rom.paragraphs[i].split(/(?<=[.!?][’”]?)\s+/);
      assert.deepEqual(
        sentences.map((s) => s.split(/\s+/).length),
        p.sentences.map((s) => s.words.length),
        `paragraph ${i + 1}: romanized sentences and words do not line up with timings.json`,
      );
      let last = 0;
      for (const s of p.sentences) {
        assert.ok(s.start >= last && s.start <= s.end && s.end <= p.duration, `${p.clip}: sentence out of order or outside the clip`);
        for (const w of s.words) {
          assert.ok(w.start >= last && w.start <= w.end && w.end <= p.duration, `${p.clip}: word "${w.text}" out of order or outside the clip`);
          last = w.start;
        }
      }
    });
  });

  // See docs/glossary.md: one entry per word form of source.bn.md, keyed by the form
  // without its punctuation, in order of first appearance, each naming the romanized
  // form that index.mdx prints at the same position.
  const glossaryPath = join(storiesDir, dir, 'glossary.json');
  test(`story ${dir} glossary`, () => {
    assert.ok(existsSync(glossaryPath), 'glossary.json is missing; see docs/glossary.md');
    const rom = parseRomanized(readFileSync(join(storiesDir, dir, 'index.mdx'), 'utf8'));
    const src = parseBengali(readFileSync(join(storiesDir, dir, 'source.bn.md'), 'utf8'));
    const glossary = JSON.parse(readFileSync(glossaryPath, 'utf8'));
    const PUNCT = /^[‘’“”.,!?।—]+|[‘’“”.,!?।—]+$/g;
    const bnWords = src.paragraphs.flatMap((p) => p.split(/\s+/)).map((w) => w.replace(PUNCT, ''));
    const romWords = rom.paragraphs.flatMap((p) => p.split(/\s+/)).map((w) => w.replace(PUNCT, '').toLowerCase());
    assert.equal(romWords.length, bnWords.length, 'word counts differ between index.mdx and source.bn.md');

    assert.deepEqual(Object.keys(glossary), [...new Set(bnWords)], 'glossary keys must be every form of source.bn.md, once, in order of first appearance');
    bnWords.forEach((w, i) => assert.equal(glossary[w].romanized, romWords[i], `glossary entry for ${w} does not match the romanized text`));
    for (const [w, entry] of Object.entries(glossary)) {
      assert.ok(entry.meaning, `${w}: meaning is missing`);
      assert.deepEqual(Object.keys(entry).filter((k) => !['romanized', 'meaning', 'from', 'note'].includes(k)), [], `${w}: unknown field`);
      assert.ok(ALLOWED.test(entry.romanized), `${w}: romanized form uses characters outside the scheme`);
      // Asterisks mark romanized Bengali inside a value: they come in pairs around a
      // non-empty span of the scheme's characters, and every run of script is followed by one.
      for (const f of ['meaning', 'from', 'note']) {
        if (!entry[f]) continue;
        const pieces = entry[f].split('*');
        assert.ok(pieces.length % 2 === 1, `${w}: ${f}: unpaired asterisk`);
        pieces.filter((_, i) => i % 2).forEach((s) => assert.ok(s && s.trim() === s && ALLOWED.test(s), `${w}: ${f}: "*${s}*" is not a romanized span`));
        const unpaired = entry[f].replace(/[ঀ-৿][ঀ-৿‌‍ -]* \*[^*]+\*/g, '');
        assert.ok(!/[ঀ-৿]/.test(unpaired), `${w}: ${f}: script without its romanization`);
      }
    }
  });
}
