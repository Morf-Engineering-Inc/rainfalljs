// Tokens-saved report: compares the cost of the condensed manifest digest
// against what an AI agent would spend reading the underlying source files.

const fs = require('fs');
const path = require('path');
const { condenseManifest, estimateTokens } = require('./manifest');
const { walkSourceFiles } = require('./scan');

function fileTokens(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return null;
    // ~4 chars per token; file size in bytes approximates chars for source code.
    return Math.ceil(stat.size / 4);
  } catch (err) {
    return null;
  }
}

/**
 * Build the tokens-saved report for a manifest rooted at `root`.
 * Returns { digestTokens, mapped: {files, tokens, missing}, project: {files, tokens}, savings }.
 */
function buildReport(manifest, root) {
  const { tokens: digestTokens } = condenseManifest(manifest);

  // Files the manifest maps: the ones an agent would otherwise read to
  // learn what the digest already says.
  const referenced = new Set();
  (manifest.components || []).forEach((c) => c.file && referenced.add(c.file));
  (manifest.endpoints || []).forEach((e) => e.file && referenced.add(e.file));

  let mappedTokens = 0;
  const missing = [];
  referenced.forEach((rel) => {
    const tokens = fileTokens(path.resolve(root, rel));
    if (tokens === null) missing.push(rel);
    else mappedTokens += tokens;
  });

  // Whole-project source estimate: the exploration ceiling for an agent
  // with no map at all.
  let projectTokens = 0;
  const projectFiles = walkSourceFiles(root);
  projectFiles.forEach((f) => {
    const tokens = fileTokens(f);
    if (tokens !== null) projectTokens += tokens;
  });

  return {
    digestTokens,
    mapped: { files: referenced.size - missing.length, tokens: mappedTokens, missing },
    project: { files: projectFiles.length, tokens: projectTokens },
    savings: {
      vsMapped: mappedTokens > 0 ? mappedTokens / digestTokens : null,
      vsProject: projectTokens > 0 ? projectTokens / digestTokens : null,
    },
  };
}

function formatTimes(ratio) {
  return ratio >= 10 ? `${Math.round(ratio)}x` : `${ratio.toFixed(1)}x`;
}

function formatReport(report, projectName) {
  const lines = [];
  lines.push(`Rainfall tokens-saved report — ${projectName || 'unnamed'}`);
  lines.push('');
  lines.push(`Condensed digest:            ~${report.digestTokens} tokens  (what an AI reads instead)`);
  if (report.mapped.files > 0) {
    lines.push(
      `Mapped source files:         ~${report.mapped.tokens} tokens  (${report.mapped.files} files the manifest describes)`
    );
  }
  if (report.project.files > 0) {
    lines.push(
      `All project source files:    ~${report.project.tokens} tokens  (${report.project.files} files, blind-exploration ceiling)`
    );
  }
  lines.push('');
  if (report.savings.vsMapped) {
    lines.push(
      `Savings vs reading mapped files:  ${formatTimes(report.savings.vsMapped)} fewer tokens per session`
    );
  } else {
    lines.push(
      'Savings vs mapped files: n/a — add "file" paths to components/endpoints to measure this.'
    );
  }
  if (report.savings.vsProject) {
    lines.push(
      `Savings vs exploring the project: ${formatTimes(report.savings.vsProject)} fewer tokens per session`
    );
  }
  if (report.mapped.missing.length) {
    lines.push('');
    lines.push(
      `warning: ${report.mapped.missing.length} mapped file(s) not found on disk (manifest may have drifted):`
    );
    report.mapped.missing.forEach((f) => lines.push(`  - ${f}`));
  }
  lines.push('');
  lines.push('Estimates use ~4 characters per token. Every AI session pays the reading');
  lines.push('cost again from scratch; the digest cost is all it needs to pay instead.');
  return lines.join('\n');
}

module.exports = { buildReport, formatReport };
