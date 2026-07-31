"use client";

/**
 * `<TextqlApp />` — the React form of `@textql/sdk/embed/element`.
 *
 *   import { TextqlApp } from "@textql/sdk/embed/react";
 *   <TextqlApp style={{ height: "80vh" }} />
 *
 * Pair with `createEmbedHandler` from `@textql/sdk/embed` on your server. See
 * EMBED.md.
 *
 * This wrapper exists for two reasons that cost every React integrator the
 * same afternoon: JSX has no type for a custom element, so using the tag
 * directly means hand-writing an `IntrinsicElements` declaration; and React
 * cannot bind `app-meta`/`app-ready`/`app-error`, which are CustomEvents and
 * need `addEventListener`.
 */

import { createElement, useEffect, useRef } from "react";
import type { CSSProperties, ReactElement } from "react";

import type { TextqlAppElement, TextqlAppMeta } from "./element.js";

export type { TextqlAppMeta, TextqlAppElement };

/** What `app-error` carries: the runtime's own report, already logged by the element. */
export interface TextqlAppError {
  message?: unknown;
  stack?: unknown;
  level?: unknown;
}

export interface TextqlAppProps {
  /** Where `createEmbedHandler` is mounted. Defaults to `/api/textql`. */
  apiBase?: string | undefined;
  className?: string | undefined;
  /** The element has no intrinsic size — give it a real height. */
  style?: CSSProperties | undefined;
  /** Metadata arrived. Depends only on your server, not on the app's bridge. */
  onMeta?: ((meta: TextqlAppMeta) => void) | undefined;
  /** The app's runtime finished its handshake. */
  onReady?: ((meta: TextqlAppMeta | null) => void) | undefined;
  /** The app reported a runtime error. */
  onError?: ((error: TextqlAppError) => void) | undefined;
}

export function TextqlApp(props: TextqlAppProps): ReactElement {
  const host = useRef<TextqlAppElement | null>(null);
  const latest = useRef(props);

  // Read through a ref so re-rendering with a new closure does not resubscribe.
  useEffect(() => {
    latest.current = props;
  });

  useEffect(() => {
    // Defining the element touches `HTMLElement` and `customElements` at module
    // scope, so a static import would crash any server render. Importing here
    // keeps this component renderable on the server; the tag sits inert until
    // this resolves, then upgrades and loads itself.
    void import("./element.js");
  }, []);

  useEffect(() => {
    const element = host.current;
    if (!element) return;

    const onMeta = (event: Event) =>
      latest.current.onMeta?.((event as CustomEvent<TextqlAppMeta>).detail);
    const onReady = (event: Event) =>
      latest.current.onReady?.((event as CustomEvent<TextqlAppMeta | null>).detail);
    const onError = (event: Event) =>
      latest.current.onError?.((event as CustomEvent<TextqlAppError>).detail);

    element.addEventListener("app-meta", onMeta);
    element.addEventListener("app-ready", onReady);
    element.addEventListener("app-error", onError);

    // A remount can attach after the element already has metadata, and
    // `app-meta` will not fire again.
    if (element.meta) latest.current.onMeta?.(element.meta);

    return () => {
      element.removeEventListener("app-meta", onMeta);
      element.removeEventListener("app-ready", onReady);
      element.removeEventListener("app-error", onError);
    };
  }, []);

  return createElement("textql-app", {
    ref: host,
    "api-base": props.apiBase,
    className: props.className,
    style: props.style,
  });
}
