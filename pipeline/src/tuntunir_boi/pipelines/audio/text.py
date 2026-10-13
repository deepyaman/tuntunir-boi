"""Split a story's Bengali source into paragraphs, sentences and words.

`source.bn.md` holds a `# title`, then one paragraph per printed paragraph, with
illustration captions as `> ` blockquotes. Only the paragraphs are spoken.
"""

import re

# A sentence ends at a danda, exclamation or question mark, optionally followed by
# a closing quote, then whitespace. Lookbehinds must be fixed-width, hence two.
_SENTENCE_END = re.compile(r"(?<=[।!?][’”])\s+|(?<=[।!?])\s+")


def paragraphs(source: str) -> list[str]:
    """The spoken paragraphs of a `source.bn.md`, in order, whitespace normalised."""
    blocks = (" ".join(block.split()) for block in re.split(r"\n\s*\n", source))
    return [b for b in blocks if b and not b.startswith(("# ", "> "))]


def sentences(paragraph: str) -> list[str]:
    """Split one paragraph into sentences, punctuation kept."""
    return [s for s in _SENTENCE_END.split(paragraph) if s]


def words(sentence: str) -> list[str]:
    """Whitespace tokens, punctuation attached, as printed."""
    return sentence.split()
