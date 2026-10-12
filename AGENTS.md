# Working on this repository

This is a static site for reading *Tuntunir Boi* in romanized Bengali. The audience
speaks Bengali but cannot read the script, so the romanization is phonemic and every
story page shows romanized text only. The Bengali source is kept alongside it for
future features. The book is in the public domain; the text comes from the 1964
Deb Sahitya Kutir edition on Bengali Wikisource.

## Principles

- One step at a time. Add a feature when it is needed, not when it might be.
  No toggles, abstractions, or client-side JavaScript "for later".
- Keep it readable by a human contributor. Prefer the plain Astro way over clever
  plugins or custom tooling.
- Match the printed book unless there is a reason not to: paragraph breaks,
  illustration placement, captions, spelling.

## Layout

```
src/stories/NN-slug/           one directory per story, NN = order in the book
  index.mdx                    romanized text, frontmatter, <Illustration /> tags
  source.bn.md                 the Bengali text, one paragraph per romanized paragraph
  page-NN.jpg                  illustrations, named by djvu page number, max 1600 px
src/content.config.ts          schema for the `stories` collection
src/pages/                     index (table of contents) and stories/[slug]
src/components/Illustration.astro
src/layouts/Base.astro
src/styles/global.css
docs/romanization.md           the romanization scheme (read before transcribing)
tests/content.test.mjs         checks every story: alignment, allowed characters, assets
tests/e2e/                     Playwright tests against the built site
```

## Adding a story

1. Copy an existing story directory. The directory name is `NN-` plus the slug used in
   the URL.
2. Fetch the Bengali text from Wikisource and compare it with the scan
   (`https://commons.wikimedia.org/w/thumb.php?f=টুনটুনির_বই.djvu&page=N&w=1400`).
   Wikisource is proofread but not validated; fix slips to match the print.
3. Write `source.bn.md` first: `# title`, one paragraph per printed paragraph, and each
   illustration caption as a `> ` blockquote where the picture sits in the book.
4. Romanize into `index.mdx` following `docs/romanization.md`. Keep the same paragraph
   breaks. Fill in the frontmatter.
5. Download the illustration crops from Wikimedia Commons, resize
   (`sips -Z 1600 in.jpg --out page-NN.jpg`), and place `<Illustration />` tags where
   the book places the pictures.
6. `npm test`.

## Development

Start the dev server in the background with `astro dev --background`; manage it with
`astro dev stop`, `astro dev status`, and `astro dev logs`. Astro docs:
<https://docs.astro.build> (routing, components, content collections).

## Commits

[Conventional Commits](https://www.conventionalcommits.org/): `type(scope): summary` in
the imperative, body explains why. Types in use: `build`, `ci`, `docs`, `feat`, `test`.
Story content goes in as `feat(stories)`. Commits made with AI assistance end with a
trailer naming the model, for example:

```
Assisted-by: Claude Opus 5.5 <noreply@anthropic.com>
```
