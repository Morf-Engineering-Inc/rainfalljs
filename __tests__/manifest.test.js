// Tests for the rainfall manifest utilities (CLI core).
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFileSync } = require('child_process');

const {
  validateManifest,
  condenseManifest,
  starterManifest,
  estimateTokens,
} = require('../cli/manifest');
const { scanProject } = require('../cli/scan');

const exampleManifest = require('../examples/manifest/rainfall.json');

describe('validateManifest', () => {
  it('accepts the example manifest with no errors', () => {
    const { errors, warnings } = validateManifest(exampleManifest);
    expect(errors).toEqual([]);
    expect(warnings).toEqual([]);
  });

  it('accepts a starter manifest', () => {
    const { errors } = validateManifest(starterManifest('demo'));
    expect(errors).toEqual([]);
  });

  it('reports missing version and project name', () => {
    const { errors } = validateManifest({});
    expect(errors.join(' ')).toMatch(/rainfall/);
    expect(errors.join(' ')).toMatch(/project\.name/);
  });

  it('reports duplicate ids', () => {
    const manifest = starterManifest('demo');
    manifest.components = [
      { id: 'C001', name: 'A', file: 'a.jsx', uiId: 'a.b' },
      { id: 'C001', name: 'B', file: 'b.jsx', uiId: 'b.c' },
    ];
    const { errors } = validateManifest(manifest);
    expect(errors.some((e) => e.includes('Duplicate id "C001"'))).toBe(true);
  });

  it('warns on dangling references between endpoints and components', () => {
    const manifest = starterManifest('demo');
    manifest.endpoints = [
      { id: 'API-001', method: 'GET', path: '/api/x', reads: ['Ghost'], components: ['C999'] },
    ];
    const { errors, warnings } = validateManifest(manifest);
    expect(errors).toEqual([]);
    expect(warnings.some((w) => w.includes('unknown entity "Ghost"'))).toBe(true);
    expect(warnings.some((w) => w.includes('unknown component "C999"'))).toBe(true);
  });
});

describe('condenseManifest', () => {
  it('produces a digest that is much smaller than the JSON', () => {
    const { text, tokens } = condenseManifest(exampleManifest);
    const jsonTokens = estimateTokens(JSON.stringify(exampleManifest, null, 2));
    expect(tokens).toBeLessThan(jsonTokens / 2);
    expect(text).toContain('mealcoach-example');
    expect(text).toContain('API-001 GET /api/score');
    expect(text).toContain('C001 ScoreCard');
    expect(text).toContain('ui:card.home.score');
    expect(text).toContain('F001 log-meal');
  });

  it('includes entity field signatures', () => {
    const { text } = condenseManifest(exampleManifest);
    expect(text).toMatch(/User\{userId,email,goals:string\[\]\}/);
  });
});

describe('scanProject', () => {
  let tmpDir;

  beforeAll(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rainfall-scan-'));
    fs.mkdirSync(path.join(tmpDir, 'components'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'pages', 'api'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, 'components', 'ScoreCard.jsx'),
      `export function ScoreCard() {
        const data = fetch('/api/score');
        return <div testID="card.home.score">{data}</div>;
      }`
    );
    fs.writeFileSync(
      path.join(tmpDir, 'pages', 'api', 'score.js'),
      'export default function handler(req, res) { res.json({ ok: true }); }'
    );
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('discovers components, ui ids, api routes, and links them', () => {
    const result = scanProject(tmpDir);
    const card = result.components.find((c) => c.name === 'ScoreCard');
    expect(card).toBeDefined();
    expect(card.uiId).toBe('card.home.score');
    expect(card.file).toBe('components/ScoreCard.jsx');

    const endpoint = result.endpoints.find((e) => e.path === '/api/score');
    expect(endpoint).toBeDefined();
    expect(card.apis).toContain(endpoint.id);
    expect(endpoint.components).toContain(card.id);
  });
});

describe('buildReport', () => {
  const { buildReport } = require('../cli/report');
  let tmpDir;

  beforeAll(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rainfall-report-'));
    fs.mkdirSync(path.join(tmpDir, 'components'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, 'components', 'ScoreCard.jsx'),
      'export function ScoreCard() { return null; }\n'.repeat(20)
    );
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('compares digest tokens against mapped and project source tokens', () => {
    const manifest = starterManifest('demo');
    manifest.components = [
      { id: 'C001', name: 'ScoreCard', file: 'components/ScoreCard.jsx', uiId: 'card.a.b' },
      { id: 'C002', name: 'Ghost', file: 'components/Ghost.jsx', uiId: 'card.c.d' },
    ];
    const report = buildReport(manifest, tmpDir);
    expect(report.digestTokens).toBeGreaterThan(0);
    expect(report.mapped.files).toBe(1);
    expect(report.mapped.tokens).toBeGreaterThan(0);
    expect(report.mapped.missing).toEqual(['components/Ghost.jsx']);
    expect(report.project.files).toBe(1);
    expect(report.savings.vsMapped).toBeGreaterThan(0);
  });
});

describe('rainfall CLI', () => {
  it('condenses the example manifest end-to-end', () => {
    const output = execFileSync(
      process.execPath,
      [path.join(__dirname, '..', 'bin', 'rainfall.js'), 'condense', 'rainfall.json'],
      { cwd: path.join(__dirname, '..', 'examples', 'manifest'), encoding: 'utf8' }
    );
    expect(output).toContain('RAINFALL v1.0');
    expect(output).toContain('API-002 POST /api/meals');
  });
});
