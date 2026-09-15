/**
 * validate — the part that earns the map's keep.
 *
 * A map you only read is a diagram, and a diagram rots quietly. These checks are
 * meant to run in CI, so that the map fails the build the day it stops matching
 * the product rather than the quarter someone notices.
 *
 * Two levels, and the distinction is the whole design:
 *
 *   error  the map contradicts ITSELF — a dangling reference, a duplicate id.
 *          Always wrong, always your bug, always fixable in the map.
 *   warn   the map is honest and the PRODUCT has a hole — an endpoint nobody
 *          calls, a requirement nothing serves. Possibly fine, never silent.
 *
 * Nothing here needs a server, a build or a browser. It is plain data in, list out.
 */
import type { DataMap } from "./define";
import type { Finding } from "./types";

const dupes = (rows: ReadonlyArray<{ id: string }>): string[] => {
	const seen = new Set<string>();
	const out = new Set<string>();
	for (const row of rows) {
		if (seen.has(row.id)) out.add(row.id);
		seen.add(row.id);
	}
	return [...out];
};

/** Is this state one that legitimately has nothing behind it? */
const unbuilt = (state?: string) => state === "planned" || state === "fenced";

export function validate(map: DataMap): Finding[] {
	const findings: Finding[] = [];
	const add = (
		level: Finding["level"],
		code: Finding["code"],
		subject: string,
		message: string,
	) => findings.push({ level, code, subject, message });

	// ── The map against itself ────────────────────────────────────────────────
	const collections: ReadonlyArray<readonly [string, ReadonlyArray<{ id: string }>]> = [
		["requirement", map.requirements],
		["endpoint", map.endpoints],
		["component", map.components],
		["screen", map.screens],
	];
	for (const [kind, rows] of collections) {
		for (const id of dupes(rows)) {
			add(
				"error",
				"duplicate-id",
				`${kind}:${id}`,
				`Two ${kind}s share the id "${id}". The first wins and the second is invisible.`,
			);
		}
	}

	for (const component of map.components) {
		for (const need of component.needs ?? []) {
			if (!map.endpoint(need.endpoint)) {
				add(
					"error",
					"unknown-endpoint",
					`component:${component.id}`,
					`needs endpoint "${need.endpoint}", which is not declared.`,
				);
			}
			if (need.required === false && !("fallback" in need)) {
				add(
					"warn",
					"missing-fallback",
					`component:${component.id}`,
					`treats "${need.endpoint}" as optional but declares no fallback — so "optional" is untested.`,
				);
			}
		}
	}

	for (const screen of map.screens) {
		for (const id of screen.components ?? []) {
			if (!map.component(id)) {
				add(
					"error",
					"unknown-component",
					`screen:${screen.id}`,
					`holds component "${id}", which is not declared.`,
				);
			}
		}
		for (const id of screen.extraEndpoints ?? []) {
			if (!map.endpoint(id)) {
				add(
					"error",
					"unknown-endpoint",
					`screen:${screen.id}`,
					`fetches endpoint "${id}", which is not declared.`,
				);
			}
		}
	}

	for (const requirement of map.requirements) {
		const trace = map.trace(requirement.id);
		for (const id of trace?.missingEndpoints ?? []) {
			add(
				"error",
				"unknown-endpoint",
				`requirement:${requirement.id}`,
				`names endpoint "${id}", which is not declared.`,
			);
		}
		for (const id of trace?.missingScreens ?? []) {
			add(
				"error",
				"unknown-screen",
				`requirement:${requirement.id}`,
				`names screen "${id}", which is not declared.`,
			);
		}
	}

	// ── The product through the map ───────────────────────────────────────────
	for (const endpoint of map.endpoints) {
		if (map.consumersOf(endpoint.id).length === 0) {
			const viaScreen = map.screens.some((s) =>
				(s.extraEndpoints ?? []).includes(endpoint.id),
			);
			if (!viaScreen && !unbuilt(endpoint.state)) {
				add(
					"warn",
					"orphan-endpoint",
					`endpoint:${endpoint.id}`,
					`${endpoint.method} ${endpoint.path} is declared and nothing consumes it — a row nobody asked for.`,
				);
			}
		}
		if (map.requirementsFor(endpoint.id).length === 0 && map.requirements.length > 0) {
			add(
				"warn",
				"unrequired-endpoint",
				`endpoint:${endpoint.id}`,
				`${endpoint.method} ${endpoint.path} serves no stated requirement.`,
			);
		}
	}

	const held = new Set<string>();
	for (const screen of map.screens)
		for (const id of screen.components ?? []) held.add(id);
	for (const component of map.components) {
		if (!held.has(component.id) && !unbuilt(component.state)) {
			add(
				"warn",
				"orphan-component",
				`component:${component.id}`,
				`${component.name} is declared and no screen holds it.`,
			);
		}
	}

	for (const requirement of map.requirements) {
		if (unbuilt(requirement.state)) continue;
		if ((requirement.endpoints ?? []).length === 0) {
			add(
				"warn",
				"unserved-requirement",
				`requirement:${requirement.id}`,
				`"${requirement.statement}" names no endpoint — a feature with no server behind it.`,
			);
		}
		if ((requirement.screens ?? []).length === 0) {
			add(
				"warn",
				"unplaced-requirement",
				`requirement:${requirement.id}`,
				`"${requirement.statement}" names no screen — real, but with nowhere to happen.`,
			);
		}
	}

	// ── States that cannot both be true ───────────────────────────────────────
	for (const requirement of map.requirements) {
		if (requirement.state !== "built") continue;
		for (const endpoint of map.trace(requirement.id)?.endpoints ?? []) {
			if (unbuilt(endpoint.state)) {
				add(
					"error",
					"state-conflict",
					`requirement:${requirement.id}`,
					`is "built" but rests on endpoint "${endpoint.id}", which is "${endpoint.state}".`,
				);
			}
		}
	}
	for (const screen of map.screens) {
		if (screen.state !== "built") continue;
		for (const component of map.componentsFor(screen.id)) {
			if (unbuilt(component.state)) {
				add(
					"error",
					"state-conflict",
					`screen:${screen.id}`,
					`is "built" but holds component "${component.id}", which is "${component.state}".`,
				);
			}
		}
	}

	// ── Provider cycles ───────────────────────────────────────────────────────
	// `context` names providers. Where a provider is itself a mapped component, a
	// cycle means neither can mount. Names that are not components are ignored.
	const colour = new Map<string, 0 | 1 | 2>();
	const walk = (id: string, path: string[]): void => {
		if (colour.get(id) === 2) return;
		if (colour.get(id) === 1) {
			add(
				"error",
				"context-cycle",
				`component:${id}`,
				`context cycle: ${[...path, id].join(" → ")}.`,
			);
			return;
		}
		colour.set(id, 1);
		for (const dep of map.component(id)?.context ?? []) {
			if (map.component(dep)) walk(dep, [...path, id]);
		}
		colour.set(id, 2);
	};
	for (const component of map.components) walk(component.id, []);

	return findings;
}

/** True when nothing is an `error`. Warnings do not fail a map. */
export const isValid = (findings: Finding[]): boolean =>
	!findings.some((f) => f.level === "error");
