import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import { test, type TestContext } from "node:test";
import { create, type JsonObject } from "@bufbuild/protobuf";
import { EmptySchema, timestampFromDate } from "@bufbuild/protobuf/wkt";
import { Code, ConnectError } from "@connectrpc/connect";
import {
  AttachAgentToChatResponseSchema,
  AttachDatasetResponseSchema,
  CellSchema,
  ChatSchema,
  ChatSortDirection,
  ChatSortField,
  ChatSource,
  CreateResponseSchema,
  GetChatResponseSchema,
  GetChatsResponseSchema,
  GetMembersWithChatsResponseSchema,
  HistoryResponseSchema,
  SendResponseSchema,
  SubmitQuestionsResponseSchema,
  DismissQuestionsResponseSchema,
  ApproveOntologyChangeResponseSchema,
  RejectOntologyChangeResponseSchema,
  ApproveContextPromptChangeResponseSchema,
  RejectContextPromptChangeResponseSchema,
  WatchChatEventSchema,
} from "@textql/sdk/generated/connect/public/chat_pb";
import {
  CreateUploadPresignUrlResponseSchema,
  DatasetSchema,
  DatasetType,
  ProcessUploadPresignUrlResponseSchema,
} from "@textql/sdk/generated/connect/public/dataset_pb";
import { GetAgentResponseSchema } from "@textql/sdk/generated/connect/public/agent_pb";
import {
  GetConnectorsResponseSchema,
  ConnectorType,
} from "@textql/sdk/generated/connect/public/connector_pb";
import { LlmModel } from "@textql/sdk/generated/connect/public/llm_model_pb";
import { createService, watchEvents } from "../src/server.js";
import { createSdk, loadConfig, type Config, type Sdk } from "../src/sdk.js";
import { MAX_FILE_BYTES } from "../src/http.js";
import { classifyFile } from "../src/files.js";

const config: Config = {
  apiKey: "test-api-key",
  serverURL: "https://api.example.test/rpc/public",
  agentId: "fixed-agent",
  token: "test-private-token",
  port: 8788,
  usercontentHost: "textqlusercontent.com",
  appHost: "app.textql.com",
};
const attachedChat = create(ChatSchema, {
  id: "chat-1",
  agentId: config.agentId,
});
const empty = () => create(EmptySchema);

function client<T extends object>(overrides: Partial<T>): T {
  return new Proxy(overrides, {
    get(target, key) {
      if (key in target) return Reflect.get(target, key);
      return () => {
        throw new Error(`Unexpected SDK call: ${String(key)}`);
      };
    },
  }) as T;
}

function mockSdk(
  overrides: {
    chats?: Partial<Sdk["chats"]>;
    datasets?: Partial<Sdk["datasets"]>;
    agents?: Partial<Sdk["agents"]>;
    connectors?: Partial<Sdk["connectors"]>;
    whoAmI?: Sdk["whoAmI"];
  } = {},
): Sdk {
  return {
    chats: client<Sdk["chats"]>({
      getChat: async () =>
        create(GetChatResponseSchema, { chat: attachedChat }),
      ...overrides.chats,
    }),
    datasets: client<Sdk["datasets"]>(overrides.datasets ?? {}),
    agents: client<Sdk["agents"]>(overrides.agents ?? {}),
    connectors: client<Sdk["connectors"]>(overrides.connectors ?? {}),
    whoAmI:
      overrides.whoAmI ?? (async () => ({ email: "person@example.test" })),
  };
}

async function start(
  t: TestContext,
  sdk = mockSdk(),
  fetcher: typeof fetch = async () => {
    throw new Error("Unexpected fetch");
  },
) {
  const server = createService(config, sdk, fetcher);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    const closed = once(server, "close");
    server.closeAllConnections();
    server.close();
    await closed;
  });
  const address = server.address();
  assert(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  return {
    base,
    request: (path: string, init: RequestInit = {}) =>
      fetch(base + path, {
        ...init,
        headers: { "X-SDK-Token": config.token, ...init.headers },
      }),
  };
}

const post = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});
const events = (text: string): JsonObject[] =>
  text
    .trim()
    .split("\n\n")
    .map((frame) => JSON.parse(frame.slice(6)) as JsonObject);

test("configuration requires all secrets and accepts the RPC base URL", () => {
  const env = {
    TEXTQL_API_KEY: config.apiKey,
    TEXTQL_SERVER_URL: config.serverURL,
    TEXTQL_AGENT_ID: config.agentId,
    SDK_SERVICE_TOKEN: config.token,
  };
  assert.equal(loadConfig(env).serverURL, config.serverURL);
  assert.equal(loadConfig(env).port, 8788);
  for (const key of Object.keys(env))
    assert.throws(() => loadConfig({ ...env, [key]: "" }), /required/);
  assert.throws(
    () => loadConfig({ ...env, TEXTQL_SERVER_URL: "file:///tmp/secret" }),
    /HTTP/,
  );
});

test("real SDK transports normalize host and RPC URLs and keep API credentials server-side", async (t) => {
  const paths: string[] = [];
  const upstream = createServer((request, response) => {
    paths.push(request.url ?? "");
    assert.equal(request.headers.tql_api_key, config.apiKey);
    assert.equal(request.headers["x-sdk-token"], undefined);
    response.writeHead(200, { "content-type": "application/json" });
    response.end(
      request.url?.endsWith("WhoAmI")
        ? JSON.stringify({ email: "sdk@example.test" })
        : JSON.stringify({ agent: { id: config.agentId, name: "SDK Agent" } }),
    );
  });
  upstream.listen(0, "127.0.0.1");
  await once(upstream, "listening");
  t.after(() => {
    upstream.closeAllConnections();
    upstream.close();
  });
  const address = upstream.address();
  assert(address && typeof address !== "string");
  for (const suffix of ["", "/rpc/public", "/rpc/public/"]) {
    const sdk = createSdk({
      ...config,
      serverURL: `http://127.0.0.1:${address.port}${suffix}`,
    });
    const identity = await sdk.whoAmI();
    assert("email" in identity && identity.email === "sdk@example.test");
    const agent = await sdk.agents.getAgent({ agentId: config.agentId });
    assert.equal(agent.agent?.name, "SDK Agent");
  }
  assert.equal(paths.length, 6);
  for (const path of paths)
    assert.match(
      path,
      /^\/rpc\/public\/textql\.rpc\.public\.(?:rbac\.RBACService\/WhoAmI|agent\.AgentService\/GetAgent)$/,
    );
});

test("every endpoint, including readiness, requires the private token", async (t) => {
  const app = await start(t);
  for (const path of ["/health", "/v3/textql/chats", "/v3/textql/config"]) {
    const response = await fetch(app.base + path);
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      detail: "Private SDK service authentication required.",
    });
  }
  assert.equal(
    (
      await app.request("/health", {
        headers: { "X-SDK-Token": "wrong-token" },
      })
    ).status,
    401,
  );
  assert.deepEqual(await (await app.request("/health")).json(), {
    status: "ok",
  });
});

test("create waits for attachment and ignores browser agent/model/tool overrides", async (t) => {
  const calls: string[] = [];
  const app = await start(
    t,
    mockSdk({
      chats: {
        createChat: async (request) => {
          calls.push("create");
          assert.equal(request.message, undefined);
          assert.equal(request.model, LlmModel.MODEL_UNKNOWN);
          return create(CreateResponseSchema, { chat: { id: "chat-1" } });
        },
        attachAgentToChat: async (request) => {
          calls.push("attach");
          assert.deepEqual(request, {
            chatId: "chat-1",
            agentId: "fixed-agent",
          });
          return create(AttachAgentToChatResponseSchema, {
            chat: attachedChat,
          });
        },
      },
    }),
  );
  const response = await app.request(
    "/v3/textql/chats",
    post({
      agent_id: "injected",
      model: "invalid",
      connector_ids: [999],
      message: "never send this",
    }),
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { chat_id: "chat-1" });
  assert.deepEqual(calls, ["create", "attach"]);
});

for (const invalidResponse of [false, true]) {
  test(`create deletes an unconfirmed partial chat (${invalidResponse ? "missing attachment confirmation" : "RPC failure"})`, async (t) => {
    const calls: string[] = [];
    const app = await start(
      t,
      mockSdk({
        chats: {
          createChat: async () => {
            calls.push("create");
            return create(CreateResponseSchema, { chat: { id: "partial" } });
          },
          attachAgentToChat: async () => {
            calls.push("attach");
            if (invalidResponse) return create(AttachAgentToChatResponseSchema);
            throw new ConnectError(
              "upstream contains a secret",
              Code.PermissionDenied,
            );
          },
          deleteChat: async (request) => {
            calls.push("delete");
            assert.equal(request.chatId, "partial");
            return empty();
          },
        },
      }),
    );
    const response = await app.request("/v3/textql/chats", post({}));
    assert.equal(response.status, 502);
    const body = await response.text();
    assert.match(body, /partial chat was deleted/);
    assert.doesNotMatch(body, /chat_id|upstream contains a secret/);
    assert.deepEqual(calls, ["create", "attach", "delete"]);
  });
}

test("create surfaces cleanup failure and does not return a usable chat id", async (t) => {
  const app = await start(
    t,
    mockSdk({
      chats: {
        createChat: async () =>
          create(CreateResponseSchema, { chat: { id: "partial" } }),
        attachAgentToChat: async () => {
          throw new Error("attach failed");
        },
        deleteChat: async () => {
          throw new Error("delete failed");
        },
      },
    }),
  );
  const response = await app.request("/v3/textql/chats", post({}));
  assert.equal(response.status, 502);
  assert.match(await response.text(), /cleanup could not be confirmed/);
});

test("existing chats cannot send or upload through a different agent", async (t) => {
  const app = await start(
    t,
    mockSdk({
      chats: {
        getChat: async () =>
          create(GetChatResponseSchema, {
            chat: { id: "chat-1", agentId: "other" },
          }),
      },
    }),
  );
  assert.equal(
    (
      await app.request(
        "/v3/textql/chats/chat-1/send",
        post({ message: "hello" }),
      )
    ).status,
    409,
  );
  assert.equal(
    (
      await app.request("/v3/textql/chats/chat-1/files", {
        method: "POST",
        body: new FormData(),
      })
    ).status,
    409,
  );
});

test("config reports fixed agent settings and safe identity fallback", async (t) => {
  const app = await start(
    t,
    mockSdk({
      agents: {
        getAgent: async (request) => {
          assert.equal(request.agentId, config.agentId);
          return create(GetAgentResponseSchema, {
            agent: {
              id: config.agentId,
              name: "Analyst",
              llmModel: LlmModel.MODEL_OPUS_4_8,
            },
          });
        },
      },
      whoAmI: async () => ({ email: " analyst@example.test " }),
    }),
  );
  const payload = await (await app.request("/v3/textql/config")).json();
  assert.deepEqual(payload, {
    app_url: config.serverURL,
    email: "analyst@example.test",
    agent_id: config.agentId,
    uploads_enabled: true,
    agent_name: "Analyst",
    model: "MODEL_OPUS_4_8",
  });
  assert.doesNotMatch(
    JSON.stringify(payload),
    /test-api-key|test-private-token/,
  );
});

test("list mirrors every ThreadsPage filter and both pagination dialects", async (t) => {
  let calls = 0;
  const app = await start(
    t,
    mockSdk({
      chats: {
        getChats: async (request) => {
          calls++;
          assert.equal(request.memberOnly, false);
          assert.equal(request.excludeBatchRuns, true);
          if (calls === 1) {
            assert.equal(request.limit, 7);
            assert.equal(request.offset, 14);
            assert.equal(request.searchTerm, "analysis");
            assert.deepEqual(request.creatorMemberIds, ["one", "two"]);
            assert.deepEqual(request.sources, [ChatSource.SLACK]);
            assert.equal(request.bookmarkedOnly, true);
            assert.equal(request.sharedWithMe, true);
            assert.equal(request.sortBy, ChatSortField.NAME);
            assert.equal(request.sortDirection, ChatSortDirection.ASC);
            assert.equal(request.createdAfter?.seconds, 1735689600n);
          } else {
            assert.equal(request.limit, 9);
            assert.equal(request.offset, 3);
          }
          return create(GetChatsResponseSchema, {
            totalCount: 40,
            chats: [
              {
                id: "chat-1",
                summary: "Summary",
                agentName: "Agent",
                source: ChatSource.SLACK,
                isRunning: true,
                updatedAt: timestampFromDate(new Date("2025-01-02T00:00:00Z")),
              },
            ],
          });
        },
      },
    }),
  );
  const payload = await (
    await app.request(
      "/v3/textql/chats?page=2&page_size=7&limit=99&offset=999&q=%20analysis%20&creator=one&creator=two&source=CHAT_SOURCE_SLACK&source=UNKNOWN&scope=bookmarked&scope=shared&sort=name&dir=asc&date=since:2025-01-01",
    )
  ).json();
  assert.equal(payload.pageSize, 7);
  assert.equal(payload.total_count, 40);
  assert.equal(payload.totalCount, 40);
  assert.equal(payload.hasMore, true);
  assert.equal(payload.has_more, true);
  assert.deepEqual(payload.chats[0], {
    id: "chat-1",
    summary: "Summary",
    title: "Summary",
    createdBy: "Agent",
    source: "Slack",
    is_running: true,
    updated_at: "2025-01-02T00:00:00.000Z",
    updatedAt: "2025-01-02T00:00:00.000Z",
    lastMessageAt: "2025-01-02T00:00:00.000Z",
  });
  assert.equal(
    (await app.request("/v3/textql/chats?limit=9&offset=3")).status,
    200,
  );
  assert.equal((await app.request("/v3/textql/chats?limit=0")).status, 400);
});

test("member facets and connectors preserve the existing frontend shapes", async (t) => {
  const app = await start(
    t,
    mockSdk({
      chats: {
        getMembersWithChats: async () =>
          create(GetMembersWithChatsResponseSchema, {
            members: [
              {
                memberId: "one",
                memberName: "One",
                memberEmail: "one@example.test",
                memberPictureUrl: "https://example.test/avatar",
              },
            ],
          }),
      },
      connectors: {
        getConnectors: async () =>
          create(GetConnectorsResponseSchema, {
            connectors: [
              {
                id: 7,
                name: "Warehouse",
                connectorType: ConnectorType.POSTGRES,
              },
            ],
          }),
      },
    }),
  );
  assert.deepEqual(
    await (await app.request("/v3/textql/chats/members")).json(),
    {
      members: [
        {
          id: "one",
          name: "One",
          email: "one@example.test",
          pictureUrl: "https://example.test/avatar",
        },
      ],
    },
  );
  assert.deepEqual(await (await app.request("/v3/textql/connectors")).json(), {
    connectors: [{ id: 7, name: "Warehouse", type: "POSTGRES" }],
  });
});

test("history paginates and uses protobuf JSON for cells and int64 values", async (t) => {
  const skips: number[] = [];
  const app = await start(
    t,
    mockSdk({
      chats: {
        getChatHistory: async (request) => {
          skips.push(request.skip ?? 0);
          assert.equal(request.limit, 200);
          return create(HistoryResponseSchema, {
            hasMore: request.skip === 0,
            cells: [
              {
                id: request.skip === 0 ? "one" : "two",
                value: {
                  case: "textCell",
                  value: { fileName: "text.txt", sizeBytes: 9007199254740993n },
                },
              },
            ],
          });
        },
      },
    }),
  );
  const payload = await (
    await app.request("/v3/textql/chats/chat-1/history?all_pages=true")
  ).json();
  assert.deepEqual(skips, [0, 1]);
  assert.equal(payload.chat_id, "chat-1");
  assert.equal(payload.total_cells, 2);
  assert.equal(payload.cells[0].textCell.sizeBytes, "9007199254740993");
  assert.equal(payload.cells[0].complete, undefined);
});

test("send SSE preserves protobuf oneof payloads, forwards cursor, and closes at runComplete", async (t) => {
  const calls: string[] = [];
  let closed = false;
  const app = await start(
    t,
    mockSdk({
      chats: {
        sendMessage: async (request) => {
          calls.push("send");
          assert.equal(request.message, "hello");
          assert.equal(request.steering, true);
          return create(SendResponseSchema, { cellId: "human-cell" });
        },
        watchChat: async function* (request) {
          calls.push("watch");
          assert.equal(request.latestCompleteCellId, "previous-cell");
          try {
            yield create(WatchChatEventSchema, {
              payload: {
                case: "cell",
                value: {
                  id: "answer",
                  complete: true,
                  value: { case: "mdCell", value: { content: "Hello" } },
                },
              },
              cursor: "cursor-1",
            });
            yield create(WatchChatEventSchema, {
              payload: {
                case: "runComplete",
                value: { finalCellId: "answer" },
              },
            });
            assert.fail("Send must stop at runComplete");
          } finally {
            closed = true;
          }
        },
      },
    }),
  );
  const response = await app.request(
    "/v3/textql/chats/chat-1/send",
    post({ message: "hello", steering: true, latest_cell_id: "previous-cell" }),
  );
  assert.match(response.headers.get("content-type")!, /text\/event-stream/);
  assert.equal(response.headers.get("x-cell-id"), "human-cell");
  assert.equal(response.headers.get("x-accel-buffering"), "no");
  const frames = events(await response.text());
  assert.deepEqual(frames[0], {
    type: "cell",
    cursor: "cursor-1",
    cell: { id: "answer", complete: true, mdCell: { content: "Hello" } },
  });
  assert.deepEqual(frames[1], {
    type: "runComplete",
    runComplete: { finalCellId: "answer" },
  });
  assert.deepEqual(calls, ["send", "watch"]);
  assert.equal(closed, true);
});

test("watch continues across runComplete and reports a normal stream end", async (t) => {
  const app = await start(
    t,
    mockSdk({
      chats: {
        watchChat: async function* (request) {
          assert.equal(request.resumeCursor, "resume");
          assert.equal(request.latestCompleteCellId, "latest");
          yield create(WatchChatEventSchema, {
            payload: { case: "runComplete", value: { finalCellId: "done" } },
          });
          yield create(WatchChatEventSchema, {
            payload: { case: "heartbeat", value: {} },
          });
        },
      },
    }),
  );
  const response = await app.request(
    "/v3/textql/chats/chat-1/watch?cursor=resume&latest_cell_id=latest",
  );
  assert.deepEqual(
    events(await response.text()).map((event) => event.type),
    ["runComplete", "heartbeat", "streamEnded"],
  );
});

test("stream errors are SSE errors, without SDK secrets", async (t) => {
  const app = await start(
    t,
    mockSdk({
      chats: {
        watchChat: async function* () {
          yield create(WatchChatEventSchema, {
            payload: { case: "opened", value: {} },
          });
          throw new ConnectError("secret signed URL", Code.Unavailable);
        },
      },
    }),
  );
  const response = await app.request("/v3/textql/chats/chat-1/watch");
  const text = await response.text();
  assert.deepEqual(
    events(text).map((event) => event.type),
    ["opened", "runError"],
  );
  assert.doesNotMatch(text, /secret signed URL/);
});

test("client disconnect aborts the upstream SDK watch", async (t) => {
  let aborted!: () => void;
  const done = new Promise<void>((resolve) => {
    aborted = resolve;
  });
  const app = await start(
    t,
    mockSdk({
      chats: {
        watchChat: async function* (_request, options) {
          yield create(WatchChatEventSchema, {
            payload: { case: "opened", value: {} },
          });
          await new Promise<void>((resolve) =>
            options?.signal?.addEventListener(
              "abort",
              () => {
                aborted();
                resolve();
              },
              { once: true },
            ),
          );
        },
      },
    }),
  );
  const response = await app.request("/v3/textql/chats/chat-1/watch");
  const reader = response.body!.getReader();
  await reader.read();
  await reader.cancel();
  await Promise.race([
    done,
    new Promise((_, reject) => {
      const timer = setTimeout(
        () => reject(new Error("upstream did not abort")),
        2000,
      );
      timer.unref();
    }),
  ]);
});

test("watchdog emits timeout and cancels the upstream SDK stream", async () => {
  let canceled = false;
  const sdk = mockSdk({
    chats: {
      watchChat: async function* (_request, options) {
        await new Promise<void>((resolve) =>
          options?.signal?.addEventListener(
            "abort",
            () => {
              canceled = true;
              resolve();
            },
            { once: true },
          ),
        );
        yield create(WatchChatEventSchema, {
          payload: { case: "heartbeat", value: {} },
        });
      },
    },
  });
  const frames: JsonObject[] = [];
  for await (const frame of watchEvents(
    sdk,
    { chatId: "chat-1" },
    false,
    new AbortController().signal,
    10,
  ))
    frames.push(frame);
  assert.deepEqual(frames, [{ type: "timeout" }]);
  assert.equal(canceled, true);
});

test("nonstreaming sends consolidate snapshots and retain run errors", async (t) => {
  const app = await start(
    t,
    mockSdk({
      chats: {
        sendMessage: async () =>
          create(SendResponseSchema, { cellId: "human" }),
        watchChat: async function* () {
          for (const content of ["H", "Hello"])
            yield create(WatchChatEventSchema, {
              payload: {
                case: "cell",
                value: {
                  id: "answer",
                  value: { case: "mdCell", value: { content } },
                },
              },
            });
          yield create(WatchChatEventSchema, {
            payload: { case: "runError", value: { error: "The run failed" } },
          });
        },
      },
    }),
  );
  const payload = await (
    await app.request(
      "/v3/textql/chats/chat-1/send",
      post({ message: "hello", stream: false }),
    )
  ).json();
  assert.equal(payload.cell_id, "human");
  assert.equal(payload.cells.length, 1);
  assert.equal(payload.cells[0].mdCell.content, "Hello");
  assert.equal(payload.error, "The run failed");
});

test("questions and all resolver pairs call their matching SDK methods", async (t) => {
  const calls: string[] = [];
  const app = await start(
    t,
    mockSdk({
      chats: {
        submitQuestions: async (request) => {
          calls.push("submit");
          assert.equal(request.cellId, "questions");
          assert.deepEqual(request.answers?.[0]?.inputs, ["value"]);
          return create(SubmitQuestionsResponseSchema);
        },
        dismissQuestions: async () => {
          calls.push("dismiss");
          return create(DismissQuestionsResponseSchema);
        },
        approveOntologyChange: async () => {
          calls.push("ontology:approve");
          return create(ApproveOntologyChangeResponseSchema);
        },
        rejectOntologyChange: async () => {
          calls.push("ontology:reject");
          return create(RejectOntologyChangeResponseSchema);
        },
        approveContextPromptChange: async () => {
          calls.push("context_prompt:approve");
          return create(ApproveContextPromptChangeResponseSchema);
        },
        rejectContextPromptChange: async () => {
          calls.push("context_prompt:reject");
          return create(RejectContextPromptChangeResponseSchema);
        },
      },
    }),
  );
  for (const action of ["submit", "dismiss"])
    assert.equal(
      (
        await app.request(
          "/v3/textql/questions",
          post({
            cellId: "questions",
            action,
            answers: [{ inputs: ["value"], provided: [true] }],
          }),
        )
      ).status,
      200,
    );
  for (const kind of ["ontology", "context_prompt"])
    for (const action of ["approve", "reject"]) {
      assert.equal(
        (
          await app.request(
            "/v3/textql/cells/cell-1/resolve",
            post({ kind, action }),
          )
        ).status,
        200,
      );
    }
  assert.deepEqual(calls, [
    "submit",
    "dismiss",
    "ontology:approve",
    "ontology:reject",
    "context_prompt:approve",
    "context_prompt:reject",
  ]);
  assert.equal(
    (
      await app.request(
        "/v3/textql/questions",
        post({ cellId: "questions", action: "unknown" }),
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await app.request(
        "/v3/textql/cells/cell-1/resolve",
        post({ kind: "other", action: "approve" }),
      )
    ).status,
    400,
  );
});

test("close is client-side only and never deletes a durable chat", async (t) => {
  const app = await start(t);
  assert.deepEqual(
    await (
      await app.request("/v3/textql/chats/chat-1", { method: "DELETE" })
    ).json(),
    { chat_id: "chat-1", status: "closed_client_side" },
  );
});

test("preview proxy allowlists hosts, rejects redirects and injects sandboxed chart HTML", async (t) => {
  const requested: string[] = [];
  const app = await start(t, mockSdk(), async (input, init) => {
    requested.push(String(input));
    assert.equal(init?.redirect, "manual");
    assert.equal(init?.headers, undefined);
    return new Response("<html><head></head><body>Chart</body></html>", {
      headers: {
        "content-type": "text/html",
        "x-frame-options": "DENY",
        "set-cookie": "not-forwarded",
      },
    });
  });
  const response = await app.request(
    "/v3/textql/preview-proxy?url=" +
      encodeURIComponent(
        "https://artifacts.textqlusercontent.com/chart/index.html",
      ) +
      "&fit=chart",
  );
  const html = await response.text();
  assert.match(
    html,
    /<base href="https:\/\/artifacts.textqlusercontent.com\/chart\/">/,
  );
  assert.match(html, /__chartFit/);
  assert.equal(
    response.headers.get("content-security-policy"),
    "sandbox allow-scripts",
  );
  assert.equal(response.headers.get("set-cookie"), null);
  assert.equal(response.headers.get("x-frame-options"), null);
  for (const url of [
    "http://127.0.0.1/",
    "https://textqlusercontent.com.evil.test/",
    "file:///etc/passwd",
  ]) {
    const rejected = await app.request(
      "/v3/textql/preview-proxy?url=" + encodeURIComponent(url),
    );
    assert([400, 403].includes(rejected.status));
  }
  assert.equal(requested.length, 1);
  const redirected = await start(
    t,
    mockSdk(),
    async () =>
      new Response(null, {
        status: 302,
        headers: { location: "http://127.0.0.1/" },
      }),
  );
  assert.equal(
    (
      await redirected.request(
        "/v3/textql/preview-proxy?url=https://app.textql.com/preview",
      )
    ).status,
    502,
  );
});

const dataset = create(DatasetSchema, {
  id: "dataset-1",
  name: "backend.csv",
  type: DatasetType.TYPE_TABULAR,
});
const fileCell = create(CellSchema, {
  id: "file-cell",
  complete: true,
  value: {
    case: "tabularFileCell",
    value: { fileName: "backend.csv", datasetSourceId: dataset.id },
  },
});

function uploadSdk(calls: string[], fail?: "register" | "process" | "attach") {
  return mockSdk({
    chats: {
      attachDataset: async (request) => {
        calls.push("attach");
        assert.equal(request.chatId, "chat-1");
        assert.equal(request.datasetId, dataset.id);
        if (fail === "attach")
          throw new ConnectError("attachment processing failed", Code.Internal);
        return create(AttachDatasetResponseSchema, { cell: fileCell, dataset });
      },
      getChatHistory: async () => {
        calls.push("history");
        return create(HistoryResponseSchema, {
          cells: [
            {
              id: "old-file-cell",
              complete: true,
              value: {
                case: "documentCell",
                value: {
                  name: "previous.pdf",
                  datasetSourceId: "previous-file",
                },
              },
            },
            fileCell,
          ],
        });
      },
    },
    datasets: {
      createUploadPresignUrl: async (request) => {
        calls.push("register");
        assert.equal(request.type, DatasetType.TYPE_TABULAR);
        assert.equal(request.fileName, "browser.csv");
        assert.equal(request.ephemeral, true);
        if (fail === "register")
          throw new ConnectError("registration failed", Code.PermissionDenied);
        return create(CreateUploadPresignUrlResponseSchema, {
          datasetId: dataset.id,
          datasetVersion: 2,
          presignUrl: "https://storage.example.test/signed?sig=test&sv=version",
        });
      },
      processUploadPresignUrl: async (request) => {
        calls.push("process");
        assert.equal(request.datasetId, dataset.id);
        assert.equal(request.datasetVersion, 2);
        if (fail === "process")
          throw new ConnectError("processing failed", Code.Internal);
        return create(ProcessUploadPresignUrlResponseSchema, { dataset });
      },
    },
  });
}

function uploadBody(
  bytes: Uint8Array = new TextEncoder().encode("a,b\n1,2\n"),
  name = "browser.csv",
) {
  const form = new FormData();
  form.append(
    "file",
    new Blob([new Uint8Array(bytes)], { type: "application/octet-stream" }),
    name,
  );
  return form;
}

test("CSV upload registers, transfers, finalizes, associates, and returns all backend attachments", async (t) => {
  const calls: string[] = [];
  const app = await start(t, uploadSdk(calls), async (_url, init) => {
    calls.push("put");
    assert.equal(init?.method, "PUT");
    assert.equal(new Headers(init?.headers).get("content-type"), "text/csv");
    assert.equal(new Headers(init?.headers).get("x-ms-blob-type"), "BlockBlob");
    assert.equal(new Headers(init?.headers).get("tql_api_key"), null);
    assert.equal(
      new TextDecoder().decode(init?.body as Uint8Array),
      "a,b\n1,2\n",
    );
    return new Response(null, { status: 200 });
  });
  const response = await app.request("/v3/textql/chats/chat-1/files", {
    method: "POST",
    body: uploadBody(),
  });
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.deepEqual(calls, ["register", "put", "process", "attach", "history"]);
  assert.deepEqual(
    payload.files.map((file: { id: string }) => file.id),
    ["previous-file", "dataset-1"],
  );
  assert.equal(payload.files[1].name, "backend.csv");
  assert.equal(payload.files[1].status, "attached");
  assert.equal(payload.files[1].cell_id, "file-cell");
  assert.deepEqual(
    await (await app.request("/v3/textql/chats/chat-1/files")).json(),
    payload,
  );
});

for (const phase of ["register", "put", "process", "attach"] as const) {
  test(`upload failure at ${phase} is an error and never reaches later stages`, async (t) => {
    const calls: string[] = [];
    const app = await start(
      t,
      uploadSdk(calls, phase === "put" ? undefined : phase),
      async () => {
        calls.push("put");
        return new Response(null, { status: phase === "put" ? 403 : 200 });
      },
    );
    const response = await app.request("/v3/textql/chats/chat-1/files", {
      method: "POST",
      body: uploadBody(),
    });
    assert(response.status >= 400);
    const payload = await response.json();
    assert.equal(typeof payload.detail, "string");
    assert.equal(payload.files, undefined);
    const all = ["register", "put", "process", "attach"];
    assert.deepEqual(calls, all.slice(0, all.indexOf(phase) + 1));
  });
}

test("generic binary and document uploads use the dataset file service too", async (t) => {
  for (const name of ["report.pdf", "archive.zip"]) {
    const doc = create(DatasetSchema, {
      id: "document",
      name,
      type: DatasetType.TYPE_DOCUMENT,
    });
    const cell = create(CellSchema, {
      id: "document-cell",
      complete: true,
      value: { case: "documentCell", value: { name, datasetSourceId: doc.id } },
    });
    const app = await start(
      t,
      mockSdk({
        datasets: {
          createUploadPresignUrl: async (request) => {
            assert.equal(request.type, DatasetType.TYPE_DOCUMENT);
            return create(CreateUploadPresignUrlResponseSchema, {
              datasetId: doc.id,
              datasetVersion: 1,
              presignUrl: "https://storage.example.test/file",
            });
          },
          processUploadPresignUrl: async () =>
            create(ProcessUploadPresignUrlResponseSchema, { dataset: doc }),
        },
        chats: {
          attachDataset: async () =>
            create(AttachDatasetResponseSchema, { cell, dataset: doc }),
          getChatHistory: async () =>
            create(HistoryResponseSchema, { cells: [cell] }),
        },
      }),
      async () => new Response(null, { status: 200 }),
    );
    const response = await app.request("/v3/textql/chats/chat-1/files", {
      method: "POST",
      body: uploadBody(new Uint8Array([1, 2]), name),
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).files[0].status, "attached");
  }
  assert.deepEqual(classifyFile("DATA.CSV"), {
    type: DatasetType.TYPE_TABULAR,
    contentType: "text/csv",
  });
  assert.deepEqual(classifyFile("table.parquet"), {
    type: DatasetType.TYPE_TABULAR,
    contentType: "application/vnd.apache.parquet",
  });
});

test("multipart rejects absent, empty, multiple, malformed and oversized files before storage RPCs", async (t) => {
  const app = await start(t);
  const multiple = uploadBody();
  multiple.append("file", new Blob(["second"]), "second.csv");
  const wrongField = new FormData();
  wrongField.append("other", new Blob(["test"]), "test.csv");
  for (const body of [
    new FormData(),
    uploadBody(new Uint8Array()),
    multiple,
    wrongField,
    uploadBody(new Uint8Array([1]), "extensionless"),
  ]) {
    const response = await app.request("/v3/textql/chats/chat-1/files", {
      method: "POST",
      body,
    });
    assert.equal(response.status, 400, await response.text());
  }
  assert.equal(
    (
      await app.request("/v3/textql/chats/chat-1/files", {
        method: "POST",
        body: "not multipart",
      })
    ).status,
    400,
  );
  const oversized = await app.request("/v3/textql/chats/chat-1/files", {
    method: "POST",
    body: uploadBody(new Uint8Array(MAX_FILE_BYTES + 1)),
  });
  assert.equal(oversized.status, 413);
});

test("the exact 20 MiB file boundary is accepted", async (t) => {
  const calls: string[] = [];
  const app = await start(t, uploadSdk(calls), async (_url, init) => {
    assert(init?.body instanceof Uint8Array);
    assert.equal(init.body.length, MAX_FILE_BYTES);
    return new Response(null, { status: 200 });
  });
  const response = await app.request("/v3/textql/chats/chat-1/files", {
    method: "POST",
    body: uploadBody(new Uint8Array(MAX_FILE_BYTES)),
  });
  assert.equal(response.status, 200);
});

test("upload does not report success when durable history does not confirm attachment", async (t) => {
  const sdk = uploadSdk([]);
  sdk.chats.getChatHistory = async () => create(HistoryResponseSchema);
  const app = await start(
    t,
    sdk,
    async () => new Response(null, { status: 200 }),
  );
  const response = await app.request("/v3/textql/chats/chat-1/files", {
    method: "POST",
    body: uploadBody(),
  });
  assert.equal(response.status, 502);
  assert.match(await response.text(), /not found in chat history/);
});
