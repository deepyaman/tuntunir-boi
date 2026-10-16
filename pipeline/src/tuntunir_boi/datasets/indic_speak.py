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

    `TTS` samples with temperature, top-p and top-k but not with the repetition
    penalty of the model's production config (`voices.md`: t 0.6 · top_p 0.9 · rp 1.2).
    Without it, a paragraph of short clauses (story two's verse) falls into silence a
    second or two in and never ends, whatever the seed; with it, every take ran to
    the end. The penalty is set as the model's generation default, which `generate`
    picks up under the arguments `TTS` passes.
    """

    def __init__(
        self, model: str, revision: str, local_dir: str, repetition_penalty: float
    ):
        self._model = model
        self._revision = revision
        self._local_dir = Path(local_dir)
        self._repetition_penalty = repetition_penalty

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
        tts = inference.TTS(str(self._local_dir), device=_device())
        tts.lm.generation_config.repetition_penalty = self._repetition_penalty
        return tts

    def save(self, data) -> None:
        raise DatasetError(f"{self.__class__.__name__} is a read-only dataset type")

    def _describe(self) -> dict[str, Any]:
        return {
            "model": self._model,
            "revision": self._revision,
            "local_dir": str(self._local_dir),
            "repetition_penalty": self._repetition_penalty,
        }


def _device() -> str:
    if torch.cuda.is_available():
        return "cuda"
    if torch.backends.mps.is_available():
        return "mps"
    return "cpu"
