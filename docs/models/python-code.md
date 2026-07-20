# PythonCode

## Example Usage

```typescript
import { PythonCode } from "@textql/sdk/models";

let value: PythonCode = {
  pythonCode: {},
};
```

## Fields

| Field                                                                                                          | Type                                                                                                           | Required                                                                                                       | Description                                                                                                    |
| -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `pythonCode`                                                                                                   | [models.TextqlRpcPublicDashboardPythonCodeSource](../models/textql-rpc-public-dashboard-python-code-source.md) | :heavy_check_mark:                                                                                             | N/A                                                                                                            |
| `type`                                                                                                         | *string*                                                                                                       | :heavy_minus_sign:                                                                                             | "sql_query", "file", "python_code", "ontology_sql", or "library_tql"                                           |
| `name`                                                                                                         | *string*                                                                                                       | :heavy_minus_sign:                                                                                             | N/A                                                                                                            |
| `parameters`                                                                                                   | [models.TextqlRpcPublicDashboardQueryParameter](../models/textql-rpc-public-dashboard-query-parameter.md)[]    | :heavy_minus_sign:                                                                                             | Parameters for live parameterized queries (sql_query type only)                                                |