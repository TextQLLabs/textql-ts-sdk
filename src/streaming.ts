import type { DescService } from "@bufbuild/protobuf";
import { type Client, createClient, type Interceptor, type Transport } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";

import { AgentService } from "./generated/connect/public/agent_pb.js";
import { AppService } from "./generated/connect/public/apps_pb.js";
import { ChatService } from "./generated/connect/public/chat_pb.js";
import { DashboardService } from "./generated/connect/public/dashboard_pb.js";
import { PlaybookService } from "./generated/connect/public/playbook_pb.js";

export interface StreamingClientOptions {
  apiKey: string;
  /** Defaults to https://app.textql.com */
  serverURL?: string;
  fetch?: typeof globalThis.fetch;
}

const DEFAULT_SERVER_URL = "https://app.textql.com";

function createTransport(options: StreamingClientOptions): Transport {
  const auth: Interceptor = (next) => (req) => {
    req.header.set("tql_api_key", options.apiKey);
    return next(req);
  };
  return createConnectTransport({
    baseUrl: options.serverURL ?? DEFAULT_SERVER_URL,
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
  options: StreamingClientOptions,
): Client<T> {
  return createClient(service, createTransport(options));
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
 * have no HTTP/JSON shape in the OpenAPI spec. Streaming methods return async
 * iterables:
 *
 *   const streaming = createStreamingClient({ apiKey });
 *   for await (const event of streaming.chats.watchChat({ chatId })) { ... }
 *
 * Server-streaming methods: chats.watchChat, chats.streamChat,
 * agents.streamAgentStatus, apps.streamAppActivity,
 * dashboards.watchDashboardHealth, playbooks.streamTemplateDataStatus.
 * Unary RPCs on these clients work too, but prefer the generated SDK for
 * those.
 */
export function createStreamingClient(options: StreamingClientOptions): StreamingClient {
  const transport = createTransport(options);
  return {
    agents: createClient(AgentService, transport),
    apps: createClient(AppService, transport),
    chats: createClient(ChatService, transport),
    dashboards: createClient(DashboardService, transport),
    playbooks: createClient(PlaybookService, transport),
  };
}

export { AgentService, AppService, ChatService, DashboardService, PlaybookService };
