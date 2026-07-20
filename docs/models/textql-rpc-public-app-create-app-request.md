# TextqlRpcPublicAppCreateAppRequest

## Example Usage

```typescript
import { TextqlRpcPublicAppCreateAppRequest } from "textql-sdk/models";

let value: TextqlRpcPublicAppCreateAppRequest = {};
```

## Fields

| Field                                                                                             | Type                                                                                              | Required                                                                                          | Description                                                                                       |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `name`                                                                                            | *string*                                                                                          | :heavy_minus_sign:                                                                                | N/A                                                                                               |
| `description`                                                                                     | *string*                                                                                          | :heavy_minus_sign:                                                                                | N/A                                                                                               |
| `code`                                                                                            | *string*                                                                                          | :heavy_minus_sign:                                                                                | N/A                                                                                               |
| `dataSources`                                                                                     | *models.TextqlRpcPublicDashboardDataSource*[]                                                     | :heavy_minus_sign:                                                                                | N/A                                                                                               |
| `computeFunctions`                                                                                | [models.TextqlRpcPublicAppComputeFunction](../models/textql-rpc-public-app-compute-function.md)[] | :heavy_minus_sign:                                                                                | N/A                                                                                               |
| `files`                                                                                           | [models.TextqlRpcPublicAppAppFile](../models/textql-rpc-public-app-app-file.md)[]                 | :heavy_minus_sign:                                                                                | N/A                                                                                               |