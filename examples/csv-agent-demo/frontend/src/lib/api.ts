/** The routes this demo adds under /v3/csv; uploads and watching use the shared /v3/textql API. */

import { pumpSse, readJson, type StreamEvent } from '@ui/lib/api';
import type { CellLike } from '@ui/lib/cells';
import { toEmbeddablePreviewUrl } from '@ui/lib/previewUrl';

import type { ForecastParams } from './forecast';

export type Run = { id: string; title: string; updated_at: string | null; is_running: boolean };

export type RunDetail = {
	file_name: string;
	/** Each forecast prompt's cell, with the parameters it sent. */
	prompts: { cell_id: string; parameters: ForecastParams }[];
	dataset_id: string | null;
	cells: CellLike[];
};

/** One forecast request: rules over the file's columns, plus the raw parameters. */
export type ForecastBody = {
	rules: string[];
	measure: string;
	scenario: string;
	forecast_from: string;
	forecast_to: string;
	parameters: ForecastParams;
};

export async function listRuns(): Promise<Run[]> {
	const payload = (await readJson(await fetch('/v3/csv/runs'), 'Unable to load runs.')) as {
		runs: Run[];
	};
	return payload.runs;
}

export async function getRun(chatId: string, signal?: AbortSignal): Promise<RunDetail> {
	const response = await fetch(`/v3/csv/runs/${encodeURIComponent(chatId)}`, { signal });
	return (await readJson(response, 'Unable to load this run.')) as RunDetail;
}

async function postStream(
	url: string,
	body: unknown,
	onEvent: (event: StreamEvent) => void,
	signal?: AbortSignal
): Promise<void> {
	const response = await fetch(url, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body),
		signal
	});
	if (!response.ok || !response.body) {
		await readJson(response, 'Unable to start the forecast.');
		throw new Error('The server returned no stream.');
	}
	await pumpSse(response.body, onEvent, signal);
}

/** Create the run's chat, attach the upload, and stream the first forecast. */
export function startRun(
	body: ForecastBody & { dataset_id: string; file_name: string },
	onEvent: (event: StreamEvent) => void,
	signal?: AbortSignal
): Promise<void> {
	return postStream('/v3/csv/runs', body, onEvent, signal);
}

/** Re-forecast in the same chat with new parameters, streaming only the new turn. */
export function updateRun(
	chatId: string,
	body: ForecastBody & { latest_cell_id: string },
	onEvent: (event: StreamEvent) => void,
	signal?: AbortSignal
): Promise<void> {
	return postStream(`/v3/csv/runs/${encodeURIComponent(chatId)}/messages`, body, onEvent, signal);
}

async function fetchText(url: string, fallback: string, signal?: AbortSignal): Promise<string> {
	const response = await fetch(url, { signal });
	if (!response.ok) await readJson(response, fallback);
	return response.text();
}

async function postJson<T>(url: string, body: unknown, fallback: string, signal?: AbortSignal): Promise<T> {
	const response = await fetch(url, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body),
		signal
	});
	return (await readJson(response, fallback)) as T;
}

/** PUT the bytes to signed storage; XHR rather than fetch, for upload progress. */
function putFile(
	file: File,
	url: string,
	headers: Record<string, string>,
	onProgress: (fraction: number) => void,
	signal?: AbortSignal
): Promise<void> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		const abort = () => xhr.abort();
		signal?.addEventListener('abort', abort, { once: true });
		xhr.upload.addEventListener('progress', (e) => {
			if (e.lengthComputable) onProgress(e.loaded / e.total);
		});
		xhr.addEventListener('loadend', () => signal?.removeEventListener('abort', abort));
		xhr.addEventListener('load', () =>
			xhr.status >= 200 && xhr.status < 300
				? resolve()
				: reject(new Error(`Upload to storage failed (${xhr.status}).`))
		);
		xhr.addEventListener('error', () => reject(new Error('Upload to storage failed.')));
		xhr.addEventListener('abort', () => reject(new Error('Upload cancelled.')));
		xhr.open('PUT', url);
		for (const [name, value] of Object.entries(headers)) xhr.setRequestHeader(name, value);
		xhr.send(file);
	});
}

/**
 * The TextQL app's upload: register, PUT the bytes straight to signed storage,
 * then finalize. The file never passes through this demo's server.
 */
export async function uploadFile(
	file: File,
	onProgress: (fraction: number) => void,
	signal?: AbortSignal
): Promise<string> {
	const upload = await postJson<{
		dataset_id: string;
		dataset_version: number;
		url: string;
		headers: Record<string, string>;
	}>('/v3/csv/uploads', { file_name: file.name }, 'Unable to start the upload.', signal);
	await putFile(file, upload.url, upload.headers, onProgress, signal);
	await postJson(
		`/v3/csv/uploads/${encodeURIComponent(upload.dataset_id)}/complete`,
		{ dataset_version: upload.dataset_version },
		'Unable to finish the upload.',
		signal
	);
	return upload.dataset_id;
}

/** A file the agent produced; its storage host is reached through the preview proxy. */
export function fetchOutputText(url: string, signal?: AbortSignal): Promise<string> {
	return fetchText(toEmbeddablePreviewUrl(url) ?? url, 'Unable to load this file.', signal);
}
