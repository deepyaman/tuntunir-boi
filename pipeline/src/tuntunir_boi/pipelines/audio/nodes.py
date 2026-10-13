"""Nodes of the audio pipeline."""

from . import text


def split_paragraphs(source_bn: str) -> dict[str, list[str]]:
    """Map paragraph ids (`p01`, `p02`, …) to their sentences.

    The ids number the spoken paragraphs in file order; the same numbering names the
    audio clips.
    """
    return {
        f"p{n:02d}": text.sentences(paragraph)
        for n, paragraph in enumerate(text.paragraphs(source_bn), start=1)
    }
