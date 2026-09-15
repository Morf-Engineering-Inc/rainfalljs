/**
 * The mapper: data in, props out, no framework.
 *
 * Every test here runs in plain Node with no DOM and no renderer. That is the
 * point of the rewrite — the 0.2.x mapper called useData() internally, so it
 * could only be exercised inside a React tree, which is why it was never
 * exercised at all.
 */
const fs = require('fs');
const path = require('path');
const {
  defineMappings,
  mapProps,
  hasMapping,
  mappingsFor,
  libraries,
  clearMappings,
  useGenericMappings,
  genericMappings,
  CATALOGUE,
  shapeOf,
} = require('../dist/mapper');

beforeEach(() => {
  clearMappings();
  useGenericMappings();
});

const users = [
  { id: '1', name: 'Ada', role: 'Admin', score: 9 },
  { id: '2', name: 'Grace', role: 'Dev', score: 7 },
];

describe('registry', () => {
  it('registers and reports mappings', () => {
    expect(libraries()).toContain('generic');
    expect(hasMapping('generic', 'Table')).toBe(true);
    expect(hasMapping('generic', 'Nope')).toBe(false);
    expect(mappingsFor('generic')).toEqual(expect.arrayContaining(['Select', 'Table', 'Card']));
  });

  it('merges on re-registration, later wins per component', () => {
    defineMappings('generic', { Table: () => ({ mine: true }) });
    expect(mapProps('generic', 'Table', users)).toEqual({ mine: true });
    expect(hasMapping('generic', 'Select')).toBe(true); // untouched
  });

  it('throws on a missing mapping, naming what is registered', () => {
    expect(() => mapProps('generic', 'Ghost', users)).toThrow(/No mapping for "generic.Ghost"/);
    expect(() => mapProps('generic', 'Ghost', users)).toThrow(/Select/);
  });

  it('throws on a non-function mapping', () => {
    expect(() => defineMappings('x', { Table: 'nope' })).toThrow(TypeError);
  });

  it('requires a library name', () => {
    expect(() => defineMappings('', {})).toThrow(TypeError);
  });
});

describe('shapes', () => {
  it('Select maps value and label, honouring field options', () => {
    expect(mapProps('generic', 'Select', users)).toEqual({
      items: [
        { value: '1', label: 'Ada' },
        { value: '2', label: 'Grace' },
      ],
    });
    expect(mapProps('generic', 'Select', users, { labelField: 'role' }).items[0].label).toBe('Admin');
  });

  it('Table derives columns and title-cases headers', () => {
    const p = mapProps('generic', 'Table', [{ userId: 1, fullName: 'Ada' }]);
    expect(p.columns).toEqual([
      { id: 'userId', header: 'User Id' },
      { id: 'fullName', header: 'Full Name' },
    ]);
  });

  it('Table honours explicit columns and headers', () => {
    const p = mapProps('generic', 'Table', users, { columns: ['name'], headers: { name: 'Who' } });
    expect(p.columns).toEqual([{ id: 'name', header: 'Who' }]);
  });

  it('Timeline sorts ascending by date', () => {
    const p = mapProps('generic', 'Timeline', [
      { date: '2026-03-01', name: 'later' },
      { date: '2026-01-01', name: 'earlier' },
    ]);
    expect(p.events.map((e) => e.label)).toEqual(['earlier', 'later']);
  });

  it('Chart infers numeric y fields', () => {
    const p = mapProps('generic', 'Chart', [{ x: 1, a: 10, b: 20, label: 'skip' }], { xField: 'x' });
    expect(p.series.map((s) => s.name)).toEqual(['a', 'b']);
    expect(p.series[0].points).toEqual([{ x: 1, y: 10 }]);
  });

  it('Tree nests children and returns roots only', () => {
    const p = mapProps('generic', 'Tree', [
      { id: 'a', name: 'root' },
      { id: 'b', name: 'child', parentId: 'a' },
    ]);
    expect(p.nodes).toHaveLength(1);
    expect(p.nodes[0].children[0].label).toBe('child');
  });

  it('Form infers a field type per value', () => {
    const p = mapProps('generic', 'Form', { name: 'Ada', score: 9, active: true });
    expect(p.fields.map((f) => f.type)).toEqual(['text', 'number', 'checkbox']);
  });

  it('Stat accepts a bare number', () => {
    expect(mapProps('generic', 'Stat', 42).value).toBe(42);
  });

  it('array shapes tolerate a non-array without throwing', () => {
    for (const type of ['Select', 'Table', 'List', 'Timeline', 'Tree']) {
      expect(() => mapProps('generic', type, null)).not.toThrow();
    }
  });
});

describe('the catalogue', () => {
  it('documents every starter mapping, and vice versa', () => {
    expect(CATALOGUE.map((s) => s.type).sort()).toEqual(Object.keys(genericMappings).sort());
  });

  it('every entry states what it accepts and produces', () => {
    for (const s of CATALOGUE) {
      expect({ type: s.type, ok: Boolean(s.purpose && s.accepts && s.produces) }).toEqual({
        type: s.type,
        ok: true,
      });
    }
  });

  it('shapeOf finds one', () => {
    expect(shapeOf('Table').produces).toMatch(/columns/);
    expect(shapeOf('Nope')).toBeUndefined();
  });

  it('schema/components.json is in sync with the TypeScript catalogue', () => {
    // The JSON is the cross-language artifact; the TS is where it is authored.
    // If this fails, run `npm run build` (which regenerates it).
    const json = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'schema', 'components.json'), 'utf8'),
    );
    expect(json.shapes).toEqual(CATALOGUE);
  });
});
