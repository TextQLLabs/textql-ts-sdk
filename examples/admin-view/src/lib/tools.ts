/**
 * The ParadigmParams tool layer.
 *
 * `paradigm_params` and `tool_restrictions` are the same proto message
 * (textql.rpc.paradigm_params.ParadigmParams) stored in two columns on the
 * organization row. Position is the entire semantic difference:
 *
 *   tool_restrictions  — ceiling.  may this tool be used at all?
 *   paradigm_params    — default.  is it on when a new chat opens?
 *
 * Source of truth for the behaviour encoded here:
 *   compute/pkg/chat/history/manager.go:481-521   applyRestrictions
 *   compute/pkg/chat/history/manager.go:89-92     admin bypass
 *   compute/pkg/db/auth.go:3364-3387              defaultParadigmParams
 */

/** How `tool_restrictions` combines with the chat's value for a field. */
export type CeilingMode =
	| 'and' // chat && restriction — the normal case
	| 'override' // restriction wins outright, in both directions
	| 'forced-on' // hard-set true, restriction discarded
	| 'or' // enabled by either org message
	| 'none'; // applyRestrictions never touches it

export interface ToolField {
	key: string;
	label: string;
	/** Stripped from the public API surface by google.api.visibility. */
	internal?: boolean;
	ceiling: CeilingMode;
	/** Re-read from the org at stream time rather than only at chat creation. */
	liveReRead?: boolean;
	/** Surfaces outside chat that read tool_restrictions directly, live. */
	nonChatGates?: string[];
	/** Value in defaultParadigmParams() — what a brand new org starts with. */
	defaultOn: boolean;
	note?: string;
}

/** Every field of ParadigmParams, in proto field-number order. */
export const TOOL_FIELDS: ToolField[] = [
	{
		key: 'webSearchEnabled',
		label: 'Web search',
		ceiling: 'and',
		defaultOn: true
	},
	{
		key: 'sqlEnabled',
		label: 'SQL',
		ceiling: 'and',
		nonChatGates: ['sandbox exec'],
		defaultOn: true
	},
	{
		key: 'ontologyEnabled',
		label: 'Ontology',
		ceiling: 'and',
		defaultOn: true,
		note: 'Also force-disabled at chat creation when no attached connector has an ontology.'
	},
	{
		key: 'ontologyEditingEnabled',
		label: 'Ontology editing',
		internal: true,
		ceiling: 'and',
		defaultOn: false
	},
	{
		key: 'pythonEnabled',
		label: 'Python',
		ceiling: 'forced-on',
		defaultOn: true,
		note: 'applyRestrictions hard-sets this true and the sandbox-exec gate always allows python. Setting it false in tool_restrictions is stored and then ignored everywhere.'
	},
	{
		key: 'powerbiEnabled',
		label: 'Power BI',
		ceiling: 'and',
		nonChatGates: ['datasets'],
		defaultOn: true
	},
	{
		key: 'googleDriveEnabled',
		label: 'Google Drive',
		ceiling: 'none',
		defaultOn: false,
		note: 'Named in the TODO at manager.go:516 as a restriction that was never wired up.'
	},
	{
		key: 'autoApproveEnabled',
		label: 'Auto approve',
		internal: true,
		ceiling: 'none',
		defaultOn: false,
		note: 'Named in the TODO at manager.go:516.'
	},
	{
		key: 'contextEditingEnabled',
		label: 'Context editing',
		internal: true,
		ceiling: 'none',
		defaultOn: false,
		note: 'Named in the TODO at manager.go:516.'
	},
	{
		key: 'formEditorEnabled',
		label: 'Form editor',
		ceiling: 'and',
		liveReRead: true,
		nonChatGates: ['forms service'],
		defaultOn: false
	},
	{
		key: 'tableauEnabled',
		label: 'Tableau',
		ceiling: 'none',
		nonChatGates: ['datasets'],
		defaultOn: true,
		note: 'Not masked at chat creation, but the datasets service does gate Tableau dataset creation on it.'
	},
	{
		key: 'fileUploadEnabled',
		label: 'File upload',
		ceiling: 'none',
		nonChatGates: ['datasets'],
		defaultOn: true
	},
	{
		key: 'multipleConnectorMode',
		label: 'Multiple connector mode',
		ceiling: 'none',
		defaultOn: true,
		note: 'Deprecated in the proto and force-set true on every write to tool_restrictions. Nothing reads it.'
	},
	{
		key: 'playbookToolsEnabled',
		label: 'Playbook tools',
		ceiling: 'override',
		liveReRead: true,
		defaultOn: true,
		note: 'The only field where the restriction replaces the chat value instead of ANDing with it, so the org can switch it back on as well as off. Re-stamped on every stream.'
	},
	{
		key: 'microsoft365Enabled',
		label: 'Microsoft 365',
		ceiling: 'none',
		defaultOn: false
	},
	{
		key: 'bashEnabled',
		label: 'Bash',
		ceiling: 'and',
		nonChatGates: ['sandbox exec'],
		defaultOn: false,
		note: 'Also has an unrelated bash_enabled column on the organization row that nothing enforces.'
	},
	{
		key: 'javascriptEnabled',
		label: 'JavaScript',
		ceiling: 'and',
		defaultOn: false
	},
	{
		key: 'modelSwitchingEnabled',
		label: 'Model switching',
		ceiling: 'none',
		defaultOn: true
	},
	{ key: 'feedExplorerEnabled', label: 'Feed explorer', ceiling: 'none', defaultOn: false },
	{ key: 'feedPostEnabled', label: 'Feed post', ceiling: 'none', defaultOn: false },
	{ key: 'feedCommentEnabled', label: 'Feed comment', ceiling: 'none', defaultOn: false },
	{ key: 'feedEngageEnabled', label: 'Feed engage', ceiling: 'none', defaultOn: false },
	{ key: 'compactionDisabled', label: 'Compaction disabled', ceiling: 'none', defaultOn: false },
	{ key: 'gmailEnabled', label: 'Gmail', ceiling: 'none', defaultOn: false },
	{
		key: 'chatHistorySearchEnabled',
		label: 'Chat history search',
		ceiling: 'and',
		defaultOn: true
	},
	{ key: 'googleCalendarEnabled', label: 'Google Calendar', ceiling: 'none', defaultOn: false },
	{
		key: 'parallelToolsEnabled',
		label: 'Parallel tools',
		ceiling: 'none',
		liveReRead: true,
		defaultOn: false,
		note: 'Read live from the org at stream time. There is no per-chat field, so the org value is the only input.'
	},
	{
		key: 'emailOutputEnabled',
		label: 'Email output',
		ceiling: 'and',
		defaultOn: true
	},
	{
		key: 'questionsToolEnabled',
		label: 'Questions tool',
		ceiling: 'or',
		liveReRead: true,
		defaultOn: false,
		note: 'Inverts the model: paradigm_params.X OR tool_restrictions.X. Setting it in the defaults message grants the tool regardless of the ceiling.'
	}
];

/** Non-boolean members of the message — config payloads, not toggles. */
export const TOOL_PAYLOAD_FIELDS = [
	{ key: 'powerbiSelections', type: 'PowerBISelection[]', note: 'Workspace / report / dataset scoping.' },
	{ key: 'datasetId', type: 'string | null', note: 'Tableau collection UUID.' }
];

export interface ResolveInput {
	ceiling: boolean;
	orgDefault: boolean;
	memberOverride: boolean | null;
	isAdmin: boolean;
}

export interface ResolveResult {
	/** What lands in chat.paradigm_options at creation. */
	enabled: boolean;
	/** The default that fed into the mask, after the member override. */
	seed: boolean;
	steps: { label: string; detail: string; value: boolean }[];
}

/**
 * Mirrors the chat-creation pipeline for one field. Deliberately models the
 * admin bypass and the four ceiling modes rather than a plain AND, because
 * those are the parts people get wrong.
 */
export function resolveTool(field: ToolField, input: ResolveInput): ResolveResult {
	const steps: ResolveResult['steps'] = [];

	const seed = input.memberOverride ?? input.orgDefault;
	steps.push({
		label: input.memberOverride === null ? 'org default' : 'member override',
		detail:
			input.memberOverride === null
				? 'member_meta.paradigm_params is null, so org.paradigm_params seeds the chat'
				: 'member_meta.paradigm_params replaces the org default wholesale — not a field merge',
		value: seed
	});

	if (input.isAdmin) {
		steps.push({
			label: 'admin bypass',
			detail: 'shouldApplyToolRestrictions returns false for admins, so the mask never runs',
			value: seed
		});
		return { enabled: seed, seed, steps };
	}

	let enabled: boolean;
	switch (field.ceiling) {
		case 'and':
			enabled = seed && input.ceiling;
			steps.push({
				label: 'AND ceiling',
				detail: `${seed} && ${input.ceiling}`,
				value: enabled
			});
			break;
		case 'override':
			enabled = input.ceiling;
			steps.push({
				label: 'override',
				detail: 'the restriction replaces the seed outright',
				value: enabled
			});
			break;
		case 'forced-on':
			enabled = true;
			steps.push({
				label: 'forced on',
				detail: 'hard-set true; the ceiling value is discarded',
				value: enabled
			});
			break;
		case 'or':
			enabled = seed || input.ceiling;
			steps.push({
				label: 'OR of both org messages',
				detail: `${seed} || ${input.ceiling}`,
				value: enabled
			});
			break;
		case 'none':
			enabled = seed;
			steps.push({
				label: 'not masked',
				detail: 'applyRestrictions never touches this field — the ceiling is inert',
				value: enabled
			});
			break;
	}

	return { enabled, seed, steps };
}

export const CEILING_LABELS: Record<CeilingMode, string> = {
	and: 'AND',
	override: 'Override',
	'forced-on': 'Forced on',
	or: 'OR',
	none: 'Inert'
};
