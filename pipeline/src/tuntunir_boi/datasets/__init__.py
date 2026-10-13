"""Datasets the catalog needs beyond kedro-datasets: audio files and the TTS model."""

from .audio import Audio, WAVDataset
from .indic_speak import IndicSpeakDataset

__all__ = ["Audio", "IndicSpeakDataset", "WAVDataset"]
