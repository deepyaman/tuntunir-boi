"""Audio files on the local filesystem."""

from pathlib import Path
from typing import Any

import numpy as np
import soundfile as sf
from kedro.io import AbstractDataset

# Mono float32 samples and their sample rate.
Audio = tuple[np.ndarray, int]


class WAVDataset(AbstractDataset[Audio, Audio]):
    """A WAV file."""

    def __init__(self, filepath: str):
        self._path = Path(filepath)

    def load(self) -> Audio:
        samples, rate = sf.read(self._path, dtype="float32")
        return samples, rate

    def save(self, data: Audio) -> None:
        samples, rate = data
        self._path.parent.mkdir(parents=True, exist_ok=True)
        sf.write(self._path, samples, rate)

    def _exists(self) -> bool:
        return self._path.exists()

    def _describe(self) -> dict[str, Any]:
        return {"filepath": str(self._path)}
