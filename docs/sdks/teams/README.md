# Teams

## Overview

### Available Operations

* [createUuid](#createuuid) - CreateTeamsUuid
* [deleteInstallation](#deleteinstallation) - DeleteInstallation
* [getCurrentUser](#getcurrentuser) - GetCurrentUser
* [handleOAuthCallback](#handleoauthcallback) - HandleTeamsOAuthCallback
* [list](#list) - ListChannels
* [listInstallations](#listinstallations) - ListInstallations
* [listUsers](#listusers) - ListUsers
* [syncWorkspace](#syncworkspace) - SyncWorkspace

## createUuid

CreateTeamsUuid

### Example Usage

<!-- UsageSnippet language="typescript" operationID="TeamsService_CreateTeamsUuid" method="post" path="/textql.rpc.public.teams.TeamsService/CreateTeamsUuid" -->
```typescript
import { Textql } from "textql-sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.teams.createUuid({
    connectProtocolVersion: 1,
    body: {},
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { TextqlCore } from "textql-sdk/core.js";
import { teamsCreateUuid } from "textql-sdk/funcs/teams-create-uuid.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await teamsCreateUuid(textql, {
    connectProtocolVersion: 1,
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("teamsCreateUuid failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.TeamsServiceCreateTeamsUuidRequest](../../models/operations/teams-service-create-teams-uuid-request.md)                                                            | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.TeamsServiceCreateTeamsUuidResponse](../../models/operations/teams-service-create-teams-uuid-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## deleteInstallation

DeleteInstallation

### Example Usage

<!-- UsageSnippet language="typescript" operationID="TeamsService_DeleteInstallation" method="post" path="/textql.rpc.public.teams.TeamsService/DeleteInstallation" -->
```typescript
import { Textql } from "textql-sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.teams.deleteInstallation({
    connectProtocolVersion: 1,
    body: {},
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { TextqlCore } from "textql-sdk/core.js";
import { teamsDeleteInstallation } from "textql-sdk/funcs/teams-delete-installation.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await teamsDeleteInstallation(textql, {
    connectProtocolVersion: 1,
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("teamsDeleteInstallation failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.TeamsServiceDeleteInstallationRequest](../../models/operations/teams-service-delete-installation-request.md)                                                       | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.TeamsServiceDeleteInstallationResponse](../../models/operations/teams-service-delete-installation-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## getCurrentUser

GetCurrentUser

### Example Usage

<!-- UsageSnippet language="typescript" operationID="TeamsService_GetCurrentUser" method="post" path="/textql.rpc.public.teams.TeamsService/GetCurrentUser" -->
```typescript
import { Textql } from "textql-sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.teams.getCurrentUser({
    connectProtocolVersion: 1,
    body: {},
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { TextqlCore } from "textql-sdk/core.js";
import { teamsGetCurrentUser } from "textql-sdk/funcs/teams-get-current-user.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await teamsGetCurrentUser(textql, {
    connectProtocolVersion: 1,
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("teamsGetCurrentUser failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.TeamsServiceGetCurrentUserRequest](../../models/operations/teams-service-get-current-user-request.md)                                                              | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.TeamsServiceGetCurrentUserResponse](../../models/operations/teams-service-get-current-user-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## handleOAuthCallback

HandleTeamsOAuthCallback

### Example Usage

<!-- UsageSnippet language="typescript" operationID="TeamsService_HandleTeamsOAuthCallback" method="post" path="/textql.rpc.public.teams.TeamsService/HandleTeamsOAuthCallback" -->
```typescript
import { Textql } from "textql-sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.teams.handleOAuthCallback({
    connectProtocolVersion: 1,
    body: {},
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { TextqlCore } from "textql-sdk/core.js";
import { teamsHandleOAuthCallback } from "textql-sdk/funcs/teams-handle-o-auth-callback.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await teamsHandleOAuthCallback(textql, {
    connectProtocolVersion: 1,
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("teamsHandleOAuthCallback failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.TeamsServiceHandleTeamsOAuthCallbackRequest](../../models/operations/teams-service-handle-teams-o-auth-callback-request.md)                                        | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.TeamsServiceHandleTeamsOAuthCallbackResponse](../../models/operations/teams-service-handle-teams-o-auth-callback-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## list

ListChannels

### Example Usage

<!-- UsageSnippet language="typescript" operationID="TeamsService_ListChannels" method="post" path="/textql.rpc.public.teams.TeamsService/ListChannels" -->
```typescript
import { Textql } from "textql-sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.teams.list({
    connectProtocolVersion: 1,
    body: {},
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { TextqlCore } from "textql-sdk/core.js";
import { teamsList } from "textql-sdk/funcs/teams-list.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await teamsList(textql, {
    connectProtocolVersion: 1,
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("teamsList failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.TeamsServiceListChannelsRequest](../../models/operations/teams-service-list-channels-request.md)                                                                   | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.TeamsServiceListChannelsResponse](../../models/operations/teams-service-list-channels-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## listInstallations

ListInstallations

### Example Usage

<!-- UsageSnippet language="typescript" operationID="TeamsService_ListInstallations" method="post" path="/textql.rpc.public.teams.TeamsService/ListInstallations" -->
```typescript
import { Textql } from "textql-sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.teams.listInstallations({
    connectProtocolVersion: 1,
    body: {},
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { TextqlCore } from "textql-sdk/core.js";
import { teamsListInstallations } from "textql-sdk/funcs/teams-list-installations.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await teamsListInstallations(textql, {
    connectProtocolVersion: 1,
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("teamsListInstallations failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.TeamsServiceListInstallationsRequest](../../models/operations/teams-service-list-installations-request.md)                                                         | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.TeamsServiceListInstallationsResponse](../../models/operations/teams-service-list-installations-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## listUsers

ListUsers

### Example Usage

<!-- UsageSnippet language="typescript" operationID="TeamsService_ListUsers" method="post" path="/textql.rpc.public.teams.TeamsService/ListUsers" -->
```typescript
import { Textql } from "textql-sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.teams.listUsers({
    connectProtocolVersion: 1,
    body: {},
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { TextqlCore } from "textql-sdk/core.js";
import { teamsListUsers } from "textql-sdk/funcs/teams-list-users.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await teamsListUsers(textql, {
    connectProtocolVersion: 1,
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("teamsListUsers failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.TeamsServiceListUsersRequest](../../models/operations/teams-service-list-users-request.md)                                                                         | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.TeamsServiceListUsersResponse](../../models/operations/teams-service-list-users-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## syncWorkspace

SyncWorkspace

### Example Usage

<!-- UsageSnippet language="typescript" operationID="TeamsService_SyncWorkspace" method="post" path="/textql.rpc.public.teams.TeamsService/SyncWorkspace" -->
```typescript
import { Textql } from "textql-sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.teams.syncWorkspace({
    connectProtocolVersion: 1,
    body: {},
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { TextqlCore } from "textql-sdk/core.js";
import { teamsSyncWorkspace } from "textql-sdk/funcs/teams-sync-workspace.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await teamsSyncWorkspace(textql, {
    connectProtocolVersion: 1,
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("teamsSyncWorkspace failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.TeamsServiceSyncWorkspaceRequest](../../models/operations/teams-service-sync-workspace-request.md)                                                                 | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.TeamsServiceSyncWorkspaceResponse](../../models/operations/teams-service-sync-workspace-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |