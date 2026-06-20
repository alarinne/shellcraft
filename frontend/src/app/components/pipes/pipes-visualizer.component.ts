import { Component, computed, signal } from '@angular/core';
import { runPipeline, Stage } from './pipeline';

const SAMPLE: string[] = [
  '[INFO] server started on :8080',
  '[ERROR] disk write failed',
  '[INFO] request handled in 12ms',
  '[ERROR] upstream timeout',
  '[WARN] memory at 81%',
  '[ERROR] disk write failed',
];

/**
 * Animated pipes & grep visualizer: shows data flowing through
 * `cat access.log | grep <pattern> | wc -l`, highlighting which lines survive
 * each stage. The grep pattern is editable so the effect is interactive.
 */
@Component({
  selector: 'sc-pipes-visualizer',
  templateUrl: './pipes-visualizer.component.html',
  styleUrl: './pipes-visualizer.component.scss',
})
export class PipesVisualizerComponent {
  protected readonly input = SAMPLE;
  protected readonly pattern = signal('ERROR');

  protected readonly stages = computed<Stage[]>(() => [
    { cmd: 'cat', file: 'access.log' },
    { cmd: 'grep', pattern: this.pattern() },
    { cmd: 'wc', flag: '-l' },
  ]);

  protected readonly results = computed(() => runPipeline(this.input, this.stages()));

  /** Lines kept by the grep stage, for highlighting the input. */
  protected readonly matched = computed(() => new Set(this.results()[1]?.lines ?? []));

  protected readonly command = computed(() =>
    this.results()
      .map((r) => r.label)
      .join(' | '),
  );

  protected setPattern(value: string): void {
    this.pattern.set(value);
  }
}
