from kedro.pipeline import Node, Pipeline

from .nodes import split_paragraphs


def create_pipeline(**kwargs) -> Pipeline:
    return Pipeline(
        [
            Node(
                split_paragraphs,
                inputs="source_bn",
                outputs="paragraphs",
                name="split_paragraphs",
            ),
        ]
    )
