from kedro.pipeline import Node, Pipeline

from .nodes import align_words, encode_clips, split_paragraphs, synthesize


def create_pipeline(**kwargs) -> Pipeline:
    return Pipeline(
        [
            Node(
                split_paragraphs,
                inputs="source_bn",
                outputs="paragraphs",
                name="split_paragraphs",
            ),
            Node(
                synthesize,
                inputs=["paragraphs", "tts_model", "params:tts"],
                outputs="paragraph_wavs",
                name="synthesize",
            ),
            Node(
                align_words,
                inputs=["paragraphs", "paragraph_wavs", "aligner", "params:tts"],
                outputs="timings",
                name="align_words",
            ),
            Node(
                encode_clips,
                inputs=["paragraphs", "paragraph_wavs"],
                outputs="paragraph_clips",
                name="encode_clips",
            ),
        ]
    )
