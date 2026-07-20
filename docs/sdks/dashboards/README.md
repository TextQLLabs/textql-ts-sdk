# Dashboards

## Overview

### Available Operations

* [checkHealth](#checkhealth) - CheckDashboardHealth
* [createDashboard](#createdashboard) - CRUD operations
* [createFolder](#createfolder) - Folder management
* [delete](#delete) - DeleteDashboard
* [deleteFolder](#deletefolder) - DeleteDashboardFolder
* [discardChanges](#discardchanges) - DiscardDashboardChanges
* [duplicate](#duplicate) - DuplicateDashboard
* [get](#get) - GetDashboard
* [getVersion](#getversion) - GetDashboardVersion
* [getDashboardViewStats](#getdashboardviewstats) - View analytics
* [getMembersWithDashboards](#getmemberswithdashboards) - Member management
* [listFolders](#listfolders) - ListDashboardFolders
* [listVersions](#listversions) - Version history
* [list](#list) - ListDashboards
* [moveToFolder](#movetofolder) - MoveDashboardToFolder
* [previewConfig](#previewconfig) - Config-managed dashboards: render a `.dashboard` straight from a patch ref before  it merges (ADR-0022). Runs as the file's run_as, gated on the previewer being  authorized for it; persists nothing.
* [publish](#publish) - Publishing workflow
* [regenerateScreenshot](#regeneratescreenshot) - Screenshot management
* [restoreDashboardVersion](#restoredashboardversion) - RestoreDashboardVersion
* [runScheduledDashboard](#runscheduleddashboard) - RunScheduledDashboard
* [spawn](#spawn) - Dashboard execution
* [updateDashboard](#updatedashboard) - UpdateDashboard
* [updateDashboardFolder](#updatedashboardfolder) - UpdateDashboardFolder
* [updateDashboardSchedule](#updatedashboardschedule) - Scheduling

## checkHealth

CheckDashboardHealth

### Example Usage

<!-- UsageSnippet language="typescript" operationID="DashboardService_CheckDashboardHealth" method="post" path="/textql.rpc.public.dashboard.DashboardService/CheckDashboardHealth" -->
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.dashboards.checkHealth({
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
import { dashboardsCheckHealth } from "@textql/sdk/funcs/dashboards-check-health.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await dashboardsCheckHealth(textql, {
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("dashboardsCheckHealth failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.DashboardServiceCheckDashboardHealthRequest](../../models/operations/dashboard-service-check-dashboard-health-request.md)                                          | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.DashboardServiceCheckDashboardHealthResponse](../../models/operations/dashboard-service-check-dashboard-health-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## createDashboard

CRUD operations

### Example Usage

<!-- UsageSnippet language="typescript" operationID="DashboardService_CreateDashboard" method="post" path="/textql.rpc.public.dashboard.DashboardService/CreateDashboard" -->
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.dashboards.createDashboard({
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
import { dashboardsCreateDashboard } from "@textql/sdk/funcs/dashboards-create-dashboard.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await dashboardsCreateDashboard(textql, {
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("dashboardsCreateDashboard failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.DashboardServiceCreateDashboardRequest](../../models/operations/dashboard-service-create-dashboard-request.md)                                                     | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.DashboardServiceCreateDashboardResponse](../../models/operations/dashboard-service-create-dashboard-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## createFolder

Folder management

### Example Usage

<!-- UsageSnippet language="typescript" operationID="DashboardService_CreateDashboardFolder" method="post" path="/textql.rpc.public.dashboard.DashboardService/CreateDashboardFolder" -->
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.dashboards.createFolder({
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
import { dashboardsCreateFolder } from "@textql/sdk/funcs/dashboards-create-folder.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await dashboardsCreateFolder(textql, {
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("dashboardsCreateFolder failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.DashboardServiceCreateDashboardFolderRequest](../../models/operations/dashboard-service-create-dashboard-folder-request.md)                                        | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.DashboardServiceCreateDashboardFolderResponse](../../models/operations/dashboard-service-create-dashboard-folder-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## delete

DeleteDashboard

### Example Usage

<!-- UsageSnippet language="typescript" operationID="DashboardService_DeleteDashboard" method="post" path="/textql.rpc.public.dashboard.DashboardService/DeleteDashboard" -->
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.dashboards.delete({
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
import { dashboardsDelete } from "@textql/sdk/funcs/dashboards-delete.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await dashboardsDelete(textql, {
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("dashboardsDelete failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.DashboardServiceDeleteDashboardRequest](../../models/operations/dashboard-service-delete-dashboard-request.md)                                                     | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.DashboardServiceDeleteDashboardResponse](../../models/operations/dashboard-service-delete-dashboard-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## deleteFolder

DeleteDashboardFolder

### Example Usage

<!-- UsageSnippet language="typescript" operationID="DashboardService_DeleteDashboardFolder" method="post" path="/textql.rpc.public.dashboard.DashboardService/DeleteDashboardFolder" -->
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.dashboards.deleteFolder({
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
import { dashboardsDeleteFolder } from "@textql/sdk/funcs/dashboards-delete-folder.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await dashboardsDeleteFolder(textql, {
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("dashboardsDeleteFolder failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.DashboardServiceDeleteDashboardFolderRequest](../../models/operations/dashboard-service-delete-dashboard-folder-request.md)                                        | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.DashboardServiceDeleteDashboardFolderResponse](../../models/operations/dashboard-service-delete-dashboard-folder-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## discardChanges

DiscardDashboardChanges

### Example Usage

<!-- UsageSnippet language="typescript" operationID="DashboardService_DiscardDashboardChanges" method="post" path="/textql.rpc.public.dashboard.DashboardService/DiscardDashboardChanges" -->
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.dashboards.discardChanges({
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
import { dashboardsDiscardChanges } from "@textql/sdk/funcs/dashboards-discard-changes.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await dashboardsDiscardChanges(textql, {
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("dashboardsDiscardChanges failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.DashboardServiceDiscardDashboardChangesRequest](../../models/operations/dashboard-service-discard-dashboard-changes-request.md)                                    | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.DashboardServiceDiscardDashboardChangesResponse](../../models/operations/dashboard-service-discard-dashboard-changes-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## duplicate

DuplicateDashboard

### Example Usage

<!-- UsageSnippet language="typescript" operationID="DashboardService_DuplicateDashboard" method="post" path="/textql.rpc.public.dashboard.DashboardService/DuplicateDashboard" -->
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.dashboards.duplicate({
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
import { dashboardsDuplicate } from "@textql/sdk/funcs/dashboards-duplicate.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await dashboardsDuplicate(textql, {
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("dashboardsDuplicate failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.DashboardServiceDuplicateDashboardRequest](../../models/operations/dashboard-service-duplicate-dashboard-request.md)                                               | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.DashboardServiceDuplicateDashboardResponse](../../models/operations/dashboard-service-duplicate-dashboard-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## get

GetDashboard

### Example Usage

<!-- UsageSnippet language="typescript" operationID="DashboardService_GetDashboard" method="post" path="/textql.rpc.public.dashboard.DashboardService/GetDashboard" -->
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.dashboards.get({
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
import { dashboardsGet } from "@textql/sdk/funcs/dashboards-get.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await dashboardsGet(textql, {
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("dashboardsGet failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.DashboardServiceGetDashboardRequest](../../models/operations/dashboard-service-get-dashboard-request.md)                                                           | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.DashboardServiceGetDashboardResponse](../../models/operations/dashboard-service-get-dashboard-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## getVersion

GetDashboardVersion

### Example Usage

<!-- UsageSnippet language="typescript" operationID="DashboardService_GetDashboardVersion" method="post" path="/textql.rpc.public.dashboard.DashboardService/GetDashboardVersion" -->
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.dashboards.getVersion({
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
import { dashboardsGetVersion } from "@textql/sdk/funcs/dashboards-get-version.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await dashboardsGetVersion(textql, {
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("dashboardsGetVersion failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.DashboardServiceGetDashboardVersionRequest](../../models/operations/dashboard-service-get-dashboard-version-request.md)                                            | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.DashboardServiceGetDashboardVersionResponse](../../models/operations/dashboard-service-get-dashboard-version-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## getDashboardViewStats

View analytics

### Example Usage

<!-- UsageSnippet language="typescript" operationID="DashboardService_GetDashboardViewStats" method="post" path="/textql.rpc.public.dashboard.DashboardService/GetDashboardViewStats" -->
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.dashboards.getDashboardViewStats({
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
import { dashboardsGetDashboardViewStats } from "@textql/sdk/funcs/dashboards-get-dashboard-view-stats.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await dashboardsGetDashboardViewStats(textql, {
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("dashboardsGetDashboardViewStats failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.DashboardServiceGetDashboardViewStatsRequest](../../models/operations/dashboard-service-get-dashboard-view-stats-request.md)                                       | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.DashboardServiceGetDashboardViewStatsResponse](../../models/operations/dashboard-service-get-dashboard-view-stats-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## getMembersWithDashboards

Member management

### Example Usage

<!-- UsageSnippet language="typescript" operationID="DashboardService_GetMembersWithDashboards" method="post" path="/textql.rpc.public.dashboard.DashboardService/GetMembersWithDashboards" -->
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.dashboards.getMembersWithDashboards({
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
import { dashboardsGetMembersWithDashboards } from "@textql/sdk/funcs/dashboards-get-members-with-dashboards.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await dashboardsGetMembersWithDashboards(textql, {
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("dashboardsGetMembersWithDashboards failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.DashboardServiceGetMembersWithDashboardsRequest](../../models/operations/dashboard-service-get-members-with-dashboards-request.md)                                 | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.DashboardServiceGetMembersWithDashboardsResponse](../../models/operations/dashboard-service-get-members-with-dashboards-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## listFolders

ListDashboardFolders

### Example Usage

<!-- UsageSnippet language="typescript" operationID="DashboardService_ListDashboardFolders" method="post" path="/textql.rpc.public.dashboard.DashboardService/ListDashboardFolders" -->
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.dashboards.listFolders({
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
import { dashboardsListFolders } from "@textql/sdk/funcs/dashboards-list-folders.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await dashboardsListFolders(textql, {
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("dashboardsListFolders failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.DashboardServiceListDashboardFoldersRequest](../../models/operations/dashboard-service-list-dashboard-folders-request.md)                                          | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.DashboardServiceListDashboardFoldersResponse](../../models/operations/dashboard-service-list-dashboard-folders-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## listVersions

Version history

### Example Usage

<!-- UsageSnippet language="typescript" operationID="DashboardService_ListDashboardVersions" method="post" path="/textql.rpc.public.dashboard.DashboardService/ListDashboardVersions" -->
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.dashboards.listVersions({
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
import { dashboardsListVersions } from "@textql/sdk/funcs/dashboards-list-versions.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await dashboardsListVersions(textql, {
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("dashboardsListVersions failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.DashboardServiceListDashboardVersionsRequest](../../models/operations/dashboard-service-list-dashboard-versions-request.md)                                        | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.DashboardServiceListDashboardVersionsResponse](../../models/operations/dashboard-service-list-dashboard-versions-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## list

ListDashboards

### Example Usage

<!-- UsageSnippet language="typescript" operationID="DashboardService_ListDashboards" method="post" path="/textql.rpc.public.dashboard.DashboardService/ListDashboards" -->
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.dashboards.list({
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
import { dashboardsList } from "@textql/sdk/funcs/dashboards-list.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await dashboardsList(textql, {
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("dashboardsList failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.DashboardServiceListDashboardsRequest](../../models/operations/dashboard-service-list-dashboards-request.md)                                                       | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.DashboardServiceListDashboardsResponse](../../models/operations/dashboard-service-list-dashboards-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## moveToFolder

MoveDashboardToFolder

### Example Usage

<!-- UsageSnippet language="typescript" operationID="DashboardService_MoveDashboardToFolder" method="post" path="/textql.rpc.public.dashboard.DashboardService/MoveDashboardToFolder" -->
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.dashboards.moveToFolder({
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
import { dashboardsMoveToFolder } from "@textql/sdk/funcs/dashboards-move-to-folder.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await dashboardsMoveToFolder(textql, {
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("dashboardsMoveToFolder failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.DashboardServiceMoveDashboardToFolderRequest](../../models/operations/dashboard-service-move-dashboard-to-folder-request.md)                                       | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.DashboardServiceMoveDashboardToFolderResponse](../../models/operations/dashboard-service-move-dashboard-to-folder-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## previewConfig

Config-managed dashboards: render a `.dashboard` straight from a patch ref before
 it merges (ADR-0022). Runs as the file's run_as, gated on the previewer being
 authorized for it; persists nothing.

### Example Usage

<!-- UsageSnippet language="typescript" operationID="DashboardService_PreviewConfigDashboard" method="post" path="/textql.rpc.public.dashboard.DashboardService/PreviewConfigDashboard" -->
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.dashboards.previewConfig({
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
import { dashboardsPreviewConfig } from "@textql/sdk/funcs/dashboards-preview-config.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await dashboardsPreviewConfig(textql, {
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("dashboardsPreviewConfig failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.DashboardServicePreviewConfigDashboardRequest](../../models/operations/dashboard-service-preview-config-dashboard-request.md)                                      | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.DashboardServicePreviewConfigDashboardResponse](../../models/operations/dashboard-service-preview-config-dashboard-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## publish

Publishing workflow

### Example Usage

<!-- UsageSnippet language="typescript" operationID="DashboardService_PublishDashboard" method="post" path="/textql.rpc.public.dashboard.DashboardService/PublishDashboard" -->
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.dashboards.publish({
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
import { dashboardsPublish } from "@textql/sdk/funcs/dashboards-publish.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await dashboardsPublish(textql, {
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("dashboardsPublish failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.DashboardServicePublishDashboardRequest](../../models/operations/dashboard-service-publish-dashboard-request.md)                                                   | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.DashboardServicePublishDashboardResponse](../../models/operations/dashboard-service-publish-dashboard-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## regenerateScreenshot

Screenshot management

### Example Usage

<!-- UsageSnippet language="typescript" operationID="DashboardService_RegenerateScreenshot" method="post" path="/textql.rpc.public.dashboard.DashboardService/RegenerateScreenshot" -->
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.dashboards.regenerateScreenshot({
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
import { dashboardsRegenerateScreenshot } from "@textql/sdk/funcs/dashboards-regenerate-screenshot.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await dashboardsRegenerateScreenshot(textql, {
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("dashboardsRegenerateScreenshot failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.DashboardServiceRegenerateScreenshotRequest](../../models/operations/dashboard-service-regenerate-screenshot-request.md)                                           | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.DashboardServiceRegenerateScreenshotResponse](../../models/operations/dashboard-service-regenerate-screenshot-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## restoreDashboardVersion

RestoreDashboardVersion

### Example Usage

<!-- UsageSnippet language="typescript" operationID="DashboardService_RestoreDashboardVersion" method="post" path="/textql.rpc.public.dashboard.DashboardService/RestoreDashboardVersion" -->
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.dashboards.restoreDashboardVersion({
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
import { dashboardsRestoreDashboardVersion } from "@textql/sdk/funcs/dashboards-restore-dashboard-version.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await dashboardsRestoreDashboardVersion(textql, {
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("dashboardsRestoreDashboardVersion failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.DashboardServiceRestoreDashboardVersionRequest](../../models/operations/dashboard-service-restore-dashboard-version-request.md)                                    | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.DashboardServiceRestoreDashboardVersionResponse](../../models/operations/dashboard-service-restore-dashboard-version-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## runScheduledDashboard

RunScheduledDashboard

### Example Usage

<!-- UsageSnippet language="typescript" operationID="DashboardService_RunScheduledDashboard" method="post" path="/textql.rpc.public.dashboard.DashboardService/RunScheduledDashboard" -->
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.dashboards.runScheduledDashboard({
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
import { dashboardsRunScheduledDashboard } from "@textql/sdk/funcs/dashboards-run-scheduled-dashboard.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await dashboardsRunScheduledDashboard(textql, {
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("dashboardsRunScheduledDashboard failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.DashboardServiceRunScheduledDashboardRequest](../../models/operations/dashboard-service-run-scheduled-dashboard-request.md)                                        | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.DashboardServiceRunScheduledDashboardResponse](../../models/operations/dashboard-service-run-scheduled-dashboard-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## spawn

Dashboard execution

### Example Usage

<!-- UsageSnippet language="typescript" operationID="DashboardService_SpawnDashboard" method="post" path="/textql.rpc.public.dashboard.DashboardService/SpawnDashboard" -->
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.dashboards.spawn({
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
import { dashboardsSpawn } from "@textql/sdk/funcs/dashboards-spawn.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await dashboardsSpawn(textql, {
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("dashboardsSpawn failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.DashboardServiceSpawnDashboardRequest](../../models/operations/dashboard-service-spawn-dashboard-request.md)                                                       | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.DashboardServiceSpawnDashboardResponse](../../models/operations/dashboard-service-spawn-dashboard-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## updateDashboard

UpdateDashboard

### Example Usage

<!-- UsageSnippet language="typescript" operationID="DashboardService_UpdateDashboard" method="post" path="/textql.rpc.public.dashboard.DashboardService/UpdateDashboard" -->
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.dashboards.updateDashboard({
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
import { dashboardsUpdateDashboard } from "@textql/sdk/funcs/dashboards-update-dashboard.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await dashboardsUpdateDashboard(textql, {
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("dashboardsUpdateDashboard failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.DashboardServiceUpdateDashboardRequest](../../models/operations/dashboard-service-update-dashboard-request.md)                                                     | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.DashboardServiceUpdateDashboardResponse](../../models/operations/dashboard-service-update-dashboard-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## updateDashboardFolder

UpdateDashboardFolder

### Example Usage

<!-- UsageSnippet language="typescript" operationID="DashboardService_UpdateDashboardFolder" method="post" path="/textql.rpc.public.dashboard.DashboardService/UpdateDashboardFolder" -->
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.dashboards.updateDashboardFolder({
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
import { dashboardsUpdateDashboardFolder } from "@textql/sdk/funcs/dashboards-update-dashboard-folder.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await dashboardsUpdateDashboardFolder(textql, {
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("dashboardsUpdateDashboardFolder failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.DashboardServiceUpdateDashboardFolderRequest](../../models/operations/dashboard-service-update-dashboard-folder-request.md)                                        | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.DashboardServiceUpdateDashboardFolderResponse](../../models/operations/dashboard-service-update-dashboard-folder-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |

## updateDashboardSchedule

Scheduling

### Example Usage

<!-- UsageSnippet language="typescript" operationID="DashboardService_UpdateDashboardSchedule" method="post" path="/textql.rpc.public.dashboard.DashboardService/UpdateDashboardSchedule" -->
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.dashboards.updateDashboardSchedule({
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
import { dashboardsUpdateDashboardSchedule } from "@textql/sdk/funcs/dashboards-update-dashboard-schedule.js";

// Use `TextqlCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const textql = new TextqlCore({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const res = await dashboardsUpdateDashboardSchedule(textql, {
    body: {},
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("dashboardsUpdateDashboardSchedule failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.DashboardServiceUpdateDashboardScheduleRequest](../../models/operations/dashboard-service-update-dashboard-schedule-request.md)                                    | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.DashboardServiceUpdateDashboardScheduleResponse](../../models/operations/dashboard-service-update-dashboard-schedule-response.md)\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.TextqlDefaultError | 4XX, 5XX                  | \*/\*                     |