# Secrets

## Overview

### Available Operations

* [deleteApiAccessKey](#deleteapiaccesskey) - DeleteApiAccessKey
* [getApiAccessKey](#getapiaccesskey) - GetApiAccessKey
* [listApiAccessKeys](#listapiaccesskeys) - ListApiAccessKeys
* [listApiProviders](#listapiproviders) - ListApiProviders
* [testApiAccessKey](#testapiaccesskey) - ---- API Connectors (deprecated) ----
* [upsertApiAccessKey](#upsertapiaccesskey) - UpsertApiAccessKey

## deleteApiAccessKey

DeleteApiAccessKey

### Example Usage

<!-- UsageSnippet language="typescript" operationID="SecretService_DeleteApiAccessKey" method="post" path="/textql.rpc.public.secret.SecretService/DeleteApiAccessKey" -->
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.secrets.deleteApiAccessKey({
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
import { secretsDeleteApiAccessKey } from "@textql/sdk/funcs/secrets-delete-api-access-key.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await secretsDeleteApiAccessKey(textql, {
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("secretsDeleteApiAccessKey failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.SecretServiceDeleteApiAccessKeyRequest](../../models/operations/secret-service-delete-api-access-key-request.md)                                                   | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.SecretServiceDeleteApiAccessKeyResponse](../../models/operations/secret-service-delete-api-access-key-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## getApiAccessKey

GetApiAccessKey

### Example Usage

<!-- UsageSnippet language="typescript" operationID="SecretService_GetApiAccessKey" method="post" path="/textql.rpc.public.secret.SecretService/GetApiAccessKey" -->
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.secrets.getApiAccessKey({
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
import { secretsGetApiAccessKey } from "@textql/sdk/funcs/secrets-get-api-access-key.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await secretsGetApiAccessKey(textql, {
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("secretsGetApiAccessKey failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.SecretServiceGetApiAccessKeyRequest](../../models/operations/secret-service-get-api-access-key-request.md)                                                         | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.SecretServiceGetApiAccessKeyResponse](../../models/operations/secret-service-get-api-access-key-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## listApiAccessKeys

ListApiAccessKeys

### Example Usage

<!-- UsageSnippet language="typescript" operationID="SecretService_ListApiAccessKeys" method="post" path="/textql.rpc.public.secret.SecretService/ListApiAccessKeys" -->
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.secrets.listApiAccessKeys({
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
import { secretsListApiAccessKeys } from "@textql/sdk/funcs/secrets-list-api-access-keys.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await secretsListApiAccessKeys(textql, {
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("secretsListApiAccessKeys failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.SecretServiceListApiAccessKeysRequest](../../models/operations/secret-service-list-api-access-keys-request.md)                                                     | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.SecretServiceListApiAccessKeysResponse](../../models/operations/secret-service-list-api-access-keys-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## listApiProviders

ListApiProviders

### Example Usage

<!-- UsageSnippet language="typescript" operationID="SecretService_ListApiProviders" method="post" path="/textql.rpc.public.secret.SecretService/ListApiProviders" -->
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.secrets.listApiProviders({
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
import { secretsListApiProviders } from "@textql/sdk/funcs/secrets-list-api-providers.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await secretsListApiProviders(textql, {
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("secretsListApiProviders failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.SecretServiceListApiProvidersRequest](../../models/operations/secret-service-list-api-providers-request.md)                                                        | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.SecretServiceListApiProvidersResponse](../../models/operations/secret-service-list-api-providers-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## testApiAccessKey

---- API Connectors (deprecated) ----

### Example Usage

<!-- UsageSnippet language="typescript" operationID="SecretService_TestApiAccessKey" method="post" path="/textql.rpc.public.secret.SecretService/TestApiAccessKey" -->
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.secrets.testApiAccessKey({
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
import { secretsTestApiAccessKey } from "@textql/sdk/funcs/secrets-test-api-access-key.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await secretsTestApiAccessKey(textql, {
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("secretsTestApiAccessKey failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.SecretServiceTestApiAccessKeyRequest](../../models/operations/secret-service-test-api-access-key-request.md)                                                       | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.SecretServiceTestApiAccessKeyResponse](../../models/operations/secret-service-test-api-access-key-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## upsertApiAccessKey

UpsertApiAccessKey

### Example Usage

<!-- UsageSnippet language="typescript" operationID="SecretService_UpsertApiAccessKey" method="post" path="/textql.rpc.public.secret.SecretService/UpsertApiAccessKey" -->
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.secrets.upsertApiAccessKey({
    body: {
      expiresAt: new Date("2023-01-15T01:30:15.01Z"),
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
import { secretsUpsertApiAccessKey } from "@textql/sdk/funcs/secrets-upsert-api-access-key.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await secretsUpsertApiAccessKey(textql, {
    body: {
      expiresAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("secretsUpsertApiAccessKey failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.SecretServiceUpsertApiAccessKeyRequest](../../models/operations/secret-service-upsert-api-access-key-request.md)                                                   | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.SecretServiceUpsertApiAccessKeyResponse](../../models/operations/secret-service-upsert-api-access-key-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |