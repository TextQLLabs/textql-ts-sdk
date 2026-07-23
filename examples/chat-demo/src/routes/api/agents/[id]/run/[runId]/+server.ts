import { isConnectError, proxyError, textqlClients, toIsoString } from "$lib/server/textql";
import { json } from "@sveltejs/kit";
import type {
	TextqlRpcPublicAgentAgentRun,
	TextqlRpcPublicChatEgressCall,
	TextqlRpcPublicAgentAgentRunToolCall,
} from "@textql/sdk/models";

import type { RequestHandler } from "./$types";

function num(value: number | string | undefined): number {
	if (typeof value === "number") return value;
	if (typeof value === "string") {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : 0;
	}
	return 0;
}

function serializeStep(step: TextqlRpcPublicAgentAgentRunToolCall) {
	return {
		tool: typeof step.tool === "string" ? step.tool : "tool",
		summary: typeof step.summary === "string" ? step.summary.trim() || null : null,
		error: typeof step.error === "string" ? step.error.trim() || null : null,
		cellId: typeof step.cellId === "string" ? step.cellId : null,
		durationMs: num(step.durationMs),
		startedAtMs: num(step.startedAtMs),
	};
}

function serializeEgress(call: TextqlRpcPublicChatEgressCall) {
	return {
		id: typeof call.id === "string" ? call.id : "",
		method: typeof call.method === "string" ? call.method : "GET",
		scheme: typeof call.scheme === "string" ? call.scheme : "https",
		host: typeof call.host === "string" ? call.host : "",
		path: typeof call.path === "string" ? call.path : "",
		statusCode: typeof call.statusCode === "number" ? call.statusCode : 0,
		outcome: typeof call.outcome === "string" ? call.outcome : "ok",
		durationMs: num(call.durationMs),
		requestBytes: num(call.requestBytes),
		responseBytes: num(call.responseBytes),
		cellId: typeof call.cellId === "string" ? call.cellId : null,
		occurredAt: toIsoString(call.occurredAt),
	};
}

function serializeRun(run: TextqlRpcPublicAgentAgentRun) {
	const geo = run.triggerMetadata?.geo;
	return {
		id: run.id ?? "",
		status: typeof run.status === "string" ? run.status : "STATUS_UNKNOWN",
		triggerSource: typeof run.triggerSource === "string" ? run.triggerSource : null,
		chatId: typeof run.chatId === "string" ? run.chatId.trim() || null : null,
		toolCallsCount: typeof run.toolCallsCount === "number" ? run.toolCallsCount : 0,
		lastSummary:
			typeof run.lastSummary === "string" ? run.lastSummary.trim() || null : null,
		errorKind: typeof run.errorKind === "string" ? run.errorKind.trim() || null : null,
		errorMessage:
			typeof run.errorMessage === "string" ? run.errorMessage.trim() || null : null,
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
					ip: typeof run.triggerMetadata.ip === "string" ? run.triggerMetadata.ip : null,
					userAgent:
						typeof run.triggerMetadata.userAgent === "string"
							? run.triggerMetadata.userAgent
							: null,
					city: typeof geo?.city === "string" ? geo.city : null,
					region: typeof geo?.region === "string" ? geo.region : null,
					country: typeof geo?.country === "string" ? geo.country : null,
					countryCode: typeof geo?.countryCode === "string" ? geo.countryCode : null,
				}
			: null,
	};
}

export const GET: RequestHandler = async ({ params }) => {
	const { client } = textqlClients();

	try {
		const result = await client.agents.getRun({ body: { runId: params.runId } });
		if (isConnectError(result)) {
			return json({ error: result.message ?? "Run not found." }, { status: 404 });
		}
		if (!result.run || typeof result.run.id !== "string") {
			return json({ error: "Run not found." }, { status: 404 });
		}
		return json({ run: serializeRun(result.run) });
	} catch (error) {
		return proxyError("Agent run request", error);
	}
};
