import { isRecord } from '../../src/lib/utils';
import { json } from '../kit';
import type { RequestHandler, RouteHandlers } from '../kit';
import { isConnectError, proxyError, textqlClients, toIsoString } from '../textql';
import {
	TextqlRpcPublicChatLlmModel,
	type TextqlRpcPublicAgentAgent,
	type TextqlRpcPublicAgentAgentRun,
	type TextqlRpcPublicChatEgressCall,
	type TextqlRpcPublicAgentAgentRunToolCall
} from '@textql/sdk/models';

const LLM_MODELS = new Set<string>(Object.values(TextqlRpcPublicChatLlmModel));

// ─── /api/agents ────────────────────────────────────────────────────────────

function toListItem(agent: TextqlRpcPublicAgentAgent) {
	if (typeof agent.id !== 'string') return null;
	return {
		id: agent.id,
		name: agent.name?.trim() || 'Untitled agent',
		prompt: typeof agent.prompt === 'string' ? agent.prompt : '',
		isActive: agent.isActive === true,
		profileImageUrl:
			typeof agent.profileImageUrl === 'string' ? agent.profileImageUrl.trim() || null : null,
		ownerName: typeof agent.memberName === 'string' ? agent.memberName.trim() || null : null,
		llmModel: typeof agent.llmModel === 'string' ? agent.llmModel : null,
		schedules: Array.isArray(agent.postingFrequencyCrons) ? agent.postingFrequencyCrons : [],
		lastPostAt: toIsoString(agent.lastPostAt)
	};
}

const listAgents: RequestHandler = async () => {
	const { client } = textqlClients();

	try {
		const result = await client.agents.list({ body: { includeInactive: true } });

		if (isConnectError(result)) {
			return json({ error: result.message ?? 'Unable to list agents.' }, { status: 502 });
		}

		const agents = Array.isArray(result.agents) ? result.agents : [];
		return json({ agents: agents.map(toListItem).filter((item) => item !== null) });
	} catch (error) {
		return proxyError('Agent list request', error);
	}
};

export const agentsRoute: RouteHandlers = { GET: listAgents };

// ─── /api/agents/[id] ───────────────────────────────────────────────────────

function serializeAgent(agent: TextqlRpcPublicAgentAgent) {
	return {
		id: agent.id,
		name: agent.name?.trim() || 'Untitled agent',
		prompt: typeof agent.prompt === 'string' ? agent.prompt : '',
		isActive: agent.isActive === true,
		profileImageUrl:
			typeof agent.profileImageUrl === 'string' ? agent.profileImageUrl.trim() || null : null,
		ownerName: typeof agent.memberName === 'string' ? agent.memberName.trim() || null : null,
		llmModel: typeof agent.llmModel === 'string' ? agent.llmModel : null,
		webhookTriggerId:
			typeof agent.webhookTriggerId === 'string' ? agent.webhookTriggerId.trim() || null : null,
		schedules: Array.isArray(agent.postingFrequencyCrons)
			? agent.postingFrequencyCrons.filter((cron): cron is string => typeof cron === 'string')
			: [],
		lastPostAt: toIsoString(agent.lastPostAt),
		lastChatId: typeof agent.lastChatId === 'string' ? agent.lastChatId.trim() || null : null,
		postCount: typeof agent.postCount === 'number' ? agent.postCount : 0,
		commentCount: typeof agent.commentCount === 'number' ? agent.commentCount : 0,
		voteCount: typeof agent.voteCount === 'number' ? agent.voteCount : 0
	};
}

function serializeRun(run: TextqlRpcPublicAgentAgentRun) {
	if (typeof run.id !== 'string') return null;
	return {
		id: run.id,
		status: typeof run.status === 'string' ? run.status : 'STATUS_UNKNOWN',
		triggerSource: typeof run.triggerSource === 'string' ? run.triggerSource : null,
		chatId: typeof run.chatId === 'string' ? run.chatId.trim() || null : null,
		toolCallsCount: typeof run.toolCallsCount === 'number' ? run.toolCallsCount : 0,
		lastSummary: typeof run.lastSummary === 'string' ? run.lastSummary.trim() || null : null,
		errorKind: typeof run.errorKind === 'string' ? run.errorKind.trim() || null : null,
		errorMessage: typeof run.errorMessage === 'string' ? run.errorMessage.trim() || null : null,
		createdAt: toIsoString(run.createdAt),
		startedAt: toIsoString(run.startedAt),
		finishedAt: toIsoString(run.finishedAt)
	};
}

const getAgent: RequestHandler = async ({ params }) => {
	const { client } = textqlClients();

	try {
		const [agentResult, runsResult] = await Promise.all([
			client.agents.getAgent({ body: { agentId: params.id } }),
			client.agents.listRuns({ body: { agentId: params.id, limit: 100 } })
		]);

		if (isConnectError(agentResult)) {
			return json({ error: agentResult.message ?? 'Agent not found.' }, { status: 404 });
		}
		if (!agentResult.agent || typeof agentResult.agent.id !== 'string') {
			return json({ error: 'Agent not found.' }, { status: 404 });
		}

		// A failed run lookup shouldn't hide the agent — degrade to an empty list.
		const runs =
			!isConnectError(runsResult) && Array.isArray(runsResult.runs)
				? runsResult.runs.map(serializeRun).filter((run) => run !== null)
				: [];

		return json({ agent: serializeAgent(agentResult.agent), runs });
	} catch (error) {
		return proxyError('Agent request', error);
	}
};

const updateAgent: RequestHandler = async ({ params, request }) => {
	const { client } = textqlClients();

	try {
		const body: unknown = await request.json();
		if (!isRecord(body)) {
			return json({ error: 'Invalid request body.' }, { status: 400 });
		}

		const name = typeof body.name === 'string' ? body.name.trim() : '';
		const prompt = typeof body.prompt === 'string' ? body.prompt : '';
		const isActive = body.isActive === true;
		const llmModel =
			typeof body.llmModel === 'string' && LLM_MODELS.has(body.llmModel)
				? (body.llmModel as TextqlRpcPublicChatLlmModel)
				: undefined;
		const postingFrequencyCrons = Array.isArray(body.schedules)
			? body.schedules.filter(
					(cron): cron is string => typeof cron === 'string' && cron.trim().length > 0
				)
			: [];

		const result = await client.agents.update({
			body: {
				agentId: params.id,
				name: name || 'Untitled agent',
				prompt,
				isActive,
				llmModel,
				postingFrequencyCrons
			}
		});

		if (isConnectError(result)) {
			return json({ error: result.message ?? 'Unable to update agent.' }, { status: 502 });
		}
		if (!result.agent || typeof result.agent.id !== 'string') {
			return json({ error: 'Update returned no agent.' }, { status: 502 });
		}

		return json({ agent: serializeAgent(result.agent) });
	} catch (error) {
		return proxyError('Agent update request', error);
	}
};

export const agentDetailRoute: RouteHandlers = { GET: getAgent, PUT: updateAgent };

// ─── /api/agents/[id]/run/[runId] ───────────────────────────────────────────

function num(value: number | string | undefined): number {
	if (typeof value === 'number') return value;
	if (typeof value === 'string') {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : 0;
	}
	return 0;
}

function serializeStep(step: TextqlRpcPublicAgentAgentRunToolCall) {
	return {
		tool: typeof step.tool === 'string' ? step.tool : 'tool',
		summary: typeof step.summary === 'string' ? step.summary.trim() || null : null,
		error: typeof step.error === 'string' ? step.error.trim() || null : null,
		cellId: typeof step.cellId === 'string' ? step.cellId : null,
		durationMs: num(step.durationMs),
		startedAtMs: num(step.startedAtMs)
	};
}

function serializeEgress(call: TextqlRpcPublicChatEgressCall) {
	return {
		id: typeof call.id === 'string' ? call.id : '',
		method: typeof call.method === 'string' ? call.method : 'GET',
		scheme: typeof call.scheme === 'string' ? call.scheme : 'https',
		host: typeof call.host === 'string' ? call.host : '',
		path: typeof call.path === 'string' ? call.path : '',
		statusCode: typeof call.statusCode === 'number' ? call.statusCode : 0,
		outcome: typeof call.outcome === 'string' ? call.outcome : 'ok',
		durationMs: num(call.durationMs),
		requestBytes: num(call.requestBytes),
		responseBytes: num(call.responseBytes),
		cellId: typeof call.cellId === 'string' ? call.cellId : null,
		occurredAt: toIsoString(call.occurredAt)
	};
}

function serializeRunDetail(run: TextqlRpcPublicAgentAgentRun) {
	const geo = run.triggerMetadata?.geo;
	return {
		id: run.id ?? '',
		status: typeof run.status === 'string' ? run.status : 'STATUS_UNKNOWN',
		triggerSource: typeof run.triggerSource === 'string' ? run.triggerSource : null,
		chatId: typeof run.chatId === 'string' ? run.chatId.trim() || null : null,
		toolCallsCount: typeof run.toolCallsCount === 'number' ? run.toolCallsCount : 0,
		lastSummary: typeof run.lastSummary === 'string' ? run.lastSummary.trim() || null : null,
		errorKind: typeof run.errorKind === 'string' ? run.errorKind.trim() || null : null,
		errorMessage: typeof run.errorMessage === 'string' ? run.errorMessage.trim() || null : null,
		createdAt: toIsoString(run.createdAt),
		startedAt: toIsoString(run.startedAt),
		finishedAt: toIsoString(run.finishedAt),
		steps: Array.isArray(run.toolsSummary?.details)
			? run.toolsSummary.details.map(serializeStep)
			: [],
		// Egress arrives newest-first; the waterfall reads chronologically.
		egress: Array.isArray(run.egressSummary?.calls)
			? [...run.egressSummary.calls].reverse().map(serializeEgress)
			: [],
		egressOutcomeCounts: run.egressSummary?.outcomeCounts ?? {},
		trigger: run.triggerMetadata
			? {
					ip: typeof run.triggerMetadata.ip === 'string' ? run.triggerMetadata.ip : null,
					userAgent:
						typeof run.triggerMetadata.userAgent === 'string'
							? run.triggerMetadata.userAgent
							: null,
					city: typeof geo?.city === 'string' ? geo.city : null,
					region: typeof geo?.region === 'string' ? geo.region : null,
					country: typeof geo?.country === 'string' ? geo.country : null,
					countryCode: typeof geo?.countryCode === 'string' ? geo.countryCode : null
				}
			: null
	};
}

const getAgentRun: RequestHandler = async ({ params }) => {
	const { client } = textqlClients();

	try {
		const result = await client.agents.getRun({ body: { runId: params.runId } });
		if (isConnectError(result)) {
			return json({ error: result.message ?? 'Run not found.' }, { status: 404 });
		}
		if (!result.run || typeof result.run.id !== 'string') {
			return json({ error: 'Run not found.' }, { status: 404 });
		}
		return json({ run: serializeRunDetail(result.run) });
	} catch (error) {
		return proxyError('Agent run request', error);
	}
};

export const agentRunRoute: RouteHandlers = { GET: getAgentRun };
