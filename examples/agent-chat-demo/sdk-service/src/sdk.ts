import { Textql } from "@textql/sdk";
import {
  createConnectClient,
  createStreamingClient,
} from "@textql/sdk/streaming";
import { ConnectorService } from "@textql/sdk/generated/connect/public/connector_pb";
import { DatasetService } from "@textql/sdk/generated/connect/public/dataset_pb";

export type Config = {
  apiKey: string;
  serverURL: string;
  agentId: string;
  token: string;
  port: number;
  usercontentHost: string;
  appHost: string;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const required = (key: string) => {
    const value = env[key]?.trim();
    if (!value) throw new Error(`${key} is required.`);
    return value;
  };
  const serverURL = required("TEXTQL_SERVER_URL");
  const url = new URL(serverURL);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  ) {
    throw new Error(
      "TEXTQL_SERVER_URL must be an HTTP(S) URL without credentials.",
    );
  }
  const port = Number(env.SDK_SERVICE_PORT ?? "8788");
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("Invalid SDK_SERVICE_PORT.");
  return {
    apiKey: required("TEXTQL_API_KEY"),
    agentId: required("TEXTQL_AGENT_ID"),
    token: required("SDK_SERVICE_TOKEN"),
    serverURL: serverURL.replace(/\/$/, ""),
    port,
    usercontentHost: env.VITE_USERCONTENT_HOST || "textqlusercontent.com",
    appHost: env.VITE_APP_HOST || "app.textql.com",
  };
}

export function createSdk(config: Config) {
  const rpcURL = new URL(config.serverURL);
  const base = rpcURL.pathname.replace(/\/+$/, "");
  rpcURL.pathname = base.endsWith("/rpc/public") ? base : `${base}/rpc/public`;
  const sdk = new Textql({
    apiKey: config.apiKey,
    serverURL: rpcURL.toString(),
  });
  const streaming = createStreamingClient(sdk);
  return {
    chats: streaming.chats,
    agents: streaming.agents,
    connectors: createConnectClient(ConnectorService, sdk),
    datasets: createConnectClient(DatasetService, sdk),
    whoAmI: () => sdk.rbac.whoAmI({ body: {} }),
  };
}

export type Sdk = ReturnType<typeof createSdk>;
