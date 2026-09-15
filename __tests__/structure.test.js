/**
 * The package loads. Every entry point, by require, the way a consumer gets it.
 *
 * The previous version of this file read dist/index.js as TEXT and asserted it
 * contained certain identifiers. It passed on 0.1.3, which could not be required
 * at all: dist/index.js asked for ./core/data-provider and the build emitted
 * ./core/react-data-provider. Three published versions, green suite, broken
 * package. So: require it, or you have tested nothing.
 */
const path = require('path');
const pkg = require('../package.json');

describe('package entry points', () => {
  it('the root entry loads and exports the core API', () => {
    const m = require('../dist/index.js');
    for (const name of [
      'DataProvider',
      'useData',
      'withData',
      'createDataSource',
      'registerComponentLibrary',
      'withComponentData',
      'useComponentData',
    ]) {
      expect(typeof m[name]).toBe('function');
    }
  });

  it('the root entry does NOT pull in the optional next peer dependency', () => {
    // Importing next/router from the root is what made 0.1.3 unusable off Next.
    // Match real requires only — the file's own doc comment names Next on purpose.
    const src = require('fs').readFileSync(
      path.join(__dirname, '../dist/index.js'),
      'utf8',
    );
    const requires = [...src.matchAll(/require\(["']([^"']+)["']\)/g)].map((m) => m[1]);
    expect(requires).not.toContain('next/router');
    expect(requires.filter((r) => /next/.test(r))).toEqual([]);
  });

  it('the datamap subpath loads', () => {
    const m = require('../dist/datamap/index.js');
    for (const name of ['defineDataMap', 'validate', 'brief', 'markdown', 'mermaid']) {
      expect(typeof m[name]).toBe('function');
    }
  });

  it('ships type declarations for every subpath that claims them', () => {
    const fs = require('fs');
    for (const [sub, entry] of Object.entries(pkg.exports)) {
      if (typeof entry !== 'object' || !entry.types) continue;
      const file = path.join(__dirname, '..', entry.types);
      expect({ sub, exists: fs.existsSync(file) }).toEqual({ sub, exists: true });
    }
  });

  it('every file named in exports exists in the build', () => {
    const fs = require('fs');
    for (const [sub, entry] of Object.entries(pkg.exports)) {
      const targets =
        typeof entry === 'string' ? [entry] : Object.values(entry);
      for (const t of targets) {
        const file = path.join(__dirname, '..', t);
        expect({ sub, t, exists: fs.existsSync(file) }).toEqual({ sub, t, exists: true });
      }
    }
  });
});
