/**
 * Create and configure a scheduled playbook.
 *
 * Playbooks are recurring AI reports. This example exercises the core update
 * API surface: scheduling, model, and Slack/email delivery.
 *
 *   npm run build && npx tsx createPlaybook.ts
 */

import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { Textql } from "@textql/sdk";
import {
  TextqlRpcParadigmParamsParadigmType,
  TextqlRpcPublicChatLlmModel,
  TextqlRpcPublicPlaybookPlaybookTriggerType,
  type ConnectError,
} from "@textql/sdk/models";

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

  // 1) Create an empty playbook shell.
  const created = await sdk.playbooks.createPlaybook({ body: {} });
  if (isConnectError(created)) throw new Error(`createPlaybook failed: ${created.message}`);
  const playbookId = created.playbook?.id;
  if (!playbookId) throw new Error("createPlaybook returned no playbook ID");
  console.log(`Playbook created: ${playbookId}`);

  // 2) Configure — name, prompt, schedule, model, paradigm, delivery.
  const updated = await sdk.playbooks.update({
    body: {
      playbookId,
      name: "Daily Revenue Report",
      prompt:
        "Summarize yesterday's revenue by product line. Highlight anomalies and week-over-week changes.",
      triggerType: TextqlRpcPublicPlaybookPlaybookTriggerType.TriggerTypeCron,
      cronString: "0 9 * * *", // 9 AM UTC every day
      llmModel: TextqlRpcPublicChatLlmModel.ModelSonnet5,
      paradigmType: TextqlRpcParadigmParamsParadigmType.TypeUniversal,
      paradigmOptions: {
        universal: {
          sqlEnabled: true,
          pythonEnabled: true,
          connectorIds: [1], // replace with your connector ID(s)
        },
      },
      slackChannelId: "C04NV2UABCD", // replace with your Slack channel ID
      taggedSlackUserIds: { items: ["U03RABC1234"] }, // replace with your Slack user ID
      emailAddresses: { items: ["test@textql.com"] }, // replace with your email
    },
  });
  if (isConnectError(updated)) throw new Error(`update failed: ${updated.message}`);
  console.log(
    `Playbook configured: model=${updated.playbook?.llmModel ?? "n/a"}  ` +
      `cron='${updated.playbook?.cronString ?? "n/a"}'`,
  );

  // 3) Deploy (activates scheduling).
  const deployed = await sdk.playbooks.deploy({ body: { playbookId } });
  if (isConnectError(deployed)) throw new Error(`deploy failed: ${deployed.message}`);
  console.log(`Playbook deployed — runs daily at 9 AM UTC. ID: ${playbookId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
