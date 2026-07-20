# TextqlRpcPublicDashboardDataSourceSqlQuery

## Example Usage

```typescript
import { TextqlRpcPublicDashboardDataSourceSqlQuery } from "textql-sdk/models";

let value: TextqlRpcPublicDashboardDataSourceSqlQuery = {
  sqlQuery: {},
};
```

## Fields

| Field                                                                                                       | Type                                                                                                        | Required                                                                                                    | Description                                                                                                 |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `sqlQuery`                                                                                                  | [models.TextqlRpcPublicDashboardSqlQuerySource](../models/textql-rpc-public-dashboard-sql-query-source.md)  | :heavy_check_mark:                                                                                          | N/A                                                                                                         |
| `type`                                                                                                      | *string*                                                                                                    | :heavy_minus_sign:                                                                                          | "sql_query", "file", "python_code", "ontology_sql", or "library_tql"                                        |
| `name`                                                                                                      | *string*                                                                                                    | :heavy_minus_sign:                                                                                          | N/A                                                                                                         |
| `parameters`                                                                                                | [models.TextqlRpcPublicDashboardQueryParameter](../models/textql-rpc-public-dashboard-query-parameter.md)[] | :heavy_minus_sign:                                                                                          | Parameters for live parameterized queries (sql_query type only)                                             |