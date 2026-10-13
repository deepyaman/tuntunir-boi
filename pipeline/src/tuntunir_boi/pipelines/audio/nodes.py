"""Nodes of the audio pipeline."""

import logging
import warnings
from collections.abc import Callable

from tuntunir_boi.datasets import Aligner, Audio

from . import text

log = logging.getLogger(__name__)


def split_paragraphs(source_bn: str) -> dict[str, list[str]]:
    """Map paragraph ids (`p01`, `p02`, …) to their sentences.

    The ids number the spoken paragraphs in file order; the same numbering names the
    audio clips.
    """
    return {
        f"p{n:02d}": text.sentences(paragraph)
        for n, paragraph in enumerate(text.paragraphs(source_bn), start=1)
    }


def synthesize(
    paragraphs: dict[str, list[str]], tts, params: dict
) -> dict[str, Callable[[], Audio]]:
    """Read each paragraph aloud in one take.

    The model is built for connected speech, so it reads a whole paragraph rather
    than sentence by sentence. Takes are returned as callables: the partitioned
    dataset runs each one when it saves it, so a finished take is on disk before the
    next begins.

    Now and then the model stops speaking partway, usually at a comma, and pads the
    take with silence up to its token limit; it warns when that happens. The stall
    tends to recur at the same temperature whatever the seed, so a failed take is
    retried with the next seed and a temperature 0.1 higher, up to `retries` times.
    A run is still fully determined by its parameters.
    """

    def take(pid: str, sentences: list[str]) -> Callable[[], Audio]:
        def run() -> Audio:
            for attempt in range(params["retries"] + 1):
                seed = params["seed"] + attempt
                temperature = params["temperature"] + 0.1 * attempt
                with warnings.catch_warnings(record=True) as caught:
                    warnings.simplefilter("always")
                    samples = tts(
                        " ".join(sentences),
                        speaker=params["voice"],
                        seed=seed,
                        temperature=temperature,
                    )
                stalled = [w for w in caught if "max_new_tokens" in str(w.message)]
                for w in caught:
                    if w not in stalled:
                        log.warning("%s: %s", pid, w.message)
                if not stalled:
                    log.info(
                        "%s: %.1f s of audio (seed %d, temperature %.1f)",
                        pid,
                        len(samples) / tts.sample_rate,
                        seed,
                        temperature,
                    )
                    return samples, tts.sample_rate
                log.warning(
                    "%s: take with seed %d at temperature %.1f ran on past its end",
                    pid,
                    seed,
                    temperature,
                )
            raise RuntimeError(
                f"{pid}: no clean take in {params['retries'] + 1} attempts"
            )

        return run

    return {pid: take(pid, sentences) for pid, sentences in paragraphs.items()}


def align_words(
    paragraphs: dict[str, list[str]],
    paragraph_wavs: dict[str, Callable[[], Audio]],
    aligner: Aligner,
    params: dict,
) -> dict:
    """Where every sentence and word is spoken in its paragraph's clip.

    This is what the site reads to play a word or a sentence as a range of the clip.
    Boundaries are raw: whatever padding playback wants is added there.
    """
    timings = {
        "model": params["model"],
        "revision": params["revision"],
        "voice": params["voice"],
        "seed": params["seed"],
        "paragraphs": [],
    }
    for pid, sentences in paragraphs.items():
        samples, rate = paragraph_wavs[pid]()
        words_by_sentence = [text.words(s) for s in sentences]
        spans = iter(
            aligner(samples, rate, [w for ws in words_by_sentence for w in ws])
        )
        entry = {
            "clip": f"{pid}.m4a",
            "duration": round(len(samples) / rate, 3),
            "sentences": [],
        }
        for ws in words_by_sentence:
            words = [{"text": w, **vars(next(spans))} for w in ws]
            entry["sentences"].append(
                {"start": words[0]["start"], "end": words[-1]["end"], "words": words}
            )
        timings["paragraphs"].append(entry)
    return timings


def encode_clips(
    paragraphs: dict[str, list[str]], paragraph_wavs: dict[str, Callable[[], Audio]]
) -> dict[str, Callable[[], Audio]]:
    """Pass this story's takes on to the clip dataset, which encodes them as it saves.

    The format change lives in `AACDataset`; this node only says which takes become
    clips. `data/` may still hold takes from an earlier run with more paragraphs.
    """
    return {pid: paragraph_wavs[pid] for pid in paragraphs}
