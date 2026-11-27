/**
 * Mirror of Settings -> Features as a customer actually sees it.
 *
 * Row set, grouping and order are taken from
 * fe/src/routes/(main)/settings/features/+page.svelte. Rows that page only
 * builds behind a debug level (playbookTools, injectFullOntology,
 * googleConnector) are deliberately absent — with $debug === 0 the whole
 * "Internal" group is never rendered, so it is not part of what a customer can
 * see. Likewise python, ontologyEditing and the ~50 other INTERNAL fields:
 * settable over the wire by a superadmin, but not surfaced here.
 *
 * Two columns, same meaning as the product:
 *   Available — the org master switch. Off means the capability is gone for
 *               everyone. Backed by tool_restrictions.<field> for agent tools,
 *               or by a standalone organization column.
 *   Default   — whether an available tool starts active in a new thread.
 *               Backed by paradigm_params.<field>.
 */

export type Source =
	| { kind: 'restriction'; field: string } // tool_restrictions.<field>
	| { kind: 'paradigm'; field: string } // paradigm_params.<field>
	| { kind: 'org'; field: string; invert?: boolean } // organization column
	| { kind: 'none' };

/**
 * The three ways this product gates a capability. Which one backs a row
 * determines whether the switch layers, whether it can have a global default,
 * and what a missing value means.
 */
export type Mechanism = 'tool-layer' | 'org-column';

export const MECHANISM_LABELS: Record<Mechanism, string> = {
	'tool-layer': 'Tool layer',
	'org-column': 'Org column'
};

export const MECHANISM_BLURBS: Record<Mechanism, string> = {
	'tool-layer':
		'Two columns of the same proto message on the org row. Available caps what is permitted, Default seeds new threads, and a member can override the Default for themselves. The only mechanism that layers.',
	'org-column':
		'A plain boolean column on the organization row. One value, one level, read live. No per-member override, which is why these rows have no Default.'
};

/** An Old / New experience selector on the title line, backed by its own column. */
export interface ModeDef {
	field: string;
	oldLabel: string;
	newLabel: string;
	note: string;
}

export interface FeatureRow {
	key: string;
	name: string;
	description: string;
	details: string;
	badge?: string;
	available: Source;
	default: Source;
	mode?: ModeDef;
	/** Why the product sometimes hides this row entirely. */
	hiddenWhen?: string;
	/**
	 * The condition behind `hiddenWhen`, evaluated against the live org. True
	 * means Settings -> Features would not render this row, so neither do we —
	 * this page should never show a switch the product does not offer.
	 */
	hiddenFor?: (organization: Record<string, unknown> | undefined) => boolean;
	/**
	 * Why this row has no Default column, when the underlying paradigm field
	 * exists anyway. Only set on `default: NONE` rows.
	 */
	defaultNote?: string;
	/**
	 * paradigm_params field cleared when Available goes off, mirroring the
	 * product's `restrictionAvail(key, field, paradigmField)` opt-in. Only the
	 * off direction cascades: turning Available back on leaves the default
	 * alone, so a tool does not silently come back enabled in new threads.
	 *
	 * Usually the same field the Default column writes. Ontology sets it even
	 * though it has no Default column, because the product still clears
	 * paradigm_params.ontologyEnabled from the sub-row.
	 */
	cascadeDefault?: string;
	storage: string;
	caveat?: string;
}

export interface FeatureGroup {
	label: string;
	description: string;
	rows: FeatureRow[];
}

const R = (field: string): Source => ({ kind: 'restriction', field });
const P = (field: string): Source => ({ kind: 'paradigm', field });
const O = (field: string, invert = false): Source => ({ kind: 'org', field, invert });
const NONE: Source = { kind: 'none' };

const TOOL_STORAGE = 'organization.tool_restrictions / .paradigm_params';

export const FEATURE_GROUPS: FeatureGroup[] = [
	{
		label: 'Agent tools',
		description:
			'Capabilities the agent uses to answer. Available adds the tool to your org; Default turns it on in new threads. Both show up in a thread’s tools menu.',
		rows: [
			{
				key: 'webSearch',
				name: 'Web Search',
				description: 'Searches the live web for current information and cites its sources.',
				details:
					'When a question needs current or external information the agent searches the live web, can fetch a specific URL, and surfaces the source pages it pulled.',
				available: R('webSearchEnabled'),
				cascadeDefault: 'webSearchEnabled',
				default: P('webSearchEnabled'),
				storage: TOOL_STORAGE
			},
			{
				key: 'sql',
				name: 'SQL',
				description: 'Writes and runs SQL against your databases to answer questions.',
				details:
					'The agent writes SQL from a plain-language question, runs it against connected databases, and shows both the query and the result table.',
				available: R('sqlEnabled'),
				cascadeDefault: 'sqlEnabled',
				default: P('sqlEnabled'),
				storage: TOOL_STORAGE,
				caveat:
					'Also enforced live by the sandbox-exec gate, which re-reads tool_restrictions on every call instead of using the thread snapshot.'
			},
			{
				key: 'ontology',
				name: 'Ontology',
				description: 'Lets the agent answer through your ontology instead of raw tables.',
				details:
					'Grounds answers in your defined metrics, entities and relationships rather than guessing at raw tables. What it runs depends on the experience: Old queries the semantic layer; New is the unified, file-based context library the agent reads and queries with .tql.',
				available: R('ontologyEnabled'),
				cascadeDefault: 'ontologyEnabled',
				default: NONE,
				defaultNote:
					'The product moves this default onto a nested "TQL Query" sub-row rather than the parent, because Ontology is the capability and TQL Query is the tool that gets switched on. Both write paradigm_params.ontologyEnabled.',
				mode: {
					field: 'contextV3Enabled',
					oldLabel: 'Legacy',
					newLabel: 'Ontology 3.0',
					note: 'The New experience is organization.context_v3_enabled — a separate column from the Available switch, so it is not a third state of the same field.'
				},
				storage: TOOL_STORAGE,
				caveat:
					'Force-disabled at thread creation when no attached connector has an ontology, whatever both switches say.'
			},
			{
				key: 'email',
				name: 'Email Output',
				description: 'Lets the agent send results by email.',
				details: 'Registers the EmailCell tool so a thread can deliver its output to an inbox.',
				available: R('emailOutputEnabled'),
				cascadeDefault: 'emailOutputEnabled',
				default: P('emailOutputEnabled'),
				storage: TOOL_STORAGE,
				caveat:
					'The separate top-level emailOutputEnabled request field is dead — the handler has no reference to it and silently drops whatever you send. Only these two columns matter.'
			},
			{
				key: 'bash',
				name: 'Bash',
				description: 'Runs shell commands inside the sandbox.',
				details:
					'Gives the agent a shell in its sandbox for file manipulation and tooling that Python does not cover.',
				available: R('bashEnabled'),
				cascadeDefault: 'bashEnabled',
				default: P('bashEnabled'),
				storage: TOOL_STORAGE,
				caveat:
					'There is also a bash_enabled column on the organization row. It is written and returned by the API but no gate reads it — these two columns are what decide.'
			}
		]
	},
	{
		label: 'Visualization & output',
		description:
			'How answers get rendered, plus BI connections. Turning one on makes it available org-wide — as an output format, an agent tool, or a data connector.',
		rows: [
			{
				key: 'dashboards',
				name: 'Dashboards',
				description: 'Lets the agent build dashboards from a thread.',
				details: 'Enables the dashboards surface and dashboard output from threads.',
				available: O('dashboardsEnabled'),
				default: NONE,
				defaultNote:
					'The default lives on a nested "Default dashboard output" sub-row, backed by the separate organization.default_dashboard_output column — not by paradigm_params.',
				storage: 'organization.dashboards_enabled / .default_dashboard_output',
				caveat:
					'Turning Available off force-clears default_dashboard_output in the same write, and setting that column while Available is off is rejected outright.'
			},
			{
				key: 'powerbi',
				name: 'Power BI',
				description: 'Connects Power BI workspaces as a data source.',
				details: 'Lets the agent query Power BI datasets and reference existing reports.',
				available: R('powerbiEnabled'),
				default: NONE,
				defaultNote:
					'paradigm_params.powerbiEnabled exists but is recomputed from the attached connectors every time the selection changes (computeConnectorSelectionFlags: powerbiEnabled = !exclusiveOAuth && hasPowerBI). It never reads the stored value, so an org default could not survive a single connector change.',
				storage: TOOL_STORAGE,
				caveat: 'Also gates Power BI dataset creation in the datasets service.'
			},
			{
				key: 'tableau',
				name: 'Tableau',
				description: 'Connects Tableau as a data source.',
				details: 'Lets the agent query Tableau collections and workbooks.',
				available: R('tableauEnabled'),
				default: NONE,
				defaultNote:
					'Same as Power BI: paradigm_params.tableauEnabled is derived from whether a Tableau connector is attached (tableauEnabled = !exclusiveOAuth && hasTableau), not from anything stored. SQL and Ontology carry their previous value forward; these two do not.',
				storage: TOOL_STORAGE,
				caveat:
					'Available is never applied at thread creation — applyRestrictions does not read it. The datasets service does gate Tableau dataset creation on it.'
			},
			{
				key: 'methodology',
				name: 'Methodology',
				description: 'Lets threads pick a response methodology.',
				details: 'Exposes the methodology selector and an org-wide default.',
				available: O('methodologyEnabled'),
				default: NONE,
				defaultNote:
					'The default is a methodology picker on a nested sub-row, backed by organization.default_methodology — an enum, not a boolean, so it cannot be a switch.',
				storage: 'organization.methodology_enabled / .default_methodology',
				caveat: 'Default is an enum here, not a boolean.'
			},
			{
				key: 'javascript',
				name: 'JavaScript',
				description: 'Runs JavaScript for client-side visualizations.',
				details: 'Executes JavaScript, largely for interactive output rather than data access.',
				available: R('javascriptEnabled'),
				cascadeDefault: 'javascriptEnabled',
				default: P('javascriptEnabled'),
				hiddenWhen:
					'Data Apps retires JS visualizations, so the product hides this row entirely once dataAppsEnabled is on — and the backend stops registering the tool.',
				hiddenFor: (org) => readSource(O('dataAppsEnabled'), org).kind === 'on',
				storage: TOOL_STORAGE
			}
		]
	},
	{
		label: 'Workspace & access',
		description:
			'Platform features and what members are allowed to do. Each surfaces in its own place — a sidebar page, the connector picker, or in-thread.',
		rows: [
			{
				key: 'fileUpload',
				name: 'File Upload',
				description: 'Lets members upload files for the agent to analyse.',
				details: 'Permits CSV / Excel upload and dataset creation from local files.',
				available: R('fileUploadEnabled'),
				default: NONE,
				defaultNote:
					'Single-axis in the product: available or not. The paradigm field is only ever set by the org ceiling.',
				storage: TOOL_STORAGE,
				caveat:
					'Available is not applied at thread creation, but the datasets service does gate dataset creation on it.'
			},
			{
				key: 'threadHistory',
				name: 'Chat History Search',
				description: 'Searches your past threads for relevant prior work.',
				details:
					'Lets the agent look through earlier threads in the org to reuse analysis instead of starting over.',
				available: R('chatHistorySearchEnabled'),
				default: NONE,
				defaultNote:
					'Single-axis in the product. paradigm_params.chatHistorySearchEnabled defaults on for every new thread and is not offered as an org default.',
				storage: TOOL_STORAGE
			},
			{
				key: 'secrets',
				name: 'Secrets',
				description: 'Lets the org store credentials for connectors and tools.',
				details: 'Enables the org secrets store.',
				available: O('secretsEnabled'),
				default: NONE,
				storage: 'organization.secrets_enabled',
				caveat:
					'Writing this also writes allow_all_api_access to the same value — the two move together whether or not you intend it.'
			},
			{
				key: 'sharing',
				name: 'Sharing',
				description: 'Lets members share threads and artifacts.',
				details: 'When off, sharing is blocked org-wide.',
				available: O('sharingDisabled', true),
				default: NONE,
				storage: 'organization.sharing_disabled',
				caveat: 'Stored inverted: the column is sharing_disabled, so Available is its negation.'
			},
			{
				key: 'modelSwitching',
				name: 'Model Switching',
				description: 'Lets members change the model mid-thread.',
				details: 'Shows the model picker in a thread instead of pinning the org default.',
				available: R('modelSwitchingEnabled'),
				default: NONE,
				defaultNote:
					'Single-axis in the product. Which models a member may pick is role policy (Roles -> Model policy), not a per-thread default.',
				storage: TOOL_STORAGE,
				caveat: 'Available is inert — nothing reads modelSwitchingEnabled as a restriction.'
			},
			{
				key: 'traces',
				name: 'Traces',
				description: 'Shows how each claim in an answer was derived.',
				details:
					'Attaches citations and provenance to agent output, so any figure in an answer can be traced back to the query or source that produced it.',
				available: O('tracesEnabled'),
				default: NONE,
				storage: 'organization.traces_enabled'
			},
			{
				key: 'apiConnectors',
				name: 'API Connectors',
				description: 'Shows first-party API connectors in the picker.',
				details: 'When off, the API connectors section is hidden.',
				available: O('hideApiConnectors', true),
				default: NONE,
				storage: 'organization.hide_api_connectors',
				caveat: 'Stored inverted as hide_api_connectors.'
			},
		]
	},
	{
		label: 'Beta',
		description:
			'Experimental features that may change or be removed. Turning one on opts your whole org in.',
		rows: [
			{
				key: 'dataApps',
				name: 'Data Apps',
				description: 'Lets the agent build interactive data apps.',
				details: 'Enables the apps resource and HTML generative dashboards.',
				available: O('dataAppsEnabled'),
				default: NONE,
				storage: 'organization.data_apps_enabled',
				caveat: 'Turning this on removes the JavaScript row above — Data Apps supersede it.'
			},
			{
				key: 'feed',
				name: 'Feed',
				description: 'A shared space for posting and discussing analysis.',
				details: 'Enables the feed surface and its posting, commenting and engagement tools.',
				available: O('feedEnabled'),
				default: NONE,
				storage: 'organization.feed_enabled',
				caveat:
					'A false-to-true transition enqueues a one-time seeding job when the org has fewer than five posts.'
			},
			{
				key: 'observability',
				name: 'Observability',
				description: 'Surfaces the quality signals completed threads produce.',
				details:
					'Old is Observability alone: run history, cost and latency. New adds the issue tracker — execution errors, slow queries and possible inaccuracies are grouped into deduplicated issues that admins can assign, prioritize and resolve on a dedicated Issues page.',
				available: O('observabilityEnabled'),
				default: NONE,
				mode: {
					field: 'issuesEnabled',
					oldLabel: 'Observe',
					newLabel: 'Issues',
					note: 'Issues is the New experience of Observability, not a separate feature. It is organization.issues_enabled, and turning the Available switch off force-clears it.'
				},
				storage: 'organization.observability_enabled / .issues_enabled'
			},
			{
				key: 'notifications',
				name: 'Notifications',
				description: 'Delivers alerts about runs, mentions and schedules.',
				details: 'Enables the notifications surface and delivery.',
				available: O('notificationsEnabled'),
				default: NONE,
				storage: 'organization.notifications_enabled'
			},
			{
				key: 'trainingMode',
				name: 'Training Mode',
				description: 'Runs the org in training mode.',
				details: 'Changes agent behaviour for onboarding and evaluation.',
				available: O('trainingMode'),
				default: NONE,
				storage: 'organization.training_mode'
			},
			{
				key: 'exampleConnectors',
				name: 'Example Connectors',
				description: 'Shows sample connectors in the picker.',
				details: 'When off, demo connectors are hidden from the picker.',
				available: O('hideExampleConnectors', true),
				default: NONE,
				storage: 'organization.hide_example_connectors',
				caveat: 'Stored inverted as hide_example_connectors.'
			},
			{
				key: 'fastMode',
				name: 'Fast Mode',
				description: 'Lets members trade depth for speed.',
				details: 'Exposes the fast-mode switch in a thread.',
				available: O('fastModeEnabled'),
				default: NONE,
				storage: 'organization.fast_mode_enabled'
			},
			{
				key: 'maxThinking',
				name: 'Max Thinking',
				description: 'Lets members request maximum reasoning effort.',
				details: 'Exposes the max-thinking switch in a thread.',
				available: O('maxThinkingEnabled'),
				default: NONE,
				storage: 'organization.max_thinking_enabled'
			},
			{
				key: 'parallelTools',
				name: 'Parallel Tools',
				description: 'Lets the agent run several tools at once.',
				details: 'Allows concurrent tool calls instead of strictly sequential execution.',
				available: R('parallelToolsEnabled'),
				default: NONE,
				storage: 'organization.tool_restrictions',
				caveat:
					'Read live from the org at stream time. There is no per-thread field, so the org value is the only input — which is why it has no Default despite living in the tool layer.'
			},
			{
				key: 'sandboxes',
				name: 'Sandboxes',
				description: 'Shows the sandbox inspection page.',
				details: 'Adds the top-level Sandboxes item to the sidebar.',
				available: O('sandboxObservabilityEnabled'),
				default: NONE,
				storage: 'organization.sandbox_observability_enabled'
			},
			{
				key: 'spendTransparency',
				name: 'Spend Transparency',
				description: 'Shows members what their usage costs.',
				details: 'Surfaces spend data outside the admin surfaces.',
				available: O('spendTransparencyEnabled'),
				default: NONE,
				storage: 'organization.spend_transparency_enabled',
				caveat:
					'Deliberately not superadmin-gated on the server: it is an opt-in an org admin turns on for their own org.'
			},
			{
				key: 'forms',
				name: 'Forms',
				description: 'Lets the agent build interactive forms.',
				details: 'Registers the form editor so a thread can collect structured input.',
				available: R('formEditorEnabled'),
				cascadeDefault: 'formEditorEnabled',
				default: P('formEditorEnabled'),
				storage: TOOL_STORAGE,
				caveat:
					'Re-read live at stream time rather than only at thread creation, and separately gates the whole forms service.'
			},
			{
				key: 'questions',
				name: 'Questions',
				description: 'Lets the agent ask you structured clarifying questions.',
				details: 'Registers the questions cell so the agent can request input mid-thread.',
				available: R('questionsToolEnabled'),
				default: NONE,
				defaultNote:
					'Single-axis in the product; the tool is either available or not.',
				storage: TOOL_STORAGE,
				caveat:
					'Inverts the usual rule: the tool is granted if EITHER column is true, so Default can enable it even when Available is off.'
			}
		]
	}
];

export function mechanismOf(row: FeatureRow): Mechanism {
	return row.available.kind === 'restriction' || row.available.kind === 'paradigm'
		? 'tool-layer'
		: 'org-column';
}

export type CellState =
	| { kind: 'on' }
	| { kind: 'off' }
	| { kind: 'dash' }
	| { kind: 'value'; text: string }
	| { kind: 'unknown' };

/** Resolve one column against the live GetOrganizationSettings payload. */
export function readSource(
	source: Source,
	organization: Record<string, unknown> | undefined
): CellState {
	if (source.kind === 'none') return { kind: 'dash' };
	if (!organization) return { kind: 'unknown' };

	if (source.kind === 'restriction' || source.kind === 'paradigm') {
		const parent = organization[
			source.kind === 'restriction' ? 'toolRestrictions' : 'paradigmParams'
		] as Record<string, unknown> | undefined;
		if (!parent) return { kind: 'unknown' };
		// proto3 omits false, so an absent key is a real false.
		return parent[source.field] === true ? { kind: 'on' } : { kind: 'off' };
	}

	const invert = source.invert === true;
	const raw = organization[source.field];

	if (typeof raw === 'boolean') {
		return (invert ? !raw : raw) ? { kind: 'on' } : { kind: 'off' };
	}
	if (typeof raw === 'string' || typeof raw === 'number') {
		return { kind: 'value', text: String(raw) };
	}
	// Absent boolean: false, then inverted if the column is a "hide_*" flag.
	return invert ? { kind: 'on' } : { kind: 'off' };
}

/** Which side of an Old/New selector this org is on. */
export function readMode(
	mode: ModeDef,
	organization: Record<string, unknown> | undefined
): boolean | null {
	if (!organization) return null;
	return organization[mode.field] === true;
}

export function sourceLabel(source: Source): string {
	switch (source.kind) {
		case 'restriction':
			return `tool_restrictions.${source.field}`;
		case 'paradigm':
			return `paradigm_params.${source.field}`;
		case 'org':
			return `organization.${source.field}${source.invert ? ' (inverted)' : ''}`;
		case 'none':
			return 'no default — single-axis';
	}
}

/**
 * The organization columns @textql/sdk 1.4.21 can actually write. The features
 * page hides a switch it cannot save and the action rejects a field it cannot
 * write — both from this one list, so the two can't drift apart.
 */
export const SDK_ORG_FIELDS = new Set([
	'hideExampleConnectors',
	'trainingMode',
	'dashboardsEnabled',
	'methodologyEnabled',
	'feedEnabled',
	'observabilityEnabled',
	'notificationsEnabled',
	'fastModeEnabled',
	'maxThinkingEnabled',
	'tracesEnabled',
	'sandboxObservabilityEnabled',
	'dataAppsEnabled',
	'subagentsEnabled'
]);

/** Writable through the SDK: tool/paradigm maps always, org columns only if exposed. */
export function isSettable(source: Source): boolean {
	if (source.kind === 'none') return false;
	return source.kind !== 'org' || SDK_ORG_FIELDS.has(source.field);
}

const SOURCES_BY_KEY = new Map<string, Source>();
for (const group of FEATURE_GROUPS) {
	for (const row of group.rows) {
		for (const source of [row.available, row.default]) {
			if (source.kind !== 'none') SOURCES_BY_KEY.set(`${source.kind}:${source.field}`, source);
		}
	}
}

export function findSource(kind: string, field: string): Source | null {
	return SOURCES_BY_KEY.get(`${kind}:${field}`) ?? null;
}
