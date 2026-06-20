/** Tiny, pure model of a shell pipeline for the grep/pipes visualizer. */

export type Stage =
  | { cmd: 'cat'; file: string }
  | { cmd: 'grep'; pattern: string; invert?: boolean }
  | { cmd: 'wc'; flag: '-l' | '-w' }
  | { cmd: 'sort' }
  | { cmd: 'head'; n: number };

export interface StageResult {
  label: string;
  lines: string[];
}

/** Render a stage's command as the text a learner would type. */
export function stageLabel(stage: Stage): string {
  switch (stage.cmd) {
    case 'cat':
      return `cat ${stage.file}`;
    case 'grep':
      return `grep ${stage.invert ? '-v ' : ''}${stage.pattern}`;
    case 'wc':
      return `wc ${stage.flag}`;
    case 'sort':
      return 'sort';
    case 'head':
      return `head -n ${stage.n}`;
  }
}

/** Apply one stage to its input lines. */
export function runStage(input: string[], stage: Stage): string[] {
  switch (stage.cmd) {
    case 'cat':
      return [...input];
    case 'grep': {
      if (!stage.pattern) {
        return stage.invert ? [] : [...input];
      }
      const matches = (line: string) => line.includes(stage.pattern);
      return input.filter((line) => (stage.invert ? !matches(line) : matches(line)));
    }
    case 'wc': {
      const count =
        stage.flag === '-l'
          ? input.length
          : input.reduce((sum, line) => sum + (line.trim() ? line.trim().split(/\s+/).length : 0), 0);
      return [String(count)];
    }
    case 'sort':
      return [...input].sort((a, b) => a.localeCompare(b));
    case 'head':
      return input.slice(0, Math.max(0, stage.n));
  }
}

/** Run the whole pipeline, returning the cumulative output after each stage. */
export function runPipeline(input: string[], stages: Stage[]): StageResult[] {
  let current = input;
  return stages.map((stage) => {
    current = runStage(current, stage);
    return { label: stageLabel(stage), lines: current };
  });
}
