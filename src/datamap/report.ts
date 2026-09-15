/**
 * report — the map as text, at three densities.
 *
 * The reason this module exists: an agent asked to change an endpoint should not
 * have to read the repo to find out what depends on it. `brief()` puts the whole
 * data flow — business requirement through endpoint and key expression to screen —
 * in something on the order of a hundred lines, which is a few thousand tokens
 * instead of a few hundred thousand, and it is current because CI validates it.
 *
 *   brief()     the dense map. Built for a context window.
 *   markdown()  the same thing for humans, with tables.
 *   mermaid()   one screen's dependency graph, for a PR or a doc.
 *   findings()  validate()'s output, rendered.
 */
import type { DataMap } from "./define";
import type { Finding } from "./types";

const MARK: Record<string, string> = {
	built: "",
	partial: "~",
	planned: "?",
	fenced: "x",
};

const mark = (state?: string) => (state ? (MARK[state] ?? "") : "");

const pad = (s: string, n: number) => (s.length >= n ? s : s + " ".repeat(n - s.length));

/**
 * The dense map. Every line is one fact; nothing is repeated between sections.
 *
 * Legend, printed in the output so a pasted map explains itself:
 *   ~ partial   ? planned   x fenced   (no mark = built)
 */
export function brief(map: DataMap): string {
	const out: string[] = [];
	const head = [
		map.name,
		map.version ? `v${map.version}` : null,
		`${map.requirements.length} req`,
		`${map.endpoints.length} endpoint`,
		`${map.components.length} component`,
		`${map.screens.length} screen`,
	]
		.filter(Boolean)
		.join(" · ");
	out.push(head);
	out.push("legend: ~ partial · ? planned · x fenced · unmarked = built");

	if (map.requirements.length) {
		out.push("", "REQUIREMENTS  id state statement → endpoints · screens");
		for (const r of map.requirements) {
			out.push(`${pad(r.id, 8)}${mark(r.state)} ${r.statement}`);
			const line = [
				(r.endpoints ?? []).join(" ") || "—",
				(r.screens ?? []).join(" ") || "—",
			].join("  ·  ");
			out.push(`         → ${line}`);
			if (r.refuses) out.push(`         ✕ ${r.refuses}`);
			if (r.blockedBy) out.push(`         blocked: ${r.blockedBy}`);
		}
	}

	if (map.endpoints.length) {
		out.push("", "ENDPOINTS  id method path · key expression [index] · consumers");
		for (const e of map.endpoints) {
			const consumers = map.consumersOf(e.id);
			out.push(
				`${pad(e.id, 8)}${mark(e.state)} ${pad(e.method, 6)} ${e.path}${
					e.summary ? `  — ${e.summary}` : ""
				}`,
			);
			if (e.access) {
				const idx = e.access.index ? ` [${e.access.index}]` : "";
				const mode = e.access.mode ? `${e.access.mode} ` : "";
				out.push(`         ${mode}${e.access.key}${idx}`);
				if (e.access.notes) out.push(`         note: ${e.access.notes}`);
			}
			out.push(
				`         used by: ${
					consumers.length ? consumers.map((c) => c.id).join(" ") : "NOBODY"
				}`,
			);
		}
	}

	if (map.screens.length) {
		out.push("", "SCREENS  id route · components · endpoints reached");
		for (const s of map.screens) {
			out.push(
				`${pad(s.id, 8)}${mark(s.state)} ${s.route ?? ""}  ${s.name}`,
			);
			out.push(
				`         components: ${(s.components ?? []).join(" ") || "—"}`,
			);
			out.push(
				`         endpoints:  ${
					map.endpointsFor(s.id).map((e) => e.id).join(" ") || "—"
				}`,
			);
		}
	}

	if (map.components.length) {
		out.push("", "COMPONENTS  id name · needs (endpoint:flow) · computed");
		for (const c of map.components) {
			const needs = (c.needs ?? [])
				.map(
					(n) =>
						`${n.endpoint}:${n.flow}${n.required === false ? "?" : ""}`,
				)
				.join(" ");
			out.push(
				`${pad(c.id, 8)}${mark(c.state)} ${c.name}${c.file ? `  (${c.file})` : ""}`,
			);
			if (needs) out.push(`         needs: ${needs}`);
			if (c.computed?.length)
				out.push(`         computed: ${c.computed.join(" ")}`);
			if (c.context?.length) out.push(`         context: ${c.context.join(" ")}`);
		}
	}

	return out.join("\n");
}

/** The same map for humans. */
export function markdown(map: DataMap): string {
	const out: string[] = [];
	out.push(`# ${map.name} — data map`);
	if (map.version) out.push(`\nVersion ${map.version}.`);
	out.push(
		`\n${map.requirements.length} requirements · ${map.endpoints.length} endpoints · ${map.components.length} components · ${map.screens.length} screens.`,
	);

	if (map.requirements.length) {
		out.push("\n## Requirements\n");
		out.push("| Id | State | Statement | Endpoints | Screens |");
		out.push("|---|---|---|---|---|");
		for (const r of map.requirements) {
			out.push(
				`| \`${r.id}\` | ${r.state ?? ""} | ${r.statement} | ${
					(r.endpoints ?? []).map((e) => `\`${e}\``).join(" ") || "—"
				} | ${(r.screens ?? []).map((s) => `\`${s}\``).join(" ") || "—"} |`,
			);
		}
	}

	if (map.endpoints.length) {
		out.push("\n## Endpoints and access patterns\n");
		out.push("| Id | Method | Path | Key expression | Index | Used by |");
		out.push("|---|---|---|---|---|---|");
		for (const e of map.endpoints) {
			const consumers = map.consumersOf(e.id);
			out.push(
				`| \`${e.id}\` | ${e.method} | \`${e.path}\` | ${
					e.access?.key ? `\`${e.access.key}\`` : "—"
				} | ${e.access?.index ?? "base"} | ${
					consumers.length ? consumers.map((c) => c.id).join(", ") : "**nobody**"
				} |`,
			);
		}
	}

	if (map.screens.length) {
		out.push("\n## Screens\n");
		out.push("| Id | Route | Components | Endpoints reached |");
		out.push("|---|---|---|---|");
		for (const s of map.screens) {
			out.push(
				`| \`${s.id}\` | \`${s.route ?? ""}\` | ${
					(s.components ?? []).join(", ") || "—"
				} | ${map.endpointsFor(s.id).map((e) => e.id).join(", ") || "—"} |`,
			);
		}
	}

	return out.join("\n");
}

/**
 * One screen as a Mermaid graph: screen → components → endpoints.
 * Omit `screenId` to draw every screen.
 */
export function mermaid(map: DataMap, screenId?: string): string {
	const screens = screenId
		? [map.screen(screenId)].filter(Boolean)
		: map.screens;
	const lines = ["graph LR"];
	const safe = (s: string) => s.replace(/[^A-Za-z0-9_]/g, "_");

	for (const screen of screens) {
		if (!screen) continue;
		const sid = `S_${safe(screen.id)}`;
		lines.push(`  ${sid}["${screen.name}"]`);
		for (const component of map.componentsFor(screen.id)) {
			const cid = `C_${safe(component.id)}`;
			lines.push(`  ${sid} --> ${cid}("${component.name}")`);
			for (const need of component.needs ?? []) {
				const endpoint = map.endpoint(need.endpoint);
				if (!endpoint) continue;
				const eid = `E_${safe(endpoint.id)}`;
				const arrow = need.required === false ? "-.->" : "-->";
				lines.push(
					`  ${cid} ${arrow}|${need.flow}| ${eid}[/"${endpoint.method} ${endpoint.path}"/]`,
				);
			}
		}
	}
	return lines.join("\n");
}

/** validate()'s output, rendered. Errors first — they are always your bug. */
export function findings(list: Finding[]): string {
	if (list.length === 0) return "No findings.";
	const errors = list.filter((f) => f.level === "error");
	const warns = list.filter((f) => f.level === "warn");
	const out: string[] = [];
	out.push(`${errors.length} error(s), ${warns.length} warning(s).`);
	for (const f of [...errors, ...warns]) {
		out.push(
			`${f.level === "error" ? "ERROR" : " warn"}  ${pad(f.code, 22)} ${f.subject}  ${f.message}`,
		);
	}
	return out.join("\n");
}
