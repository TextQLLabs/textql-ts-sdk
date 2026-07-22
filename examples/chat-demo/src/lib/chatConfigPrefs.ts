/** Last-used model + connectors for new chats in the chat-demo. */

export const CHAT_CONFIG_STORAGE_KEY = "textql-chat-demo:last-config";

export const KNOWN_CHAT_MODELS = [
	"MODEL_HAIKU_4_5",
	"MODEL_SONNET_5",
	"MODEL_OPUS_4_8",
] as const;

export type ChatConfigPrefs = {
	model: string;
	connectorIds: number[];
};

function isBrowser(): boolean {
	return typeof localStorage !== "undefined";
}

function isKnownModel(model: string): boolean {
	return (KNOWN_CHAT_MODELS as readonly string[]).includes(model);
}

function isPositiveInt(value: unknown): value is number {
	return typeof value === "number" && Number.isInteger(value) && value > 0;
}

export function loadLastChatConfig(): ChatConfigPrefs | null {
	if (!isBrowser()) return null;

	try {
		const raw = localStorage.getItem(CHAT_CONFIG_STORAGE_KEY);
		if (!raw) return null;

		const parsed: unknown = JSON.parse(raw);
		if (!parsed || typeof parsed !== "object") return null;

		const record = parsed as Record<string, unknown>;
		if (typeof record.model !== "string" || !isKnownModel(record.model)) {
			return null;
		}
		if (!Array.isArray(record.connectorIds)) return null;

		const connectorIds = record.connectorIds.filter(isPositiveInt);
		return { model: record.model, connectorIds };
	} catch {
		return null;
	}
}

export function saveLastChatConfig(prefs: ChatConfigPrefs): void {
	if (!isBrowser()) return;
	if (!isKnownModel(prefs.model)) return;

	const connectorIds = prefs.connectorIds.filter(isPositiveInt);

	try {
		localStorage.setItem(
			CHAT_CONFIG_STORAGE_KEY,
			JSON.stringify({
				model: prefs.model,
				connectorIds,
			}),
		);
	} catch {
		// ignore quota / private-mode failures
	}
}
