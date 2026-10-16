# Pipeline

A [Kedro](https://kedro.org) project that derives the audio for the stories in
`../src/stories/`. The site never imports anything from here; the pipeline writes into
the story directories and the results are committed, so a reader of the site needs
nothing from this directory.

## The `audio` pipeline

For one story, it

1. splits `source.bn.md` into paragraphs, sentences and words (`text.py`),
2. reads each paragraph aloud in one take with
   [Indic-Speak](https://huggingface.co/bodhan-ai/indic-speak) (Bodhan AI / AI4Bharat),
   a text-to-speech model with Bengali voices,
3. finds where every word is spoken with Meta's MMS forced aligner
   (`datasets/mms_aligner.py`), and
4. writes one AAC clip per paragraph plus `timings.json` into the story's `audio/`.

Paragraph takes rather than word or sentence takes because the model is built for
connected speech: a lone sentence sometimes runs on into silence, a paragraph rarely
does. Takes sample at the model's production settings (temperature 0.6, top-p 0.9,
repetition penalty 1.2); its own `inference.py` leaves out the penalty, and without it
a paragraph of short clauses, like the verse in story two, stalls into silence on
almost every seed. The site plays a word or a sentence as a time range of its
paragraph's clip.

`timings.json` records the model and its pinned revision, the voice and the seed, then
per paragraph the clip name, its duration, and the sentences with their words:

```json
{ "text": "দুষ্টু", "start": 0.10, "end": 0.48, "score": 0.83 }
```

`start` and `end` are seconds into the clip, widened a little past the aligner's letter
boundaries so a word plays whole without any padding; `score` is the aligner's
confidence (0–1). Words are the whitespace tokens of `source.bn.md`, punctuation
attached, so they line up one-to-one with the romanized text.

## Setup

Needs [uv](https://docs.astral.sh/uv/), a Mac (clips are encoded with the built-in
`afconvert`), and about 8 GB of disk for the model. Python is pinned in
`.python-version`.

1. Accept the model's license on its
   [Hugging Face page](https://huggingface.co/bodhan-ai/indic-speak) (approval is
   automatic) and log in once:

   ```
   uv run hf auth login
   ```

2. Install and test:

   ```
   uv sync
   uv run pytest
   ```

## Running

One story per run, named by its directory under `src/stories/`:

```
uv run kedro run --params story=01-tuntuni-ar-biraler-kotha
```

The first run downloads the model (about 8 GB, into `data/models/`) and the aligner
(about 1 GB, into torchaudio's cache). A story
takes a few minutes on an Apple Silicon GPU; the log prints each paragraph's length as
it finishes, and warns if a take ran on past its end. To redo a story with a different
take, change `tts.seed` in `conf/base/parameters.yml` (or pass
`--params tts.seed=99`); `tts.voice` picks the speaker, `Ishita` or `Sourav`.

Every story:

```
for dir in ../src/stories/*/; do
  uv run kedro run --params story=$(basename "$dir")
done
```

Intermediate takes stay in `data/` (ignored by git). Commit the story's `audio/`
directory; `npm test` at the root checks it against the text.

## Credit

Audio built with Indic-Speak from Bodhan AI / AI4Bharat, under the
[Indic Open Model License](https://huggingface.co/bodhan-ai/indic-speak).
