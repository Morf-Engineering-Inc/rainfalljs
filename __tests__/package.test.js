/**
 * The package is shippable.
 *
 * Every bug this file exists to catch was shipped by a green suite:
 *
 *   0.1.3  dist/index.js required ./core/data-provider; the build emitted
 *          ./core/react-data-provider. Three published versions, unusable.
 *          The test that missed it read the bundle as TEXT and asserted it
 *          contained the string "DataProvider".
 *   0.2.0  the README documented `npx rainfall ...` while package.json had no
 *          `bin` field and `files` excluded bin/ and cli/. Every documented
 *          command was unreachable from an install.
 *
 * So: resolve what the manifest promises, and execute the CLI. Reading a file
 * and looking for a substring proves the build ran, not that anything works.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

/** Run the CLI and return stdout+stderr together, whatever the exit code. */
const run = (...args) => {
  const r = spawnSync(process.execPath, args, { encoding: 'utf8' });
  return `${r.stdout || ''}${r.stderr || ''}`;
};
const pkg = require('../package.json');

const root = path.join(__dirname, '..');
const abs = (p) => path.join(root, p.replace(/^\.\//, ''));

describe('package manifest', () => {
  it('every path named in `exports` exists', () => {
    for (const [sub, entry] of Object.entries(pkg.exports)) {
      const targets = typeof entry === 'string' ? [entry] : Object.values(entry);
      for (const t of targets) {
        expect({ sub, t, exists: fs.existsSync(abs(t)) }).toEqual({ sub, t, exists: true });
      }
    }
  });

  it('every `bin` target exists and is executable', () => {
    for (const [name, target] of Object.entries(pkg.bin || {})) {
      const file = abs(target);
      expect({ name, exists: fs.existsSync(file) }).toEqual({ name, exists: true });
      // eslint-disable-next-line no-bitwise
      expect({ name, executable: Boolean(fs.statSync(file).mode & 0o111) }).toEqual({
        name,
        executable: true,
      });
    }
  });

  it('every `bin` target is declared without a "./" prefix', () => {
    // npm normalises every bin value through secureAndUnixifyPath, which strips a
    // leading "./". When the normalised path differs from the declared one, every
    // publish prints:
    //
    //   npm warn publish "bin[rainfall]" script name bin/rainfall.js was invalid and removed
    //
    // Nothing is removed - @npmcli/package-json assigns the corrected value on the
    // next line - but the wording is identical in shape to the warnings that DO
    // drop a bin, so a real one would read as routine noise. #46.
    //
    // `exports` is the opposite: Node's spec requires the "./" there. bin only.
    for (const [name, target] of Object.entries(pkg.bin || {})) {
      expect({ name, target }).toEqual({ name, target: target.replace(/^\.\//, '') });
    }
  });

  it('`files` covers everything bin, main and exports depend on', () => {
    const covered = (p) =>
      pkg.files.some((f) => p === f || p.startsWith(`${f}/`) || f.startsWith(`${p}/`));
    const needed = [
      ...Object.values(pkg.bin || {}),
      pkg.main,
      ...Object.values(pkg.exports).flatMap((e) =>
        typeof e === 'string' ? [e] : Object.values(e),
      ),
    ]
      .filter(Boolean)
      .map((p) => p.replace(/^\.\//, ''))
      .filter((p) => p !== 'package.json');

    for (const p of needed) {
      expect({ p, covered: covered(p) }).toEqual({ p, covered: true });
    }
    // bin/rainfall.js requires ../cli/*, which `files` must ship too.
    expect(pkg.files).toContain('cli');
  });

  it('declares no runtime dependencies', () => {
    // The whole point is that a manifest tool is safe to install anywhere.
    expect(pkg.dependencies ?? {}).toEqual({});
  });
});

describe('the package actually runs', () => {
  it('the library entry loads and exports the Data Map API', () => {
    const m = require(abs(pkg.main));
    for (const name of ['defineDataMap', 'validate', 'brief', 'markdown', 'mermaid']) {
      expect(typeof m[name]).toBe('function');
    }
  });

  it('the CLI executes and reports its commands', () => {
    const out = run(abs(pkg.bin.rainfall), '--help');
    for (const cmd of ['init', 'scan', 'validate', 'condense', 'report', 'prompt']) {
      expect(out).toContain(cmd);
    }
  });

  it('the CLI condenses the shipped example manifest', () => {
    const example = abs('examples/manifest/rainfall.json');
    const out = run(abs(pkg.bin.rainfall), 'condense', example);
    expect(out).toMatch(/tokens/);
    expect(out).toContain('Entities');
  });

  it('the shipped example manifest validates against the shipped schema', () => {
    const out = run(abs(pkg.bin.rainfall), 'validate', abs('examples/manifest/rainfall.json'));
    expect(out).not.toMatch(/error/i);
  });
});
