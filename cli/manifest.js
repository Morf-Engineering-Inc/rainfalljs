// Rainfall manifest utilities: load, validate, condense.
// Zero dependencies so the CLI runs anywhere Node runs, with no build step.

const fs = require('fs');
const path = require('path');

const MANIFEST_VERSION = '1.0';
const DEFAULT_FILENAME = 'rainfall.json';

/**
 * Rough token estimate (~4 chars per token, the common heuristic for
 * English/code). Good enough for budgeting AI context, not billing.
 */
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

function loadManifest(cwd, file) {
  const manifestPath = path.resolve(cwd, file || DEFAULT_FILENAME);
  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      `No manifest found at ${manifestPath}. Run "rainfall init" to create one.`
    );
  }
  const raw = fs.readFileSync(manifestPath, 'utf8');
  let manifest;
  try {
    manifest = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON in ${manifestPath}: ${err.message}`);
  }
  return { manifest, manifestPath, raw };
}

/**
 * Validate manifest structure and referential integrity.
 * Returns { errors: string[], warnings: string[] }.
 */
function validateManifest(manifest) {
  const errors = [];
  const warnings = [];

  if (!manifest || typeof manifest !== 'object') {
    return { errors: ['Manifest must be a JSON object.'], warnings };
  }
  if (!manifest.rainfall) {
    errors.push('Missing "rainfall" version field (e.g. "1.0").');
  }
  if (!manifest.project || !manifest.project.name) {
    errors.push('Missing "project.name".');
  }

  const entities = manifest.entities || [];
  const endpoints = manifest.endpoints || [];
  const components = manifest.components || [];
  const flows = manifest.flows || [];

  const seenIds = new Set();
  const checkId = (item, kind, index) => {
    if (!item.id) {
      errors.push(`${kind}[${index}] is missing an "id".`);
      return;
    }
    if (seenIds.has(item.id)) {
      errors.push(`Duplicate id "${item.id}" (${kind}[${index}]). IDs must be unique across the manifest.`);
    }
    seenIds.add(item.id);
  };

  entities.forEach((e, i) => {
    checkId(e, 'entities', i);
    if (!e.name) errors.push(`entities[${i}] is missing a "name".`);
  });
  endpoints.forEach((e, i) => {
    checkId(e, 'endpoints', i);
    if (!e.method) errors.push(`endpoints[${i}] (${e.id || '?'}) is missing "method".`);
    if (!e.path) errors.push(`endpoints[${i}] (${e.id || '?'}) is missing "path".`);
  });
  components.forEach((c, i) => {
    checkId(c, 'components', i);
    if (!c.name) errors.push(`components[${i}] is missing a "name".`);
    if (!c.file) warnings.push(`components[${i}] (${c.id || c.name || '?'}) has no "file" — AI agents can't locate it without one.`);
    if (!c.uiId) warnings.push(`components[${i}] (${c.id || c.name || '?'}) has no "uiId" — add a stable hierarchical id (e.g. "card.home.score").`);
  });

  // Referential integrity: the water must flow between real points.
  const entityNames = new Set(entities.map((e) => e.name));
  const componentIds = new Set(components.map((c) => c.id));
  const endpointIds = new Set(endpoints.map((e) => e.id));

  endpoints.forEach((e) => {
    (e.reads || []).concat(e.writes || []).forEach((name) => {
      const bare = String(name).split('.')[0];
      if (!entityNames.has(bare)) {
        warnings.push(`Endpoint ${e.id} references unknown entity "${bare}".`);
      }
    });
    (e.components || []).forEach((cid) => {
      if (!componentIds.has(cid)) {
        warnings.push(`Endpoint ${e.id} references unknown component "${cid}".`);
      }
    });
  });

  components.forEach((c) => {
    (c.apis || []).forEach((aid) => {
      if (!endpointIds.has(aid)) {
        warnings.push(`Component ${c.id} references unknown endpoint "${aid}".`);
      }
    });
  });

  flows.forEach((f, i) => {
    checkId(f, 'flows', i);
    (f.steps || []).forEach((step) => {
      const [kind, ref] = String(step).split(':');
      if (kind === 'api' && !endpointIds.has(ref)) {
        warnings.push(`Flow ${f.id} step references unknown endpoint "${ref}".`);
      }
      if (kind === 'entity' && !entityNames.has(ref)) {
        warnings.push(`Flow ${f.id} step references unknown entity "${ref}".`);
      }
      if (kind === 'component' && !componentIds.has(ref)) {
        warnings.push(`Flow ${f.id} step references unknown component "${ref}".`);
      }
    });
  });

  return { errors, warnings };
}

function fieldSignature(fields) {
  if (!fields) return '';
  if (Array.isArray(fields)) {
    return fields
      .map((f) => (typeof f === 'string' ? f : `${f.name}${f.required ? '!' : ''}`))
      .join(',');
  }
  return Object.keys(fields)
    .map((k) => {
      const v = fields[k];
      const type = typeof v === 'string' ? v : (v && v.type) || '';
      return type && type !== 'string' ? `${k}:${type}` : k;
    })
    .join(',');
}

/**
 * Condense a manifest into a compact plain-text digest for AI context.
 * This is the "cloud" of the water cycle: everything the agent needs to
 * know about the data layer, evaporated down to a few hundred tokens.
 */
function condenseManifest(manifest) {
  const lines = [];
  const project = manifest.project || {};
  const stack = (project.stack || []).join(', ');
  lines.push(
    `RAINFALL v${manifest.rainfall || MANIFEST_VERSION} — ${project.name || 'unnamed'}${stack ? ` (${stack})` : ''}`
  );
  if (project.description) lines.push(project.description);

  const entities = manifest.entities || [];
  if (entities.length) {
    lines.push('', '## Entities (the ocean — source of truth)');
    entities.forEach((e) => {
      const sig = fieldSignature(e.fields);
      lines.push(`${e.id} ${e.name}{${sig}}${e.source ? ` @ ${e.source}` : ''}`);
    });
  }

  const endpoints = manifest.endpoints || [];
  if (endpoints.length) {
    lines.push('', '## Endpoints (evaporation — data lifted from the ocean)');
    endpoints.forEach((e) => {
      const parts = [`${e.id} ${e.method} ${e.path}`];
      if (e.reads && e.reads.length) parts.push(`reads:${e.reads.join(',')}`);
      if (e.writes && e.writes.length) parts.push(`writes:${e.writes.join(',')}`);
      if (e.returns) parts.push(`returns:{${fieldSignature(e.returns)}}`);
      if (e.components && e.components.length) parts.push(`→ ${e.components.join(',')}`);
      lines.push(parts.join(' '));
    });
  }

  const components = manifest.components || [];
  if (components.length) {
    lines.push('', '## Components (rainfall — where data lands)');
    components.forEach((c) => {
      const parts = [`${c.id} ${c.name}`];
      if (c.file) parts.push(c.file);
      if (c.uiId) parts.push(`ui:${c.uiId}`);
      if (c.apis && c.apis.length) parts.push(`apis:${c.apis.join(',')}`);
      lines.push(parts.join(' '));
    });
  }

  const flows = manifest.flows || [];
  if (flows.length) {
    lines.push('', '## Flows (the cycle — end-to-end paths)');
    flows.forEach((f) => {
      lines.push(`${f.id} ${f.name}: ${(f.steps || []).join(' → ')}`);
    });
  }

  const text = lines.join('\n');
  return { text, tokens: estimateTokens(text) };
}

/**
 * Filter a manifest down to the subgraph around one item ("local weather"):
 * the focused item plus everything it directly touches. `ref` may be an id
 * (C001, API-001, E001, F001), an entity name, a component name, or a uiId.
 *
 * Expansion rules (bounded, no full-graph crawl):
 * - focused component  → its endpoints
 * - focused entity     → endpoints that read/write it
 * - focused flow       → every item in its steps
 * - every selected endpoint → its reads/writes entities and consumer components
 * - plus any flow that references a seed item
 */
function focusManifest(manifest, ref) {
  const entities = manifest.entities || [];
  const endpoints = manifest.endpoints || [];
  const components = manifest.components || [];
  const flows = manifest.flows || [];

  const entitySel = new Set(); // by name
  const endpointSel = new Set(); // by id
  const componentSel = new Set(); // by id
  const flowSel = new Set(); // by id

  // Resolve seeds.
  const seedEntities = entities.filter((e) => e.id === ref || e.name === ref);
  const seedEndpoints = endpoints.filter((e) => e.id === ref || e.path === ref);
  const seedComponents = components.filter(
    (c) => c.id === ref || c.name === ref || c.uiId === ref
  );
  const seedFlows = flows.filter((f) => f.id === ref || f.name === ref);
  if (!seedEntities.length && !seedEndpoints.length && !seedComponents.length && !seedFlows.length) {
    throw new Error(
      `No manifest item matches "${ref}" (tried entity id/name, endpoint id/path, component id/name/uiId, flow id/name).`
    );
  }

  seedEntities.forEach((e) => entitySel.add(e.name));
  seedEndpoints.forEach((e) => endpointSel.add(e.id));
  seedComponents.forEach((c) => componentSel.add(c.id));
  seedFlows.forEach((f) => flowSel.add(f.id));

  // Flow seeds pull in every step item.
  const componentByUiId = new Map(components.filter((c) => c.uiId).map((c) => [c.uiId, c]));
  seedFlows.forEach((f) => {
    (f.steps || []).forEach((step) => {
      const [kind, stepRef] = String(step).split(':');
      if (kind === 'api') endpointSel.add(stepRef);
      if (kind === 'entity') entitySel.add(stepRef);
      if (kind === 'component') componentSel.add(stepRef);
      if (kind === 'ui' && componentByUiId.has(stepRef)) {
        componentSel.add(componentByUiId.get(stepRef).id);
      }
    });
  });

  // Component seeds pull in their endpoints.
  seedComponents.forEach((c) => (c.apis || []).forEach((id) => endpointSel.add(id)));

  // Entity seeds pull in endpoints touching them.
  if (entitySel.size) {
    endpoints.forEach((e) => {
      const touched = (e.reads || []).concat(e.writes || []);
      if (touched.some((name) => entitySel.has(String(name).split('.')[0]))) {
        endpointSel.add(e.id);
      }
    });
  }

  // Every selected endpoint pulls in its entities and consumer components.
  endpoints
    .filter((e) => endpointSel.has(e.id))
    .forEach((e) => {
      (e.reads || []).concat(e.writes || []).forEach((name) => {
        entitySel.add(String(name).split('.')[0]);
      });
      (e.components || []).forEach((cid) => componentSel.add(cid));
    });

  // Any flow that references a seed item comes along for context.
  const seedRefs = new Set([
    ...seedEntities.map((e) => e.name),
    ...seedEndpoints.map((e) => e.id),
    ...seedComponents.map((c) => c.id),
    ...seedComponents.filter((c) => c.uiId).map((c) => c.uiId),
  ]);
  flows.forEach((f) => {
    if ((f.steps || []).some((step) => seedRefs.has(String(step).split(':')[1]))) {
      flowSel.add(f.id);
    }
  });

  return {
    ...manifest,
    project: {
      ...(manifest.project || {}),
      description: `Focused on "${ref}" — subgraph only.`,
    },
    entities: entities.filter((e) => entitySel.has(e.name)),
    endpoints: endpoints.filter((e) => endpointSel.has(e.id)),
    components: components.filter((c) => componentSel.has(c.id)),
    flows: flows.filter((f) => flowSel.has(f.id)),
  };
}

function starterManifest(projectName) {
  return {
    $schema: 'https://raw.githubusercontent.com/Morf-Engineering-Inc/rainfalljs/main/schema/rainfall.schema.json',
    rainfall: MANIFEST_VERSION,
    project: {
      name: projectName,
      description: '',
      stack: [],
    },
    entities: [],
    endpoints: [],
    components: [],
    flows: [],
  };
}

module.exports = {
  MANIFEST_VERSION,
  DEFAULT_FILENAME,
  estimateTokens,
  loadManifest,
  validateManifest,
  condenseManifest,
  focusManifest,
  starterManifest,
};
