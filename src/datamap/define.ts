/**
 * defineDataMap — turn declarations into something you can ask questions of.
 *
 * The input is four flat arrays because arrays are what a human edits well. The
 * output is indexed, so every lookup below is O(1) and the whole map can be walked
 * in a test without a build step or a running server.
 *
 * This never throws on a bad reference. An unknown endpoint id is a FINDING, not a
 * crash — the map has to stay loadable precisely when it is wrong, or you cannot
 * use it to find out what is wrong.
 */
import type {
	Component,
	DataMapInput,
	Endpoint,
	Requirement,
	Screen,
} from "./types";

/** A resolved chain from one requirement down to the screens that meet it. */
export interface Trace {
	requirement: Requirement;
	endpoints: Endpoint[];
	screens: Screen[];
	components: Component[];
	/** Endpoint ids the requirement names that no `Endpoint` declares. */
	missingEndpoints: string[];
	/** Screen ids the requirement names that no `Screen` declares. */
	missingScreens: string[];
}

export interface DataMap {
	readonly name: string;
	readonly version?: string;
	readonly requirements: Requirement[];
	readonly endpoints: Endpoint[];
	readonly components: Component[];
	readonly screens: Screen[];

	requirement(id: string): Requirement | undefined;
	endpoint(id: string): Endpoint | undefined;
	component(id: string): Component | undefined;
	screen(id: string): Screen | undefined;

	/**
	 * Every endpoint a screen touches, resolved through its components and folded
	 * together with its own `extraEndpoints`. Deduped, declaration order preserved.
	 *
	 * This is the function that makes `Screen` have no endpoint list of its own.
	 */
	endpointsFor(screenId: string): Endpoint[];
	/**
	 * Every component a screen renders, nested children included, depth-first.
	 */
	componentsFor(screenId: string): Component[];
	/** One component and everything it renders, itself first. */
	subtreeOf(componentId: string): Component[];
	/** The component that renders this one, if any. */
	parentOf(componentId: string): Component | undefined;
	/** Every component that needs this endpoint — the "what breaks if I change it" read. */
	consumersOf(endpointId: string): Component[];
	/** Every screen that reaches this endpoint through any of its components. */
	screensUsing(endpointId: string): Screen[];
	/** Every requirement that names this endpoint. */
	requirementsFor(endpointId: string): Requirement[];
	/** The whole chain under one requirement. */
	trace(requirementId: string): Trace | undefined;
}

const index = <T extends { id: string }>(rows: T[]): Map<string, T> => {
	const m = new Map<string, T>();
	// First declaration wins; the duplicate is reported by validate(), not silently merged.
	for (const row of rows) if (!m.has(row.id)) m.set(row.id, row);
	return m;
};

export function defineDataMap(input: DataMapInput): DataMap {
	if (!input || typeof input.name !== "string" || input.name === "") {
		throw new TypeError("defineDataMap: `name` is required");
	}

	const requirements = input.requirements ?? [];
	const endpoints = input.endpoints ?? [];
	const components = input.components ?? [];
	const screens = input.screens ?? [];

	const byRequirement = index(requirements);
	const byEndpoint = index(endpoints);
	const byComponent = index(components);
	const byScreen = index(screens);

	/**
	 * A component and everything it renders, depth-first, each once.
	 * Guards against a cycle so a malformed map still returns rather than hangs;
	 * validate() reports the cycle itself.
	 */
	const descend = (id: string, seen: Set<string>, out: Component[]): void => {
		if (seen.has(id)) return;
		seen.add(id);
		const component = byComponent.get(id);
		if (!component) return;
		out.push(component);
		for (const child of component.children ?? []) descend(child, seen, out);
	};

	/** Every component on a screen, including nested children, in render order. */
	const componentsFor = (screenId: string): Component[] => {
		const screen = byScreen.get(screenId);
		if (!screen?.components) return [];
		const out: Component[] = [];
		const seen = new Set<string>();
		for (const id of screen.components) descend(id, seen, out);
		return out;
	};

	/** The component tree under one component, itself first. */
	const subtreeOf = (componentId: string): Component[] => {
		const out: Component[] = [];
		descend(componentId, new Set(), out);
		return out;
	};

	/** The component that renders this one, if any. */
	const parentOf = (componentId: string): Component | undefined =>
		components.find((c) => (c.children ?? []).includes(componentId));

	const endpointsFor = (screenId: string): Endpoint[] => {
		const screen = byScreen.get(screenId);
		if (!screen) return [];
		const ids: string[] = [];
		for (const component of componentsFor(screenId)) {
			for (const need of component.needs ?? []) ids.push(need.endpoint);
		}
		ids.push(...(screen.extraEndpoints ?? []));
		const seen = new Set<string>();
		const out: Endpoint[] = [];
		for (const id of ids) {
			if (seen.has(id)) continue;
			seen.add(id);
			const endpoint = byEndpoint.get(id);
			if (endpoint) out.push(endpoint);
		}
		return out;
	};

	const consumersOf = (endpointId: string): Component[] =>
		components.filter((c) =>
			(c.needs ?? []).some((n) => n.endpoint === endpointId),
		);

	const screensUsing = (endpointId: string): Screen[] =>
		screens.filter((s) =>
			endpointsFor(s.id).some((e) => e.id === endpointId),
		);

	const requirementsFor = (endpointId: string): Requirement[] =>
		requirements.filter((r) => (r.endpoints ?? []).includes(endpointId));

	const trace = (requirementId: string): Trace | undefined => {
		const requirement = byRequirement.get(requirementId);
		if (!requirement) return undefined;

		const endpointIds = requirement.endpoints ?? [];
		const screenIds = requirement.screens ?? [];

		const resolvedEndpoints = endpointIds
			.map((id) => byEndpoint.get(id))
			.filter((e): e is Endpoint => Boolean(e));
		const resolvedScreens = screenIds
			.map((id) => byScreen.get(id))
			.filter((s): s is Screen => Boolean(s));

		// The components that actually carry this requirement: those on one of its
		// screens that need one of its endpoints. A component on the screen needing
		// nothing from the requirement is chrome, and is not part of the trace.
		const wanted = new Set(endpointIds);
		const seen = new Set<string>();
		const carriers: Component[] = [];
		for (const screen of resolvedScreens) {
			for (const component of componentsFor(screen.id)) {
				if (seen.has(component.id)) continue;
				if ((component.needs ?? []).some((n) => wanted.has(n.endpoint))) {
					seen.add(component.id);
					carriers.push(component);
				}
			}
		}

		return {
			requirement,
			endpoints: resolvedEndpoints,
			screens: resolvedScreens,
			components: carriers,
			missingEndpoints: endpointIds.filter((id) => !byEndpoint.has(id)),
			missingScreens: screenIds.filter((id) => !byScreen.has(id)),
		};
	};

	return {
		name: input.name,
		version: input.version,
		requirements,
		endpoints,
		components,
		screens,
		requirement: (id) => byRequirement.get(id),
		endpoint: (id) => byEndpoint.get(id),
		component: (id) => byComponent.get(id),
		screen: (id) => byScreen.get(id),
		endpointsFor,
		componentsFor,
		subtreeOf,
		parentOf,
		consumersOf,
		screensUsing,
		requirementsFor,
		trace,
	};
}
