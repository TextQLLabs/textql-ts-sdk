/**
 * ana/v1 host bridge for the embedded data-app iframe.
 *
 * Mirrors the essentials of demo2's computeBridge.ts so apps are interactive, not
 * static: it advertises the app's compute functions in the hello handshake and
 * relays each ana.compute call to the backend (via /api/apps/<id>/compute, since
 * the browser can't hold the API key), handing the result back to the sandboxed
 * app. Per-member state/activity aren't wired here — this example runs apps in an
 * anonymous-viewer context — so those calls are answered "not available" rather
 * than left hanging. Returns a teardown function.
 */
const BRIDGE = 'ana/v1';

type AppBridgeOptions = {
	appId: string;
	functionNames: string[];
};

type Json = Record<string, unknown>;

function isFromApp(
	event: MessageEvent,
	frame: Window | null
): event is MessageEvent & { data: Json } {
	return (
		event.source === frame &&
		!!event.data &&
		typeof event.data === 'object' &&
		(event.data as Json).bridge === BRIDGE
	);
}

const MAX_DOWNLOAD_BYTES = 50 * 1024 * 1024;

// Strip path separators and control chars (code < 0x20 or in 0x7f–0x9f) from an app-supplied name.
function sanitizeFilename(name: string): string {
	let out = '';
	for (const ch of name.replace(/[/\\]/g, '_')) {
		const code = ch.codePointAt(0) ?? 0;
		if (code >= 0x20 && (code < 0x7f || code > 0x9f)) out += ch;
	}
	return out.trim() || 'download';
}

// Sandboxed apps can't trigger a download themselves; the host performs the <a download> click.
function hostDownload(filename: string, content: unknown, mimeType?: string) {
	const safeName = sanitizeFilename(filename);
	const blob =
		content instanceof Blob
			? content
			: new Blob([typeof content === 'string' ? content : JSON.stringify(content)], {
					type: mimeType || 'application/octet-stream'
				});
	if (blob.size > MAX_DOWNLOAD_BYTES) return;
	const href = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = href;
	anchor.download = safeName;
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	URL.revokeObjectURL(href);
}

export function attachAppBridge(
	iframe: HTMLIFrameElement,
	{ appId, functionNames }: AppBridgeOptions
): () => void {
	let detached = false;

	const postToApp = (message: Json) =>
		iframe.contentWindow?.postMessage({ bridge: BRIDGE, ...message }, '*');

	const postHello = () =>
		postToApp({
			type: 'hello',
			capabilities: {
				compute: functionNames.length > 0,
				query: false,
				devOverlay: false,
				route: false,
				state: false,
				activity: false
			},
			functions: functionNames,
			grants: [],
			viewer: null
		});

	async function relayCompute(id: string, name: string, appParams: unknown) {
		try {
			const response = await fetch(`/api/apps/${encodeURIComponent(appId)}/compute`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ functionName: name, paramsJson: JSON.stringify(appParams ?? {}) })
			});
			const payload: unknown = await response.json();
			if (detached) return;
			if (!response.ok || !payload || typeof payload !== 'object') {
				const error =
					payload && typeof payload === 'object' && typeof (payload as Json).error === 'string'
						? (payload as Json).error
						: 'compute function failed';
				postToApp({ type: 'compute.error', id, error });
				return;
			}
			const resultJson = (payload as Json).resultJson;
			let result: unknown = null;
			if (typeof resultJson === 'string') {
				try {
					result = JSON.parse(resultJson);
				} catch {
					result = resultJson;
				}
			}
			postToApp({ type: 'compute.result', id, result });
		} catch (error) {
			if (detached) return;
			postToApp({
				type: 'compute.error',
				id,
				error: error instanceof Error ? error.message : 'compute function failed'
			});
		}
	}

	function onMessage(event: MessageEvent) {
		if (!isFromApp(event, iframe.contentWindow)) return;
		const msg = event.data;
		const type = typeof msg.type === 'string' ? msg.type : '';
		const id = typeof msg.id === 'string' ? msg.id : undefined;

		if (type === 'ready') {
			postHello();
			return;
		}
		if (type === 'compute.run' && id) {
			relayCompute(id, typeof msg.name === 'string' ? msg.name : '', msg.params);
			return;
		}
		// Per-member features aren't wired in this example; settle the SDK promise as unavailable.
		if ((type === 'state.load' || type === 'state.save') && id) {
			postToApp({ type: 'state.error', id, error: 'state is not available in this context' });
			return;
		}
		if ((type === 'activity.record' || type === 'activity.list') && id) {
			postToApp({ type: 'activity.error', id, error: 'activity is not available in this context' });
			return;
		}
		if (type === 'download' && typeof msg.filename === 'string') {
			hostDownload(
				msg.filename,
				msg.content,
				typeof msg.mimeType === 'string' ? msg.mimeType : undefined
			);
			return;
		}
	}

	window.addEventListener('message', onMessage);
	iframe.addEventListener('load', postHello);
	if (iframe.contentWindow) postHello();

	return () => {
		detached = true;
		window.removeEventListener('message', onMessage);
		iframe.removeEventListener('load', postHello);
	};
}
