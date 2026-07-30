/**
 * A live interactive chat: one chat, many turns, one stream.
 *
 * `watchChat` attaches to a *chat*, not a run, so one stream spans the whole
 * conversation — `runComplete` ends a turn, not the session. Each turn is `send`
 * then `run`; cells arrive on the stream, not from `run`'s return value.
 *
 *   npm run build && npx tsx interactiveChat.ts [chatId]
 *
 * /exit or Ctrl-D quits. Ctrl-C mid-turn cancels the run first — dropping the
 * stream alone would leave the agent running server-side.
 */

import { fileURLToPath } from "node:url";
import * as readline from "node:readline/promises";
import dotenv from "dotenv";
import { Textql } from "@textql/sdk";
import {
  TextqlRpcParadigmParamsParadigmType,
  TextqlRpcPublicChatLlmModel,
} from "@textql/sdk/models";
import { createStreamingClient } from "@textql/sdk/streaming";
import { assertOk, cellPrinter, isConnectError, latch, onAbort } from "./shared.js";

dotenv.config(); // examples/.env, then the repo-root one (relative to this file)
dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const MODEL = TextqlRpcPublicChatLlmModel.ModelSonnet5;
const RECONNECT_MS = 2000;

async function main() {
  const sdk = new Textql({
    apiKey: process.env["TEXTQL_API_KEY"] ?? "",
    serverURL: process.env["TEXTQL_SERVER_URL"],
  });
  const streaming = createStreamingClient(sdk);

  let chatId = process.argv[2] ?? "";
  if (chatId) {
    console.log(`Resuming chat: ${chatId}`);
  } else {
    // No `message` here: the prompt loop sends every turn, including the first.
    const created = await sdk.chats.createChat({
      body: {
        model: MODEL,
        paradigm: {
          type: TextqlRpcParadigmParamsParadigmType.TypeUniversal,
          version: 1,
          // replace connectorIds with your own
          options: { universal: { sqlEnabled: true, pythonEnabled: true, connectorIds: [1] } },
        },
      },
    });
    if (isConnectError(created)) throw new Error(`createChat failed: ${created.message}`);
    chatId = created.chat?.id ?? "";
    if (!chatId) throw new Error("createChat returned no chat ID");
    console.log(`Chat created: ${chatId}`);
  }

  const { feed, log } = cellPrinter();
  const opened = latch();
  const turnDone = latch();

  // Ctrl-C and Ctrl-D both end the session; prompt and watch share this signal.
  const quit = new AbortController();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.on("SIGINT", () => rl.close());
  rl.on("close", () => quit.abort());

  // One stream for the whole session. Proxies close idle streams, so a drop is
  // normal — replaying `cursor` reattaches without redelivering the whole chat.
  const watch = (async () => {
    let cursor = "";
    while (!quit.signal.aborted) {
      try {
        const stream = streaming.chats.watchChat(
          { chatId, resumeCursor: cursor },
          { signal: quit.signal },
        );
        for await (const { payload, cursor: c } of stream) {
          if (c) cursor = c;
          switch (payload.case) {
            case "cell": feed(payload.value); break;
            case "opened": opened.open(); break;
            case "runStarted": log("--- run started"); break;
            case "runComplete": log("--- run complete"); turnDone.open(); break;
            case "runError": log(`--- run error: ${payload.value.error}`); turnDone.open(); break;
            // A handoff halts the agent with no runComplete coming, so release
            // the prompt: the next message is the answer.
            case "handoffPending":
              log(`--- waiting for your input (${payload.value.handoffMarker})`);
              turnDone.open();
              break;
            case "heartbeat": break; // keepalive
          }
        }
      } catch (err) {
        if (quit.signal.aborted) return;
        log(`--- stream dropped (${err instanceof Error ? err.message : String(err)})`);
      }
      if (!quit.signal.aborted) await new Promise((r) => setTimeout(r, RECONNECT_MS));
    }
  })();

  try {
    await Promise.race([opened.wait(), onAbort(quit.signal)]);

    while (!quit.signal.aborted) {
      let message: string;
      try {
        message = (await rl.question("\nyou> ", { signal: quit.signal })).trim();
      } catch {
        break; // aborted at the prompt
      }
      if (!message) continue;
      if (message === "/exit" || message === "/quit") break;

      turnDone.reset();
      assertOk(await sdk.chats.send({ body: { chatId, message } }), "send");

      // `run` only resolves once the turn ends, and the stream can still be
      // draining after it does — so wait on both, but let a `run` rejection
      // through immediately, since a failed run emits no runComplete.
      const run = sdk.chats.run({ body: { chatId, model: MODEL } })
        .then((r) => assertOk(r, "run"));
      await Promise.race([Promise.all([run, turnDone.wait()]), onAbort(quit.signal)]);

      if (quit.signal.aborted) {
        void run.catch(() => {}); // leaving; don't surface a late rejection
        log("--- cancelling run"); // abandoning the stream wouldn't stop it
        await sdk.chats.cancelStream({ body: { chatId } });
        break;
      }
    }
  } finally {
    quit.abort();
    rl.close();
    await watch;
    console.log(`\nresume with: npx tsx interactiveChat.ts ${chatId}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
