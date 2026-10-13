"""The Indic-Speak text-to-speech model (Bodhan AI / AI4Bharat)."""

import importlib.util
from pathlib import Path
from typing import Any

import torch
from huggingface_hub import snapshot_download
from kedro.io import AbstractDataset, DatasetError


class IndicSpeakDataset(AbstractDataset):
    """Indic-Speak, loaded from the Hugging Face Hub. Read-only.

    The model repository is gated: accept its license on the Hub and log in with
    `hf auth login` once. It ships its own `inference.py`, whose `TTS` class wires the
    language model to the SNAC quantizer and the Vocos decoder; the pinned revision
    freezes that code along with the weights.
    """

    def __init__(self, model: str, revision: str, local_dir: str):
        self._model = model
        self._revision = revision
        self._local_dir = Path(local_dir)

    def load(self):
        # A plain directory, not the Hub cache: the model's loader locates its own
        # files relative to inference.py, and the cache's symlinks would mislead it.
        snapshot_download(
            self._model, revision=self._revision, local_dir=self._local_dir
        )
        # That loader is a script in the repository, not an installable package.
        spec = importlib.util.spec_from_file_location(
            "indic_speak", self._local_dir / "inference.py"
        )
        inference = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(inference)
        return inference.TTS(str(self._local_dir), device=_device())

    def save(self, data) -> None:
        raise DatasetError(f"{self.__class__.__name__} is a read-only dataset type")

    def _describe(self) -> dict[str, Any]:
        return {
            "model": self._model,
            "revision": self._revision,
            "local_dir": str(self._local_dir),
        }


def _device() -> str:
    if torch.cuda.is_available():
        return "cuda"
    if torch.backends.mps.is_available():
        return "mps"
    return "cpu"
