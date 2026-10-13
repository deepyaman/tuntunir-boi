"""Audio files on the local filesystem."""

import subprocess
import tempfile
from pathlib import Path
from typing import Any

import numpy as np
import soundfile as sf
from kedro.io import AbstractDataset, DatasetError

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


class AACDataset(AbstractDataset[Audio, Audio]):
    """An AAC clip in an .m4a container, encoded with macOS's afconvert. Write-only."""

    def __init__(self, filepath: str, bitrate: int = 48_000):
        self._path = Path(filepath)
        self._bitrate = bitrate

    def load(self) -> Audio:
        raise DatasetError(f"{self.__class__.__name__} is a write-only dataset type")

    def save(self, data: Audio) -> None:
        samples, rate = data
        self._path.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory() as tmp:
            wav = Path(tmp) / "take.wav"
            sf.write(wav, samples, rate)
            subprocess.run(
                [
                    "afconvert",
                    "-f",
                    "m4af",
                    "-d",
                    "aac",
                    "-b",
                    str(self._bitrate),
                    wav,
                    self._path,
                ],
                check=True,
            )

    def _exists(self) -> bool:
        return self._path.exists()

    def _describe(self) -> dict[str, Any]:
        return {"filepath": str(self._path), "bitrate": self._bitrate}
