import type { Component } from 'svelte';
import {
	AppWindow,
	Archive,
	BookOpen,
	Bot,
	Braces,
	Brain,
	Calendar,
	ChartArea,
	ChartColumn,
	ChartLine,
	Code,
	Database,
	Eye,
	FilePen,
	FileText,
	Globe,
	HardDrive,
	Image,
	LayoutDashboard,
	List,
	Mail,
	MessageCircleQuestionMark,
	Pencil,
	Search,
	SquareSlash,
	Table,
	Terminal,
	Users,
	Wrench
} from '@lucide/svelte';

/**
 * A chat cell as returned by both the SDK (`chats.getHistory`) and the
 * `/v2/chats/:id/cells/stream` NDJSON endpoint: common metadata fields plus
 * exactly one `<case>Cell` key holding the typed payload (a flattened proto
 * oneof, e.g. `{ id, complete, toolSummary, sqlCell: { query, ... } }`).
 */
export type CellLike = Record<string, unknown> & {
	id?: string;
	complete?: boolean;
	generated?: boolean;
	toolSummary?: string | null;
	execError?: string | null;
};

export type IconComponent = Component<{ size?: number | string; class?: string }>;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

/** Cell metadata keys that end in "Cell" but are not the oneof payload. */
const NON_PAYLOAD_KEYS = new Set(['id', 'toolCallId']);

/** Find the oneof payload key, e.g. "sqlCell" | "mdCell" | "mcpToolCell". */
export function getCellCase(cell: CellLike): string | undefined {
	for (const key of Object.keys(cell)) {
		if (!key.endsWith('Cell') || NON_PAYLOAD_KEYS.has(key)) continue;
		if (isRecord(cell[key])) return key;
	}
	return undefined;
}

export function getCellPayload(cell: CellLike): Record<string, unknown> {
	const cellCase = getCellCase(cell);
	const payload = cellCase ? cell[cellCase] : undefined;
	return isRecord(payload) ? payload : {};
}

export type CellTypeInfo = {
	name: string;
	icon: IconComponent;
};

const CELL_TYPE_INFO: Record<string, CellTypeInfo> = {
	sqlCell: { name: 'SQL', icon: Database },
	tableauSqlCell: { name: 'Tableau SQL', icon: Database },
	pyCell: { name: 'Python', icon: Code },
	wsCell: { name: 'Web Search', icon: Globe },
	linkedinSearchCell: { name: 'LinkedIn Search', icon: Users },
	metricsCell: { name: 'Metrics', icon: ChartLine },
	mcpToolCell: { name: 'MCP Tool', icon: Wrench },
	useSkillCell: { name: 'Using skill', icon: SquareSlash },
	ontologyQueryCell: { name: 'TQL Query', icon: Database },
	tableauSearchFieldsCell: { name: 'Search Tableau Fields', icon: Search },
	googleDriveSearchCell: { name: 'Google Drive Search', icon: HardDrive },
	googleDriveContentCell: { name: 'Google Drive File', icon: HardDrive },
	ontologySearchMetricsCell: { name: 'Ontology Metric Search', icon: Search },
	ontologyOpenObjectCell: { name: 'Ontology Object Context', icon: Database },
	microsoft365EmailSearchCell: { name: 'Microsoft 365 Email Search', icon: Mail },
	microsoft365EmailContentCell: { name: 'Microsoft 365 Email', icon: Mail },
	microsoft365CalendarCell: { name: 'Microsoft 365 Calendar', icon: Calendar },
	googleCalendarSearchCell: { name: 'Google Calendar', icon: Calendar },
	gmailEmailSearchCell: { name: 'Gmail Email Search', icon: Mail },
	gmailEmailContentCell: { name: 'Gmail Email', icon: Mail },
	bashCell: { name: 'Bash', icon: Terminal },
	javascriptCell: { name: 'JavaScript', icon: Braces },
	powerbiDaxCell: { name: 'DAX', icon: Database },
	powerbiCell: { name: 'PowerBI', icon: ChartColumn },
	feedExplorerCell: { name: 'Feed Explorer', icon: Bot },
	feedPostCell: { name: 'Feed Post', icon: Bot },
	feedCommentCell: { name: 'Feed Comment', icon: Bot },
	feedEngageCell: { name: 'Feed Engage', icon: Bot },
	feedCreateCell: { name: 'Feed Agent', icon: Bot },
	listDashboardsCell: { name: 'List Dashboards', icon: LayoutDashboard },
	listAppsCell: { name: 'List Data Apps', icon: AppWindow },
	listUsersCell: { name: 'List Users', icon: List },
	compactionCell: { name: 'Compaction', icon: Archive },
	thinkingCell: { name: 'Thinking', icon: Brain },
	documentCell: { name: 'Document', icon: FileText },
	emailCell: { name: 'Email', icon: Mail },
	imageCell: { name: 'Image', icon: Image },
	textCell: { name: 'Text File', icon: FileText },
	tabularFileCell: { name: 'Datasets', icon: Table },
	reportCell: { name: 'Report', icon: ChartArea },
	reportHistoryCell: { name: 'Report History', icon: ChartArea },
	patchCell: { name: 'Ontology Update', icon: FilePen },
	tableauCell: { name: 'Tableau', icon: ChartColumn },
	previewCell: { name: 'Preview', icon: Eye },
	streamlitCell: { name: 'Streamlit', icon: ChartColumn },
	dashboardCell: { name: 'Dashboard', icon: LayoutDashboard },
	appCell: { name: 'Data App', icon: AppWindow },
	contextPromptEditorCell: { name: 'Context Editor', icon: Pencil },
	ontologyEditorCell: { name: 'Ontology Editor', icon: Pencil },
	formEditorCell: { name: 'Form Editor', icon: FilePen },
	formCell: { name: 'Form', icon: FilePen },
	questionsCell: { name: 'Questions', icon: MessageCircleQuestionMark },
	connectorsCell: { name: 'Connectors', icon: Database },
	playbookEditorCell: { name: 'Playbook Editor', icon: BookOpen },
	mdCell: { name: 'Message', icon: FileText },
	ansCell: { name: 'Answer', icon: FileText },
	summaryCell: { name: 'Summary', icon: FileText },
	statusCell: { name: 'Status', icon: Bot }
};

export function getCellTypeInfo(cellCase: string | undefined): CellTypeInfo {
	if (cellCase && CELL_TYPE_INFO[cellCase]) return CELL_TYPE_INFO[cellCase];
	return { name: 'Tool', icon: Bot };
}

function titleCaseSnake(value: string): string {
	return value
		.split('_')
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

/** Human label for one cell: branded skill/MCP names, else the type name. */
export function getToolDisplayName(cell: CellLike): string {
	const cellCase = getCellCase(cell);
	const payload = getCellPayload(cell);

	if (cellCase === 'useSkillCell') {
		const trigger = typeof payload.trigger === 'string' ? payload.trigger : '';
		return trigger ? `Using skill /${trigger.replace(/^\//, '')}` : 'Using skill';
	}
	if (cellCase === 'mcpToolCell') {
		const toolName = typeof payload.toolName === 'string' ? payload.toolName : '';
		return titleCaseSnake(toolName) || 'Tool';
	}
	return getCellTypeInfo(cellCase).name;
}

/** "3 SQL, Python, Web Search" — grouped counts across a tool segment. */
export function getToolSummaryText(cells: CellLike[]): string {
	const counts = new Map<string, number>();
	for (const cell of cells) {
		const name = getToolDisplayName(cell);
		counts.set(name, (counts.get(name) ?? 0) + 1);
	}

	const parts: string[] = [];
	for (const [name, count] of counts) {
		parts.push(count > 1 ? `${count} ${name}` : name);
	}
	return parts.join(', ');
}

/** Prefer the LLM-written toolSummary when the segment has one. */
export function getLlmSummary(cells: CellLike[]): string | null {
	const summaries = cells
		.map((cell) => (typeof cell.toolSummary === 'string' ? cell.toolSummary : ''))
		.filter(Boolean);
	if (summaries.length === 0) return null;
	if (cells.length === 1) return summaries[0];
	return `${cells.length} steps — ${summaries[0]}, ...`;
}

/** Latest available summary while a segment is still streaming. */
export function getActiveSummary(cells: CellLike[]): string {
	for (let i = cells.length - 1; i >= 0; i--) {
		if (typeof cells[i].toolSummary === 'string' && cells[i].toolSummary) {
			return cells[i].toolSummary as string;
		}
	}
	return cells.length > 0 ? getToolDisplayName(cells[cells.length - 1]) : 'Working';
}

export function getUniqueToolIcons(cells: CellLike[]): { key: string; icon: IconComponent }[] {
	const seen = new Set<string>();
	const out: { key: string; icon: IconComponent }[] = [];
	for (const cell of cells) {
		const cellCase = getCellCase(cell);
		if (!cellCase || seen.has(cellCase)) continue;
		seen.add(cellCase);
		out.push({ key: cellCase, icon: getCellTypeInfo(cellCase).icon });
	}
	return out;
}

/**
 * How a chat turn is chunked for the UI: generated assistant markdown
 * (`mdCell` / `ansCell`) splits the stream. Everything between those —
 * thinking + tool calls — collapses into one expandable "toolgroup".
 */
export type Segment =
	| { type: 'assistant'; cell: CellLike }
	| { type: 'toolgroup'; cells: CellLike[] };

const TEXT_CASES = new Set(['mdCell', 'ansCell']);

export function buildSegments(cells: CellLike[]): Segment[] {
	const result: Segment[] = [];
	let currentGroup: CellLike[] = [];

	function flushGroup() {
		if (currentGroup.length > 0) {
			result.push({ type: 'toolgroup', cells: currentGroup });
			currentGroup = [];
		}
	}

	for (const cell of cells) {
		const cellCase = getCellCase(cell);
		if (cellCase && TEXT_CASES.has(cellCase) && cell.generated) {
			flushGroup();
			result.push({ type: 'assistant', cell });
		} else {
			currentGroup.push(cell);
		}
	}
	flushGroup();
	return result;
}

/** Stable key so segment DOM survives cells appending mid-stream. */
export function getSegmentKey(segment: Segment, index: number): string {
	if (segment.type === 'assistant') {
		return `assistant:${segment.cell.id || index}`;
	}
	return `toolgroup:${segment.cells[0]?.id || index}`;
}

/** Compact batch headline, e.g. "Explored 3 tools" / "Thinking". */
export function getBatchHeadline(cells: CellLike[]): string {
	const tools = cells.filter((cell) => getCellCase(cell) !== 'thinkingCell');
	const thoughts = cells.length - tools.length;

	if (tools.length === 0) {
		return thoughts > 1 ? `Thought ${thoughts} times` : 'Thinking';
	}

	const toolBit =
		tools.length === 1
			? getToolDisplayName(tools[0])
			: `${tools.length} tools`;
	if (thoughts === 0) return `Explored ${toolBit}`;
	return `Explored ${toolBit}`;
}

/** One-line label for a step inside an expanded batch. */
export function getStepLabel(cell: CellLike): string {
	const cellCase = getCellCase(cell);
	if (cellCase === 'thinkingCell') {
		const payload = getCellPayload(cell);
		if (payload.redacted === true) return 'Thought (redacted)';
		return 'Thought briefly';
	}
	const summary =
		typeof cell.toolSummary === 'string' && cell.toolSummary.trim()
			? cell.toolSummary.trim()
			: '';
	const name = getToolDisplayName(cell);
	return summary ? `Ran ${name} — ${summary}` : `Ran ${name}`;
}
