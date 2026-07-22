# Streaming (Connect-RPC bridge)

The TextQL API exposes several **server-streaming** RPCs that have no HTTP/JSON
shape in the OpenAPI spec, so they are not part of the generated SDK surface.
This package bridges them with [Connect-RPC](https://connectrpc.com) via
`@textql/sdk/streaming` — a hand-written module that talks the Connect protocol
directly to the same gateway, authenticated with the same API key.

> `chats.streamChat` is also available in the generated SDK as an SSE endpoint
> (`sdk.chats.streamChat(...)`). Everything else below is streaming-bridge-only.

## Usage

```typescript
import { createStreamingClient } from "@textql/sdk/streaming";

const streaming = createStreamingClient({ apiKey: process.env.TEXTQL_API_KEY! });

// Watch a chat: cells, run lifecycle, heartbeats
for await (const event of streaming.chats.watchChat({ chatId })) {
  switch (event.payload.case) {
    case "cell":        /* event.payload.value is a Cell */ break;
    case "runComplete": /* run finished */ break;
    case "heartbeat":   break; // keepalive, safe to ignore
  }
}
```

Streams are async iterables; pass an `AbortSignal` to cancel:

```typescript
const abort = new AbortController();
for await (const update of streaming.agents.streamAgentStatus({}, { signal: abort.signal })) {
  console.log(update.agentId, update.status);
}
```

## Streaming methods

| Method | Emits |
| --- | --- |
| `chats.watchChat({ chatId })` | `WatchChatEvent` (opened, cell, runStarted, runComplete, runError, handoffPending, heartbeat) |
| `chats.streamChat({ chatId, ... })` | `Cell` per update while a run executes |
| `agents.streamAgentStatus({})` | `AgentStatusUpdate` for every visible agent run transition |
| `apps.streamAppActivity({ appId })` | `AppActivityStreamEvent` (activity batches, presence, heartbeat) |
| `dashboards.watchDashboardHealth({ dashboardId })` | `DashboardHealthEvent` on health transitions |
| `playbooks.streamTemplateDataStatus({ templateHeaderId, playbookId })` | `TemplateDataStatusUpdate` per template-data row |

For any other service in `src/generated/connect`, use the escape hatch:

```typescript
import { createConnectClient } from "@textql/sdk/streaming";
import { FeedService } from "@textql/sdk/generated/connect/public/feed_pb.js";

const feed = createConnectClient(FeedService, { apiKey });
```

## Notes

- **Transport**: browsers and Node 18+ (server-streaming rides on `fetch`
  response streams). Client-streaming RPCs are not supported over this
  transport.
- **Types**: streaming methods return protobuf-es message types (vendored under
  `src/generated/connect`), which differ slightly in shape from the generated
  SDK's Zod models for the same protos.
- **Long-lived idle streams** may be closed by intermediary proxies if nothing
  is sent for a while; `watchChat` and `streamAppActivity` send periodic
  heartbeats, the others emit only on activity. Wrap consumption in a
  reconnect loop for anything long-running.

## Regenerating the vendored types

`src/generated/connect` is generated from the platform protos (not by
Speakeasy — it survives `speakeasy run`):

```bash
DEMO2_DIR=/path/to/demo2 ./scripts/generate-connect.sh
```

## Live smoke test

```bash
npm run build
TEXTQL_API_KEY=... node scripts/stream-smoke.mjs agent-status --timeout 90
TEXTQL_API_KEY=... node scripts/stream-smoke.mjs watch-chat <chatId>
TEXTQL_API_KEY=... node scripts/stream-smoke.mjs dashboard-health <dashboardId>
```
