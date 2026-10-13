# Pipeline

A [Kedro](https://kedro.org) project that derives files for the stories in
`../src/stories/`: audio first, glossaries later. The site never imports anything from
here; the pipeline writes into the story directories and the results are committed.

## Setup

Needs [uv](https://docs.astral.sh/uv/). Python is pinned in `.python-version`.

```
uv sync
uv run kedro registry list
```
