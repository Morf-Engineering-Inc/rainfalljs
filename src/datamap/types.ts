/**
 * The Data Map — the model.
 *
 * Four kinds of thing, and the edges between them:
 *
 *   requirement  what the business needs to be true
 *        │ serves
 *   endpoint     what the server answers, and how the store serves it
 *        │ needs
 *   component    what renders it
 *        │ holds
 *   screen       where a person meets it
 *
 * Read down, it answers "what stands behind this screen". Read up, it answers
 * "if I change this key, what breaks and who asked for it". Both directions are
 * the point: a map that only goes one way is a diagram.
 *
 * Every id is a string you choose. Ids are the only thing the four layers share,
 * which is what keeps this one map rather than four lists that drift apart.
 */

/** HTTP method, or the transport's nearest equivalent. */
export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** What a component does with an endpoint. */
export type Flow = "FETCH" | "MUTATE" | "SUBSCRIBE" | "CACHE";

/**
 * How honest a row is about itself. Deliberately not a percentage.
 *
 *   built    wired end to end and persisting
 *   partial  works, but a piece is missing or local-only
 *   planned  declared here, nothing behind it yet
 *   fenced   deliberately not built; named so it is not mistaken for an oversight
 */
export type State = "built" | "partial" | "planned" | "fenced";

/** How the store actually serves an endpoint. Optional — fill it in when you know. */
export interface AccessPattern {
	/** The key expression, verbatim. `Query PK = QUESTION#<qid>` beats "by question". */
	key: string;
	/** The index that serves it. Omit for the base table; say `none` to mean a scan. */
	index?: string;
	/** `read` or `write`. A write that says how it is guarded belongs in `notes`. */
	mode?: "read" | "write";
	/** Anything a reviewer needs: append-only, conditional, paginated, fan-out. */
	notes?: string;
}

/** Something the server answers. */
export interface Endpoint {
	id: string;
	path: string;
	method: Method;
	/** One line. What a caller gets, not how it is implemented. */
	summary?: string;
	/** Free grouping — `billing`, `graph`, `catalog`. Used only for reporting. */
	category?: string;
	/** How the store serves it. The backend half of the map. */
	access?: AccessPattern;
	state?: State;
}

/** One thing a component needs from one endpoint. */
export interface DataNeed {
	/** An `Endpoint.id`. Unknown ids are a finding, not a crash. */
	endpoint: string;
	flow: Flow;
	/** Default true. A component that renders without it should say `false`. */
	required?: boolean;
	/** What to render while it is missing. Its presence is what makes `required:false` honest. */
	fallback?: unknown;
	/** Name the transform; do not inline it. The map records that one exists. */
	transform?: string;
}

/** Something that renders. */
export interface Component {
	id: string;
	name: string;
	/** Repo-relative path. Lets a reader jump from the map to the code. */
	file?: string;
	needs?: DataNeed[];
	/** Providers it must sit inside. */
	context?: string[];
	/** Derived on read from data it already has — never fetched, never stored. */
	computed?: string[];
	state?: State;
}

/** Where a person meets the components. */
export interface Screen {
	id: string;
	name: string;
	route?: string;
	/** `Component.id`s. The screen's endpoints are DERIVED from these — see below. */
	components?: string[];
	/**
	 * Endpoints the screen itself fetches, outside any one component — a page-level
	 * prefetch, say. Most screens need none.
	 *
	 * There is deliberately no field listing every endpoint a screen uses. That list
	 * is computed from the components (`DataMap.endpointsFor`), because a hand-kept
	 * copy is a second list, and a second list drifts from the first in exactly the
	 * way this map exists to prevent.
	 */
	extraEndpoints?: string[];
	loading?: "parallel" | "sequential" | "lazy";
	cache?: "aggressive" | "moderate" | "minimal";
	state?: State;
}

/** What the business needs to be true. The layer most maps leave out. */
export interface Requirement {
	id: string;
	/** One sentence, in the business's words, not the code's. */
	statement: string;
	/** Who acts. A person, a role, an agent. */
	actor?: string;
	/** `Endpoint.id`s that serve it. Empty means nothing on the server answers it. */
	endpoints?: string[];
	/** `Screen.id`s where it is met. Empty means it is real but has nowhere to happen. */
	screens?: string[];
	/** What the product refuses here. A rule with no refusal is a comment. */
	refuses?: string;
	state?: State;
	/** An issue, ticket or open-item id. Explains a `planned` that is not neglect. */
	blockedBy?: string;
}

/** What you hand to `defineDataMap`. */
export interface DataMapInput {
	/** The product or service this map covers. */
	name: string;
	/** Your versioning, not ours. Printed in reports so a pasted map is traceable. */
	version?: string;
	requirements?: Requirement[];
	endpoints?: Endpoint[];
	components?: Component[];
	screens?: Screen[];
}

/** A problem with the map, or with what the map describes. */
export interface Finding {
	/** `error` — the map contradicts itself. `warn` — the map is honest and the product has a hole. */
	level: "error" | "warn";
	/** Stable code, so a suppression or a test can name one. */
	code: FindingCode;
	/** `requirement:BR-101`, `endpoint:1001` — what the finding is about. */
	subject: string;
	message: string;
}

export type FindingCode =
	| "duplicate-id"
	| "unknown-endpoint"
	| "unknown-component"
	| "unknown-screen"
	| "orphan-endpoint"
	| "orphan-component"
	| "unserved-requirement"
	| "unplaced-requirement"
	| "unrequired-endpoint"
	| "missing-fallback"
	| "state-conflict"
	| "context-cycle";
