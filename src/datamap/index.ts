/**
 * The Data Map — one declaration of how data flows from the business requirement,
 * through the endpoint and the key that serves it, to the screen a person uses.
 *
 * It is plain data. No server, no build, no browser, no React — so it can be
 * loaded by a test, a CI job, a docs generator or an AI agent that needs the shape
 * of a system without reading the system.
 *
 *   import { defineDataMap, validate, brief } from "@morf_engineering/rainfalljs/datamap";
 *
 *   const map = defineDataMap({ name: "Acme", endpoints: [...], screens: [...] });
 *   const problems = validate(map);   // run this in CI
 *   console.log(brief(map));          // paste this into a prompt
 *
 * The runtime half of RainfallJS (DataProvider, useData) is optional and separate.
 * A map describes a system; it does not have to be the system that fetches it.
 */
export { defineDataMap } from "./define";
export type { DataMap, Trace } from "./define";
export { validate, isValid } from "./validate";
export { brief, markdown, mermaid, findings } from "./report";
export type {
	AccessPattern,
	Component,
	DataMapInput,
	DataNeed,
	Endpoint,
	Finding,
	FindingCode,
	Flow,
	Method,
	Requirement,
	Screen,
	State,
} from "./types";
