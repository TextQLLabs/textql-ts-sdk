#!/usr/bin/env node
// Live smoke test for the Connect streaming bridge. Opens a real stream
// against the API and prints events until Ctrl-C or --timeout elapses.
//
// Usage:
//   TEXTQL_API_KEY=... node scripts/stream-smoke.mjs agent-status
//   TEXTQL_API_KEY=... node scripts/stream-smoke.mjs watch-chat <chatId>
//   TEXTQL_API_KEY=... TEXTQL_SERVER_URL=... node scripts/stream-smoke.mjs agent-status --timeout 30
//
// Requires a build first: npm run build

import { createStreamingClient } from "../esm/streaming.js";

const apiKey = process.env.TEXTQL_API_KEY;
if (!apiKey) {
  console.error("TEXTQL_API_KEY is required");
  process.exit(1);
}

const args = process.argv.slice(2);
const mode = args[0] ?? "agent-status";
const timeoutIdx = args.indexOf("--timeout");
const timeoutSec = timeoutIdx === -1 ? 120 : Number(args[timeoutIdx + 1]);

const streaming = createStreamingClient({
  apiKey,
  ...(process.env.TEXTQL_SERVER_URL ? { serverURL: process.env.TEXTQL_SERVER_URL } : {}),
});

const abort = new AbortController();
setTimeout(() => abort.abort(), timeoutSec * 1000);
process.on("SIGINT", () => abort.abort());

function openStream() {
  const signal = abort.signal;
  switch (mode) {
    case "agent-status":
      return streaming.agents.streamAgentStatus({}, { signal });
    case "watch-chat": {
      const chatId = args[1];
      if (!chatId) throw new Error("watch-chat requires a chatId argument");
      return streaming.chats.watchChat({ chatId }, { signal });
    }
    case "dashboard-health": {
      const dashboardId = args[1];
      if (!dashboardId) throw new Error("dashboard-health requires a dashboardId argument");
      return streaming.dashboards.watchDashboardHealth({ dashboardId }, { signal });
    }
    default:
      throw new Error(`unknown mode: ${mode} (agent-status | watch-chat | dashboard-health)`);
  }
}

console.error(`[smoke] opening ${mode} stream (timeout ${timeoutSec}s) ...`);
const startedAt = Date.now();
let events = 0;

try {
  for await (const event of openStream()) {
    events += 1;
    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log(`[${elapsed}s] event #${events}:`, JSON.stringify(event, (_, v) => (typeof v === "bigint" ? v.toString() : v)));
  }
  console.error(`[smoke] stream ended cleanly after ${events} event(s)`);
} catch (err) {
  if (abort.signal.aborted) {
    console.error(`[smoke] aborted after ${((Date.now() - startedAt) / 1000).toFixed(1)}s with ${events} event(s) — stream stayed open until abort ✓`);
  } else {
    console.error(`[smoke] stream failed after ${events} event(s):`, err);
    process.exit(1);
  }
}
