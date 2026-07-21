/** Universal option flags that are meaningful to surface in the composer. */
export const TOOL_FLAG_KEYS = [
	'sqlEnabled',
	'pythonEnabled',
	'webSearchEnabled',
	'bashEnabled',
	'javascriptEnabled',
	'ontologyEnabled',
	'googleDriveEnabled',
	'gmailEnabled',
	'googleCalendarEnabled',
	'microsoft365Enabled',
	'powerbiEnabled',
	'streamlitEnabled'
] as const;

export type ToolFlagKey = (typeof TOOL_FLAG_KEYS)[number];

export type ChatTools = Partial<Record<ToolFlagKey, boolean>>;

export type ToolDisplay = {
	key: ToolFlagKey;
	label: string;
};

/** Display order + labels for enabled tool chips. */
export const TOOL_DISPLAY: ToolDisplay[] = [
	{ key: 'sqlEnabled', label: 'SQL' },
	{ key: 'pythonEnabled', label: 'Python' },
	{ key: 'webSearchEnabled', label: 'Web search' },
	{ key: 'bashEnabled', label: 'Bash' },
	{ key: 'javascriptEnabled', label: 'JavaScript' },
	{ key: 'ontologyEnabled', label: 'Ontology' },
	{ key: 'googleDriveEnabled', label: 'Google Drive' },
	{ key: 'gmailEnabled', label: 'Gmail' },
	{ key: 'googleCalendarEnabled', label: 'Google Calendar' },
	{ key: 'microsoft365Enabled', label: 'Microsoft 365' },
	{ key: 'powerbiEnabled', label: 'Power BI' },
	{ key: 'streamlitEnabled', label: 'Streamlit' }
];

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

/** Pull only `true` tool flags from a GetChat `universal` options object. */
export function extractEnabledTools(universal: unknown): ChatTools {
	if (!isRecord(universal)) return {};

	const tools: ChatTools = {};
	for (const key of TOOL_FLAG_KEYS) {
		if (universal[key] === true) {
			tools[key] = true;
		}
	}
	return tools;
}

/**
 * Tools that will be enabled on create given the current selection.
 * Matches `/api/chat` createChat: connectors → `sqlEnabled: true`.
 */
export function previewToolsFromSelection(connectorIds: number[]): ChatTools {
	if (connectorIds.length === 0) return {};
	return { sqlEnabled: true };
}

export function enabledToolDisplays(tools: ChatTools): ToolDisplay[] {
	return TOOL_DISPLAY.filter((tool) => tools[tool.key] === true);
}
