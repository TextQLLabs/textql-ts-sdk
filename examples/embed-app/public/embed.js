/**
 * <textql-app api-base="/textql"></textql-app>
 *
 * Renders the Data App your server is configured for: fetches its signed
 * document URL (see server.ts), mounts it in a sandboxed iframe, and speaks the
 * `ana/v1` bridge its runtime expects. Which app that is stays server-side.
 *
 * This is the minimum viable half of that bridge. The full host also carries
 * member state, activity, presence, routing, realtime and asks; declaring them
 * off in `hello` is supported, and the runtime degrades instead of hanging.
 */

const BRIDGE = 'ana/v1';

/** The sandboxed app can't enforce its own limit, so the host is the only gate. */
const MAX_DOWNLOAD_BYTES = 50 * 1024 * 1024;

const STYLE = `
	:host { display: block; position: relative; min-height: 240px; }
	iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
	.overlay {
		position: absolute; inset: 0; display: flex; flex-direction: column; gap: 12px;
		align-items: center; justify-content: center; overflow: hidden;
		background: #fff; text-align: center; padding: 24px;
		font: 14px/1.5 system-ui, -apple-system, sans-serif; color: #374151;
	}
	.poster { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.6; filter: blur(1px); }
	.spinner {
		width: 32px; height: 32px; border-radius: 50%;
		border: 3px solid #e5e7eb; border-top-color: #9ca3af;
		animation: textql-spin 0.8s linear infinite;
	}
	@keyframes textql-spin { to { transform: rotate(360deg); } }
	button {
		padding: 6px 14px; border: 1px solid #d1d5db; border-radius: 6px;
		background: #fff; font: inherit; cursor: pointer;
	}
	button:hover { background: #f9fafb; }
`;

class TextqlApp extends HTMLElement {
	static observedAttributes = ['api-base'];

	#root = this.attachShadow({ mode: 'open' });
	#body = document.createElement('div');
	#iframe = null;
	#meta = null;
	#posterEl = null;
	/** Bumped on every (re)load so a slow response can't overwrite a newer one. */
	#generation = 0;

	connectedCallback() {
		this.#root.innerHTML = `<style>${STYLE}</style>`;
		this.#root.append(this.#body);
		window.addEventListener('message', this.#onMessage);
		void this.load();
	}

	disconnectedCallback() {
		window.removeEventListener('message', this.#onMessage);
		this.#generation += 1;
		this.#iframe = null;
	}

	attributeChangedCallback(_name, previous, next) {
		if (this.isConnected && previous !== null && previous !== next) void this.load();
	}

	/** Null until the metadata fetch lands; lets a late listener catch up. */
	get meta() {
		return this.#meta;
	}

	#endpoint(suffix = '') {
		return `${(this.getAttribute('api-base') ?? '/textql').replace(/\/+$/, '')}/app${suffix}`;
	}

	/**
	 * Also the retry path. The signed URL expires, so recovery means asking the
	 * server for a new one, never reloading the iframe.
	 */
	async load() {
		const generation = ++this.#generation;
		this.#iframe = null;

		this.#body.replaceChildren(this.#overlay([this.#spinner()]));

		let meta;
		try {
			const response = await fetch(this.#endpoint());
			const payload = await response.json();
			if (!response.ok) throw new Error(payload?.error ?? 'Unable to load the app.');
			meta = payload;
		} catch (cause) {
			if (generation === this.#generation) this.#showError(String(cause?.message ?? cause));
			return;
		}
		if (generation !== this.#generation) return;

		this.#meta = meta;
		// Fires off the metadata fetch, so a host can title its chrome without
		// waiting on the app document — or on the bridge handshake, which a
		// rehosted document may never complete.
		this.dispatchEvent(new CustomEvent('app-meta', { detail: meta }));
		const iframe = document.createElement('iframe');
		iframe.src = this.#endpoint('/document');
		iframe.title = meta.name;
		// allow-scripts only: app HTML is untrusted, and the opaque origin it
		// produces is what makes `event.source` identity meaningful below.
		iframe.setAttribute('sandbox', 'allow-scripts');
		iframe.addEventListener('load', () => {
			// `load` is the dismissal signal, not `ready`. The runtime only posts
			// to the origin baked in at publish time, so on a rehosted document
			// `ready` may never arrive even though the app rendered fine.
			this.#dismissPoster();
			this.#postHello(iframe);
		});
		this.#iframe = iframe;

		this.#posterEl = this.#poster(meta.screenshotUrl, meta.name);
		this.#body.replaceChildren(iframe, this.#posterEl);
	}

	// ─── bridge ─────────────────────────────────────────────────────────────

	#onMessage = (event) => {
		const iframe = this.#iframe;
		// The iframe's origin is opaque, so source-window identity is the only
		// trustworthy check on an inbound message.
		if (!iframe || event.source !== iframe.contentWindow) return;

		const message = event.data;
		if (!message || message.bridge !== BRIDGE) return;

		switch (message.type) {
			case 'ready':
				this.#onReady(iframe);
				return;
			case 'compute.run':
				void this.#relayCompute(iframe, message);
				return;
			case 'state.load':
			case 'state.save':
			case 'activity.record':
			case 'activity.list':
				// Request-shaped, so the runtime blocks on a reply keyed to this id.
				// `hello` declaring the capability off is not enough — staying
				// silent here hangs whatever part of the app made the call.
				if (typeof message.id === 'string') {
					const kind = message.type.split('.')[0];
					this.#post(iframe, {
						type: `${kind}.error`,
						id: message.id,
						error: `${kind} is not available in this context`
					});
				}
				return;
			case 'download':
				this.#download(message);
				return;
			case 'runtime.error':
				console[message.level === 'warn' ? 'warn' : 'error'](
					`[textql-app] ${message.message}`,
					message.stack ?? ''
				);
				this.dispatchEvent(new CustomEvent('app-error', { detail: message }));
				return;
		}
	};

	#post(iframe, message) {
		iframe.contentWindow?.postMessage({ bridge: BRIDGE, ...message }, '*');
	}

	#postHello(iframe) {
		this.#post(iframe, {
			type: 'hello',
			// Declaring a capability off settles the runtime's queued calls for it
			// immediately; omitting it makes them wait out a timeout instead.
			capabilities: {
				compute: (this.#meta?.functions ?? []).length > 0,
				query: false,
				devOverlay: false,
				route: false,
				state: false,
				activity: false,
				realtime: false,
				ask: false
			},
			functions: this.#meta?.functions ?? [],
			grants: [],
			viewer: null
		});
	}

	#onReady(iframe) {
		this.#dismissPoster();
		this.#postHello(iframe);
		this.dispatchEvent(new CustomEvent('app-ready', { detail: this.#meta }));
	}

	async #relayCompute(iframe, message) {
		if (typeof message.id !== 'string') return;
		try {
			const response = await fetch(this.#endpoint('/compute'), {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ name: message.name, params: message.params ?? {} })
			});
			const payload = await response.json();
			if (!response.ok) throw new Error(payload?.error ?? `${message.name} failed.`);
			// A remount while this was in flight would make the id meaningless.
			if (this.#iframe !== iframe) return;
			this.#post(iframe, { type: 'compute.result', id: message.id, result: payload.result });
		} catch (cause) {
			if (this.#iframe !== iframe) return;
			this.#post(iframe, {
				type: 'compute.error',
				id: message.id,
				error: String(cause?.message ?? cause)
			});
		}
	}

	/** A sandboxed document can't download; it posts and the host clicks the link. */
	#download({ filename, content, mimeType }) {
		if (typeof filename !== 'string') return;
		// \p{Cc} is the C0/C1 control block. With separators gone too, an
		// app-supplied name can only ever be a bare filename.
		const name = filename.replace(/[/\\]/g, '_').replace(/\p{Cc}/gu, '').trim() || 'download';

		let blob;
		if (content instanceof Blob) {
			blob = content;
		} else if (content instanceof ArrayBuffer || ArrayBuffer.isView(content)) {
			blob = new Blob([content], { type: mimeType || 'application/octet-stream' });
		} else {
			blob = new Blob([String(content)], { type: mimeType || 'text/plain' });
		}
		if (blob.size > MAX_DOWNLOAD_BYTES) {
			console.error(`[textql-app] download(${name}): exceeds the 50MB limit`);
			return;
		}

		const url = URL.createObjectURL(blob);
		const anchor = Object.assign(document.createElement('a'), { href: url, download: name });
		document.body.append(anchor);
		anchor.click();
		anchor.remove();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}

	// ─── overlays ───────────────────────────────────────────────────────────

	/**
	 * Detaching the iframe would destroy its browsing context and reload `src`
	 * on reinsert, so the overlay goes rather than the frame being re-appended.
	 */
	#dismissPoster() {
		this.#posterEl?.remove();
		this.#posterEl = null;
	}

	#overlay(children) {
		const overlay = document.createElement('div');
		overlay.className = 'overlay';
		overlay.append(...children);
		return overlay;
	}

	#spinner() {
		return Object.assign(document.createElement('div'), { className: 'spinner' });
	}

	#poster(screenshotUrl, name) {
		const children = [];
		if (screenshotUrl) {
			children.push(
				Object.assign(document.createElement('img'), {
					className: 'poster',
					src: screenshotUrl,
					alt: name
				})
			);
		}
		children.push(this.#spinner());
		return this.#overlay(children);
	}

	#showError(text) {
		this.#iframe = null;

		const retry = document.createElement('button');
		retry.textContent = 'Retry';
		retry.addEventListener('click', () => void this.load());

		this.#body.replaceChildren(this.#overlay([document.createTextNode(text), retry]));
	}
}

customElements.define('textql-app', TextqlApp);
