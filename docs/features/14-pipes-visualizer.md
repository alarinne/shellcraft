# Feature: Pipes & grep stream visualizer

- **Issue:** #14
- **PR:** (this PR)
- **Status:** Shipped
- **Area:** visualization

## Why

The spec calls out visualizing pipe logic (`|`) and `grep`. This shows data
flowing through a pipeline stage by stage — a bonus visualization/interactivity
win and the basis for Lab 03.

## What changed

- **`pipeline.ts`** — pure model: `Stage` union (`cat`/`grep`/`wc`/`sort`/
  `head`), `runStage`, `stageLabel`, and `runPipeline` (cumulative per-stage
  output).
- **`PipesVisualizerComponent`** — renders `cat access.log | grep <pattern> |
  wc -l`, highlighting which lines survive `grep` and showing the live `wc -l`
  count. The grep pattern is **editable**, so the count and highlights update
  reactively.
- **`PipesPage`** at route `/pipes`, linked from the shell nav.

## How it works

`results = runPipeline(input, stages)` is a `computed` over the pattern signal;
the input list highlights lines present in the grep stage's output, and the
final stage shows the count.

## Testing

- `pipeline.spec.ts`: grep (and `-v`), `wc -l`, stage labels, and a full
  `cat | grep | wc -l` run.
- `pipes-visualizer.component.spec.ts`: renders the command + default count, and
  recomputes when the pattern changes.
- `npm run build` + `npx ng test --watch=false` green (18 files, 59 tests).

## Follow-ups

- Promote this into a guided **Lab 03** with steps in `core/labs/`.
