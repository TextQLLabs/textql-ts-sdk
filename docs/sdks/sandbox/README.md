# Sandbox

## Overview

### Available Operations

* [create](#create) - CreateSandbox
* [exec](#exec) - Exec
* [executeCode](#executecode) - ExecuteCode
* [getToolAvailability](#gettoolavailability) - GetToolAvailability
* [loadConnectorData](#loadconnectordata) - LoadConnectorData
* [executeQuery](#executequery) - ExecuteQuery

## create

CreateSandbox

### Example Usage

<!-- UsageSnippet language="typescript" operationID="SandboxExecService_CreateSandbox" method="post" path="/textql.rpc.public.sandbox_exec.SandboxExecService/CreateSandbox" -->
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.sandbox.create({
    body: {},
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { TextqlCore } from "@textql/sdk/core.js";
import { sandboxCreate } from "@textql/sdk/funcs/sandbox-create.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await sandboxCreate(textql, {
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("sandboxCreate failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.SandboxExecServiceCreateSandboxRequest](../../models/operations/sandbox-exec-service-create-sandbox-request.md)                                                    | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.SandboxExecServiceCreateSandboxResponse](../../models/operations/sandbox-exec-service-create-sandbox-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## exec

Exec

### Example Usage

<!-- UsageSnippet language="typescript" operationID="SandboxExecService_Exec" method="post" path="/textql.rpc.public.sandbox_exec.SandboxExecService/Exec" -->
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.sandbox.exec({
    body: {},
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { TextqlCore } from "@textql/sdk/core.js";
import { sandboxExec } from "@textql/sdk/funcs/sandbox-exec.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await sandboxExec(textql, {
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("sandboxExec failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.SandboxExecServiceExecRequest](../../models/operations/sandbox-exec-service-exec-request.md)                                                                       | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.SandboxExecServiceExecResponse](../../models/operations/sandbox-exec-service-exec-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## executeCode

ExecuteCode

### Example Usage

<!-- UsageSnippet language="typescript" operationID="SandboxExecService_ExecuteCode" method="post" path="/textql.rpc.public.sandbox_exec.SandboxExecService/ExecuteCode" -->
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.sandbox.executeCode({
    body: {},
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { TextqlCore } from "@textql/sdk/core.js";
import { sandboxExecuteCode } from "@textql/sdk/funcs/sandbox-execute-code.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await sandboxExecuteCode(textql, {
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("sandboxExecuteCode failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.SandboxExecServiceExecuteCodeRequest](../../models/operations/sandbox-exec-service-execute-code-request.md)                                                        | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.SandboxExecServiceExecuteCodeResponse](../../models/operations/sandbox-exec-service-execute-code-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## getToolAvailability

GetToolAvailability

### Example Usage

<!-- UsageSnippet language="typescript" operationID="SandboxExecService_GetToolAvailability" method="post" path="/textql.rpc.public.sandbox_exec.SandboxExecService/GetToolAvailability" -->
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.sandbox.getToolAvailability({
    body: {},
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { TextqlCore } from "@textql/sdk/core.js";
import { sandboxGetToolAvailability } from "@textql/sdk/funcs/sandbox-get-tool-availability.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await sandboxGetToolAvailability(textql, {
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("sandboxGetToolAvailability failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.SandboxExecServiceGetToolAvailabilityRequest](../../models/operations/sandbox-exec-service-get-tool-availability-request.md)                                       | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.SandboxExecServiceGetToolAvailabilityResponse](../../models/operations/sandbox-exec-service-get-tool-availability-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## loadConnectorData

LoadConnectorData

### Example Usage

<!-- UsageSnippet language="typescript" operationID="SandboxExecService_LoadConnectorData" method="post" path="/textql.rpc.public.sandbox_exec.SandboxExecService/LoadConnectorData" -->
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.sandbox.loadConnectorData({
    body: {},
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { TextqlCore } from "@textql/sdk/core.js";
import { sandboxLoadConnectorData } from "@textql/sdk/funcs/sandbox-load-connector-data.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await sandboxLoadConnectorData(textql, {
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("sandboxLoadConnectorData failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.SandboxExecServiceLoadConnectorDataRequest](../../models/operations/sandbox-exec-service-load-connector-data-request.md)                                           | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.SandboxExecServiceLoadConnectorDataResponse](../../models/operations/sandbox-exec-service-load-connector-data-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## executeQuery

ExecuteQuery

### Example Usage

<!-- UsageSnippet language="typescript" operationID="SandboxQueryService_ExecuteQuery" method="post" path="/textql.rpc.public.sandbox_query.SandboxQueryService/ExecuteQuery" -->
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.sandbox.executeQuery({
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
import { TextqlCore } from "@textql/sdk/core.js";
import { sandboxExecuteQuery } from "@textql/sdk/funcs/sandbox-execute-query.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await sandboxExecuteQuery(textql, {
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