"""The Indic-Speak text-to-speech model (Bodhan AI / AI4Bharat)."""

import sys
from typing import Any

import torch
from huggingface_hub import snapshot_download
from kedro.io import AbstractDataset, DatasetError


class IndicSpeakDataset(AbstractDataset):
    """Indic-Speak, loaded from the Hugging Face Hub. Read-only.

    The model repository is gated: accept its license on the Hub and log in with
    `hf auth login` once. It ships its own `inference.py`, whose `TTS` class wires the
    language model to the SNAC quantizer and the Vocos decoder.
    """

    def __init__(self, model: str, revision: str):
        self._model = model
        self._revision = revision

    def load(self):
        local = snapshot_download(self._model, revision=self._revision)
        # `inference` only exists once the snapshot is on disk, so it cannot be a
        # module-level import.
        if local not in sys.path:
            sys.path.insert(0, local)
        from inference import TTS

        return TTS(local, device=_device())

    def save(self, data) -> None:
        raise DatasetError(f"{self.__class__.__name__} is a read-only dataset type")

    def _describe(self) -> dict[str, Any]:
        return {"model": self._model, "revision": self._revision}


def _device() -> str:
    if torch.cuda.is_available():
        return "cuda"
    if torch.backends.mps.is_available():
        return "mps"
    return "cpu"
