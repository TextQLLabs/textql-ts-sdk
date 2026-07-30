/** Helpers shared by the streaming examples. */

import type { ConnectError } from "@textql/sdk/models";
// Streaming rides on protobuf-es message types, not the Zod models.
import type { Cell } from "@textql/sdk/generated/connect/public/chat_pb.js";

// ConnectError is all-optional, so `in` narrowing can't discriminate the
// `Response | ConnectError` unions the unary methods return — hence a predicate.
export const isConnectError = (r: object): r is ConnectError =>
  "code" in r || "details" in r;

/** The error arm of a unary response is a value, not an exception. */
export function assertOk(result: object, what: string): void {
  if (isConnectError(result)) throw new Error(`${what} failed: ${result.message}`);
}

/** A Cell is a oneof over ~50 types; pull the human-readable text out. */
export function cellText({ value: p }: Cell): string {
  switch (p.case) {
    case "mdCell":
    case "ansCell":
    case "textCell":
    case "thinkingCell": return p.value.content || `(${p.case})`;
    case "summaryCell": return p.value.summary || `(${p.case})`;
    case "sqlCell": return p.value.query || `(${p.case})`;
    case "pyCell": return p.value.code || `(${p.case})`;
    case "previewCell":
      if (!p.value.url) return `(${p.case})`;
      return p.value.name ? `${p.value.name}: ${p.value.url}` : p.value.url;
    default: return p.case ? `(${p.case})` : "(empty)";
  }
}

/**
 * Streams cells to stdout. A cell is re-sent as it grows, so only the delta is
 * written; state is keyed by cell id and spans the whole conversation.
 *
 * `log` writes a standalone line, closing any open cell line first.
 */
export function cellPrinter() {
  const printed = new Map<string, number>();
  let openId = "";

  const endLine = () => {
    if (openId) process.stdout.write("\n");
    openId = "";
  };

  return {
    log: (line: string) => (endLine(), console.log(line)),
    feed(cell: Cell) {
      if (cell.id !== openId) {
        endLine();
        process.stdout.write(`[${cell.value.case} ${(openId = cell.id)}] `);
      }
      const text = cellText(cell);
      const seen = printed.get(cell.id) ?? 0;
      if (text.length > seen) {
        process.stdout.write(text.slice(seen));
        printed.set(cell.id, text.length);
      }
    },
  };
}

/** A re-armable one-shot: one side opens it, the other awaits it. */
export function latch() {
  let open!: () => void;
  let done = new Promise<void>((r) => (open = r));
  return {
    open: () => open(),
    wait: () => done,
    reset: () => void (done = new Promise<void>((r) => (open = r))),
  };
}

export const onAbort = (s: AbortSignal) =>
  s.aborted
    ? Promise.resolve()
    : new Promise<void>((r) => s.addEventListener("abort", () => r(), { once: true }));
