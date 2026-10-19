/** Last-used model + connectors, so a new chat opens the way the last one did. */

import { isKnownChatModel } from './chatModels';
import { isRecord, storageGet, storageSet } from './utils';

const STORAGE_KEY = 'textql-python-demo:last-config';

export type ChatConfigPrefs = {
	model: string;
	connectorIds: number[];
};

function isPositiveInt(value: unknown): value is number {
	return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

export function loadLastChatConfig(): ChatConfigPrefs | null {
	try {
		const raw = storageGet(STORAGE_KEY);
		if (!raw) return null;

		const parsed: unknown = JSON.parse(raw);
		if (!isRecord(parsed)) return null;

		if (typeof parsed.model !== 'string' || !isKnownChatModel(parsed.model)) return null;
		if (!Array.isArray(parsed.connectorIds)) return null;

		return { model: parsed.model, connectorIds: parsed.connectorIds.filter(isPositiveInt) };
	} catch {
		return null;
	}
}

export function saveLastChatConfig(prefs: ChatConfigPrefs): void {
	if (!isKnownChatModel(prefs.model)) return;

	storageSet(
		STORAGE_KEY,
		JSON.stringify({
			model: prefs.model,
			connectorIds: prefs.connectorIds.filter(isPositiveInt)
		})
	);
}
