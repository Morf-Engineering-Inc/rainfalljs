#!/usr/bin/env node
// Rainfall CLI — a compact data-layer manifest for token-efficient AI development.
//
//   rainfall init [name]        Create a starter rainfall.json
//   rainfall scan [dir]         Scan a React/Next.js project and seed the manifest
//   rainfall validate [file]    Check structure and referential integrity
//   rainfall condense [file] [--focus <ref>]
//                               Print the compact AI context digest + token estimate;
//                               --focus limits it to one item's subgraph
//   rainfall report [dir]       Tokens-saved report: digest vs reading the source
//   rainfall prompt             Print AI instructions for building the manifest

const fs = require('fs');
const path = require('path');
const {
  DEFAULT_FILENAME,
  loadManifest,
  validateManifest,
  condenseManifest,
  focusManifest,
  starterManifest,
  estimateTokens,
} = require('../cli/manifest');
const { scanProject } = require('../cli/scan');
const { buildReport, formatReport } = require('../cli/report');
const { BOOTSTRAP_PROMPT } = require('../cli/prompt');

const [, , command, ...rawArgs] = process.argv;
const cwd = process.cwd();

// Split out --focus <ref> (used by condense); everything else is positional.
let focusRef = null;
const args = [];
for (let i = 0; i < rawArgs.length; i++) {
  if (rawArgs[i] === '--focus') {
    focusRef = rawArgs[++i];
  } else {
    args.push(rawArgs[i]);
  }
}

function writeManifest(manifest, file) {
  const manifestPath = path.resolve(cwd, file || DEFAULT_FILENAME);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  return manifestPath;
}

function fail(message) {
  console.error(`rainfall: ${message}`);
  process.exit(1);
}

switch (command) {
  case 'init': {
    const target = path.resolve(cwd, DEFAULT_FILENAME);
    if (fs.existsSync(target)) fail(`${DEFAULT_FILENAME} already exists here.`);
    const name = args[0] || path.basename(cwd);
    const manifestPath = writeManifest(starterManifest(name));
    console.log(`Created ${manifestPath}`);
    console.log('Next: run "rainfall scan" to seed it from your code.');
    break;
  }

  case 'scan': {
    const root = path.resolve(cwd, args[0] || '.');
    if (!fs.existsSync(root)) fail(`Directory not found: ${root}`);
    const result = scanProject(root);

    let manifest;
    const manifestPath = path.resolve(cwd, DEFAULT_FILENAME);
    if (fs.existsSync(manifestPath)) {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      // Merge: keep existing entries, append newly discovered files/paths.
      const knownFiles = new Set((manifest.components || []).map((c) => `${c.name}:${c.file}`));
      const knownPaths = new Set((manifest.endpoints || []).map((e) => e.path));
      manifest.components = (manifest.components || []).concat(
        result.components.filter((c) => !knownFiles.has(`${c.name}:${c.file}`))
      );
      manifest.endpoints = (manifest.endpoints || []).concat(
        result.endpoints.filter((e) => !knownPaths.has(e.path))
      );
    } else {
      manifest = starterManifest(path.basename(root));
      manifest.components = result.components;
      manifest.endpoints = result.endpoints;
    }

    writeManifest(manifest);
    console.log(`Scanned ${result.filesScanned} files.`);
    console.log(`Manifest now has ${manifest.components.length} components and ${manifest.endpoints.length} endpoints.`);
    console.log('Scan results are heuristic proposals — review and prune, then fill in entities/reads/writes.');
    break;
  }

  case 'validate': {
    try {
      const { manifest, manifestPath } = loadManifest(cwd, args[0]);
      const { errors, warnings } = validateManifest(manifest);
      warnings.forEach((w) => console.warn(`warning: ${w}`));
      if (errors.length) {
        errors.forEach((e) => console.error(`error: ${e}`));
        fail(`${manifestPath} has ${errors.length} error(s).`);
      }
      console.log(`OK — ${manifestPath} is valid (${warnings.length} warning(s)).`);
    } catch (err) {
      fail(err.message);
    }
    break;
  }

  case 'condense': {
    try {
      const { manifest, raw } = loadManifest(cwd, args[0]);
      const target = focusRef ? focusManifest(manifest, focusRef) : manifest;
      const { text, tokens } = condenseManifest(target);
      console.log(text);
      console.error(''); // stats go to stderr so stdout stays pipeable
      if (focusRef) {
        const full = condenseManifest(manifest);
        console.error(
          `~${tokens} tokens focused on "${focusRef}" (full digest: ~${full.tokens}, manifest JSON: ~${estimateTokens(raw)})`
        );
      } else {
        console.error(`~${tokens} tokens (manifest JSON itself: ~${estimateTokens(raw)} tokens)`);
      }
    } catch (err) {
      fail(err.message);
    }
    break;
  }

  case 'report': {
    try {
      const { manifest } = loadManifest(cwd);
      const root = path.resolve(cwd, args[0] || '.');
      const report = buildReport(manifest, root);
      console.log(formatReport(report, manifest.project && manifest.project.name));
    } catch (err) {
      fail(err.message);
    }
    break;
  }

  case 'prompt': {
    console.log(BOOTSTRAP_PROMPT);
    break;
  }

  default:
    console.log('rainfall — compact data-layer manifests for token-efficient AI development');
    console.log('');
    console.log('Usage:');
    console.log('  rainfall init [name]        Create a starter rainfall.json');
    console.log('  rainfall scan [dir]         Seed the manifest from a React/Next.js project');
    console.log('  rainfall validate [file]    Check structure and referential integrity');
    console.log('  rainfall condense [file] [--focus <ref>]');
    console.log('                              Print the compact AI context digest; --focus <id|name|uiId>');
    console.log('                              limits it to one item and everything it touches');
    console.log('  rainfall report [dir]       Tokens-saved report: digest vs reading the source');
    console.log('  rainfall prompt             Print AI instructions for building the manifest');
    process.exit(command ? 1 : 0);
}
