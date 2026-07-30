/**
 * Create a chat, then watch it stream over the Connect-RPC bridge.
 *
 * Server-streaming RPCs aren't part of the generated SDK surface, so they live
 * in `@textql/sdk/streaming`. Prefer `watchChat` for anything long-lived — it
 * carries run lifecycle events (`runStarted`, `runComplete`, `runError`) plus
 * every cell as it's produced. See STREAMING.md for the other streaming methods.
 *
 *   npm run build && npx tsx watchChat.ts
 *   npm run build && npx tsx watchChat.ts "plot sinx"
 */

import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { Textql } from "@textql/sdk";
import {
  TextqlRpcParadigmParamsParadigmType,
  TextqlRpcPublicChatLlmModel,
  type ConnectError,
} from "@textql/sdk/models";
import { createStreamingClient } from "@textql/sdk/streaming";
// Streaming rides on protobuf-es message types (not the Zod models), so Cell
// comes from the generated Connect stubs.
import type { Cell } from "@textql/sdk/generated/connect/public/chat_pb.js";

dotenv.config(); // examples/.env when run from here
// Fall back to the repo-root .env (resolved relative to this file, not cwd).
dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const isConnectError = (r: object): r is ConnectError => "code" in r || "details" in r;

/** Pull the human-readable text out of a Cell (a oneof over ~50 cell types). */
function cellText(cell: Cell): string {
  const p = cell.value;
  switch (p.case) {
    case "mdCell":
    case "ansCell":
    case "textCell":
    case "thinkingCell":
      return p.value.content || `(${p.case})`;
    case "summaryCell":
      return p.value.summary || `(${p.case})`;
    case "sqlCell":
      return p.value.query || `(${p.case})`;
    case "pyCell":
      return p.value.code || `(${p.case})`;
    case "previewCell":
      return p.value.url
        ? p.value.name
          ? `${p.value.name}: ${p.value.url}`
          : p.value.url
        : `(${p.case})`;
    default:
      return p.case ? `(${p.case})` : "(empty)";
  }
}

async function main() {
  const message = process.argv[2] ?? "plot sinx";

  const sdk = new Textql({
    apiKey: process.env["TEXTQL_API_KEY"] ?? "",
    serverURL: process.env["TEXTQL_SERVER_URL"],
  });
  const streaming = createStreamingClient(sdk);

  // 1) Create the chat (message is the first user turn).
  const created = await sdk.chats.createChat({
    body: {
      message,
      model: TextqlRpcPublicChatLlmModel.ModelSonnet5,
      paradigm: {
        type: TextqlRpcParadigmParamsParadigmType.TypeUniversal,
        version: 1,
        options: {
          universal: {
            sqlEnabled: true,
            pythonEnabled: true,
            connectorIds: [1], // replace with your connector ID(s)
          },
        },
      },
    },
  });
  if (isConnectError(created)) throw new Error(`createChat failed: ${created.message}`);
  const chatId = created.chat?.id;
  if (!chatId) throw new Error("createChat returned no chat ID");
  console.log(`Chat created: ${chatId}`);

  // 2) Open watch before kicking off the run so we don't miss lifecycle events.
  const abort = new AbortController();
  const printed = new Map<string, number>();
  let streamingId = "";

  const watch = (async () => {
    for await (const event of streaming.chats.watchChat({ chatId }, { signal: abort.signal })) {
      switch (event.payload.case) {
        case "opened":
          console.log("watch opened");
          break;
        case "cell": {
          const cell = event.payload.value;
          const text = cellText(cell);
          // New cell → start a fresh, labelled line.
          if (cell.id !== streamingId) {
            if (streamingId) process.stdout.write("\n");
            process.stdout.write(`[${cell.value.case} ${cell.id}] `);
            streamingId = cell.id;
          }
          // Append just the delta (content grows monotonically).
          const already = printed.get(cell.id) ?? 0;
          if (text.length > already) {
            process.stdout.write(text.slice(already));
            printed.set(cell.id, text.length);
          }
          break;
        }
        case "runStarted":
          console.log("run started");
          break;
        case "runComplete":
          if (streamingId) process.stdout.write("\n"); // close the last cell line
          console.log("run complete");
          return;
        case "runError":
          if (streamingId) process.stdout.write("\n");
          throw new Error(`run error: ${JSON.stringify(event.payload.value)}`);
        case "heartbeat":
          break; // keepalive
      }
    }
  })();

  // 3) Start the run; the watch loop receives cells + lifecycle until runComplete.
  const run = await sdk.chats.run({
    body: { chatId, model: TextqlRpcPublicChatLlmModel.ModelSonnet5 },
  });
  if (isConnectError(run)) {
    abort.abort();
    throw new Error(`run failed: ${run.message}`);
  }

  await watch;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
