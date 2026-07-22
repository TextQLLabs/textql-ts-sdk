import {
	asRecords as recs,
	asString as str,
	asStrings as strs,
	getCellCase,
	getCellPayload,
	isCellFinished,
	titleCaseSnake,
	type CellLike
} from '$lib/cells';
import { isRecord } from '$lib/utils';

export type Block =
	| { kind: 'text'; label?: string; text: string }
	| { kind: 'md'; label?: string; text: string }
	| { kind: 'code'; label?: string; text: string; lang?: string }
	| { kind: 'kv'; rows: { label: string; value: string }[] }
	| { kind: 'link'; label: string; href: string }
	| { kind: 'image'; url: string; alt?: string }
	| { kind: 'list'; label?: string; items: { title: string; subtitle?: string; href?: string }[] };

function num(value: unknown): string {
	if (typeof value === 'number') return String(value);
	if (typeof value === 'string' && value !== '') return value;
	return '';
}

/** Finished wall-clock only — never surface placeholder 0 ms while executing. */
function formatExecTimeMs(value: unknown): string {
	const n =
		typeof value === 'number'
			? value
			: typeof value === 'string' && value !== ''
				? Number(value)
				: NaN;
	if (!Number.isFinite(n) || n <= 0) return '';
	return `${n} ms`;
}

function humanizeEnum(value: unknown): string {
	const text = str(value);
	if (!/^[A-Z][A-Z0-9_]*$/.test(text)) return text;
	return titleCaseSnake(text.toLowerCase());
}

function prettyJson(value: unknown): string {
	if (typeof value === 'string') {
		try {
			return JSON.stringify(JSON.parse(value), null, 2);
		} catch {
			return value;
		}
	}
	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return String(value);
	}
}

type BlockBuilder = (p: Record<string, unknown>, blocks: Block[]) => void;

function kv(blocks: Block[], rows: [string, string][]) {
	const filled = rows.filter(([, value]) => value !== '');
	if (filled.length > 0) {
		blocks.push({ kind: 'kv', rows: filled.map(([label, value]) => ({ label, value })) });
	}
}

function text(blocks: Block[], label: string, value: unknown) {
	if (str(value)) blocks.push({ kind: 'text', label: label || undefined, text: str(value) });
}

/** Markdown-rendered prose (LLM-written content, answers, summaries). */
function md(blocks: Block[], label: string, value: unknown) {
	if (str(value)) blocks.push({ kind: 'md', label: label || undefined, text: str(value) });
}

function code(blocks: Block[], label: string, value: unknown, lang?: string) {
	if (str(value)) blocks.push({ kind: 'code', label: label || undefined, text: str(value), lang });
}

function link(blocks: Block[], label: string, href: unknown) {
	if (str(href)) blocks.push({ kind: 'link', label, href: str(href) });
}

function list(
	blocks: Block[],
	label: string,
	items: { title: string; subtitle?: string; href?: string }[]
) {
	if (items.length > 0) blocks.push({ kind: 'list', label, items });
}

function image(blocks: Block[], url: unknown, alt?: string) {
	if (str(url)) blocks.push({ kind: 'image', url: str(url), alt });
}

function authNote(blocks: Block[], p: Record<string, unknown>) {
	if (p.authRequired === true && p.authCompleted !== true) {
		text(blocks, 'Auth', `Authentication required for ${str(p.authConnectorName) || str(p.authProviderName) || 'this connector'} — approve it in the TextQL app.`);
	}
}

function imageRefs(blocks: Block[], value: unknown) {
	for (const ref of recs(value)) image(blocks, ref.url, str(ref.name));
}

function fileRefs(blocks: Block[], value: unknown) {
	const items = recs(value)
		.filter((ref) => str(ref.url))
		.map((ref) => ({ title: str(ref.name) || 'file', href: str(ref.url) }));
	list(blocks, 'Files', items);
}

function exaResults(blocks: Block[], value: unknown) {
	const items = recs(value).map((result) => ({
		title: str(result.title) || str(result.url) || 'result',
		subtitle: str(result.summary) || undefined,
		href: str(result.url) || undefined
	}));
	list(blocks, 'Results', items);
}

function fieldChanges(blocks: Block[], value: unknown) {
	const items = recs(value).map((change) => ({
		title: str(change.fieldName),
		subtitle: `${str(change.oldValue)} → ${str(change.newValue)}`
	}));
	list(blocks, 'Changes', items);
}

function messageBlocks(blocks: Block[], value: unknown) {
	for (const block of recs(value)) {
		text(blocks, '', block.content);
		if (str(block.imageBase64)) {
			image(blocks, `data:image/png;base64,${str(block.imageBase64)}`);
		}
	}
}

const BUILDERS: Record<string, BlockBuilder> = {
	// ── Text / answer ────────────────────────────────────────────────────
	mdCell: (p, b) => {
		md(b, '', p.content);
	},
	ansCell: (p, b) => {
		md(b, '', p.content);
		imageRefs(b, p.images);
	},
	summaryCell: (p, b) => {
		md(b, '', p.summary);
	},
	statusCell: (p, b) => {
		text(b, '', p.status);
	},
	thinkingCell: (p, b) => {
		if (p.redacted === true) text(b, '', 'Thinking (redacted)');
		else md(b, '', p.content);
	},
	compactionCell: (p, b) => {
		kv(b, [['Executed Python', p.executedPython === true ? 'yes' : '']]);
		md(b, '', p.content);
	},

	// ── Query tools ──────────────────────────────────────────────────────
	sqlCell: (p, b) => {
		authNote(b, p);
		// Time is appended in buildCellBlocks only after the cell finishes.
		kv(b, [
			['Connector', num(p.connectorId)],
			['Agent memory', p.agentMemory === true ? 'yes' : '']
		]);
		code(b, 'Query', p.query, 'sql');
		code(b, 'Result', p.dataframePreview);
	},
	tableauSqlCell: (p, b) => {
		kv(b, [['Datasource', str(p.tableauDatasourceLuid)]]);
		code(b, 'Query', p.query, 'sql');
		code(b, 'Result', p.dataframePreview);
	},
	powerbiDaxCell: (p, b) => {
		authNote(b, p);
		kv(b, [['Dataset', str(p.datasetId)]]);
		code(b, 'DAX', p.daxQuery, 'sql');
		code(b, 'Result', p.dataframePreview);
	},
	metricsCell: (p, b) => {
		kv(b, [
			['Dataset', str(p.dataset)],
			['Ontology', num(p.ontologyId)]
		]);
		code(b, 'Query', p.query);
		code(b, 'Generated SQL', p.generatedSql, 'sql');
		code(b, 'Result', p.dataframePreview);
		text(b, 'Error', p.errorMessage);
	},
	ontologyQueryCell: (p, b) => {
		authNote(b, p);
		kv(b, [
			['Action', str(p.action)],
			['Path', str(p.path)],
			['Connector', num(p.usedConnectorId) || num(p.connectorId)]
		]);
		if (str(p.paramsJson) && str(p.paramsJson) !== '{}') {
			code(b, 'Params', prettyJson(p.paramsJson), 'json');
		}
		code(b, 'SQL', p.sql, 'sql');
		code(b, 'Result', p.dataframePreview);
	},
	ontologySearchMetricsCell: (p, b) => {
		kv(b, [
			['Query', str(p.query)],
			['Matches', num(p.matchCount)],
			['Returned', num(p.returnedCount)]
		]);
		const items = recs(p.matches).map((match) => ({
			title: `${str(match.objectName)}.${str(match.metricName)}`,
			subtitle: str(match.metricDescription) || undefined
		}));
		list(b, 'Matches', items);
	},
	ontologyOpenObjectCell: (p, b) => {
		kv(b, [
			['Requested', str(p.requestedObject)],
			['Object', str(p.objectName)],
			['Dimensions', num(p.dimensionCount)],
			['Metrics', num(p.metricCount)]
		]);
		text(b, '', p.objectDescription);
		const dims = recs(p.dimensions).map((dim) => ({
			title: str(dim.dimensionName),
			subtitle: str(dim.dimensionDescription) || str(dim.dimensionType) || undefined
		}));
		list(b, 'Dimensions', dims);
		const metrics = recs(p.metrics).map((metric) => ({
			title: str(metric.metricName),
			subtitle: str(metric.metricDescription) || undefined
		}));
		list(b, 'Metrics', metrics);
	},

	// ── Code execution ───────────────────────────────────────────────────
	pyCell: (p, b) => {
		authNote(b, p);
		code(b, 'Code', p.code, 'python');
		const output = strs(p.output).join('\n');
		code(b, 'Output', output);
		const preview = strs(p.dataframePreview).join('\n\n');
		code(b, 'Dataframes', preview);
		imageRefs(b, p.images);
		for (const chart of recs(p.charts)) {
			image(b, str(chart.pngUrl) || str(chart.url), str(chart.title));
		}
		fileRefs(b, p.files);
	},
	javascriptCell: (p, b) => {
		kv(b, [['Title', str(p.title)]]);
		code(b, 'Code', p.code, 'javascript');
		code(b, 'Output', p.stdout);
		imageRefs(b, p.images);
		fileRefs(b, p.files);
	},
	bashCell: (p, b) => {
		code(b, 'Script', p.script, 'bash');
		code(b, 'Stdout', p.stdout);
		code(b, 'Stderr', p.stderr);
		const exitCode = num(p.exitCode);
		if (exitCode && exitCode !== '0') kv(b, [['Exit code', exitCode]]);
	},

	// ── Search tools ─────────────────────────────────────────────────────
	wsCell: (p, b) => {
		kv(b, [
			['Query', str(p.query)],
			['Type', humanizeEnum(p.searchType)]
		]);
		md(b, 'Answer', p.answer);
		exaResults(b, p.exaResults);
	},
	linkedinSearchCell: (p, b) => {
		kv(b, [['Query', str(p.query)]]);
		exaResults(b, p.exaResults);
	},
	tableauSearchFieldsCell: (p, b) => {
		kv(b, [['Search', str(p.searchTerm)]]);
		code(b, 'Result', p.resultText);
	},

	// ── MCP / skills ─────────────────────────────────────────────────────
	mcpToolCell: (p, b) => {
		// Time is appended in buildCellBlocks only after the cell finishes.
		kv(b, [
			['Server', str(p.serverName)],
			['Tool', str(p.toolName)]
		]);
		if (str(p.argumentsJson) && str(p.argumentsJson) !== '{}') {
			code(b, 'Arguments', prettyJson(p.argumentsJson), 'json');
		}
		if (str(p.errorMessage)) text(b, 'Error', p.errorMessage);
		else code(b, 'Result', str(p.contentJson) ? prettyJson(p.contentJson) : '', 'json');
	},
	useSkillCell: (p, b) => {
		kv(b, [
			['Skill', str(p.trigger) ? `/${str(p.trigger).replace(/^\//, '')}` : ''],
			['Name', str(p.name)],
			['Loaded', p.ok === false ? 'no' : 'yes']
		]);
	},

	// ── Apps / dashboards / reports ──────────────────────────────────────
	streamlitCell: (p, b) => {
		text(b, 'Error', p.errorMessage);
		link(b, 'Open app', p.url);
		image(b, p.screenshotUrl, 'App screenshot');
		code(b, 'Code', p.code, 'python');
	},
	dashboardCell: (p, b) => {
		kv(b, [
			['Dashboard', str(p.name)],
			['Action', humanizeEnum(p.action)],
			['Type', str(p.type)]
		]);
		text(b, 'Error', p.errorMessage);
		image(b, p.screenshotUrl, 'Dashboard screenshot');
		code(b, 'Code', p.code, 'python');
	},
	appCell: (p, b) => {
		kv(b, [
			['App', str(p.name)],
			['Action', str(p.action)],
			['Build', num(p.buildLineCount) ? `${num(p.buildLineCount)} lines / ${num(p.buildFileCount)} files` : '']
		]);
		text(b, 'Error', p.errorMessage);
		image(b, p.screenshotUrl, 'App screenshot');
	},
	reportCell: (p, b) => {
		kv(b, [['Subject', str(p.subject)]]);
		md(b, '', p.summary);
	},
	reportHistoryCell: (p, b) => {
		kv(b, [['Total', num(p.totalCount)]]);
		const items = recs(p.reports).map((report) => ({
			title: str(report.subject) || 'report',
			subtitle: str(report.summary) || undefined
		}));
		list(b, 'Reports', items);
		text(b, 'Error', p.errorMessage);
	},
	previewCell: (p, b) => {
		kv(b, [
			['Name', str(p.name)],
			['Type', str(p.previewType)]
		]);
		text(b, 'Error', p.error);
		if (str(p.previewType) === 'image') image(b, p.url, str(p.name));
		else link(b, 'Open preview', p.url);
		code(b, '', p.content);
	},

	// ── Files / media ────────────────────────────────────────────────────
	imageCell: (p, b) => {
		image(b, p.url, str(p.altText) || str(p.name));
		text(b, '', p.caption);
	},
	textCell: (p, b) => {
		kv(b, [
			['File', str(p.fileName)],
			['Lines', num(p.lineCount)]
		]);
		code(b, '', p.content);
	},
	documentCell: (p, b) => {
		kv(b, [
			['Document', str(p.name)],
			['Pages', num(p.pageCount)]
		]);
		link(b, 'Open document', p.url);
		text(b, 'Preview', p.preview);
	},
	tabularFileCell: (p, b) => {
		kv(b, [['File', str(p.fileName)]]);
		const items = recs(p.dataframes).map((frame) => ({
			title: str(frame.name) || 'dataframe'
		}));
		list(b, 'Dataframes', items);
	},

	// ── Tableau / PowerBI ────────────────────────────────────────────────
	tableauCell: (p, b) => {
		kv(b, [['Dataset', str(p.datasetId)]]);
		messageBlocks(b, p.messageBlocks);
	},
	powerbiCell: (p, b) => {
		kv(b, [['Dataset', str(p.datasetId)]]);
		messageBlocks(b, p.messageBlocks);
	},

	// ── Google / Microsoft integrations ──────────────────────────────────
	googleDriveSearchCell: (p, b) => {
		kv(b, [['Files found', num(p.fileCount)]]);
		const items = recs(p.files).map((file) => ({
			title: str(file.name) || 'file',
			subtitle: str(file.mimeType) || undefined,
			href: str(file.webViewLink) || undefined
		}));
		list(b, 'Files', items);
		code(b, 'Preview', p.dataframePreview);
		text(b, 'Error', p.errorMessage);
	},
	googleDriveContentCell: (p, b) => {
		kv(b, [
			['File', str(p.fileName)],
			['Type', str(p.contentType)]
		]);
		code(b, '', p.content);
		text(b, 'Error', p.errorMessage);
	},
	googleCalendarSearchCell: (p, b) => {
		kv(b, [['Events', num(p.eventCount)]]);
		md(b, '', p.eventSummary);
	},
	gmailEmailSearchCell: (p, b) => {
		kv(b, [['Emails', num(p.emailCount)]]);
		md(b, '', p.emailSummary);
	},
	gmailEmailContentCell: (p, b) => {
		kv(b, [
			['Subject', str(p.subject)],
			['From', str(p.sender)]
		]);
	},
	microsoft365EmailSearchCell: (p, b) => {
		kv(b, [['Emails', num(p.emailCount)]]);
		text(b, '', p.emailSummary);
	},
	microsoft365EmailContentCell: (p, b) => {
		kv(b, [
			['Subject', str(p.subject)],
			['From', str(p.sender)]
		]);
	},
	microsoft365CalendarCell: (p, b) => {
		kv(b, [['Events', num(p.eventCount)]]);
		text(b, '', p.eventSummary);
	},

	// ── Email ────────────────────────────────────────────────────────────
	emailCell: (p, b) => {
		kv(b, [
			['To', strs(p.to).join(', ')],
			['Subject', str(p.subject)],
			['Status', str(p.status)],
			['Sent at', str(p.sentAt)],
			['Sent count', num(p.sentCount)]
		]);
		text(b, 'Error', p.errorMessage);
		md(b, '', p.body);
	},

	// ── Editors / config ─────────────────────────────────────────────────
	contextPromptEditorCell: (p, b) => {
		kv(b, [
			['Action', humanizeEnum(p.action)],
			['Status', humanizeEnum(p.status)]
		]);
		code(b, 'Diff', p.diff, 'diff');
		md(b, 'Proposed', p.proposedContext);
		text(b, 'Error', p.errorMessage);
	},
	ontologyEditorCell: (p, b) => {
		kv(b, [
			['Action', humanizeEnum(p.action)],
			['Operation', humanizeEnum(p.operation)],
			['Status', humanizeEnum(p.status)],
			['Items', num(p.listCount)]
		]);
		for (const key of [
			'createdObject',
			'updatedObject',
			'deletedObject',
			'createdAttribute',
			'updatedAttribute',
			'deletedAttribute',
			'createdLink',
			'updatedLink',
			'deletedLink',
			'createdMetric',
			'updatedMetric',
			'deletedMetric'
		]) {
			if (isRecord(p[key])) {
				const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
				code(b, label, prettyJson(p[key]), 'json');
			}
		}
	},
	playbookEditorCell: (p, b) => {
		kv(b, [
			['Action', humanizeEnum(p.action)],
			['Total', num(p.totalCount)]
		]);
		const items = recs(p.playbooks).map((playbook) => ({
			title: str(playbook.name) || 'playbook',
			subtitle: str(playbook.cronString) || undefined
		}));
		list(b, 'Playbooks', items);
		fieldChanges(b, p.fieldChanges);
		text(b, 'Error', p.errorMessage);
	},
	formEditorCell: (p, b) => {
		const form = isRecord(p.form) ? p.form : isRecord(p.formSnapshot) ? p.formSnapshot : null;
		kv(b, [
			['Action', humanizeEnum(p.action)],
			['Form', form ? str(form.formName) : ''],
			['Status', form ? humanizeEnum(form.status) : '']
		]);
		if (form && isRecord(form.fields)) code(b, 'Fields', prettyJson(form.fields), 'json');
	},
	formCell: (p, b) => {
		kv(b, [
			['Form', str(p.name)],
			['Action', str(p.action)],
			['Type', str(p.formType)],
			['Status', str(p.status)],
			['Test', str(p.testStatus)],
			['Outcome', str(p.approvalOutcome)]
		]);
		text(b, '', p.testMessage);
	},
	questionsCell: (p, b) => {
		kv(b, [
			['Status', humanizeEnum(p.status)],
			['Answered', num(p.answeredCount)]
		]);
		const answers = recs(p.answers);
		const items = recs(p.questions).map((question, index) => {
			const answer = answers[index];
			const selected = answer ? strs(answer.selected).join(', ') : '';
			const inputs = answer ? strs(answer.inputs).filter(Boolean).join(', ') : '';
			return {
				title: str(question.question),
				subtitle: selected || inputs || undefined
			};
		});
		list(b, 'Questions', items);
	},
	connectorsCell: (p, b) => {
		kv(b, [
			['Action', str(p.action)],
			['Connectors', num(p.totalCount)]
		]);
	},
	patchCell: (p, b) => {
		kv(b, [
			['Patch', str(p.title)],
			['Number', num(p.number)],
			['Status', humanizeEnum(p.status)],
			['Conflicts', p.hasConflicts === true ? 'yes' : '']
		]);
		md(b, '', p.description);
		for (const diff of recs(p.diffs)) {
			code(b, str(diff.path) || 'Diff', str(diff.diff) || prettyJson(diff), 'diff');
		}
	},

	// ── Lists ────────────────────────────────────────────────────────────
	listDashboardsCell: (p, b) => {
		kv(b, [
			['Search', str(p.searchTerm)],
			['Total', num(p.totalCount)]
		]);
		const items = recs(p.dashboards).map((dashboard) => ({
			title: str(dashboard.name) || 'dashboard',
			subtitle: str(dashboard.status) || undefined
		}));
		list(b, 'Dashboards', items);
		text(b, 'Error', p.errorMessage);
	},
	listAppsCell: (p, b) => {
		kv(b, [
			['Search', str(p.searchTerm)],
			['Total', num(p.totalCount)]
		]);
		const items = recs(p.apps).map((app) => ({
			title: str(app.name) || 'app',
			subtitle: str(app.status) || undefined
		}));
		list(b, 'Apps', items);
		text(b, 'Error', p.errorMessage);
	},
	listUsersCell: (p, b) => {
		kv(b, [
			['Search', str(p.searchTerm)],
			['Type', str(p.userType)],
			['Total', num(p.totalCount)]
		]);
		const items = recs(p.agents).map((agent) => ({
			title: str(agent.name) || 'user',
			subtitle: str(agent.email) || str(agent.type) || undefined
		}));
		list(b, 'Users', items);
		text(b, 'Error', p.errorMessage);
	},

	// ── Feed ─────────────────────────────────────────────────────────────
	feedExplorerCell: (p, b) => {
		kv(b, [
			['Operation', str(p.operation)],
			['Post', str(p.postId)],
			['Filter', str(p.filter)]
		]);
		code(b, 'Result', str(p.result) ? prettyJson(p.result) : '', 'json');
		text(b, 'Error', p.error);
	},
	feedPostCell: (p, b) => {
		kv(b, [['Title', str(p.title)]]);
		md(b, '', p.content);
		for (const url of strs(p.imageUrls)) image(b, url);
		link(b, 'View post', p.postUrl);
		text(b, 'Error', p.error);
	},
	feedCommentCell: (p, b) => {
		kv(b, [['On post', str(p.postTitle)]]);
		md(b, '', p.content);
		link(b, 'View comment', p.commentUrl);
		text(b, 'Error', p.error);
	},
	feedEngageCell: (p, b) => {
		kv(b, [
			['Vote', str(p.voteType)],
			['On', str(p.thingTitle)],
			['Upvotes', num(p.upvoteCount)],
			['Downvotes', num(p.downvoteCount)]
		]);
		link(b, 'View', p.url);
		text(b, 'Error', p.error);
	},
	feedCreateCell: (p, b) => {
		const agent = isRecord(p.agent) ? p.agent : null;
		kv(b, [
			['Action', humanizeEnum(p.action)],
			['Agent', agent ? str(agent.name) : ''],
			['Active', agent && agent.isActive === true ? 'yes' : '']
		]);
		if (agent) md(b, 'Prompt', agent.prompt);
		fieldChanges(b, p.fieldChanges);
		text(b, 'Error', p.errorMessage);
	}
};

export function buildCellBlocks(cell: CellLike): Block[] {
	const cellCase = getCellCase(cell);
	const payload = getCellPayload(cell);
	const blocks: Block[] = [];

	const builder = cellCase ? BUILDERS[cellCase] : undefined;
	if (builder) {
		builder(payload, blocks);
	} else {
		// Unknown / future cell types: show the raw payload rather than nothing.
		const json = prettyJson(payload);
		if (json && json !== '{}') blocks.push({ kind: 'code', text: json });
	}

	// Only finished cells get a final duration — never 0/missing while running.
	const time = isCellFinished(cell)
		? formatExecTimeMs(payload.executionTimeMs ?? cell.durationMs)
		: '';
	if (time) {
		const firstKv = blocks.find((block) => block.kind === 'kv');
		if (firstKv && firstKv.kind === 'kv') {
			firstKv.rows.push({ label: 'Time', value: time });
		} else {
			blocks.unshift({ kind: 'kv', rows: [{ label: 'Time', value: time }] });
		}
	}

	return blocks;
}
