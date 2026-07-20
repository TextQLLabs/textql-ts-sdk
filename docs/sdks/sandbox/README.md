# Sandbox

## Overview

### Available Operations

* [executeQuery](#executequery) - ExecuteQuery

## executeQuery

ExecuteQuery

### Example Usage

<!-- UsageSnippet language="typescript" operationID="SandboxQueryService_ExecuteQuery" method="post" path="/textql.rpc.public.sandbox_query.SandboxQueryService/ExecuteQuery" -->
```typescript
import { Textql } from "textql-sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.sandbox.executeQuery({
    connectProtocolVersion: 1,
    body: {
      sqlQuery: {},
    },
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { TextqlCore } from "textql-sdk/core.js";
import { sandboxExecuteQuery } from "textql-sdk/funcs/sandbox-execute-query.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await sandboxExecuteQuery(textql, {
    connectProtocolVersion: 1,
    body: {
      sqlQuery: {},
    },
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("sandboxExecuteQuery failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.SandboxQueryServiceExecuteQueryRequest](../../models/operations/sandbox-query-service-execute-query-request.md)                                                    | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.SandboxQueryServiceExecuteQueryResponse](../../models/operations/sandbox-query-service-execute-query-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |