# AppDb

## Example Usage

```typescript
import { AppDb } from "@textql/sdk/models";

let value: AppDb = {
  appDb: {},
};
```

## Fields

| Field                                                                                                                     | Type                                                                                                                      | Required                                                                                                                  | Description                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `appDb`                                                                                                                   | [models.TextqlRpcPublicSandboxQueryAppDBTemplate](../models/textql-rpc-public-sandbox-query-app-db-template.md)           | :heavy_check_mark:                                                                                                        | N/A                                                                                                                       |
| `sourceName`                                                                                                              | *string*                                                                                                                  | :heavy_minus_sign:                                                                                                        | N/A                                                                                                                       |
| `connectorId`                                                                                                             | *number*                                                                                                                  | :heavy_minus_sign:                                                                                                        | N/A                                                                                                                       |
| `parameters`                                                                                                              | [models.TextqlRpcPublicSandboxQuerySandboxQueryParam](../models/textql-rpc-public-sandbox-query-sandbox-query-param.md)[] | :heavy_minus_sign:                                                                                                        | N/A                                                                                                                       |
| `maxRows`                                                                                                                 | *models.TextqlRpcPublicSandboxQuerySandboxExecuteQueryRequestMaxRows1*                                                    | :heavy_minus_sign:                                                                                                        | N/A                                                                                                                       |