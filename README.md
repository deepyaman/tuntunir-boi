# Ṭunṭunir Boi

A small website for reading Upendrakishore Ray Chowdhury's *Tuntunir Boi* (টুনটুনির বই, 1910)
in romanized Bengali, with the original illustrations.

It exists for people who speak Bengali but cannot read the script. Each story is
transcribed phonemically (see [`docs/romanization.md`](docs/romanization.md)) and laid
out plainly, the way the printed book is: text, then a centered illustration with its
caption.

Live site: <https://deepyaman.github.io/tuntunir-boi/>

## Running it

Requires Node 24 (`nvm install` picks it up from `.nvmrc`).

```sh
npm install
npm run dev        # local dev server
npm run build      # static output in dist/
npm run preview    # serve dist/ locally
npm test           # content checks + browser tests (see AGENTS.md)
```

## Source and license

The Bengali text follows the 1964 Deb Sahitya Kutir edition as transcribed on
[Bengali Wikisource](https://bn.wikisource.org/wiki/টুনটুনির_বই), checked against the
scanned pages. Illustrations are cropped from the same scan. The book is in the public
domain.

Audio built with [Indic-Speak](https://huggingface.co/bodhan-ai/indic-speak) from
Bodhan AI / AI4Bharat; see [`pipeline/`](pipeline/) for how it is generated.
