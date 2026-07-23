// Structured parse of a .tql / .playbook / .dashboard source file.
// Ported from the main app's TqlPreview; the frontmatter reader mirrors
// compute/pkg/ontology/tql_frontmatter.go's parseFrontmatterBlock.

export interface MetricDetail {
	name: string;
	expr: string | null;
}

export interface DimensionDetail {
	key: string;
	label: string;
	expr: string | null;
}

export interface RelationDetail {
	joined: string;
	parent: string;
	fk: string;
	pk: string;
}

export interface ParsedTql {
	title: string | null;
	description: string | null;
	role: string | null;
	backing: string | null;
	imports: { alias: string; path: string }[];
	relations: RelationDetail[];
	params: { name: string; type: string; default: string | null }[];
	metrics: MetricDetail[];
	dimensions: DimensionDetail[];
	filters: string[];
	comments: { key: string; value: string }[];
}

const TQL_EXTENSIONS = ["tql", "playbook", "dashboard"];

export function isTqlName(name: string | undefined | null): boolean {
	if (!name) return false;
	const ext = name.split(".").pop()?.toLowerCase() ?? "";
	return TQL_EXTENSIONS.includes(ext);
}

// Optional YAML-ish frontmatter block at the top of a .tql file.
function parseFrontmatter(src: string): {
	entries: Record<string, string>;
	bodyStartLine: number;
} {
	const lines = src.split("\n");
	if (lines.length === 0 || lines[0].replace(/[ \t\r]+$/, "") !== "---") {
		return { entries: {}, bodyStartLine: 0 };
	}
	let end = -1;
	for (let i = 1; i < lines.length; i++) {
		if (lines[i].replace(/[ \t\r]+$/, "") === "---") {
			end = i;
			break;
		}
	}
	if (end < 0) return { entries: {}, bodyStartLine: 0 };

	const entries: Record<string, string> = {};
	for (let i = 1; i < end; i++) {
		const raw = lines[i].replace(/\r$/, "");
		const line = raw.replace(/^[ \t]+/, "");
		if (line === "" || line.startsWith("#")) continue;
		const colon = line.indexOf(":");
		if (colon <= 0) continue;
		const key = line.slice(0, colon).trim();
		if (!key) continue;
		const rest = line.slice(colon + 1).replace(/^[ \t]+/, "");
		entries[key] = parseFrontmatterValue(rest);
	}
	return { entries, bodyStartLine: end + 1 };
}

function parseFrontmatterValue(rest: string): string {
	if (rest === "") return "";
	if (rest.startsWith('"')) return parseDoubleQuoted(rest.slice(1));
	if (rest.startsWith("'")) return parseSingleQuoted(rest.slice(1));
	// Strip an inline `#` comment when preceded by whitespace, per YAML.
	let value = rest;
	for (let i = 0; i < value.length - 1; i++) {
		if ((value[i] === " " || value[i] === "\t") && value[i + 1] === "#") {
			value = value.slice(0, i);
			break;
		}
	}
	return value.replace(/[ \t]+$/, "");
}

function parseDoubleQuoted(rest: string): string {
	let out = "";
	for (let i = 0; i < rest.length; i++) {
		const c = rest[i];
		if (c === "\\" && i + 1 < rest.length) {
			const next = rest[i + 1];
			out +=
				next === "n"
					? "\n"
					: next === "t"
						? "\t"
						: next === "r"
							? "\r"
							: next === "0"
								? "\0"
								: next === "/"
									? "/"
									: next;
			i++;
			continue;
		}
		if (c === '"') return out;
		out += c;
	}
	return out;
}

function parseSingleQuoted(rest: string): string {
	let out = "";
	for (let i = 0; i < rest.length; i++) {
		const c = rest[i];
		if (c === "'") {
			if (i + 1 < rest.length && rest[i + 1] === "'") {
				out += "'";
				i++;
				continue;
			}
			return out;
		}
		out += c;
	}
	return out;
}

function roleLabelFromType(entryType: string): string | null {
	switch (entryType) {
		case "object_module":
			return "Object module";
		case "composed_view":
			return "Composed view";
		case "query":
			return "Query";
		default:
			return entryType ? entryType : null;
	}
}

function extractQuotedStrings(s: string): string[] {
	const matches = s.match(/"([^"]+)"/g);
	if (!matches) return [];
	return matches.map((m) => m.slice(1, -1));
}

export function stripNounPrefix(s: string): string {
	const dot = s.indexOf(".");
	return dot >= 0 ? s.slice(dot + 1) : s;
}

export function resolveImport(fromFilePath: string, importPath: string): string {
	const fromDir = fromFilePath.split("/").slice(0, -1).join("/");
	const parts = importPath.split("/");
	const segments = fromDir ? fromDir.split("/") : [];
	for (const part of parts) {
		if (part === "..") segments.pop();
		else if (part !== ".") segments.push(part);
	}
	return segments.join("/");
}

export function parseTql(src: string): ParsedTql {
	const result: ParsedTql = {
		title: null,
		description: null,
		role: null,
		backing: null,
		imports: [],
		relations: [],
		params: [],
		metrics: [],
		dimensions: [],
		filters: [],
		comments: [],
	};

	// Prefer frontmatter when present; the migration now emits a `---` block
	// with type/name/description at the top of every generated .tql file.
	const { entries: frontmatter, bodyStartLine } = parseFrontmatter(src);
	if (frontmatter.name) result.title = frontmatter.name;
	if (frontmatter.description) result.description = frontmatter.description;
	if (frontmatter.type) result.role = roleLabelFromType(frontmatter.type);

	const allLines = src.split("\n");
	const lines = allLines.slice(bodyStartLine);

	for (const line of lines) {
		const trimmed = line.trim();

		// -- Description: ... (legacy fallback for files without frontmatter)
		const descMatch = trimmed.match(/^--\s*Description:\s*(.+)/);
		if (descMatch && !result.description) {
			result.description = descMatch[1].trim();
			continue;
		}

		// -- Composed view: ... / -- Object module: ... (legacy fallback)
		const roleMatch = trimmed.match(
			/^--\s*(?:Composed view|Object module|Fact|Dimension):\s*(.+)/,
		);
		if (roleMatch) {
			if (!result.role) {
				const prefix = trimmed.match(
					/^--\s*(Composed view|Object module|Fact|Dimension)/,
				);
				result.role = prefix ? prefix[1] : null;
			}
			if (!result.title) {
				result.title = roleMatch[1].trim();
			}
			continue;
		}

		// -- Key: Value comments
		const commentMatch = trimmed.match(/^--\s*(\w[\w\s]*?):\s*(.+)/);
		if (commentMatch) {
			const key = commentMatch[1].trim();
			const value = commentMatch[2].trim();
			if (!["Description", "Composed view", "Object module"].includes(key)) {
				result.comments.push({ key, value });
			}
			continue;
		}

		// import alias from "path"
		const importRecord = trimmed.match(/^import\s+(\w+)\s+from\s+"([^"]+)"/);
		if (importRecord) {
			result.imports.push({ alias: importRecord[1], path: importRecord[2] });
			continue;
		}

		// import { ... } from "path"
		const importFields = trimmed.match(
			/^import\s+\{([^}]+)\}\s+from\s+"([^"]+)"/,
		);
		if (importFields) {
			result.imports.push({
				alias: importFields[1].trim(),
				path: importFields[2],
			});
			continue;
		}

		// backing = sql"schema.table"
		const backingMatch = trimmed.match(/backing\s*=\s*sql"([^"]+)"/);
		if (backingMatch) {
			result.backing = backingMatch[1];
			continue;
		}

		// metric_keys = ["...", "..."] (fallback for names)
		const metricKeysMatch = trimmed.match(/metric_keys\s*=\s*\[([^\]]*)\]/);
		if (metricKeysMatch && result.metrics.length === 0) {
			result.metrics = extractQuotedStrings(metricKeysMatch[1]).map(
				(name) => ({ name, expr: null }),
			);
			continue;
		}

		// dimension_keys = ["...", "..."] (fallback for names)
		const dimKeysMatch = trimmed.match(/dimension_keys\s*=\s*\[([^\]]*)\]/);
		if (dimKeysMatch && result.dimensions.length === 0) {
			result.dimensions = extractQuotedStrings(dimKeysMatch[1]).map((key) => ({
				key,
				label: stripNounPrefix(key),
				expr: null,
			}));
			continue;
		}

		// filter_keys = ["...", "..."]
		const filterKeysMatch = trimmed.match(/filter_keys\s*=\s*\[([^\]]*)\]/);
		if (filterKeysMatch) {
			result.filters = extractQuotedStrings(filterKeysMatch[1]);
			continue;
		}
	}

	// Parse metric definitions: "Name" -> sql"EXPR"
	const metricBlock = src.match(
		/metrics\s*=\s*\\alias\s+selected\s*->\s*matchSet\s+selected\s*\{([\s\S]*?)\n\s*\}/,
	);
	if (metricBlock) {
		const metricDefs: MetricDetail[] = [];
		const metricLines = metricBlock[1].split("\n");
		for (const ml of metricLines) {
			const mm = ml.trim().match(/^"([^"]+)"\s*->\s*sql"([^"]+)"/);
			if (mm) metricDefs.push({ name: mm[1], expr: mm[2] });
		}
		if (metricDefs.length > 0) result.metrics = metricDefs;
	}

	// Parse dimension definitions: { key = "...", label = "...", expr = sql"..." }
	const dimBlock = src.match(/dimensions\s*=\s*\\alias\s*->\s*\[([\s\S]*?)\n\s*\]/);
	if (dimBlock) {
		const dimDefs: DimensionDetail[] = [];
		const dimEntries = dimBlock[1].matchAll(
			/\{\s*key\s*=\s*"([^"]+)"\s*,\s*label\s*=\s*"([^"]+)"\s*,\s*expr\s*=\s*sql"([^"]+)"\s*\}/g,
		);
		for (const dm of dimEntries) {
			dimDefs.push({ key: dm[1], label: dm[2], expr: dm[3] });
		}
		if (dimDefs.length > 0) result.dimensions = dimDefs;
	}

	// Parse params block
	const paramsBlock = src.match(/params\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/s);
	if (paramsBlock) {
		const paramLines = paramsBlock[1].split("\n");
		for (const pl of paramLines) {
			const pm = pl.trim().match(/^(\w+)\s*:\s*([^=]+?)(?:\s*=\s*(.+))?$/);
			if (pm) {
				result.params.push({
					name: pm[1],
					type: pm[2].trim(),
					default: pm[3]?.trim() ?? null,
				});
			}
		}
	}

	// Parse composed-view relations from `join_<alias> = obj_<X>.join_if
	// needs_<alias> <alias> <parent> sql"FK" sql"PK"` lines.
	const joinRegex =
		/^\s*join_(\w+)\s*=\s*\w+\.join_if\s+\w+\s+\w+\s+(\w+)\s+sql"([^"]+)"\s+sql"([^"]+)"/gm;
	for (const m of src.matchAll(joinRegex)) {
		result.relations.push({ joined: m[1], parent: m[2], fk: m[3], pk: m[4] });
	}

	return result;
}

export function hasTqlStructure(parsed: ParsedTql): boolean {
	return Boolean(
		parsed.title ||
			parsed.role ||
			parsed.description ||
			parsed.backing ||
			parsed.imports.length > 0 ||
			parsed.relations.length > 0 ||
			parsed.params.length > 0 ||
			parsed.metrics.length > 0 ||
			parsed.dimensions.length > 0 ||
			parsed.filters.length > 0,
	);
}
