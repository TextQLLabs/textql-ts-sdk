# OntologySql

## Example Usage

```typescript
import { OntologySql } from "@textql/sdk/models";

let value: OntologySql = {
  ontologySql: {},
};
```

## Fields

| Field                                                                                                            | Type                                                                                                             | Required                                                                                                         | Description                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `ontologySql`                                                                                                    | [models.TextqlRpcPublicDashboardOntologySqlSource](../models/textql-rpc-public-dashboard-ontology-sql-source.md) | :heavy_check_mark:                                                                                               | N/A                                                                                                              |
| `type`                                                                                                           | *string*                                                                                                         | :heavy_minus_sign:                                                                                               | "sql_query", "file", "python_code", "ontology_sql", or "library_tql"                                             |
| `name`                                                                                                           | *string*                                                                                                         | :heavy_minus_sign:                                                                                               | N/A                                                                                                              |
| `parameters`                                                                                                     | [models.TextqlRpcPublicDashboardQueryParameter](../models/textql-rpc-public-dashboard-query-parameter.md)[]      | :heavy_minus_sign:                                                                                               | Parameters for live parameterized queries (sql_query type only)                                                  |