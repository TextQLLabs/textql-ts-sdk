# TextqlRpcPublicSandboxQuerySandboxExecuteQueryRequestSqlQuery

## Example Usage

```typescript
import { TextqlRpcPublicSandboxQuerySandboxExecuteQueryRequestSqlQuery } from "@textql/sdk/models";

let value: TextqlRpcPublicSandboxQuerySandboxExecuteQueryRequestSqlQuery = {
  sqlQuery: {},
};
```

## Fields

| Field                                                                                                                     | Type                                                                                                                      | Required                                                                                                                  | Description                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `sqlQuery`                                                                                                                | [models.TextqlRpcPublicSandboxQuerySqlQueryTemplate](../models/textql-rpc-public-sandbox-query-sql-query-template.md)     | :heavy_check_mark:                                                                                                        | N/A                                                                                                                       |
| `sourceName`                                                                                                              | *string*                                                                                                                  | :heavy_minus_sign:                                                                                                        | N/A                                                                                                                       |
| `connectorId`                                                                                                             | *number*                                                                                                                  | :heavy_minus_sign:                                                                                                        | N/A                                                                                                                       |
| `parameters`                                                                                                              | [models.TextqlRpcPublicSandboxQuerySandboxQueryParam](../models/textql-rpc-public-sandbox-query-sandbox-query-param.md)[] | :heavy_minus_sign:                                                                                                        | N/A                                                                                                                       |
| `maxRows`                                                                                                                 | *models.MaxRows2*                                                                                                         | :heavy_minus_sign:                                                                                                        | N/A                                                                                                                       |