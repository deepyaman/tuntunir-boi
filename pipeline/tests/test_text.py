from pathlib import Path

from tuntunir_boi.pipelines.audio import text
from tuntunir_boi.pipelines.audio.nodes import split_paragraphs

STORY_ONE = (
    Path(__file__).parents[2] / "src/stories/01-tuntuni-ar-biraler-kotha/source.bn.md"
)
SOURCE = STORY_ONE.read_text(encoding="utf-8")


def test_only_spoken_paragraphs_are_kept():
    paras = text.paragraphs(SOURCE)
    assert len(paras) == 13
    assert not any(p.startswith(("#", ">")) for p in paras)
    assert paras[0].startswith("গৃহস্থের ঘরের পিছনে")


def test_sentences_end_at_danda_bang_or_question_with_optional_quote():
    paras = text.paragraphs(SOURCE)
    assert text.sentences(paras[0]) == [
        "গৃহস্থের ঘরের পিছনে বেগুন গাছ আছে।",
        "সেই বেগুন গাছের পাতা ঠোঁট দিয়ে সেলাই করে টুনটুনি পাখিটি তার বাসা বেঁধেছে।",
    ]
    # Quoted speech keeps its closing quote with the sentence.
    assert text.sentences(paras[2]) == [
        "গৃহস্থের বিড়ালটা ভারী দুষ্ট।",
        "সে খালি ভাবে ‘টুনটুনির ছানা খাব।’",
        "একদিন সে বেগুন গাছের তলায় এসে বললে, ‘কি করছিস লা টুনটুনি?’",
    ]
    # A quote that ends mid-sentence still splits; the UI only needs spans.
    assert len(text.sentences(paras[11])) == 2
    assert text.sentences("সে বললে, “যাব না।” তারপর গেল।") == [
        "সে বললে, “যাব না।”",
        "তারপর গেল।",
    ]


def test_words_are_whitespace_tokens_with_punctuation_attached():
    last = text.paragraphs(SOURCE)[-1]
    tokens = [w for s in text.sentences(last) for w in text.words(s)]
    assert (
        tokens
        == (
            "দুষ্টু বিড়াল দাঁত খিঁচিয়ে লাফিয়ে গাছে উঠে, টুনটুনিকেও ধরতে পারল না, ছানাও "
            "খেতে পেল না। খালি বেগুন কাঁটার খোঁচা খেয়ে নাকাল হয়ে ঘরে ফিরল।"
        ).split()
    )
    # Splitting into sentences then words loses nothing.
    assert (
        sum(
            len(text.words(s))
            for p in text.paragraphs(SOURCE)
            for s in text.sentences(p)
        )
        == 213
    )


def test_split_paragraphs_numbers_them_in_file_order():
    result = split_paragraphs(SOURCE)
    assert list(result) == [f"p{n:02d}" for n in range(1, 14)]
    assert result["p08"] == ["ছানারা বললে, ‘হ্যাঁ মা, পারব।’"]
