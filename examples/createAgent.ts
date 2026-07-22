/**
 * Create an agent, trigger it, list its runs, then clean up.
 *
 * Agents are persistent AI assistants configured with a system prompt.
 * Triggering an agent generates a fresh report based on its prompt.
 *
 *   npm run build && npx tsx createAgent.ts
 */

import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { Textql } from "@textql/sdk";
import { TextqlRpcPublicChatLlmModel, type ConnectError } from "@textql/sdk/models";

dotenv.config(); // examples/.env when run from here
// Fall back to the repo-root .env (resolved relative to this file, not cwd).
dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

// Unary calls resolve to either the response or a ConnectError; both are
// all-optional objects, so narrow with a typed predicate rather than `in`.
const isConnectError = (r: object): r is ConnectError => "code" in r || "details" in r;

async function main() {
  const sdk = new Textql({
    apiKey: process.env["TEXTQL_API_KEY"] ?? "",
    serverURL: process.env["TEXTQL_SERVER_URL"],
  });

  // Create the agent with a strongly typed universal paradigm.
  const created = await sdk.agents.create({
    body: {
      name: "Weekly Revenue Summary",
      prompt: "Summarize total revenue by region for the past 7 days.",
      postingFrequencyCrons: ["0 9 * * *"], // every day at 9 AM UTC
      llmModel: TextqlRpcPublicChatLlmModel.ModelSonnet5,
      paradigmOptions: {
        universal: {
          sqlEnabled: true,
          pythonEnabled: true,
          connectorIds: [1234, 5678], // replace with your connector IDs
        },
      },
    },
  });
  if (isConnectError(created)) throw new Error(`create agent failed: ${created.message}`);
  const agentId = created.agent?.id;
  if (!agentId) throw new Error("create agent returned no agent ID");
  console.log(`Agent created: ${agentId}`);

  // Trigger a run (generates a new report).
  const trigger = await sdk.agents.triggerAgent({ body: { agentId } });
  if (isConnectError(trigger)) throw new Error(`triggerAgent failed: ${trigger.message}`);
  console.log("Agent triggered — check the TextQL UI for the report.");

  // List recent runs.
  const runs = await sdk.agents.listRuns({ body: { agentId } });
  if (isConnectError(runs)) throw new Error(`listRuns failed: ${runs.message}`);
  const recent = runs.runs ?? [];
  console.log(`\nRecent runs: ${recent.length} run(s)`);
  for (const run of recent.slice(0, 3)) {
    console.log(`  ${run.id}  status=${run.status}`);
  }

  // Clean up.
  await sdk.agents.delete({ body: { agentId } });
  console.log(`\nAgent ${agentId} deleted.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
