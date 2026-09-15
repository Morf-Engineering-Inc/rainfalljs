/**
 * The Data Map, exercised through the built package.
 *
 * These tests REQUIRE the module and call it. The suite this replaces read
 * dist/index.js as text and asserted it contained the string "DataProvider",
 * which passed for three published versions while the entry point threw
 * MODULE_NOT_FOUND on require. A test that greps a build artifact proves the
 * build ran, not that the thing works.
 */
const {
  defineDataMap,
  validate,
  isValid,
  brief,
  markdown,
  mermaid,
  findings,
} = require('../dist/datamap');

/** A deliberately small, deliberately correct map. */
const sound = () =>
  defineDataMap({
    name: 'Test',
    version: '1.0.0',
    requirements: [
      {
        id: 'BR-1',
        statement: 'A reader can see one case.',
        endpoints: ['E1'],
        screens: ['S1'],
        state: 'built',
      },
    ],
    endpoints: [
      {
        id: 'E1',
        path: '/cases/:id',
        method: 'GET',
        summary: 'One case',
        access: { key: 'Get PK=CASE#<id>', mode: 'read' },
        state: 'built',
      },
    ],
    components: [
      {
        id: 'C1',
        name: 'CaseCard',
        file: 'src/CaseCard.tsx',
        needs: [{ endpoint: 'E1', flow: 'FETCH', required: true }],
        state: 'built',
      },
    ],
    screens: [
      { id: 'S1', name: 'Case', route: '/case', components: ['C1'], state: 'built' },
    ],
  });

describe('defineDataMap', () => {
  it('requires a name', () => {
    expect(() => defineDataMap({})).toThrow(TypeError);
  });

  it('indexes every layer by id', () => {
    const map = sound();
    expect(map.requirement('BR-1').statement).toBe('A reader can see one case.');
    expect(map.endpoint('E1').path).toBe('/cases/:id');
    expect(map.component('C1').name).toBe('CaseCard');
    expect(map.screen('S1').route).toBe('/case');
    expect(map.endpoint('nope')).toBeUndefined();
  });

  it('derives a screen’s endpoints through its components', () => {
    expect(sound().endpointsFor('S1').map((e) => e.id)).toEqual(['E1']);
  });

  it('folds in screen-level extraEndpoints and dedupes', () => {
    const map = defineDataMap({
      name: 'T',
      endpoints: [
        { id: 'E1', path: '/a', method: 'GET' },
        { id: 'E2', path: '/b', method: 'GET' },
      ],
      components: [{ id: 'C1', name: 'C', needs: [{ endpoint: 'E1', flow: 'FETCH' }] }],
      screens: [{ id: 'S1', name: 'S', components: ['C1'], extraEndpoints: ['E1', 'E2'] }],
    });
    expect(map.endpointsFor('S1').map((e) => e.id)).toEqual(['E1', 'E2']);
  });

  it('answers the reverse question: what breaks if I change this endpoint', () => {
    const map = sound();
    expect(map.consumersOf('E1').map((c) => c.id)).toEqual(['C1']);
    expect(map.screensUsing('E1').map((s) => s.id)).toEqual(['S1']);
    expect(map.requirementsFor('E1').map((r) => r.id)).toEqual(['BR-1']);
  });

  it('traces a requirement to the components that carry it', () => {
    const t = sound().trace('BR-1');
    expect(t.endpoints.map((e) => e.id)).toEqual(['E1']);
    expect(t.screens.map((s) => s.id)).toEqual(['S1']);
    expect(t.components.map((c) => c.id)).toEqual(['C1']);
    expect(t.missingEndpoints).toEqual([]);
  });

  it('reports a dangling reference instead of throwing', () => {
    const map = defineDataMap({
      name: 'T',
      components: [{ id: 'C1', name: 'C', needs: [{ endpoint: 'GHOST', flow: 'FETCH' }] }],
      screens: [{ id: 'S1', name: 'S', components: ['C1'] }],
    });
    expect(map.endpointsFor('S1')).toEqual([]);
    expect(validate(map).some((f) => f.code === 'unknown-endpoint')).toBe(true);
  });
});

describe('validate', () => {
  it('passes a sound map', () => {
    const list = validate(sound());
    expect(list.filter((f) => f.level === 'error')).toEqual([]);
    expect(isValid(list)).toBe(true);
  });

  it('catches a duplicate id', () => {
    const map = defineDataMap({
      name: 'T',
      endpoints: [
        { id: 'E1', path: '/a', method: 'GET' },
        { id: 'E1', path: '/b', method: 'GET' },
      ],
    });
    const f = validate(map).find((x) => x.code === 'duplicate-id');
    expect(f.level).toBe('error');
    expect(map.endpoint('E1').path).toBe('/a'); // first wins
  });

  it('flags an endpoint nobody consumes', () => {
    const map = defineDataMap({
      name: 'T',
      endpoints: [{ id: 'E1', path: '/a', method: 'GET', state: 'built' }],
    });
    expect(validate(map).some((f) => f.code === 'orphan-endpoint')).toBe(true);
  });

  it('does not flag an orphan that is planned or fenced', () => {
    const map = defineDataMap({
      name: 'T',
      endpoints: [{ id: 'E1', path: '/a', method: 'GET', state: 'planned' }],
    });
    expect(validate(map).some((f) => f.code === 'orphan-endpoint')).toBe(false);
  });

  it('flags a requirement with no server behind it', () => {
    const map = defineDataMap({
      name: 'T',
      requirements: [{ id: 'BR-1', statement: 'Something.', state: 'built' }],
    });
    const codes = validate(map).map((f) => f.code);
    expect(codes).toContain('unserved-requirement');
    expect(codes).toContain('unplaced-requirement');
  });

  it('flags a built requirement resting on a planned endpoint', () => {
    const map = defineDataMap({
      name: 'T',
      requirements: [{ id: 'BR-1', statement: 'X.', endpoints: ['E1'], screens: ['S1'], state: 'built' }],
      endpoints: [{ id: 'E1', path: '/a', method: 'GET', state: 'planned' }],
      screens: [{ id: 'S1', name: 'S' }],
    });
    const f = validate(map).find((x) => x.code === 'state-conflict');
    expect(f.level).toBe('error');
    expect(f.message).toMatch(/planned/);
  });

  it('flags an optional need with no fallback', () => {
    const map = defineDataMap({
      name: 'T',
      endpoints: [{ id: 'E1', path: '/a', method: 'GET' }],
      components: [
        { id: 'C1', name: 'C', needs: [{ endpoint: 'E1', flow: 'FETCH', required: false }] },
      ],
      screens: [{ id: 'S1', name: 'S', components: ['C1'] }],
    });
    expect(validate(map).some((f) => f.code === 'missing-fallback')).toBe(true);
  });

  it('detects a context cycle between mapped components', () => {
    const map = defineDataMap({
      name: 'T',
      components: [
        { id: 'A', name: 'A', context: ['B'] },
        { id: 'B', name: 'B', context: ['A'] },
      ],
      screens: [{ id: 'S1', name: 'S', components: ['A', 'B'] }],
    });
    expect(validate(map).some((f) => f.code === 'context-cycle')).toBe(true);
  });

  it('ignores context names that are not components', () => {
    const map = defineDataMap({
      name: 'T',
      components: [{ id: 'A', name: 'A', context: ['UserProvider'] }],
      screens: [{ id: 'S1', name: 'S', components: ['A'] }],
    });
    expect(validate(map).some((f) => f.code === 'context-cycle')).toBe(false);
  });
});

describe('report', () => {
  it('brief carries the key expression and the consumer', () => {
    const text = brief(sound());
    expect(text).toContain('Get PK=CASE#<id>');
    expect(text).toContain('BR-1');
    expect(text).toContain('used by: C1');
  });

  it('brief names an unconsumed endpoint NOBODY', () => {
    const map = defineDataMap({
      name: 'T',
      endpoints: [{ id: 'E1', path: '/a', method: 'GET' }],
    });
    expect(brief(map)).toContain('NOBODY');
  });

  it('markdown renders tables', () => {
    expect(markdown(sound())).toContain('| Id | Method | Path |');
  });

  it('mermaid draws screen to component to endpoint', () => {
    const g = mermaid(sound(), 'S1');
    expect(g).toContain('graph LR');
    expect(g).toContain('-->|FETCH|');
  });

  it('findings renders errors before warnings', () => {
    const text = findings([
      { level: 'warn', code: 'orphan-endpoint', subject: 'endpoint:E9', message: 'w' },
      { level: 'error', code: 'duplicate-id', subject: 'endpoint:E1', message: 'e' },
    ]);
    // Compare the finding rows themselves — the summary header mentions both words.
    expect(text.indexOf('duplicate-id')).toBeLessThan(text.indexOf('orphan-endpoint'));
  });

  it('says so when there is nothing to report', () => {
    expect(findings([])).toBe('No findings.');
  });
});

describe('component hierarchy', () => {
  const nested = () =>
    defineDataMap({
      name: 'Nested',
      endpoints: [
        { id: 'E1', path: '/a', method: 'GET', state: 'built' },
        { id: 'E2', path: '/b', method: 'GET', state: 'built' },
      ],
      components: [
        { id: 'Page', name: 'Page', children: ['Panel'], state: 'built' },
        { id: 'Panel', name: 'Panel', children: ['Row'], state: 'built' },
        { id: 'Row', name: 'Row', needs: [{ endpoint: 'E2', flow: 'FETCH' }], state: 'built' },
        { id: 'Aside', name: 'Aside', needs: [{ endpoint: 'E1', flow: 'FETCH' }], state: 'built' },
      ],
      screens: [{ id: 'S1', name: 'S', components: ['Page', 'Aside'], state: 'built' }],
    });

  it('walks nested children depth-first, in render order', () => {
    expect(nested().componentsFor('S1').map((c) => c.id)).toEqual([
      'Page',
      'Panel',
      'Row',
      'Aside',
    ]);
  });

  it('resolves an endpoint fetched deep in the tree without the screen naming it', () => {
    // E2 is needed by Row, three levels below the screen.
    expect(nested().endpointsFor('S1').map((e) => e.id).sort()).toEqual(['E1', 'E2']);
  });

  it('subtreeOf returns a component and its descendants, itself first', () => {
    expect(nested().subtreeOf('Panel').map((c) => c.id)).toEqual(['Panel', 'Row']);
  });

  it('parentOf finds the renderer', () => {
    expect(nested().parentOf('Row').id).toBe('Panel');
    expect(nested().parentOf('Page')).toBeUndefined();
  });

  it('a nested child is not reported as an orphan', () => {
    const codes = validate(nested()).map((f) => f.code);
    expect(codes).not.toContain('orphan-component');
  });

  it('flags a child that is not declared', () => {
    const map = defineDataMap({
      name: 'T',
      components: [{ id: 'A', name: 'A', children: ['GHOST'] }],
      screens: [{ id: 'S1', name: 'S', components: ['A'] }],
    });
    const f = validate(map).find((x) => x.code === 'unknown-component');
    expect(f.message).toMatch(/GHOST/);
  });

  it('flags a render cycle', () => {
    const map = defineDataMap({
      name: 'T',
      components: [
        { id: 'A', name: 'A', children: ['B'] },
        { id: 'B', name: 'B', children: ['A'] },
      ],
      screens: [{ id: 'S1', name: 'S', components: ['A'] }],
    });
    expect(validate(map).some((f) => f.code === 'child-cycle')).toBe(true);
  });

  it('a render cycle does not hang componentsFor', () => {
    const map = defineDataMap({
      name: 'T',
      components: [
        { id: 'A', name: 'A', children: ['B'] },
        { id: 'B', name: 'B', children: ['A'] },
      ],
      screens: [{ id: 'S1', name: 'S', components: ['A'] }],
    });
    expect(map.componentsFor('S1').map((c) => c.id)).toEqual(['A', 'B']);
  });

  it('brief indents the tree', () => {
    const text = brief(nested());
    expect(text).toMatch(/Page/);
    expect(text).toMatch(/└ Panel/);
    expect(text).toMatch(/└ Row/);
  });
});
