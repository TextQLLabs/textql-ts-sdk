import type { DescService } from "@bufbuild/protobuf";
import { type Client, createClient, type Interceptor, type Transport } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";

import { ServerList } from "./lib/config.js";
import { ClientSDK } from "./lib/sdks.js";
import { AgentService } from "./generated/connect/public/agent_pb.js";
import { AppService } from "./generated/connect/public/apps_pb.js";
import { ChatService } from "./generated/connect/public/chat_pb.js";
import { DashboardService } from "./generated/connect/public/dashboard_pb.js";
import { PlaybookService } from "./generated/connect/public/playbook_pb.js";

export interface StreamingClientOptions {
  apiKey: string | (() => Promise<string>);
  serverURL?: string;
  fetch?: typeof globalThis.fetch;
}

export type StreamingClientSource = ClientSDK | StreamingClientOptions;

// Connect RPCs are always mounted at /rpc/public on the host. Append it to
// whatever base the caller/SDK provides — idempotently, so a base that already
// carries the prefix isn't doubled.
function rpcBaseUrl(serverURL: string): string {
  const url = new URL(serverURL);
  const base = url.pathname.replace(/\/+$/, "");
  url.pathname = base.endsWith("/rpc/public") ? base : `${base}/rpc/public`;
  return url.toString();
}

function optionsFromSource(source: StreamingClientSource): StreamingClientOptions {
  if (source instanceof ClientSDK) {
    return {
      apiKey: source._options.apiKey ?? "",
      serverURL: source._baseURL?.toString() ?? ServerList[0],
    };
  }
  return source;
}

function createTransport(options: StreamingClientOptions): Transport {
  const { apiKey } = options;
  const auth: Interceptor = (next) => async (req) => {
    req.header.set("tql_api_key", typeof apiKey === "function" ? await apiKey() : apiKey);
    return next(req);
  };
  return createConnectTransport({
    baseUrl: rpcBaseUrl(options.serverURL ?? ServerList[0]),
    interceptors: [auth],
    ...(options.fetch ? { fetch: options.fetch } : {}),
  });
}

export function createConnectClient<T extends DescService>(
  service: T,
  source: StreamingClientSource,
): Client<T> {
  return createClient(service, createTransport(optionsFromSource(source)));
}

export interface StreamingClient {
  agents: Client<typeof AgentService>;
  apps: Client<typeof AppService>;
  chats: Client<typeof ChatService>;
  dashboards: Client<typeof DashboardService>;
  playbooks: Client<typeof PlaybookService>;
}


export function createStreamingClient(source: StreamingClientSource): StreamingClient {
  const transport = createTransport(optionsFromSource(source));
  return {
    agents: createClient(AgentService, transport),
    apps: createClient(AppService, transport),
    chats: createClient(ChatService, transport),
    dashboards: createClient(DashboardService, transport),
    playbooks: createClient(PlaybookService, transport),
  };
}

export { AgentService, AppService, ChatService, DashboardService, PlaybookService };
