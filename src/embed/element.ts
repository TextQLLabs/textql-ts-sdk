/**
 * Registers `<textql-app>`, which renders the Data App served by
 * `createEmbedHandler` from `@textql/sdk/embed`.
 *
 *   import "@textql/sdk/embed/element";
 *   <textql-app></textql-app>
 *
 * Importing this module is the whole setup; it defines the element as a side
 * effect. Nothing here imports the rest of the SDK, so it stays out of your
 * browser bundle.
 *
 * The element speaks the `ana/v1` bridge the app's runtime expects. The full
 * host inside TextQL also carries member state, activity, presence, routing,
 * realtime and asks; declaring those off in `hello` is supported, and the
 * runtime degrades rather than hanging.
 */

const BRIDGE = "ana/v1";

/** Matches `DEFAULT_BASE_PATH` in `@textql/sdk/embed`. */
const DEFAULT_API_BASE = "/api/textql";

/** The sandboxed app can't enforce its own limit, so the host is the only gate. */
const MAX_DOWNLOAD_BYTES = 50 * 1024 * 1024;

export interface TextqlAppMeta {
  name: string;
  screenshotUrl: string | null;
  functions: string[];
}

interface BridgeMessage {
  bridge?: unknown;
  type?: unknown;
  id?: unknown;
  name?: unknown;
  params?: unknown;
  level?: unknown;
  message?: unknown;
  stack?: unknown;
  filename?: unknown;
  mimeType?: unknown;
  content?: unknown;
}

const STYLE = `
  :host { display: block; position: relative; min-height: 240px; height: 100%; }
  iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
  .overlay {
    position: absolute; inset: 0; display: flex; flex-direction: column; gap: 12px;
    align-items: center; justify-content: center; overflow: hidden;
    background: #fff; text-align: center; padding: 24px;
    font: 14px/1.5 system-ui, -apple-system, sans-serif; color: #374151;
  }
  .poster {
    position: absolute; inset: 0; width: 100%; height: 100%;
    object-fit: cover; opacity: 0.6; filter: blur(1px);
  }
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

export class TextqlAppElement extends HTMLElement {
  static readonly observedAttributes = ["api-base"];

  readonly #shadow = this.attachShadow({ mode: "open" });
  readonly #body = document.createElement("div");
  #frame: HTMLIFrameElement | null = null;
  #meta: TextqlAppMeta | null = null;
  #poster: HTMLElement | null = null;
  /** Bumped on every (re)load so a slow response can't overwrite a newer one. */
  #generation = 0;

  connectedCallback(): void {
    this.#shadow.innerHTML = `<style>${STYLE}</style>`;
    this.#shadow.append(this.#body);
    window.addEventListener("message", this.#onMessage);
    void this.load();
  }

  disconnectedCallback(): void {
    window.removeEventListener("message", this.#onMessage);
    this.#generation += 1;
    this.#frame = null;
  }

  attributeChangedCallback(_name: string, previous: string | null, next: string | null): void {
    if (this.isConnected && previous !== null && previous !== next) void this.load();
  }

  /** Null until the fetch lands; lets a listener that missed `app-meta` catch up. */
  get meta(): TextqlAppMeta | null {
    return this.#meta;
  }

  #endpoint(suffix: string): string {
    const base = (this.getAttribute("api-base") ?? DEFAULT_API_BASE).replace(/\/+$/, "");
    return `${base}${suffix}`;
  }

  async #request(suffix: string, init?: RequestInit): Promise<Record<string, unknown>> {
    const response = await fetch(this.#endpoint(suffix), init);
    const payload = (await response.json()) as Record<string, unknown> | null;
    if (!response.ok) {
      const error = payload?.["error"];
      throw new Error(typeof error === "string" ? error : "The request failed.");
    }
    return payload ?? {};
  }

  /** Also the retry path: recovery is a refetch, never an iframe reload. */
  async load(): Promise<void> {
    const generation = ++this.#generation;
    this.#frame = null;
    this.#body.replaceChildren(this.#overlay([this.#spinner()]));

    let meta: TextqlAppMeta;
    try {
      const payload = await this.#request("/app");
      meta = {
        name: typeof payload["name"] === "string" ? payload["name"] : "Data app",
        screenshotUrl:
          typeof payload["screenshotUrl"] === "string" ? payload["screenshotUrl"] : null,
        functions: Array.isArray(payload["functions"])
          ? (payload["functions"] as string[])
          : [],
      };
    } catch (cause) {
      if (generation === this.#generation) this.#showError(String((cause as Error)?.message ?? cause));
      return;
    }
    if (generation !== this.#generation) return;

    this.#meta = meta;
    // Off the fetch, not the handshake, so host chrome can title itself even if
    // the bridge never connects.
    this.dispatchEvent(new CustomEvent<TextqlAppMeta>("app-meta", { detail: meta }));

    const frame = document.createElement("iframe");
    frame.src = this.#endpoint("/document");
    frame.title = meta.name;
    // allow-scripts only: app HTML is untrusted, and the opaque origin it
    // produces is what makes `event.source` identity meaningful below.
    frame.setAttribute("sandbox", "allow-scripts");
    // `ready` is the real handshake, but dismiss on `load` too so a document
    // whose handshake never lands still shows itself. Both greet; the runtime
    // settles the first hello and ignores the rest.
    frame.addEventListener("load", () => {
      this.#dismissPoster();
      this.#postHello(frame);
    });
    this.#frame = frame;

    this.#poster = this.#posterOverlay(meta);
    this.#body.replaceChildren(frame, this.#poster);
  }

  // ─── bridge ───────────────────────────────────────────────────────────────

  #onMessage = (event: MessageEvent): void => {
    const frame = this.#frame;
    // The iframe's origin is opaque, so source-window identity is the only
    // trustworthy check on an inbound message.
    if (!frame || event.source !== frame.contentWindow) return;

    const message = event.data as BridgeMessage | null;
    if (!message || message.bridge !== BRIDGE) return;

    switch (message.type) {
      case "ready":
        this.#dismissPoster();
        this.#postHello(frame);
        this.dispatchEvent(new CustomEvent<TextqlAppMeta | null>("app-ready", { detail: this.#meta }));
        return;
      case "compute.run":
        void this.#relayCompute(frame, message);
        return;
      case "download":
        this.#download(message);
        return;
      case "runtime.error":
        console[message.level === "warn" ? "warn" : "error"](
          `[textql-app] ${String(message.message)}`,
          message.stack ?? "",
        );
        this.dispatchEvent(new CustomEvent<BridgeMessage>("app-error", { detail: message }));
        return;
      default:
        break;
    }

    // Any other request-shaped call — `state.*`, `activity.*`, `data.query`. A
    // current runtime never sends these once `hello` declares the family off,
    // but one that does would block on a reply keyed to this id.
    if (typeof message.id === "string") {
      const family = String(message.type).split(".")[0] ?? "request";
      this.#post(frame, {
        type: `${family}.error`,
        id: message.id,
        error: `${family} is not available in this context`,
      });
    }
  };

  #post(frame: HTMLIFrameElement, message: Record<string, unknown>): void {
    frame.contentWindow?.postMessage({ bridge: BRIDGE, ...message }, "*");
  }

  #postHello(frame: HTMLIFrameElement): void {
    const functions = this.#meta?.functions ?? [];
    this.#post(frame, {
      type: "hello",
      // Declared off settles the runtime's queued calls at once; omitted leaves
      // them waiting out a timeout.
      capabilities: {
        compute: functions.length > 0,
        query: false,
        devOverlay: false,
        route: false,
        state: false,
        activity: false,
        realtime: false,
        ask: false,
      },
      functions,
      grants: [],
      viewer: null,
    });
  }

  async #relayCompute(frame: HTMLIFrameElement, message: BridgeMessage): Promise<void> {
    if (typeof message.id !== "string") return;
    try {
      const payload = await this.#request("/compute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: message.name, params: message.params ?? {} }),
      });
      // A remount while this was in flight would make the id meaningless.
      if (this.#frame !== frame) return;
      this.#post(frame, { type: "compute.result", id: message.id, result: payload["result"] });
    } catch (cause) {
      if (this.#frame !== frame) return;
      this.#post(frame, {
        type: "compute.error",
        id: message.id,
        error: String((cause as Error)?.message ?? cause),
      });
    }
  }

  /** A sandboxed document can't download; it posts and the host clicks the link. */
  #download({ filename, content, mimeType }: BridgeMessage): void {
    if (typeof filename !== "string") return;
    // \p{Cc} is the C0/C1 control block; with separators gone the app-supplied
    // name can only be a bare filename.
    const name = filename.replace(/[/\\]/g, "_").replace(/\p{Cc}/gu, "").trim() || "download";

    const blob = new Blob([content as BlobPart], {
      type: typeof mimeType === "string" && mimeType ? mimeType : "application/octet-stream",
    });
    if (blob.size > MAX_DOWNLOAD_BYTES) {
      console.error(`[textql-app] download(${name}): exceeds the 50MB limit`);
      return;
    }

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ─── overlays ─────────────────────────────────────────────────────────────

  /**
   * Removes the overlay, never re-appends the frame: detaching an iframe
   * destroys its browsing context and reinserting reloads `src`.
   */
  #dismissPoster(): void {
    this.#poster?.remove();
    this.#poster = null;
  }

  #overlay(children: Node[]): HTMLElement {
    const overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.append(...children);
    return overlay;
  }

  #spinner(): HTMLElement {
    const spinner = document.createElement("div");
    spinner.className = "spinner";
    return spinner;
  }

  #posterOverlay(meta: TextqlAppMeta): HTMLElement {
    const children: Node[] = [];
    if (meta.screenshotUrl) {
      const image = document.createElement("img");
      image.className = "poster";
      image.src = meta.screenshotUrl;
      image.alt = meta.name;
      children.push(image);
    }
    children.push(this.#spinner());
    return this.#overlay(children);
  }

  #showError(text: string): void {
    const retry = document.createElement("button");
    retry.textContent = "Retry";
    retry.addEventListener("click", () => void this.load());
    this.#body.replaceChildren(this.#overlay([document.createTextNode(text), retry]));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "textql-app": TextqlAppElement;
  }
}

// Guarded so importing this module twice (two bundles, HMR) isn't fatal.
if (!customElements.get("textql-app")) {
  customElements.define("textql-app", TextqlAppElement);
}
