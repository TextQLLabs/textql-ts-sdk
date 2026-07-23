import {
	isConnectError,
	proxyError,
	textqlClients,
	toIsoString,
} from "$lib/server/textql";
import { isRecord } from "$lib/utils";
import { json } from "@sveltejs/kit";
import {
	TextqlRpcPublicChatLlmModel,
	type TextqlRpcPublicAgentAgent,
	type TextqlRpcPublicAgentAgentRun,
} from "@textql/sdk/models";

import type { RequestHandler } from "./$types";

const LLM_MODELS = new Set<string>(Object.values(TextqlRpcPublicChatLlmModel));

function serializeAgent(agent: TextqlRpcPublicAgentAgent) {
	return {
		id: agent.id,
		name: agent.name?.trim() || "Untitled agent",
		prompt: typeof agent.prompt === "string" ? agent.prompt : "",
		isActive: agent.isActive === true,
		profileImageUrl:
			typeof agent.profileImageUrl === "string"
				? agent.profileImageUrl.trim() || null
				: null,
		ownerName:
			typeof agent.memberName === "string"
				? agent.memberName.trim() || null
				: null,
		llmModel: typeof agent.llmModel === "string" ? agent.llmModel : null,
		webhookTriggerId:
			typeof agent.webhookTriggerId === "string"
				? agent.webhookTriggerId.trim() || null
				: null,
		schedules: Array.isArray(agent.postingFrequencyCrons)
			? agent.postingFrequencyCrons.filter(
					(cron): cron is string => typeof cron === "string",
				)
			: [],
		lastPostAt: toIsoString(agent.lastPostAt),
		lastChatId:
			typeof agent.lastChatId === "string"
				? agent.lastChatId.trim() || null
				: null,
		postCount: typeof agent.postCount === "number" ? agent.postCount : 0,
		commentCount:
			typeof agent.commentCount === "number" ? agent.commentCount : 0,
		voteCount: typeof agent.voteCount === "number" ? agent.voteCount : 0,
	};
}

function serializeRun(run: TextqlRpcPublicAgentAgentRun) {
	if (typeof run.id !== "string") return null;
	return {
		id: run.id,
		status: typeof run.status === "string" ? run.status : "STATUS_UNKNOWN",
		triggerSource:
			typeof run.triggerSource === "string" ? run.triggerSource : null,
		chatId: typeof run.chatId === "string" ? run.chatId.trim() || null : null,
		toolCallsCount:
			typeof run.toolCallsCount === "number" ? run.toolCallsCount : 0,
		lastSummary:
			typeof run.lastSummary === "string"
				? run.lastSummary.trim() || null
				: null,
		errorKind:
			typeof run.errorKind === "string" ? run.errorKind.trim() || null : null,
		errorMessage:
			typeof run.errorMessage === "string"
				? run.errorMessage.trim() || null
				: null,
		createdAt: toIsoString(run.createdAt),
		startedAt: toIsoString(run.startedAt),
		finishedAt: toIsoString(run.finishedAt),
	};
}

export const GET: RequestHandler = async ({ params }) => {
	const { client } = textqlClients();

	try {
		const [agentResult, runsResult] = await Promise.all([
			client.agents.getAgent({ body: { agentId: params.id } }),
			client.agents.listRuns({ body: { agentId: params.id, limit: 100 } }),
		]);

		if (isConnectError(agentResult)) {
			return json(
				{ error: agentResult.message ?? "Agent not found." },
				{ status: 404 },
			);
		}
		if (!agentResult.agent || typeof agentResult.agent.id !== "string") {
			return json({ error: "Agent not found." }, { status: 404 });
		}

		// A failed run lookup shouldn't hide the agent — degrade to an empty list.
		const runs =
			!isConnectError(runsResult) && Array.isArray(runsResult.runs)
				? runsResult.runs.map(serializeRun).filter((run) => run !== null)
				: [];

		return json({ agent: serializeAgent(agentResult.agent), runs });
	} catch (error) {
		return proxyError("Agent request", error);
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const { client } = textqlClients();

	try {
		const body: unknown = await request.json();
		if (!isRecord(body)) {
			return json({ error: "Invalid request body." }, { status: 400 });
		}

		const name = typeof body.name === "string" ? body.name.trim() : "";
		const prompt = typeof body.prompt === "string" ? body.prompt : "";
		const isActive = body.isActive === true;
		const llmModel =
			typeof body.llmModel === "string" && LLM_MODELS.has(body.llmModel)
				? (body.llmModel as TextqlRpcPublicChatLlmModel)
				: undefined;
		const postingFrequencyCrons = Array.isArray(body.schedules)
			? body.schedules.filter(
					(cron): cron is string =>
						typeof cron === "string" && cron.trim().length > 0,
				)
			: [];

		const result = await client.agents.update({
			body: {
				agentId: params.id,
				name: name || "Untitled agent",
				prompt,
				isActive,
				llmModel,
				postingFrequencyCrons,
			},
		});

		if (isConnectError(result)) {
			return json(
				{ error: result.message ?? "Unable to update agent." },
				{ status: 502 },
			);
		}
		if (!result.agent || typeof result.agent.id !== "string") {
			return json({ error: "Update returned no agent." }, { status: 502 });
		}

		return json({ agent: serializeAgent(result.agent) });
	} catch (error) {
		return proxyError("Agent update request", error);
	}
};
