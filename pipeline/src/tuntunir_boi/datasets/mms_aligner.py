"""Meta's MMS forced aligner, via torchaudio.

The aligner knows Latin letters only, so each Bengali word is romanized with uroman
first (a letter-for-letter scheme, unrelated to the site's phonemic one). Given the
audio and the letters, it returns where each letter was spoken; a word spans its
first and last letter.
"""

import re
import unicodedata
from dataclasses import dataclass
from typing import Any

import numpy as np
import torch
import torchaudio.functional as F
import uroman
from kedro.io import AbstractDataset, DatasetError
from torchaudio.pipelines import MMS_FA


@dataclass
class Span:
    """Where a word is spoken: seconds into the take, and the aligner's confidence."""

    start: float
    end: float
    score: float


class Aligner:
    """The loaded model; call it once per take."""

    def __init__(self):
        self._model = MMS_FA.get_model(with_star=False)
        self._dictionary = MMS_FA.get_dict(star=None)
        self._uroman = uroman.Uroman()

    def __call__(self, samples: np.ndarray, rate: int, words: list[str]) -> list[Span]:
        """One span per word, in order."""
        audio = torch.from_numpy(samples).unsqueeze(0)
        if rate != MMS_FA.sample_rate:
            audio = F.resample(audio, rate, MMS_FA.sample_rate)
        tokens_per_word = [self._tokens(w) for w in words]
        targets = torch.tensor(
            [[t for ts in tokens_per_word for t in ts]], dtype=torch.int32
        )

        with torch.inference_mode():
            emission, _ = self._model(audio)
            alignment, scores = F.forced_align(emission, targets, blank=0)
        letters = F.merge_tokens(alignment[0], scores[0].exp())
        seconds_per_frame = audio.shape[1] / emission.shape[1] / MMS_FA.sample_rate

        spans = []
        i = 0
        for tokens in tokens_per_word:
            word = letters[i : i + len(tokens)]
            i += len(tokens)
            spans.append(
                Span(
                    start=round(word[0].start * seconds_per_frame, 3),
                    end=round(word[-1].end * seconds_per_frame, 3),
                    score=round(float(np.mean([s.score for s in word])), 3),
                )
            )
        return spans

    def _tokens(self, word: str) -> list[int]:
        latin = self._uroman.romanize_string(
            unicodedata.normalize("NFC", word), lcode="ben"
        )
        latin = re.sub(r"[^a-z']", "", latin.lower())
        return [self._dictionary[c] for c in latin if c in self._dictionary]


class MMSAlignerDataset(AbstractDataset[None, Aligner]):
    """The aligner, downloaded by torchaudio on first use. Read-only."""

    def load(self) -> Aligner:
        return Aligner()

    def save(self, data: None) -> None:
        raise DatasetError(f"{self.__class__.__name__} is a read-only dataset type")

    def _describe(self) -> dict[str, Any]:
        return {}
