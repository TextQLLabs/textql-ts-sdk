# TextqlRpcPublicDashboardDataSourceFile

## Example Usage

```typescript
import { TextqlRpcPublicDashboardDataSourceFile } from "textql-sdk/models";

let value: TextqlRpcPublicDashboardDataSourceFile = {
  file: {},
};
```

## Fields

| Field                                                                                                       | Type                                                                                                        | Required                                                                                                    | Description                                                                                                 |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `file`                                                                                                      | [models.TextqlRpcPublicDashboardFileSource](../models/textql-rpc-public-dashboard-file-source.md)           | :heavy_check_mark:                                                                                          | N/A                                                                                                         |
| `type`                                                                                                      | *string*                                                                                                    | :heavy_minus_sign:                                                                                          | "sql_query", "file", "python_code", "ontology_sql", or "library_tql"                                        |
| `name`                                                                                                      | *string*                                                                                                    | :heavy_minus_sign:                                                                                          | N/A                                                                                                         |
| `parameters`                                                                                                | [models.TextqlRpcPublicDashboardQueryParameter](../models/textql-rpc-public-dashboard-query-parameter.md)[] | :heavy_minus_sign:                                                                                          | Parameters for live parameterized queries (sql_query type only)                                             |