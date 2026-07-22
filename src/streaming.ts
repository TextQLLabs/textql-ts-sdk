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
  /** Host of your TextQL deployment; defaults to the SDK's configured server. The /rpc/public prefix is appended unless the URL already has a path. */
  serverURL?: string;
  fetch?: typeof globalThis.fetch;
}

/**
 * Either a configured SDK instance (e.g. `new Textql({ apiKey, serverURL })`),
 * whose server and API key are reused, or a standalone options object.
 */
export type StreamingClientSource = ClientSDK | StreamingClientOptions;

// Connect RPCs are mounted under /rpc/public. Callers pass just their host
// (cloud or on-prem); the prefix is appended unless an explicit path is given.
function rpcBaseUrl(serverURL: string): string {
  const url = new URL(serverURL);
  if (url.pathname === "" || url.pathname === "/") {
    url.pathname = "/rpc/public";
  }
  return url.toString();
}

// Pull the resolved server + api key off a configured SDK so streaming inherits
// whatever the caller already set up, rather than re-specifying it.
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

/**
 * Connect-RPC client for a single service. Escape hatch for services not
 * covered by createStreamingClient — any service in src/generated/connect
 * works.
 */
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

/**
 * Streaming bridge over Connect-RPC for the server-streaming endpoints that
 * have no HTTP/JSON shape in the OpenAPI spec. Pass a configured SDK to inherit
 * its server and API key, or a standalone options object. Streaming methods
 * return async iterables:
 *
 *   const sdk = new Textql({ apiKey });     // serverURL optional
 *   const streaming = createStreamingClient(sdk);
 *   for await (const event of streaming.chats.watchChat({ chatId })) { ... }
 *
 * Server-streaming methods: chats.watchChat, chats.streamChat,
 * agents.streamAgentStatus, apps.streamAppActivity,
 * dashboards.watchDashboardHealth, playbooks.streamTemplateDataStatus.
 * Unary RPCs on these clients work too, but prefer the generated SDK for
 * those.
 */
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
