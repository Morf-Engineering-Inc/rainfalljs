// Heuristic project scanner: seeds a rainfall.json from an existing
// React / Next.js codebase. Regex-based on purpose — it proposes entries
// for a human (or AI agent) to confirm, it does not claim to be a parser.

const fs = require('fs');
const path = require('path');

const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);
const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', 'coverage', 'out',
]);

function walk(dir, files = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    return files;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) walk(full, files);
    } else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

const COMPONENT_RE = /(?:export\s+(?:default\s+)?(?:function|const|class)|function|const)\s+([A-Z][A-Za-z0-9_]*)\s*(?:=|\(|extends)/g;
const UI_ID_RE = /(?:testID|testId|uiID|uiId|data-ui-id|data-testid)\s*[=:]\s*["'{]+["']?([A-Za-z0-9_.:-]+)["']/g;
const FETCH_RE = /(?:fetch|axios\.(?:get|post|put|patch|delete)|api\.(?:get|post|put|patch|delete))\s*\(\s*[`"']([^`"']+)[`"']/g;
const API_ROUTE_DIR_RE = /(?:pages|app)[/\\]api[/\\](.+)$/;

function scanFile(file, root) {
  const rel = path.relative(root, file).replace(/\\/g, '/');
  const source = fs.readFileSync(file, 'utf8');
  const result = { file: rel, components: [], uiIds: [], calls: [], apiRoute: null };

  let match;
  COMPONENT_RE.lastIndex = 0;
  while ((match = COMPONENT_RE.exec(source))) {
    if (!result.components.includes(match[1])) result.components.push(match[1]);
  }
  UI_ID_RE.lastIndex = 0;
  while ((match = UI_ID_RE.exec(source))) {
    if (!result.uiIds.includes(match[1])) result.uiIds.push(match[1]);
  }
  FETCH_RE.lastIndex = 0;
  while ((match = FETCH_RE.exec(source))) {
    const url = match[1];
    // Only keep app-relative or /api paths; skip absolute third-party URLs.
    if (url.startsWith('/') && !result.calls.includes(url)) result.calls.push(url);
  }

  const routeMatch = rel.match(API_ROUTE_DIR_RE);
  if (routeMatch) {
    const routePath = '/api/' + routeMatch[1]
      .replace(/\.(js|jsx|ts|tsx)$/, '')
      .replace(/\/(index|route)$/, '')
      .replace(/\[([^\]]+)\]/g, '{$1}');
    result.apiRoute = routePath;
  }
  return result;
}

/**
 * Scan a project directory and return proposed manifest entries.
 */
function scanProject(root) {
  const files = walk(root);
  const componentEntries = [];
  const endpointEntries = [];
  const seenComponents = new Set();
  const seenEndpoints = new Set();
  let componentCounter = 1;
  let endpointCounter = 1;

  for (const file of files) {
    const info = scanFile(file, root);

    if (info.apiRoute && !seenEndpoints.has(info.apiRoute)) {
      seenEndpoints.add(info.apiRoute);
      endpointEntries.push({
        id: `API-${String(endpointCounter++).padStart(3, '0')}`,
        method: 'GET',
        path: info.apiRoute,
        file: info.file,
        reads: [],
        writes: [],
        components: [],
      });
      continue; // an API route file's exports are handlers, not UI components
    }

    info.components.forEach((name, i) => {
      const key = `${name}:${info.file}`;
      if (seenComponents.has(key)) return;
      seenComponents.add(key);
      componentEntries.push({
        id: `C${String(componentCounter++).padStart(3, '0')}`,
        name,
        file: info.file,
        uiId: info.uiIds[i] || info.uiIds[0] || undefined,
        apis: [],
        calls: info.calls, // raw fetch paths, to be resolved to endpoint ids
      });
    });

    info.calls.forEach((url) => {
      if (seenEndpoints.has(url)) return;
      seenEndpoints.add(url);
      endpointEntries.push({
        id: `API-${String(endpointCounter++).padStart(3, '0')}`,
        method: 'GET',
        path: url,
        reads: [],
        writes: [],
        components: [],
      });
    });
  }

  // Link components to endpoints by matched path, then drop the raw calls.
  const byPath = new Map(endpointEntries.map((e) => [e.path, e]));
  componentEntries.forEach((c) => {
    (c.calls || []).forEach((url) => {
      const endpoint = byPath.get(url);
      if (endpoint) {
        c.apis.push(endpoint.id);
        endpoint.components.push(c.id);
      }
    });
    delete c.calls;
    if (c.uiId === undefined) delete c.uiId;
  });

  return {
    filesScanned: files.length,
    components: componentEntries,
    endpoints: endpointEntries,
  };
}

module.exports = { scanProject };
