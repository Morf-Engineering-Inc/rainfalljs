/**
 * Component mapping — data in, props out. No framework.
 *
 * A mapping is a pure function: `(data, options) => props`. That is the whole
 * idea, and it is the one piece of the old React runtime that was never about
 * React. The 0.2.x mapper called `useData()` internally, so it only ran inside a
 * DataProvider, inside a React tree, inside a browser. Nothing about turning
 * `[{id, name}]` into `{items: [{value, label}]}` needs any of that.
 *
 * Decoupled, the same mapping serves React, Vue, Svelte, plain DOM and
 * server-side rendering, and it is testable without a renderer.
 *
 * It also closes a gap in the manifest. `rainfall.json` records that component
 * C001 calls endpoint API-001 — WHICH data reaches the component. It says
 * nothing about HOW that data becomes props, so the reshaping stays invisible to
 * the map and duplicated across components. A named mapping is that missing
 * edge: `DataNeed.transform` names one, and the map can then state the whole
 * path from key expression to rendered prop.
 */

/** Options the built-in mappings understand. Extra keys pass through. */
export interface MappingOptions {
	/** Field read as a row's value/key. */
	valueField?: string;
	/** Field read as a row's label. */
	labelField?: string;
	/** Column id -> header text. Derived from the first row otherwise. */
	headers?: Record<string, string>;
	/** Explicit column order; overrides derivation. */
	columns?: string[];
	[key: string]: unknown;
}

/** A mapping turns fetched data into the props one component expects. */
export type Mapping<D = unknown, P = Record<string, unknown>> = (
	data: D,
	options: MappingOptions,
) => P;

/** Registry-internal type: any mapping, whatever its data and prop shapes. */
type AnyMapping = (data: never, options: MappingOptions) => unknown;

/** What a component type needs and what it gives back. */
export interface ComponentShape {
	/** The component type, as `mapProps` names it. */
	type: string;
	/** What it renders, in a designer's words. */
	purpose: string;
	/** The data shape it expects. */
	accepts: string;
	/** The props shape it returns. */
	produces: string;
	/** Option keys this shape reads. */
	options: string[];
}

const registry = new Map<string, Map<string, AnyMapping>>();

/**
 * Register mappings for a component library.
 *
 * Called twice for one library the sets merge, later wins per component — so a
 * project can adjust a single mapping without restating the rest.
 */
export function defineMappings(
	library: string,
	mappings: Record<string, AnyMapping>,
): void {
	if (!library) throw new TypeError("defineMappings: `library` is required");
	const existing = registry.get(library) ?? new Map<string, AnyMapping>();
	for (const [type, fn] of Object.entries(mappings)) {
		if (typeof fn !== "function") {
			throw new TypeError(
				`defineMappings: mapping for "${library}.${type}" is not a function`,
			);
		}
		existing.set(type, fn);
	}
	registry.set(library, existing);
}

/** Is there a mapping for this library and component type? */
export const hasMapping = (library: string, type: string): boolean =>
	Boolean(registry.get(library)?.has(type));

/** Every component type registered for a library. */
export const mappingsFor = (library: string): string[] => [
	...(registry.get(library)?.keys() ?? []),
];

/** Every registered library. */
export const libraries = (): string[] => [...registry.keys()];

/** Drop a library's mappings, or all of them. Mainly for tests. */
export const clearMappings = (library?: string): void => {
	if (library) registry.delete(library);
	else registry.clear();
};

/**
 * Apply a mapping. Throws when it is not registered.
 *
 * 0.2.x returned the raw data behind a `console.warn` instead, which renders a
 * component with wrong props and no error anywhere — the failure mode is a blank
 * panel nobody can trace. A missing mapping is a wiring mistake; say so.
 */
export function mapProps<P = Record<string, unknown>>(
	library: string,
	type: string,
	data: unknown,
	options: MappingOptions = {},
): P {
	const mapping = registry.get(library)?.get(type);
	if (!mapping) {
		const known = mappingsFor(library);
		throw new Error(
			`No mapping for "${library}.${type}".` +
				(known.length
					? ` Registered for "${library}": ${known.join(", ")}.`
					: ` No mappings registered for "${library}".`),
		);
	}
	return (mapping as (d: unknown, o: MappingOptions) => P)(data, options);
}

/* ── helpers ──────────────────────────────────────────────────────────────── */

type Row = Record<string, unknown>;

const rows = (data: unknown): Row[] => (Array.isArray(data) ? (data as Row[]) : []);
const record = (data: unknown): Row =>
	data && typeof data === "object" && !Array.isArray(data) ? (data as Row) : {};

/** `userId` -> `User Id`. Used when no explicit header is given. */
const titleCase = (key: string): string =>
	key
		.replace(/[_-]+/g, " ")
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.replace(/\s+/g, " ")
		.trim()
		.replace(/\b\w/g, (c) => c.toUpperCase());

const pick = (row: Row, field: string | undefined, ...fallbacks: string[]) => {
	if (field && field in row) return row[field];
	for (const f of fallbacks) if (f in row) return row[f];
	return undefined;
};

/**
 * THE CATALOGUE — every component type the starter mappings cover, the data
 * each one expects, and the props it produces.
 *
 * Named after the SHAPE produced, never after a UI library. 0.2.x shipped a
 * `registerRadixComponents` that was never implemented and a shadcn one that
 * existed only in the README; naming a mapping after a library implies a
 * compatibility promise this package cannot keep as that library changes.
 * `Table` is a shape. `MuiDataGrid` would be a dependency.
 *
 * Read it at runtime (`CATALOGUE`) or from the CLI. It is the answer to "what
 * can I map, and what does it need" without reading the source.
 */
export const CATALOGUE: ComponentShape[] = [
	{
		type: "Select",
		purpose: "Choose one of many — select, dropdown, radio group, autocomplete",
		accepts: "Row[] — an array of records",
		produces: "{ items: { value, label }[] }",
		options: ["valueField", "labelField"],
	},
	{
		type: "Table",
		purpose: "Rows and columns — table, data grid, spreadsheet",
		accepts: "Row[] — columns are derived from the first row unless given",
		produces: "{ columns: { id, header }[], rows: Row[] }",
		options: ["columns", "headers"],
	},
	{
		type: "List",
		purpose: "An ordered run of items — list, menu, nav",
		accepts: "Row[]",
		produces: "{ items: { value, label, description? }[] }",
		options: ["valueField", "labelField", "descriptionField"],
	},
	{
		type: "Card",
		purpose: "One record shown on its own",
		accepts: "Row — a single object",
		produces: "{ title, description, body }",
		options: ["labelField", "descriptionField", "defaultTitle"],
	},
	{
		type: "Tabs",
		purpose: "Parallel panels, one visible at a time",
		accepts: "Row[] — one tab per row",
		produces: "{ tabs: { value, label, content }[], defaultValue }",
		options: ["valueField", "labelField", "contentField"],
	},
	{
		type: "Timeline",
		purpose: "Events in time order",
		accepts: "Row[] — each needs a date field",
		produces: "{ events: { at, label, description? }[] } — sorted ascending",
		options: ["dateField", "labelField", "descriptionField"],
	},
	{
		type: "Chart",
		purpose: "A plotted series — line, bar, area",
		accepts: "Row[] — one x field, one or more y fields",
		produces: "{ series: { name, points: { x, y }[] }[] }",
		options: ["xField", "yFields"],
	},
	{
		type: "Stat",
		purpose: "One number with its label — KPI tile, badge, meter",
		accepts: "Row or number",
		produces: "{ label, value, delta?, unit? }",
		options: ["valueField", "labelField", "deltaField", "unit"],
	},
	{
		type: "KeyValue",
		purpose: "Field-by-field detail — definition list, property panel",
		accepts: "Row — rendered key by key",
		produces: "{ pairs: { key, label, value }[] }",
		options: ["headers", "columns"],
	},
	{
		type: "Tree",
		purpose: "Nested structure — tree view, file browser, org chart",
		accepts: "Row[] — flat rows joined by a parent field",
		produces: "{ nodes: { value, label, children }[] } — roots only",
		options: ["valueField", "labelField", "parentField"],
	},
	{
		type: "Form",
		purpose: "Editable fields for one record",
		accepts: "Row — the current values",
		produces: "{ fields: { name, label, value, type }[] }",
		options: ["headers", "columns"],
	},
];

/** Look up one shape. */
export const shapeOf = (type: string): ComponentShape | undefined =>
	CATALOGUE.find((s) => s.type === type);

/** The catalogue as a compact table, for a terminal or a prompt. */
export function catalogueTable(): string {
	const w = Math.max(...CATALOGUE.map((s) => s.type.length));
	return CATALOGUE.map(
		(s) =>
			`${s.type.padEnd(w)}  ${s.accepts}\n${" ".repeat(w)}  -> ${s.produces}` +
			(s.options.length ? `\n${" ".repeat(w)}     opts: ${s.options.join(", ")}` : ""),
	).join("\n");
}

/* ── the starter mappings, one per catalogue entry ────────────────────────── */

export const genericMappings: Record<string, AnyMapping> = {
	Select: (data: never, o: MappingOptions) => ({
		items: rows(data).map((r) => ({
			value: pick(r, o.valueField, "id", "value"),
			label: pick(r, o.labelField, "name", "label", "title"),
		})),
	}),

	Table: (data: never, o: MappingOptions) => {
		const list = rows(data);
		const keys = o.columns ?? (list.length ? Object.keys(list[0]) : []);
		return {
			columns: keys.map((id) => ({ id, header: o.headers?.[id] ?? titleCase(id) })),
			rows: list,
		};
	},

	List: (data: never, o: MappingOptions) => ({
		items: rows(data).map((r) => ({
			value: pick(r, o.valueField, "id"),
			label: pick(r, o.labelField, "name", "title", "label"),
			description: pick(r, o.descriptionField as string, "description"),
		})),
	}),

	Card: (data: never, o: MappingOptions) => {
		const r = record(data);
		return {
			title: pick(r, o.labelField, "title", "name") ?? o.defaultTitle ?? "",
			description: pick(r, o.descriptionField as string, "description") ?? "",
			body: r,
		};
	},

	Tabs: (data: never, o: MappingOptions) => {
		const tabs = rows(data).map((r) => ({
			value: pick(r, o.valueField, "id", "value"),
			label: pick(r, o.labelField, "title", "name", "label"),
			content: pick(r, o.contentField as string, "content", "description"),
		}));
		return { tabs, defaultValue: tabs[0]?.value };
	},

	Timeline: (data: never, o: MappingOptions) => ({
		events: rows(data)
			.map((r) => ({
				at: pick(r, o.dateField as string, "date", "at", "createdAt"),
				label: pick(r, o.labelField, "name", "title", "label"),
				description: pick(r, o.descriptionField as string, "description"),
			}))
			.sort((a, b) => String(a.at ?? "").localeCompare(String(b.at ?? ""))),
	}),

	Chart: (data: never, o: MappingOptions) => {
		const list = rows(data);
		const x = (o.xField as string) ?? "x";
		const ys =
			(o.yFields as string[]) ??
			(list.length
				? Object.keys(list[0]).filter(
						(k) => k !== x && typeof list[0][k] === "number",
					)
				: []);
		return {
			series: ys.map((name) => ({
				name,
				points: list.map((r) => ({ x: r[x], y: r[name] })),
			})),
		};
	},

	Stat: (data: never, o: MappingOptions) => {
		if (typeof data === "number") return { label: o.labelField ?? "", value: data };
		const r = record(data);
		return {
			label: pick(r, o.labelField, "label", "name") ?? "",
			value: pick(r, o.valueField, "value", "count", "total"),
			delta: pick(r, o.deltaField as string, "delta", "change"),
			unit: o.unit,
		};
	},

	KeyValue: (data: never, o: MappingOptions) => {
		const r = record(data);
		const keys = o.columns ?? Object.keys(r);
		return {
			pairs: keys.map((key) => ({
				key,
				label: o.headers?.[key] ?? titleCase(key),
				value: r[key],
			})),
		};
	},

	Tree: (data: never, o: MappingOptions) => {
		const list = rows(data);
		const idOf = (r: Row) => String(pick(r, o.valueField, "id") ?? "");
		const parentOf = (r: Row) => {
			const p = pick(r, o.parentField as string, "parentId", "parent");
			return p == null ? "" : String(p);
		};
		const node = (r: Row): Record<string, unknown> => ({
			value: idOf(r),
			label: pick(r, o.labelField, "name", "title", "label"),
			children: list.filter((c) => parentOf(c) === idOf(r)).map(node),
		});
		const ids = new Set(list.map(idOf));
		return { nodes: list.filter((r) => !ids.has(parentOf(r))).map(node) };
	},

	Form: (data: never, o: MappingOptions) => {
		const r = record(data);
		const keys = o.columns ?? Object.keys(r);
		return {
			fields: keys.map((name) => ({
				name,
				label: o.headers?.[name] ?? titleCase(name),
				value: r[name],
				type:
					typeof r[name] === "number"
						? "number"
						: typeof r[name] === "boolean"
							? "checkbox"
							: "text",
			})),
		};
	},
};

/** Register the shape-based starter mappings under the name `generic`. */
export const useGenericMappings = (): void =>
	defineMappings("generic", genericMappings);
