from kedro.pipeline import Node, Pipeline

from .nodes import split_paragraphs, synthesize


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
        ]
    )
