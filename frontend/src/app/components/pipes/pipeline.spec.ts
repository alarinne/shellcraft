import { runPipeline, runStage, stageLabel } from './pipeline';

const log = [
  '[INFO] started',
  '[ERROR] disk full',
  '[INFO] handled',
  '[ERROR] timeout',
];

describe('pipeline', () => {
  it('grep keeps only matching lines', () => {
    expect(runStage(log, { cmd: 'grep', pattern: 'ERROR' })).toEqual([
      '[ERROR] disk full',
      '[ERROR] timeout',
    ]);
  });

  it('grep -v inverts the match', () => {
    expect(runStage(log, { cmd: 'grep', pattern: 'ERROR', invert: true })).toEqual([
      '[INFO] started',
      '[INFO] handled',
    ]);
  });

  it('wc -l counts lines', () => {
    expect(runStage(log, { cmd: 'wc', flag: '-l' })).toEqual(['4']);
  });

  it('labels stages as their command text', () => {
    expect(stageLabel({ cmd: 'grep', pattern: 'ERROR' })).toBe('grep ERROR');
    expect(stageLabel({ cmd: 'wc', flag: '-l' })).toBe('wc -l');
  });

  it('runs a full cat | grep | wc -l pipeline', () => {
    const results = runPipeline(log, [
      { cmd: 'cat', file: 'access.log' },
      { cmd: 'grep', pattern: 'ERROR' },
      { cmd: 'wc', flag: '-l' },
    ]);
    expect(results.map((r) => r.label)).toEqual(['cat access.log', 'grep ERROR', 'wc -l']);
    expect(results[2].lines).toEqual(['2']);
  });
});
