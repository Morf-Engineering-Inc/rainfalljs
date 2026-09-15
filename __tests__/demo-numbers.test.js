/**
 * The demo's committed numbers match what the tool actually reports.
 *
 * TOKENS.md calls itself "real, reproducible" and on 2026-09-15 it was neither:
 * it claimed 19 files / ~4977 tokens / 6.9x when the truth was 17 / ~3699 / 5.1x.
 * Nothing was wrong with the tool. A measurement was written down once, the file
 * walker later stopped counting two dotfiles, and no one re-ran it — so the
 * document kept asserting a number that had stopped being true.
 *
 * That is the exact failure this package exists to prevent, and it happened in
 * this package's own demo. So it is a test now.
 *
 * If this fails: run `rainfall report` in examples/fintech-demo and update
 * TOKENS.md (and the demo section of the root README) with the new figures.
 * Do not update the expectation to match the file.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const demo = path.join(root, 'examples', 'fintech-demo');

const live = (() => {
  const r = spawnSync(
    process.execPath,
    [path.join(root, 'bin', 'rainfall.js'), 'report', '--json'],
    { cwd: demo, encoding: 'utf8' },
  );
  if (r.status !== 0) throw new Error(`rainfall report --json failed: ${r.stderr}`);
  return JSON.parse(r.stdout);
})();

const tokensMd = fs.readFileSync(path.join(demo, 'TOKENS.md'), 'utf8');
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');

describe('rainfall report --json', () => {
  it('returns the full structured shape', () => {
    expect(live).toMatchObject({
      projectName: 'fintrack',
      tokenEstimator: 'bytes/4',
      digestTokens: expect.any(Number),
      mapped: { files: expect.any(Number), tokens: expect.any(Number), missing: [] },
      project: { files: expect.any(Number), tokens: expect.any(Number) },
      savings: { vsMapped: expect.any(Number), vsProject: expect.any(Number) },
    });
  });

  it('resolves the root correctly when a flag is passed', () => {
    // `report --json` once resolved the root to a directory named "--json",
    // so every mapped file came back missing and every number came back 0.
    expect(live.mapped.files).toBeGreaterThan(0);
    expect(live.project.tokens).toBeGreaterThan(0);
  });

  it('agrees with the human-readable output', () => {
    const r = spawnSync(
      process.execPath,
      [path.join(root, 'bin', 'rainfall.js'), 'report'],
      { cwd: demo, encoding: 'utf8' },
    );
    expect(r.stdout).toContain(String(live.project.tokens));
    expect(r.stdout).toContain(String(live.digestTokens));
  });
});

describe('TOKENS.md is current', () => {
  const oneDp = (n) => n.toFixed(1);

  it('quotes the live digest and file-token counts', () => {
    for (const n of [live.digestTokens, live.mapped.tokens, live.project.tokens]) {
      expect({ n, inTokensMd: tokensMd.includes(String(n)) }).toEqual({ n, inTokensMd: true });
    }
  });

  it('quotes the live file counts', () => {
    expect(tokensMd).toContain(`${live.mapped.files} files`);
    expect(tokensMd).toContain(`${live.project.files} files`);
  });

  it('quotes the live savings multiples', () => {
    expect(tokensMd).toContain(`${oneDp(live.savings.vsMapped)}x`);
    expect(tokensMd).toContain(`${oneDp(live.savings.vsProject)}x`);
  });

  it('does not still carry the figures it drifted to in 2026-09', () => {
    // Scoped to the reported-numbers fence only. The prose deliberately quotes
    // the stale values when explaining that this file drifted once, and that
    // note should not trip its own guard.
    const fence = tokensMd.match(/```[\s\S]*?```/);
    expect(fence).not.toBeNull();
    for (const stale of ['4977', '6.9x', '19 files']) {
      expect({ stale, inNumbers: fence[0].includes(stale) }).toEqual({
        stale,
        inNumbers: false,
      });
    }
  });
});

describe("the README's demo section is current", () => {
  it('quotes the same numbers as the tool', () => {
    for (const n of [live.digestTokens, live.mapped.tokens, live.project.tokens]) {
      expect({ n, inReadme: readme.includes(String(n)) }).toEqual({ n, inReadme: true });
    }
  });

  it('quotes the same multiples', () => {
    expect(readme).toContain(`${live.savings.vsMapped.toFixed(1)}x`);
    expect(readme).toContain(`${live.savings.vsProject.toFixed(1)}x`);
  });
});
