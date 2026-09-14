import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { fromJson, toJson, type JsonObject } from "@bufbuild/protobuf";
import {
  timestampDate,
  timestampFromDate,
  type Timestamp,
} from "@bufbuild/protobuf/wkt";
import {
  CellSchema,
  ChatSortDirection,
  ChatSortField,
  ChatSource,
  ChatSourceSchema,
  SubmitQuestionsRequestSchema,
  WatchChatEventSchema,
  WatchChatRequestSchema,
  type Cell,
} from "@textql/sdk/generated/connect/public/chat_pb";
import { ConnectorType } from "@textql/sdk/generated/connect/public/connector_pb";
import { LlmModel } from "@textql/sdk/generated/connect/public/llm_model_pb";
import { ParadigmType } from "@textql/sdk/generated/connect/paradigm_params_pb";
import type { MessageInitShape } from "@bufbuild/protobuf";
import { GetChatsRequestSchema } from "@textql/sdk/generated/connect/public/chat_pb";
import {
  authenticated,
  booleanField,
  errorResponse,
  HttpError,
  integerParam,
  json,
  readFile,
  readJson,
  stringField,
  writeSse,
} from "./http.js";
import { fileFromCell, uploadFile } from "./files.js";
import { previewProxy } from "./preview.js";
import { createSdk, type Config, type Sdk } from "./sdk.js";

const sourceLabels: Partial<Record<ChatSource, string>> = {
  [ChatSource.THREAD]: "Thread",
  [ChatSource.PLAYBOOK]: "Playbook",
  [ChatSource.SLACK]: "Slack",
  [ChatSource.FEED]: "Feed",
  [ChatSource.TEAMS]: "Teams",
  [ChatSource.SMS]: "SMS",
  [ChatSource.MCP]: "MCP",
  [ChatSource.SYSTEM]: "System",
};

const sortFields: Record<string, ChatSortField> = {
  updated: ChatSortField.UPDATED_AT,
  created: ChatSortField.CREATED_AT,
  name: ChatSortField.NAME,
};

export function chatFilters(params: URLSearchParams): {
  request: MessageInitShape<typeof GetChatsRequestSchema>;
  page: number;
  limit: number;
  offset: number;
} {
  const page = integerParam(params, "page", 0, 0);
  const limit = params.has("page")
    ? integerParam(params, "page_size", 30, 1, 100)
    : integerParam(params, "limit", 10, 1, 100);
  const offset = params.has("page")
    ? page * limit
    : integerParam(params, "offset", 0, 0);
  if (offset > 2_147_483_647)
    throw new HttpError(400, "Pagination offset is too large.");
  const request: MessageInitShape<typeof GetChatsRequestSchema> = {
    memberOnly: false,
    limit,
    offset,
    excludeBatchRuns: true,
    searchTerm: (params.get("q") || params.get("search_term") || "").trim(),
    creatorMemberIds: params.getAll("creator"),
    sources: params.getAll("source").flatMap((name) => {
      const value = ChatSourceSchema.values.find(
        (value) => value.name === name,
      );
      return value ? [value.number] : [];
    }),
    sortBy:
      sortFields[params.get("sort") ?? "updated"] ?? ChatSortField.UPDATED_AT,
    sortDirection:
      params.get("dir") === "asc"
        ? ChatSortDirection.ASC
        : ChatSortDirection.DESC,
    bookmarkedOnly: params.getAll("scope").includes("bookmarked"),
    sharedWithMe: params.getAll("scope").includes("shared"),
  };
  const date = params.get("date") ?? "";
  const presetDays: Record<string, number> = {
    today: 1,
    week: 7,
    month: 30,
    quarter: 90,
  };
  if (presetDays[date])
    request.createdAfter = timestampFromDate(
      new Date(Date.now() - presetDays[date] * 86400_000),
    );
  if (/^since:\d{4}-\d{2}-\d{2}$/.test(date)) {
    const parsed = new Date(date.slice(6) + "T00:00:00Z");
    if (
      Number.isFinite(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === date.slice(6)
    ) {
      request.createdAfter = timestampFromDate(parsed);
    }
  }
  return { request, page, limit, offset };
}

function iso(value: Timestamp | undefined): string | null {
  return value && (value.seconds || value.nanos)
    ? timestampDate(value).toISOString()
    : null;
}

async function history(
  sdk: Sdk,
  chatId: string,
  signal: AbortSignal,
  limit = 200,
  skip = 0,
  allPages = true,
): Promise<Cell[]> {
  const cells: Cell[] = [];
  for (;;) {
    const page = await sdk.chats.getChatHistory(
      { chatId, limit, skip },
      { signal },
    );
    cells.push(...page.cells);
    skip += page.cells.length;
    if (!allPages || !page.hasMore || !page.cells.length) return cells;
  }
}

async function attachedFiles(sdk: Sdk, chatId: string, signal: AbortSignal) {
  const cells = await history(sdk, chatId, signal);
  const files = new Map<string, NonNullable<ReturnType<typeof fileFromCell>>>();
  for (const cell of cells) {
    const file = fileFromCell(cell);
    if (file) files.set(file.id, file);
  }
  return [...files.values()];
}

async function requireAgent(
  sdk: Sdk,
  config: Config,
  chatId: string,
  signal: AbortSignal,
): Promise<void> {
  const { chat } = await sdk.chats.getChat({ chatId }, { signal });
  if (!chat) throw new HttpError(404, "Chat not found.");
  if (chat.agentId !== config.agentId)
    throw new HttpError(
      409,
      "This chat does not use the configured agent. Start a new chat to send messages or upload files.",
    );
}

export async function* watchEvents(
  sdk: Sdk,
  request: MessageInitShape<typeof WatchChatRequestSchema>,
  stopOnComplete: boolean,
  signal: AbortSignal,
  watchdogMs = 30_000,
): AsyncGenerator<JsonObject> {
  const controller = new AbortController();
  const combined = AbortSignal.any([signal, controller.signal]);
  const iterator = sdk.chats
    .watchChat(request, { signal: combined })
    [Symbol.asyncIterator]();
  const timeout = Symbol("timeout");
  try {
    while (!combined.aborted) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const deadline = new Promise<typeof timeout>((resolve) => {
        timer = setTimeout(() => resolve(timeout), watchdogMs);
      });
      let next;
      try {
        next = await Promise.race([iterator.next(), deadline]);
      } finally {
        clearTimeout(timer);
      }
      if (next === timeout) {
        controller.abort();
        yield { type: "timeout" };
        return;
      }
      if (next.done) {
        yield { type: "streamEnded" };
        return;
      }
      const type = next.value.payload.case ?? "unknown";
      yield {
        type,
        ...(toJson(WatchChatEventSchema, next.value) as JsonObject),
      };
      if (stopOnComplete && (type === "runComplete" || type === "runError"))
        return;
    }
  } finally {
    controller.abort();
    await iterator.return?.().catch(() => undefined);
  }
}

export function createService(
  config: Config,
  sdk: Sdk = createSdk(config),
  fetcher: typeof fetch = fetch,
) {
  async function route(
    request: IncomingMessage,
    response: ServerResponse,
    signal: AbortSignal,
  ): Promise<void> {
    if (!authenticated(request, config.token))
      throw new HttpError(401, "Private SDK service authentication required.");
    const url = new URL(request.url ?? "/", "http://localhost");
    const path = url.pathname;
    const method = request.method;
    if (method === "GET" && path === "/health") {
      json(response, { status: "ok" });
      return;
    }
    const base = "/v3/textql";
    if (method === "GET" && path === `${base}/config`) {
      const [identity, agent] = await Promise.all([
        sdk.whoAmI().catch(() => undefined),
        sdk.agents.getAgent({ agentId: config.agentId }, { signal }),
      ]);
      const email =
        identity && "email" in identity && typeof identity.email === "string"
          ? identity.email.trim() || null
          : null;
      json(response, {
        app_url: config.serverURL,
        email,
        agent_id: config.agentId,
        uploads_enabled: true,
        agent_name: agent.agent?.name ?? null,
        model:
          agent.agent?.llmModel === undefined
            ? null
            : (LlmModel[agent.agent.llmModel] ?? null),
      });
      return;
    }
    if (method === "GET" && path === `${base}/connectors`) {
      const result = await sdk.connectors.getConnectors({}, { signal });
      json(response, {
        connectors: result.connectors.map((connector) => ({
          id: connector.id,
          name: connector.name || `Connector ${connector.id}`,
          type: ConnectorType[connector.connectorType] ?? "UNKNOWN",
        })),
      });
      return;
    }
    if (method === "GET" && path === `${base}/chats/members`) {
      const result = await sdk.chats.getMembersWithChats({}, { signal });
      json(response, {
        members: result.members
          .filter((member) => member.memberId)
          .map((member) => ({
            id: member.memberId,
            name: member.memberName || null,
            email: member.memberEmail || null,
            pictureUrl: member.memberPictureUrl || null,
          })),
      });
      return;
    }
    if (method === "GET" && path === `${base}/chats`) {
      const filters = chatFilters(url.searchParams);
      const result = await sdk.chats.getChats(filters.request, { signal });
      const chats = result.chats.map((chat) => {
        const updated = iso(chat.updatedAt) ?? iso(chat.timestamp);
        return {
          id: chat.id,
          summary: chat.summary || null,
          updated_at: updated,
          is_running: !!chat.isRunning,
          title: chat.summary?.trim() || chat.preview?.trim() || "New chat",
          createdBy:
            chat.agentName?.trim() || chat.creatorEmail?.trim() || null,
          source:
            chat.source === undefined
              ? null
              : (sourceLabels[chat.source] ?? null),
          lastMessageAt: updated,
          updatedAt: updated,
        };
      });
      const total = result.totalCount;
      const hasMore = total > filters.offset + chats.length;
      json(response, {
        chats,
        total_count: total,
        has_more: hasMore,
        page: filters.page,
        pageSize: filters.limit,
        totalCount: total,
        hasMore,
      });
      return;
    }
    if (method === "POST" && path === `${base}/chats`) {
      await readJson(request);
      const created = await sdk.chats.createChat(
        {
          model: LlmModel.MODEL_UNKNOWN,
          paradigm: {
            type: ParadigmType.TYPE_UNIVERSAL,
            version: 1,
            options: { options: { case: "universal", value: {} } },
          },
        },
        { signal },
      );
      const chatId = created.chat?.id;
      if (!chatId)
        throw new HttpError(502, "TextQL returned a chat without an ID.");
      try {
        const attached = await sdk.chats.attachAgentToChat(
          { chatId, agentId: config.agentId },
          { signal },
        );
        if (
          attached.chat?.id !== chatId ||
          attached.chat.agentId !== config.agentId
        ) {
          throw new HttpError(
            502,
            "TextQL did not confirm the agent attachment.",
          );
        }
      } catch {
        try {
          await sdk.chats.deleteChat(
            { chatId },
            { signal: AbortSignal.timeout(30_000) },
          );
        } catch {
          throw new HttpError(
            502,
            "Agent attachment failed and cleanup could not be confirmed. No messages were sent. Check your TextQL chat list before retrying.",
          );
        }
        throw new HttpError(
          502,
          "Agent attachment failed. The partial chat was deleted and no messages were sent.",
        );
      }
      json(response, { chat_id: chatId });
      return;
    }
    if (method === "POST" && path === `${base}/questions`) {
      const body = await readJson(request);
      const action = stringField(body.action, "action");
      if (action !== "submit" && action !== "dismiss")
        throw new HttpError(400, "action must be submit or dismiss.");
      let payload;
      try {
        payload = fromJson(SubmitQuestionsRequestSchema, {
          cellId: stringField(body.cellId, "cellId"),
          answers: body.answers ?? [],
        } as JsonObject);
      } catch {
        throw new HttpError(400, "Invalid question answers.");
      }
      if (action === "submit")
        await sdk.chats.submitQuestions(payload, { signal });
      else
        await sdk.chats.dismissQuestions(
          { cellId: payload.cellId, answers: payload.answers },
          { signal },
        );
      json(response, { success: true });
      return;
    }
    const resolve = path.match(/^\/v3\/textql\/cells\/([^/]+)\/resolve$/);
    if (method === "POST" && resolve) {
      const cellId = decodeURIComponent(resolve[1]!);
      const body = await readJson(request);
      const key = `${body.kind}:${body.action}`;
      switch (key) {
        case "ontology:approve":
          await sdk.chats.approveOntologyChange({ cellId }, { signal });
          break;
        case "ontology:reject":
          await sdk.chats.rejectOntologyChange({ cellId }, { signal });
          break;
        case "context_prompt:approve":
          await sdk.chats.approveContextPromptChange({ cellId }, { signal });
          break;
        case "context_prompt:reject":
          await sdk.chats.rejectContextPromptChange({ cellId }, { signal });
          break;
        default:
          throw new HttpError(400, "Invalid resolution kind or action.");
      }
      json(response, { cell_id: cellId, kind: body.kind, action: body.action });
      return;
    }
    if (method === "GET" && path === `${base}/preview-proxy`) {
      await previewProxy(url.searchParams, config, response, fetcher, signal);
      return;
    }
    const chatRoute = path.match(
      /^\/v3\/textql\/chats\/([^/]+)(?:\/(history|send|watch|files))?$/,
    );
    if (!chatRoute) throw new HttpError(404, "Route not found.");
    const chatId = decodeURIComponent(chatRoute[1]!);
    const operation = chatRoute[2];
    if (method === "DELETE" && !operation) {
      json(response, { chat_id: chatId, status: "closed_client_side" });
      return;
    }
    if (method === "GET" && operation === "history") {
      const allPages = ["true", "1"].includes(
        url.searchParams.get("all_pages") ?? "",
      );
      const limit = integerParam(
        url.searchParams,
        "limit",
        allPages ? 200 : 50,
        1,
        200,
      );
      const skip = integerParam(url.searchParams, "skip", 0, 0);
      const cells = await history(sdk, chatId, signal, limit, skip, allPages);
      json(response, {
        chat_id: chatId,
        cells: cells.map((cell) => toJson(CellSchema, cell)),
        total_cells: cells.length,
      });
      return;
    }
    if (method === "GET" && operation === "files") {
      json(response, { files: await attachedFiles(sdk, chatId, signal) });
      return;
    }
    if (method === "POST" && operation === "files") {
      await requireAgent(sdk, config, chatId, signal);
      const file = await readFile(request);
      const attached = await uploadFile(sdk, chatId, file, fetcher, signal);
      const files = await attachedFiles(sdk, chatId, signal);
      if (!files.some((file) => file.id === attached.id)) {
        throw new HttpError(
          502,
          "The attachment was not found in chat history. Reload the chat before retrying.",
        );
      }
      json(response, { files });
      return;
    }
    if (
      (method === "POST" && operation === "send") ||
      (method === "GET" && operation === "watch")
    ) {
      const sending = operation === "send";
      const body = sending ? await readJson(request) : {};
      const latest = stringField(
        sending
          ? body.latest_cell_id
          : (url.searchParams.get("latest_cell_id") ?? undefined),
        "latest_cell_id",
        "",
      );
      const streaming = booleanField(body.stream, "stream", true);
      let cellId = "";
      if (sending) {
        const message = stringField(body.message, "message");
        const steering = booleanField(body.steering, "steering", false);
        await requireAgent(sdk, config, chatId, signal);
        const sent = await sdk.chats.sendMessage(
          { chatId, message, steering },
          { signal },
        );
        cellId = sent.cellId;
      }
      const events = watchEvents(
        sdk,
        {
          chatId,
          latestCompleteCellId: latest || undefined,
          resumeCursor: sending
            ? undefined
            : url.searchParams.get("cursor") || undefined,
        },
        sending,
        signal,
      );
      if (streaming) {
        response.writeHead(200, {
          "content-type": "text/event-stream",
          "cache-control": "no-cache",
          "x-accel-buffering": "no",
          ...(sending
            ? {
                "x-cell-id": cellId,
                "access-control-expose-headers": "X-Cell-Id",
              }
            : {}),
        });
        response.flushHeaders();
        for await (const event of events)
          await writeSse(response, event, signal);
        response.end();
        return;
      }
      const cells = new Map<string, JsonObject>();
      let finalCellId = "";
      let error: string | null = null;
      for await (const event of events) {
        if (event.type === "cell") {
          const cell = event.cell as JsonObject;
          cells.set(String(cell.id), cell);
        } else if (event.type === "runComplete")
          finalCellId = String(
            (event.runComplete as JsonObject).finalCellId ?? "",
          );
        else if (event.type === "runError")
          error = String((event.runError as JsonObject).error ?? "Run failed.");
        else if (event.type === "timeout" || event.type === "streamEnded")
          error = "Stream ended before the run completed.";
      }
      json(response, {
        chat_id: chatId,
        cell_id: cellId,
        final_cell_id: finalCellId,
        cells: [...cells.values()],
        error,
      });
      return;
    }
    throw new HttpError(404, "Route not found.");
  }

  const server = createServer((request, response) => {
    const controller = new AbortController();
    response.once("close", () => controller.abort());
    void route(request, response, controller.signal).catch((error: unknown) =>
      errorResponse(response, error),
    );
  });
  server.requestTimeout = 180_000;
  server.headersTimeout = 30_000;
  return server;
}
