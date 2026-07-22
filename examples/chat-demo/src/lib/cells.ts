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
import {
	TextqlRpcPublicChatCellLifecycle,
	type TextqlRpcPublicChatCellLifecycle as CellLifecycle
} from '@textql/sdk/models';
import { isRecord } from '$lib/utils';

/** Coerce unknown payload fields; cell payloads are untyped proto JSON. */
export function asString(value: unknown): string {
	return typeof value === 'string' ? value : '';
}

export function asRecords(value: unknown): Record<string, unknown>[] {
	return Array.isArray(value) ? value.filter(isRecord) : [];
}

export function asStrings(value: unknown): string[] {
	return Array.isArray(value)
		? value.filter((item): item is string => typeof item === 'string')
		: [];
}


export type CellLike = Record<string, unknown> & {
	id?: string;
	complete?: boolean;
	generated?: boolean;
	toolSummary?: string | null;
	execError?: string | null;
	/** Wall-clock start from the API (ISO string or Date). */
	timestamp?: string | Date | number | null;
	startedAt?: string | Date | number | null;
	createdAt?: string | Date | number | null;
	lifecycle?: CellLifecycle | null;
	durationMs?: number | string | null;
};

const TERMINAL_LIFECYCLES = new Set<CellLifecycle>([
	TextqlRpcPublicChatCellLifecycle.LifecycleExecuted,
	TextqlRpcPublicChatCellLifecycle.LifecycleHalted
]);

const EXECUTING_LIFECYCLES = new Set<CellLifecycle>([
	TextqlRpcPublicChatCellLifecycle.LifecycleCreating,
	TextqlRpcPublicChatCellLifecycle.LifecycleCreated,
	TextqlRpcPublicChatCellLifecycle.LifecycleExecuting,
	TextqlRpcPublicChatCellLifecycle.LifecycleHandoffPending
]);

export function isCellExecuting(
	cell: CellLike,
	assumeIncomplete = false
): boolean {
	const lifecycle = cell.lifecycle;
	if (lifecycle && TERMINAL_LIFECYCLES.has(lifecycle)) return false;
	if (cell.complete === true) return false;
	if (lifecycle && EXECUTING_LIFECYCLES.has(lifecycle)) return true;
	if (cell.complete === false) return true;
	return assumeIncomplete && cell.complete == null;
}

export function settleCells(cells: CellLike[] | undefined): void {
	if (!cells) return;
	for (const cell of cells) {
		if (!isCellExecuting(cell)) continue;
		cell.lifecycle = TextqlRpcPublicChatCellLifecycle.LifecycleExecuted;
		cell.complete = true;
	}
}

/** Finished enough to show final wall-clock duration (not a live timer). */
export function isCellFinished(cell: CellLike): boolean {
	const lifecycle = cell.lifecycle;
	if (lifecycle && TERMINAL_LIFECYCLES.has(lifecycle)) return true;
	if (cell.complete === true) return true;
	return false;
}

function parseTimeMs(value: unknown): number | null {
	if (value == null) return null;
	if (typeof value === 'number' && Number.isFinite(value)) {
		// Seconds vs milliseconds heuristic.
		return value < 1e12 ? value * 1000 : value;
	}
	if (value instanceof Date) {
		const ms = value.getTime();
		return Number.isFinite(ms) ? ms : null;
	}
	if (typeof value === 'string' && value.trim()) {
		const ms = Date.parse(value);
		return Number.isFinite(ms) ? ms : null;
	}
	return null;
}

/** Prefer API timestamps; caller falls back to a local clock when null. */
export function getCellStartedAtMs(cell: CellLike): number | null {
	return (
		parseTimeMs(cell.startedAt) ??
		parseTimeMs(cell.createdAt) ??
		parseTimeMs(cell.timestamp)
	);
}

/** Compact elapsed label: `3s`, `1m 05s`, `1h 02m`. */
export function formatElapsed(ms: number): string {
	const totalSec = Math.max(0, Math.floor(ms / 1000));
	if (totalSec < 60) return `${totalSec}s`;
	const mins = Math.floor(totalSec / 60);
	const secs = totalSec % 60;
	if (mins < 60) return `${mins}m ${String(secs).padStart(2, '0')}s`;
	const hours = Math.floor(mins / 60);
	const remMins = mins % 60;
	return `${hours}h ${String(remMins).padStart(2, '0')}m`;
}

/** Earliest start among still-running cells in a batch (for the header timer). */
export function getBatchStartedAtMs(cells: CellLike[]): number | null {
	let earliest: number | null = null;
	for (const cell of cells) {
		if (!isCellExecuting(cell)) continue;
		const started = getCellStartedAtMs(cell);
		if (started == null) continue;
		if (earliest == null || started < earliest) earliest = started;
	}
	return earliest;
}

export type IconComponent = Component<{ size?: number | string; class?: string }>;

/** Find the oneof payload key, e.g. "sqlCell" | "mdCell" | "mcpToolCell". */
export function getCellCase(cell: CellLike): string | undefined {
	for (const key of Object.keys(cell)) {
		if (key.endsWith('Cell') && isRecord(cell[key])) return key;
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

export function titleCaseSnake(value: string): string {
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

/** Latest available summary while a segment is still streaming. */
export function getActiveSummary(cells: CellLike[]): string {
	for (let i = cells.length - 1; i >= 0; i--) {
		if (typeof cells[i].toolSummary === 'string' && cells[i].toolSummary) {
			return cells[i].toolSummary as string;
		}
	}
	return cells.length > 0 ? getToolDisplayName(cells[cells.length - 1]) : 'Working';
}

/**
 * How a chat turn is chunked for the UI: assistant markdown
 * (`mdCell` / `ansCell`) splits the stream. Everything between those —
 * thinking + tool calls — collapses into one expandable "toolgroup".
 *
 * Note: these arrays are already scoped to the assistant turn (user echoes
 * are filtered out before this runs). Do not require `generated === true` —
 * stream snapshots sometimes omit that flag until the cell completes, which
 * would hide live markdown inside a collapsed tool group.
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
		if (cellCase && TEXT_CASES.has(cellCase)) {
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
	return `Explored ${toolBit}`;
}

/** One-line label for a step inside an expanded batch. */
export function getStepLabel(cell: CellLike, assumeIncomplete = false): string {
	const running = isCellExecuting(cell, assumeIncomplete);
	const cellCase = getCellCase(cell);
	if (cellCase === 'thinkingCell') {
		const payload = getCellPayload(cell);
		if (payload.redacted === true) return 'Thought (redacted)';
		return running ? 'Thinking' : 'Thought briefly';
	}
	const summary =
		typeof cell.toolSummary === 'string' && cell.toolSummary.trim()
			? cell.toolSummary.trim()
			: '';
	const name = getToolDisplayName(cell);
	const verb = running ? 'Running' : 'Ran';
	return summary ? `${verb} ${name} — ${summary}` : `${verb} ${name}`;
}
