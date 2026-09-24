import assert from "node:assert/strict";
import test, { describe } from "node:test";

import { SDK_METADATA } from "../esm/lib/config.js";
import { HTTPClient } from "../esm/lib/http.js";
import { ClientSDK } from "../esm/lib/sdks.js";
import { Textql } from "../esm/sdk/sdk.js";
import {
  AgentService,
  createConnectClient,
  createStreamingClient,
} from "../esm/streaming.js";

const clientHeaders = {
  "X-TextQL-Client": "customer-application",
  "X-TextQL-Client-Version": "2.0",
  "X-TextQL-Agent": "customer-agent",
};

for (const sdkMarker of [undefined, "stale-client/0.0"]) {
  describe(`${sdkMarker === undefined ? "Absent" : "Stale"} SDK marker`, () => {
    const markerHeaders =
      sdkMarker === undefined ? {} : { "x-textql-sdk": sdkMarker };

    for (const userAgent of [undefined, "customer-application/2.0"]) {
      test(`SDK operations preserve client headers with ${userAgent ?? "default user agent"}`, async () => {
        const requests = [];
        const sdk = new Textql({
          apiKey: "test-api-key",
          serverURL: "https://textql-sdk-tests.invalid",
          userAgent,
          httpClient: new HTTPClient({
            fetcher: async (request) => {
              requests.push(request);
              return Response.json({});
            },
          }),
        });

        await sdk.agents.getAgent(
          { body: { agentId: "a1" } },
          { headers: { ...clientHeaders, ...markerHeaders } },
        );

        assert.equal(requests.length, 1);
        const request = requests[0];
        assert.equal(
          request.headers.get("X-TextQL-SDK"),
          `typescript/${SDK_METADATA.sdkVersion}`,
        );
        assert.equal(
          request.headers.get("User-Agent"),
          userAgent ?? SDK_METADATA.userAgent,
        );
        for (const [name, value] of Object.entries(clientHeaders)) {
          assert.equal(request.headers.get(name), value);
        }
        assert.equal(request.headers.get("tql_api_key"), "test-api-key");
        assert.equal(
          new URL(request.url).pathname,
          "/rpc/public/textql.rpc.public.agent.AgentService/GetAgent",
        );
        assert.deepEqual(await request.json(), { agentId: "a1" });
      });
    }

    for (const browserLike of [false, true]) {
      test(`request building sets SDK origin in ${browserLike ? "browser" : "Node"} runtimes`, async () => {
        let RuntimeClientSDK = ClientSDK;
        if (browserLike) {
          const originalWindow = Object.getOwnPropertyDescriptor(
            globalThis,
            "window",
          );
          try {
            Object.defineProperty(globalThis, "window", {
              configurable: true,
              value: { document: {} },
            });
            ({ ClientSDK: RuntimeClientSDK } =
              await import("../esm/lib/sdks.js?browser"));
          } finally {
            if (originalWindow) {
              Object.defineProperty(globalThis, "window", originalWindow);
            } else {
              delete globalThis.window;
            }
          }
        }

        const sdk = new RuntimeClientSDK({
          serverURL: "https://textql-sdk-tests.invalid",
        });
        const result = sdk._createRequest(
          {
            baseURL: sdk._baseURL,
            operationID: "test-sdk-origin",
            oAuth2Scopes: null,
            retryConfig: { strategy: "none" },
            resolvedSecurity: null,
            options: sdk._options,
          },
          {
            method: "POST",
            path: "/test",
            userAgent: "customer-application/2.0",
          },
          { headers: { ...clientHeaders, ...markerHeaders } },
        );

        assert.equal(result.ok, true);
        const request = result.value;
        assert.equal(
          request.headers.get("X-TextQL-SDK"),
          `typescript/${SDK_METADATA.sdkVersion}`,
        );
        assert.equal(
          request.headers.get("User-Agent"),
          browserLike ? null : "customer-application/2.0",
        );
        for (const [name, value] of Object.entries(clientHeaders)) {
          assert.equal(request.headers.get(name), value);
        }
      });
    }

    for (const streaming of [false, true]) {
      test(`Connect ${streaming ? "streaming" : "unary"} requests include SDK origin`, async () => {
        const requests = [];
        const source = {
          apiKey: "test-api-key",
          serverURL: "https://textql-sdk-tests.invalid",
          fetch: async (input, init) => {
            requests.push(new Request(input, init));
            return streaming
              ? new Response(new Uint8Array([2, 0, 0, 0, 2, 123, 125]), {
                  headers: { "content-type": "application/connect+json" },
                })
              : Response.json({});
          },
        };
        const client = streaming
          ? createStreamingClient(source).agents
          : createConnectClient(AgentService, source);
        const options = {
          headers: {
            ...clientHeaders,
            "user-agent": "customer-application/2.0",
            ...markerHeaders,
          },
        };

        if (streaming) {
          const messages = [];
          for await (const message of client.streamAgentStatus({}, options)) {
            messages.push(message);
          }
          assert.deepEqual(messages, []);
        } else {
          await client.getAgent({ agentId: "a1" }, options);
        }

        assert.equal(requests.length, 1);
        const request = requests[0];
        assert.equal(
          request.headers.get("X-TextQL-SDK"),
          `typescript/${SDK_METADATA.sdkVersion}`,
        );
        assert.equal(
          request.headers.get("User-Agent"),
          "customer-application/2.0",
        );
        for (const [name, value] of Object.entries(clientHeaders)) {
          assert.equal(request.headers.get(name), value);
        }
        assert.equal(request.headers.get("tql_api_key"), "test-api-key");
        assert.equal(
          new URL(request.url).pathname,
          `/rpc/public/textql.rpc.public.agent.AgentService/${streaming ? "StreamAgentStatus" : "GetAgent"}`,
        );
      });
    }
  });
}
